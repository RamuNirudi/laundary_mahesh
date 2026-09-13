import { createHmac, timingSafeEqual } from "node:crypto";
import { config } from "./env.js";
import { database } from "./db.js";
import { forbidden, unauthorized } from "./http.js";

const encode = (value) => Buffer.from(JSON.stringify(value)).toString("base64url");
const decode = (value) => JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
const sign = (value) => createHmac("sha256", config.secret).update(value).digest("base64url");

/** Strips the password hash and reset token before a user crosses the wire. */
export function publicUser(user) {
  if (!user) return null;
  const { password_hash, reset_token_hash, reset_token_expires, ...rest } = user;
  return { ...rest, active: Boolean(rest.active), must_change_password: Boolean(rest.must_change_password) };
}

export function issueToken(user) {
  const header = encode({ alg: "HS256", typ: "JWT" });
  const payload = encode({
    sub: user.id,
    role: user.role,
    exp: Math.floor(Date.now() / 1000) + config.tokenTtlSeconds,
  });
  return `${header}.${payload}.${sign(`${header}.${payload}`)}`;
}

export function verifyToken(token) {
  const [header, payload, signature] = String(token || "").split(".");
  if (!header || !payload || !signature) return null;
  const expected = sign(`${header}.${payload}`);
  const given = Buffer.from(signature);
  const want = Buffer.from(expected);
  if (given.length !== want.length || !timingSafeEqual(given, want)) return null;
  try {
    const claims = decode(payload);
    if (!claims.exp || claims.exp * 1000 < Date.now()) return null;
    return claims;
  } catch {
    return null;
  }
}

/** Resolves the caller, or null when the request carries no valid token. */
export async function currentUser(request) {
  const token = request.headers.authorization?.replace(/^Bearer\s+/i, "");
  const claims = token ? verifyToken(token) : null;
  if (!claims) return null;
  const [users] = await database.execute("SELECT * FROM users WHERE id = ? LIMIT 1", [claims.sub]);
  const user = users[0];
  // A deactivated account keeps its token but loses access immediately.
  if (!user || !user.active) return null;
  return user;
}

/** Route guard: any signed-in user. */
export function requireUser(context) {
  if (!context.user) throw unauthorized();
  return context.user;
}

/** Route guard: a signed-in user holding one of `roles`. */
export function requireRole(context, ...roles) {
  const user = requireUser(context);
  if (!roles.includes(user.role)) throw forbidden();
  return user;
}
