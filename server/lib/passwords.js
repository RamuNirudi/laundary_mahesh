import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);

export async function hashPassword(password) {
  const salt = randomBytes(16).toString("base64url");
  const hash = await scrypt(password, salt, 64);
  return `${salt}:${Buffer.from(hash).toString("base64url")}`;
}

export async function verifyPassword(password, stored) {
  const [salt, expected] = String(stored || "").split(":");
  if (!salt || !expected) return false;
  const actual = Buffer.from(await scrypt(password, salt, 64)).toString("base64url");
  const actualBuffer = Buffer.from(actual);
  const expectedBuffer = Buffer.from(expected);
  // timingSafeEqual throws on a length mismatch, which itself leaks a bit of
  // information about the stored hash; compare lengths first and bail quietly.
  if (actualBuffer.length !== expectedBuffer.length) return false;
  return timingSafeEqual(actualBuffer, expectedBuffer);
}

/** Readable one-time password for admin-created staff accounts. */
export function generateTemporaryPassword() {
  return `Slv-${randomBytes(6).toString("base64url").replace(/[-_]/g, "x")}`;
}
