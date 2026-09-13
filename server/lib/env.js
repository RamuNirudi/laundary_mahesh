// Central place for reading and validating configuration. Importing this module
// fails fast with an actionable message rather than letting the API boot into a
// half-configured state.

const isProduction = process.env.NODE_ENV === "production";

const secret =
  process.env.AUTH_JWT_SECRET || (isProduction ? "" : "local-development-secret-change-me");

if (!secret) throw new Error("AUTH_JWT_SECRET must be set in production.");

for (const key of ["MYSQL_HOST", "MYSQL_DATABASE", "MYSQL_USER"]) {
  if (!process.env[key]) throw new Error(`${key} must be set before starting the API.`);
}

if (isProduction && !process.env.MYSQL_PASSWORD) {
  throw new Error("MYSQL_PASSWORD must be set in production.");
}

export const config = {
  isProduction,
  port: Number(process.env.PORT || 3001),
  secret,
  tokenTtlSeconds: 60 * 60 * 24 * 7,
  clientOrigin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
  adminEmail: (process.env.ADMIN_EMAIL || "").trim().toLowerCase(),
  adminPassword: process.env.ADMIN_PASSWORD || "",
  contactInbox: (process.env.CONTACT_INBOX || process.env.SMTP_FROM || "").trim(),
  // Slack Incoming Webhook. Unset disables Slack notifications entirely.
  slackWebhookUrl: (process.env.SLACK_WEBHOOK_URL || "").trim(),
  slackNotifyStatusChanges: process.env.SLACK_NOTIFY_STATUS_CHANGES === "true",
  mysql: {
    host: process.env.MYSQL_HOST,
    port: Number(process.env.MYSQL_PORT || 3306),
    database: process.env.MYSQL_DATABASE,
    user: process.env.MYSQL_USER,
    // XAMPP and other local installs commonly use a blank root password.
    // Production is guarded above and must always supply one.
    password: process.env.MYSQL_PASSWORD || "",
    ssl:
      process.env.MYSQL_SSL === "true"
        ? { rejectUnauthorized: process.env.MYSQL_SSL_REJECT_UNAUTHORIZED !== "false" }
        : undefined,
  },
  smtp: {
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 465),
    secure: process.env.SMTP_SECURE !== "false",
    user: process.env.SMTP_USER,
    password: process.env.SMTP_PASSWORD,
    from: process.env.SMTP_FROM,
  },
};
