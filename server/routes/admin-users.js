import { database, newId } from "../lib/db.js";
import { publicUser, requireRole } from "../lib/auth.js";
import { generateTemporaryPassword, hashPassword } from "../lib/passwords.js";
import { isMailConfigured, sendMailInBackground, staffWelcomeEmail } from "../lib/mail.js";
import {
  badRequest,
  conflict,
  isValidEmail,
  normalizeEmail,
  notFound,
  optionalString,
  requireString,
  toBoolean,
} from "../lib/http.js";

async function loadUser(id) {
  const [rows] = await database.execute("SELECT * FROM users WHERE id = ? LIMIT 1", [id]);
  if (!rows[0]) throw notFound("User not found.");
  return rows[0];
}

export function registerAdminUserRoutes(router) {
  // Customers, with their booking counts and lifetime spend for the list page.
  router.get("/api/admin/customers", async (context) => {
    requireRole(context, "admin");
    const [customers] = await database.execute(
      `SELECT u.id, u.email, u.full_name, u.phone, u.address, u.active, u.created_date,
              COUNT(b.id) AS booking_count,
              COALESCE(SUM(CASE WHEN b.amount_set AND b.status <> 'Cancelled' THEN b.final_amount ELSE 0 END), 0) AS total_spent
       FROM users u
       LEFT JOIN bookings b ON b.customer_id = u.id
       WHERE u.role = 'customer'
       GROUP BY u.id
       ORDER BY u.created_date DESC`,
    );
    return {
      body: {
        customers: customers.map((customer) => ({
          ...customer,
          active: Boolean(customer.active),
          booking_count: Number(customer.booking_count),
          total_spent: Number(customer.total_spent),
        })),
      },
    };
  });

  router.get("/api/admin/serviceboys", async (context) => {
    requireRole(context, "admin");
    const [staff] = await database.execute(
      `SELECT u.id, u.email, u.full_name, u.phone, u.active, u.created_date,
              COUNT(b.id) AS assigned_count,
              SUM(CASE WHEN b.status NOT IN ('Delivered','Cancelled') THEN 1 ELSE 0 END) AS active_count
       FROM users u
       LEFT JOIN bookings b ON b.service_boy_id = u.id
       WHERE u.role = 'service_boy'
       GROUP BY u.id
       ORDER BY u.created_date DESC`,
    );
    return {
      body: {
        serviceBoys: staff.map((member) => ({
          ...member,
          active: Boolean(member.active),
          assigned_count: Number(member.assigned_count),
          active_count: Number(member.active_count || 0),
        })),
      },
    };
  });

  /**
   * Creates a service-boy account directly. Base44's invite flow is gone, so the
   * admin sets up the account and the temporary password is emailed to the new
   * member (and returned once, for when SMTP is not configured).
   */
  router.post("/api/admin/serviceboys", async (context) => {
    requireRole(context, "admin");
    const { body } = context;
    const email = normalizeEmail(body.email);
    if (!isValidEmail(email)) throw badRequest("Enter a valid email address.");

    const [existing] = await database.execute("SELECT id, role FROM users WHERE email = ? LIMIT 1", [
      email,
    ]);
    if (existing.length) {
      throw conflict(
        existing[0].role === "service_boy"
          ? "This service boy already has an account."
          : "Another account already uses this email address.",
      );
    }

    const temporaryPassword = optionalString(body.password, "Password", { max: 128 }) ||
      generateTemporaryPassword();
    if (temporaryPassword.length < 8) throw badRequest("Password must be at least 8 characters.");

    const id = newId();
    await database.execute(
      `INSERT INTO users (id, email, full_name, role, phone, address, password_hash, must_change_password)
       VALUES (?, ?, ?, 'service_boy', ?, '', ?, TRUE)`,
      [
        id,
        email,
        requireString(body.full_name ?? body.fullName, "Full name", { max: 120 }),
        optionalString(body.phone, "Phone", { max: 32 }),
        await hashPassword(temporaryPassword),
      ],
    );

    sendMailInBackground({ to: email, ...staffWelcomeEmail(email, temporaryPassword) });

    return {
      status: 201,
      body: {
        user: publicUser(await loadUser(id)),
        temporary_password: temporaryPassword,
        emailed: isMailConfigured(),
      },
    };
  });

  router.put("/api/admin/users/:id", async (context) => {
    requireRole(context, "admin");
    const user = await loadUser(context.params.id);
    const { body } = context;

    const fullName =
      body.full_name === undefined
        ? user.full_name
        : optionalString(body.full_name, "Full name", { max: 120 }) || null;
    const phone =
      body.phone === undefined ? user.phone : optionalString(body.phone, "Phone", { max: 32 });

    await database.execute("UPDATE users SET full_name = ?, phone = ? WHERE id = ?", [
      fullName,
      phone,
      user.id,
    ]);
    return { body: { user: publicUser(await loadUser(user.id)) } };
  });

  router.patch("/api/admin/users/:id/status", async (context) => {
    const admin = requireRole(context, "admin");
    const user = await loadUser(context.params.id);
    // Locking yourself out of the only admin account is not recoverable in-app.
    if (user.id === admin.id) throw badRequest("You cannot deactivate your own account.");

    const active = toBoolean(context.body.active, !user.active);
    await database.execute("UPDATE users SET active = ? WHERE id = ?", [active, user.id]);
    return {
      body: {
        user: publicUser(await loadUser(user.id)),
        message: active ? "Account activated." : "Account deactivated.",
      },
    };
  });

  router.post("/api/admin/users/:id/reset-password", async (context) => {
    requireRole(context, "admin");
    const user = await loadUser(context.params.id);
    const temporaryPassword = generateTemporaryPassword();

    await database.execute(
      "UPDATE users SET password_hash = ?, must_change_password = TRUE WHERE id = ?",
      [await hashPassword(temporaryPassword), user.id],
    );
    sendMailInBackground({ to: user.email, ...staffWelcomeEmail(user.email, temporaryPassword) });

    return { body: { temporary_password: temporaryPassword, emailed: isMailConfigured() } };
  });
}
