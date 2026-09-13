// Slack notifications via an Incoming Webhook.
//
// Set SLACK_WEBHOOK_URL in .env to switch this on. When it is unset every call
// here is a no-op, so the app runs unchanged without Slack configured.

import { config } from "./env.js";

export const isSlackConfigured = () => Boolean(config.slackWebhookUrl);

const money = (amount) => `₹${Number(amount || 0).toLocaleString("en-IN")}`;

/** "2026-09-15" -> "15 September 2026", matching the channel's readable style. */
function formatPickupDate(value) {
  const raw = String(value || "");
  const parsed = new Date(`${raw.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return raw;
  return parsed.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
}

/**
 * Posts to the webhook. Never throws: a Slack outage or a bad URL must not turn
 * a successful booking into a failed request, so problems are logged instead.
 */
export async function postToSlack(message) {
  if (!isSlackConfigured()) return false;
  try {
    const response = await fetch(config.slackWebhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(message),
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) {
      // Slack answers with a plain-text reason such as "no_service" or "invalid_payload".
      console.error(`[slack] post failed (${response.status}): ${await response.text()}`);
      return false;
    }
    return true;
  } catch (error) {
    console.error("[slack] post failed:", error.message);
    return false;
  }
}

/** Fire-and-forget wrapper for use inside request handlers. */
export function postToSlackInBackground(message) {
  if (!isSlackConfigured()) return;
  void postToSlack(message);
}

/**
 * Builds the "new booking" message.
 *
 * `text` is the notification/fallback line (what shows in the sidebar and on a
 * phone's lock screen); `blocks` is the formatted body.
 */
export function newBookingMessage(booking) {
  const totalItems =
    Number(booking.number_of_items) ||
    (booking.services || []).reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);

  // Always show the quantity, including ×1: the channel is read as a picking
  // list, so an implicit count is worse than a redundant one.
  const services = (booking.services || []).length
    ? booking.services
        .map((item) => `• ${item.service_name} × ${Number(item.quantity) || 1}`)
        .join("\n")
    : "• —";

  const lines = [
    "🧺 *NEW LAUNDRY BOOKING*",
    "",
    `👤 *Customer:* ${booking.customer_name || "—"}`,
    `📱 *Phone:* ${booking.customer_phone || "—"}`,
    `📍 *Address:* ${booking.pickup_address}`,
    "",
    "🧺 *Services:*",
    services,
    "",
    `🧺 *Total Items:* ${totalItems}`,
    `💰 *Total:* ${money(booking.final_amount)}`,
    `📅 *Pickup Date:* ${formatPickupDate(booking.pickup_date)}`,
    `🕒 *Pickup Time:* ${booking.pickup_time}`,
    `🆔 *Booking ID:* #${booking.booking_id}`,
  ];

  if (Number(booking.coupon_discount) > 0) {
    lines.splice(
      lines.indexOf(`💰 *Total:* ${money(booking.final_amount)}`),
      0,
      `🎟️ *Coupon:* ${booking.coupon_code} (−${money(booking.coupon_discount)})`,
    );
  }
  if (booking.special_instructions) {
    lines.push("", `📝 *Instructions:* ${booking.special_instructions}`);
  }

  return {
    text: `🧺 New booking #${booking.booking_id} from ${booking.customer_name || "a customer"} — ${money(booking.final_amount)}`,
    blocks: [{ type: "section", text: { type: "mrkdwn", text: lines.join("\n") } }],
  };
}

/** Posted when a booking moves to a new status. */
export function bookingStatusMessage(booking, status) {
  const emoji =
    {
      "Booking Confirmed": "✅",
      "Service Boy Assigned": "🧑‍🔧",
      "Clothes Picked Up": "🚚",
      "Cleaning in Progress": "🫧",
      "Ready for Delivery": "📦",
      Delivered: "🎉",
      Cancelled: "❌",
    }[status] || "🔄";

  const lines = [
    `${emoji} *BOOKING UPDATE* — #${booking.booking_id}`,
    "",
    `👤 *Customer:* ${booking.customer_name || "—"}`,
    `📌 *Status:* ${status}`,
  ];
  if (booking.service_boy_name) lines.push(`🧑‍🔧 *Service Boy:* ${booking.service_boy_name}`);
  if (booking.amount_set) lines.push(`💰 *Amount:* ${money(booking.final_amount)}`);

  return {
    text: `${emoji} #${booking.booking_id} — ${status}`,
    blocks: [{ type: "section", text: { type: "mrkdwn", text: lines.join("\n") } }],
  };
}
