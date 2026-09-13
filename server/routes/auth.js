import { createHash, randomInt } from "node:crypto";
import { database, newId } from "../lib/db.js";
import { issueToken, publicUser, requireUser } from "../lib/auth.js";
import { hashPassword, verifyPassword } from "../lib/passwords.js";
import { passwordResetEmail, sendMail } from "../lib/mail.js";
import {
  badRequest,
  conflict,
  isValidEmail,
  normalizeEmail,
  optionalString,
  requireString,
  unauthorized,
} from "../lib/http.js";

const MIN_PASSWORD_LENGTH = 8;

const assertPassword = (password) => {
  if (typeof password !== "string" || password.length < MIN_PASSWORD_LENGTH) {
    throw badRequest(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
  }
  return password;
};

export function registerAuthRoutes(router) {
  router.post("/api/auth/signup", async ({ body }) => {
    const email = normalizeEmail(body.email);
    if (!isValidEmail(email)) throw badRequest("Enter a valid email address.");
    assertPassword(body.password);

    const [existing] = await database.execute("SELECT id FROM users WHERE email = ? LIMIT 1", [
      email,
    ]);
    if (existing.length) throw conflict("An account with this email already exists.");

    const user = {
      id: newId(),
      email,
      full_name: optionalString(body.fullName ?? body.full_name, "Full name", { max: 120 }) || null,
      role: "customer",
      phone: optionalString(body.phone, "Phone", { max: 32 }),
      address: optionalString(body.address, "Address", { max: 2000 }),
      active: 1,
      must_change_password: 0,
    };

    await database.execute(
      `INSERT INTO users (id, email, full_name, role, phone, address, password_hash)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        user.id,
        user.email,
        user.full_name,
        user.role,
        user.phone,
        user.address,
        await hashPassword(body.password),
      ],
    );

    return { status: 201, body: { access_token: issueToken(user), user: publicUser(user) } };
  });

  router.post("/api/auth/login", async ({ body }) => {
    const email = normalizeEmail(body.email);
    const [users] = await database.execute("SELECT * FROM users WHERE email = ? LIMIT 1", [email]);
    const user = users[0];

    // One message for "no such user" and "wrong password" so the endpoint can't
    // be used to discover which addresses have accounts.
    if (!user || !(await verifyPassword(body.password ?? "", user.password_hash))) {
      throw unauthorized("Invalid email or password.");
    }
    if (!user.active) throw unauthorized("This account has been deactivated.");

    return { body: { access_token: issueToken(user), user: publicUser(user) } };
  });

  router.get("/api/auth/me", async (context) => ({ body: { user: publicUser(requireUser(context)) } }));

  router.put("/api/auth/me", async (context) => {
    const user = requireUser(context);
    const { body } = context;

    const fullName =
      body.full_name === undefined
        ? user.full_name
        : optionalString(body.full_name, "Full name", { max: 120 }) || null;
    const phone =
      body.phone === undefined ? user.phone : optionalString(body.phone, "Phone", { max: 32 });
    const address =
      body.address === undefined
        ? user.address
        : optionalString(body.address, "Address", { max: 2000 });

    await database.execute(
      "UPDATE users SET full_name = ?, phone = ?, address = ? WHERE id = ?",
      [fullName, phone, address, user.id],
    );
    const [rows] = await database.execute("SELECT * FROM users WHERE id = ?", [user.id]);
    return { body: { user: publicUser(rows[0]) } };
  });

  router.put("/api/auth/password", async (context) => {
    const user = requireUser(context);
    const currentPassword = context.body.currentPassword ?? "";
    assertPassword(context.body.newPassword);

    if (!(await verifyPassword(currentPassword, user.password_hash))) {
      throw badRequest("Your current password is incorrect.");
    }
    await database.execute(
      "UPDATE users SET password_hash = ?, must_change_password = FALSE WHERE id = ?",
      [await hashPassword(context.body.newPassword), user.id],
    );
    return { body: { message: "Password updated." } };
  });

  router.post("/api/auth/forgot-password", async ({ body }) => {
    const email = normalizeEmail(body.email);
    const [users] = await database.execute("SELECT * FROM users WHERE email = ? LIMIT 1", [email]);
    const account = users[0];

    if (account && account.active) {
      const otp = String(randomInt(100000, 1000000));
      await database.execute(
        `UPDATE users SET reset_token_hash = ?, reset_token_expires = DATE_ADD(UTC_TIMESTAMP(), INTERVAL 30 MINUTE)
         WHERE id = ?`,
        [createHash("sha256").update(otp).digest("hex"), account.id],
      );
      await sendMail({ to: account.email, ...passwordResetEmail(otp) });
    }

    // Always the same answer, whether or not the address is registered.
    return { body: { message: "If an account exists with that email, a reset code has been sent." } };
  });

  router.post("/api/auth/reset-password", async ({ body }) => {
    const email = normalizeEmail(body.email);
    const otp = requireString(body.otp, "Reset code", { max: 6 });
    assertPassword(body.newPassword);
    if (!/^\d{6}$/.test(otp)) throw badRequest("Enter the six-digit code from your email.");

    const [users] = await database.execute(
      `SELECT * FROM users
       WHERE email = ? AND reset_token_hash = ? AND reset_token_expires > UTC_TIMESTAMP() LIMIT 1`,
      [email, createHash("sha256").update(otp).digest("hex")],
    );
    if (!users[0]) throw badRequest("This reset code is invalid or has expired.");

    await database.execute(
      `UPDATE users SET password_hash = ?, reset_token_hash = NULL, reset_token_expires = NULL,
       must_change_password = FALSE WHERE id = ?`,
      [await hashPassword(body.newPassword), users[0].id],
    );
    return { body: { message: "Password reset successfully. You can now log in." } };
  });
}
