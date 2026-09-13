import { database, newId } from "../lib/db.js";
import { requireRole } from "../lib/auth.js";
import { config } from "../lib/env.js";
import { contactEnquiryEmail, isMailConfigured, sendMailInBackground } from "../lib/mail.js";
import {
  badRequest,
  isValidEmail,
  normalizeEmail,
  notFound,
  optionalString,
  requireString,
  toBoolean,
} from "../lib/http.js";

export function registerContactRoutes(router) {
  // Public enquiry form. The message is stored first so nothing is lost when
  // SMTP is unavailable, then emailed to the business inbox in the background.
  router.post("/api/contact", async ({ body }) => {
    const email = normalizeEmail(body.email);
    if (!isValidEmail(email)) throw badRequest("Enter a valid email address.");

    const enquiry = {
      id: newId(),
      name: requireString(body.name, "Name", { max: 120 }),
      email,
      phone: optionalString(body.phone, "Phone", { max: 32 }),
      message: requireString(body.message, "Message", { max: 5000 }),
    };

    await database.execute(
      "INSERT INTO contact_messages (id, name, email, phone, message) VALUES (?, ?, ?, ?, ?)",
      [enquiry.id, enquiry.name, enquiry.email, enquiry.phone, enquiry.message],
    );

    const inbox = config.contactInbox;
    if (inbox && isMailConfigured()) {
      sendMailInBackground({ to: inbox, ...contactEnquiryEmail(enquiry) });
    }

    return { status: 201, body: { message: "Thanks for reaching out. We will be in touch shortly." } };
  });

  router.get("/api/admin/contact-messages", async (context) => {
    requireRole(context, "admin");
    const [messages] = await database.execute(
      "SELECT * FROM contact_messages ORDER BY created_date DESC LIMIT 500",
    );
    return { body: { messages: messages.map((m) => ({ ...m, handled: Boolean(m.handled) })) } };
  });

  router.patch("/api/admin/contact-messages/:id", async (context) => {
    requireRole(context, "admin");
    const [rows] = await database.execute(
      "SELECT * FROM contact_messages WHERE id = ? LIMIT 1",
      [context.params.id],
    );
    if (!rows[0]) throw notFound("Message not found.");

    const handled = toBoolean(context.body.handled, !rows[0].handled);
    await database.execute("UPDATE contact_messages SET handled = ? WHERE id = ?", [
      handled,
      rows[0].id,
    ]);
    return { body: { message: handled ? "Marked as handled." : "Reopened." } };
  });
}
