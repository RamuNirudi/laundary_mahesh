import nodemailer from "nodemailer";
import { config } from "./env.js";

let transport = null;

export const isMailConfigured = () =>
  Boolean(config.smtp.host && config.smtp.user && config.smtp.password && config.smtp.from);

function mailer() {
  if (!isMailConfigured()) {
    throw new Error(
      "Email is not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASSWORD and SMTP_FROM in .env.",
    );
  }
  transport ??= nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.secure,
    auth: { user: config.smtp.user, pass: config.smtp.password },
  });
  return transport;
}

/** Sends and throws on failure. Use for mail the user is waiting on. */
export async function sendMail(message) {
  return mailer().sendMail({ from: config.smtp.from, ...message });
}

/**
 * Sends without blocking the response. Notification mail must never turn a
 * successful booking update into a failed request, so delivery problems are
 * logged rather than propagated.
 */
export function sendMailInBackground(message) {
  if (!isMailConfigured()) return;
  Promise.resolve()
    .then(() => sendMail(message))
    .catch((error) => console.error("[mail] delivery failed:", error.message));
}

const escapeHtml = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character],
  );

function layout(title, bodyHtml) {
  return `<div style="font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;color:#1f2937">
    <h2 style="margin:0 0 4px;color:#0f172a">STAR LAUNDROVAMAT</h2>
    <p style="margin:0 0 20px;font-size:12px;letter-spacing:1px;text-transform:uppercase;color:#64748b">Premium Garment Stewardship</p>
    <h3 style="margin:0 0 12px">${escapeHtml(title)}</h3>
    ${bodyHtml}
    <p style="margin-top:24px;font-size:12px;color:#94a3b8">This is an automated message from Star Laundrovamat.</p>
  </div>`;
}

const STATUS_MESSAGES = {
  "Booking Requested": "We have received your booking and will confirm it shortly.",
  "Booking Confirmed": "Your booking is confirmed. We will be in touch before pickup.",
  "Service Boy Assigned": "A service executive has been assigned to your booking.",
  "Clothes Picked Up": "Your clothes have been picked up and are on their way to us.",
  "Cleaning in Progress": "Your garments are being cleaned with care.",
  "Ready for Delivery": "Your order is ready and will be delivered soon.",
  Delivered: "Your order has been delivered. Thank you for choosing us!",
  Cancelled: "Your booking has been cancelled. Contact us if this was unexpected.",
};

const money = (amount) => `Rs. ${Number(amount || 0).toLocaleString("en-IN")}`;

export function bookingStatusEmail(booking, status) {
  const rows = [
    ["Booking ID", booking.booking_id],
    ["Status", status],
    ["Pickup date", booking.pickup_date],
    ["Pickup time", booking.pickup_time],
    booking.service_boy_name ? ["Service executive", booking.service_boy_name] : null,
    booking.amount_set ? ["Amount payable", money(booking.final_amount)] : null,
  ].filter(Boolean);

  const table = rows
    .map(
      ([label, value]) =>
        `<tr><td style="padding:6px 12px 6px 0;color:#64748b">${escapeHtml(label)}</td><td style="padding:6px 0;font-weight:600">${escapeHtml(value)}</td></tr>`,
    )
    .join("");

  return {
    subject: `Booking ${booking.booking_id} - ${status}`,
    text: `${STATUS_MESSAGES[status] || "Your booking has been updated."}\n\n${rows
      .map(([label, value]) => `${label}: ${value}`)
      .join("\n")}`,
    html: layout(
      STATUS_MESSAGES[status] || "Your booking has been updated.",
      `<table style="border-collapse:collapse;font-size:14px">${table}</table>`,
    ),
  };
}

export function newBookingAdminEmail(booking) {
  return {
    subject: `New booking ${booking.booking_id}`,
    text: `New booking from ${booking.customer_name || booking.customer_phone}.
Booking ID: ${booking.booking_id}
Pickup: ${booking.pickup_date} at ${booking.pickup_time}
Address: ${booking.pickup_address}
Estimated total: ${money(booking.final_amount)}`,
    html: layout(
      "New booking received",
      `<table style="border-collapse:collapse;font-size:14px">
        <tr><td style="padding:6px 12px 6px 0;color:#64748b">Booking ID</td><td style="padding:6px 0;font-weight:600">${escapeHtml(booking.booking_id)}</td></tr>
        <tr><td style="padding:6px 12px 6px 0;color:#64748b">Customer</td><td style="padding:6px 0;font-weight:600">${escapeHtml(booking.customer_name || "-")}</td></tr>
        <tr><td style="padding:6px 12px 6px 0;color:#64748b">Phone</td><td style="padding:6px 0;font-weight:600">${escapeHtml(booking.customer_phone)}</td></tr>
        <tr><td style="padding:6px 12px 6px 0;color:#64748b">Pickup</td><td style="padding:6px 0;font-weight:600">${escapeHtml(booking.pickup_date)} at ${escapeHtml(booking.pickup_time)}</td></tr>
        <tr><td style="padding:6px 12px 6px 0;color:#64748b">Address</td><td style="padding:6px 0;font-weight:600">${escapeHtml(booking.pickup_address)}</td></tr>
        <tr><td style="padding:6px 12px 6px 0;color:#64748b">Estimated total</td><td style="padding:6px 0;font-weight:600">${escapeHtml(money(booking.final_amount))}</td></tr>
      </table>`,
    ),
  };
}

export function staffWelcomeEmail(email, temporaryPassword) {
  return {
    subject: "Your Star Laundrovamat service account",
    text: `An account has been created for you.\n\nEmail: ${email}\nTemporary password: ${temporaryPassword}\n\nSign in and change your password from your profile.`,
    html: layout(
      "Your service account is ready",
      `<p style="font-size:14px">An account has been created for you.</p>
       <p style="font-size:14px">Email: <strong>${escapeHtml(email)}</strong><br>
       Temporary password: <strong style="letter-spacing:1px">${escapeHtml(temporaryPassword)}</strong></p>
       <p style="font-size:14px">Please sign in and change your password from your profile.</p>`,
    ),
  };
}

export function contactEnquiryEmail({ name, email, phone, message }) {
  return {
    subject: `Website enquiry from ${name}`,
    replyTo: email,
    text: `Name: ${name}\nEmail: ${email}\nPhone: ${phone || "-"}\n\n${message}`,
    html: layout(
      "New website enquiry",
      `<table style="border-collapse:collapse;font-size:14px">
        <tr><td style="padding:6px 12px 6px 0;color:#64748b">Name</td><td style="padding:6px 0;font-weight:600">${escapeHtml(name)}</td></tr>
        <tr><td style="padding:6px 12px 6px 0;color:#64748b">Email</td><td style="padding:6px 0;font-weight:600">${escapeHtml(email)}</td></tr>
        <tr><td style="padding:6px 12px 6px 0;color:#64748b">Phone</td><td style="padding:6px 0;font-weight:600">${escapeHtml(phone || "-")}</td></tr>
      </table>
      <p style="margin-top:16px;font-size:14px;white-space:pre-wrap">${escapeHtml(message)}</p>`,
    ),
  };
}

export function passwordResetEmail(otp) {
  return {
    subject: "Your Star Laundrovamat password reset code",
    text: `Your password reset code is ${otp}. It expires in 30 minutes. Do not share this code.`,
    html: layout(
      "Password reset code",
      `<p style="font-size:24px;font-weight:bold;letter-spacing:4px;margin:8px 0">${escapeHtml(otp)}</p>
       <p style="font-size:14px">This code expires in 30 minutes. Do not share it with anyone.</p>`,
    ),
  };
}
