import { database } from "../lib/db.js";
import { requireRole } from "../lib/auth.js";
import { DEFAULT_SETTINGS } from "../lib/schema.js";
import { badRequest, optionalString } from "../lib/http.js";
import { isSlackConfigured, postToSlack } from "../lib/slack.js";

async function readSettings() {
  const [rows] = await database.execute("SELECT setting_key, setting_value FROM app_settings");
  const stored = Object.fromEntries(rows.map((row) => [row.setting_key, row.setting_value]));
  // Defaults fill any key added since the row was written.
  return { ...DEFAULT_SETTINGS, ...stored };
}

export function registerSettingsRoutes(router) {
  // Public: the storefront reads business name, phone and hours from here.
  router.get("/api/settings", async () => ({ body: { settings: await readSettings() } }));

  router.put("/api/admin/settings", async (context) => {
    requireRole(context, "admin");
    const updates = Object.entries(context.body).filter(([key]) => key in DEFAULT_SETTINGS);
    if (!updates.length) throw badRequest("No recognised settings were supplied.");

    for (const [key, value] of updates) {
      await database.execute(
        `INSERT INTO app_settings (setting_key, setting_value) VALUES (?, ?)
         ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
        [key, optionalString(value, key, { max: 255 })],
      );
    }
    return { body: { settings: await readSettings() } };
  });

  // Lets the admin confirm the webhook works without placing a real booking.
  router.get("/api/admin/slack/status", async (context) => {
    requireRole(context, "admin");
    return { body: { configured: isSlackConfigured() } };
  });

  router.post("/api/admin/slack/test", async (context) => {
    requireRole(context, "admin");
    if (!isSlackConfigured()) {
      throw badRequest("Slack is not configured. Set SLACK_WEBHOOK_URL in .env and restart the API.");
    }
    const delivered = await postToSlack({
      text: "✅ Star Laundrovamat is connected to this channel. New bookings will appear here.",
    });
    if (!delivered) {
      throw badRequest("Slack rejected the message. Check SLACK_WEBHOOK_URL and the server log.");
    }
    return { body: { message: "Test message sent to Slack." } };
  });
}
