// Star Laundrovamat API - Node.js + MySQL, no external web framework.
//
//   npm run server      start the API on PORT (default 3001)
//   npm run dev:all     API and Vite frontend together
//
// Routes are grouped in ./routes and share the helpers in ./lib.

import { createServer } from "node:http";
import { config } from "./lib/env.js";
import { database } from "./lib/db.js";
import { initializeDatabase } from "./lib/schema.js";
import { currentUser } from "./lib/auth.js";
import { ApiError, readJsonBody, send, sendBuffer } from "./lib/http.js";
import { createRouter } from "./lib/router.js";
import { registerAuthRoutes } from "./routes/auth.js";
import { registerServiceRoutes } from "./routes/services.js";
import { registerCouponRoutes } from "./routes/coupons.js";
import { registerBookingRoutes } from "./routes/bookings.js";
import { registerAdminUserRoutes } from "./routes/admin-users.js";
import { registerExpenseRoutes } from "./routes/expenses.js";
import { registerReportRoutes } from "./routes/reports.js";
import { registerSettingsRoutes } from "./routes/settings.js";
import { registerContactRoutes } from "./routes/contact.js";

const router = createRouter();
router.get("/api/health", async () => ({ body: { status: "ok" } }));
registerAuthRoutes(router);
registerServiceRoutes(router);
registerCouponRoutes(router);
registerBookingRoutes(router);
registerAdminUserRoutes(router);
registerExpenseRoutes(router);
registerReportRoutes(router);
registerSettingsRoutes(router);
registerContactRoutes(router);

const METHODS_WITH_BODY = new Set(["POST", "PUT", "PATCH"]);

const server = createServer(async (request, response) => {
  if (request.method === "OPTIONS") return send(response, 204, {});

  try {
    const url = new URL(request.url, `http://${request.headers.host}`);
    const { handler, params } = router.resolve(request.method, url.pathname);

    // Every handler gets the caller (or null) and calls requireUser/requireRole
    // itself, so a new route is never accidentally left unguarded by a
    // path-prefix rule that forgot to cover it.
    const context = {
      request,
      params,
      query: Object.fromEntries(url.searchParams),
      user: await currentUser(request),
      body: METHODS_WITH_BODY.has(request.method) ? await readJsonBody(request) : {},
    };

    const result = (await handler(context)) || {};
    // File downloads return a Buffer instead of a JSON body.
    if (result.buffer) {
      return sendBuffer(response, result.status || 200, result.buffer, {
        contentType: result.contentType || "application/octet-stream",
        filename: result.filename || "download",
      });
    }
    return send(response, result.status || 200, result.body ?? {});
  } catch (error) {
    if (error instanceof ApiError) return send(response, error.status, { message: error.message });

    console.error("[api]", error);
    if (error.code === "ER_DUP_ENTRY") {
      return send(response, 409, { message: "That record already exists." });
    }
    if (error.code === "ECONNREFUSED" || error.code === "PROTOCOL_CONNECTION_LOST") {
      return send(response, 503, { message: "The database is unavailable. Please try again." });
    }
    return send(response, 500, { message: "Internal server error." });
  }
});

async function shutdown(signal) {
  console.log(`\n[api] ${signal} received, shutting down.`);
  server.close();
  await database.end().catch(() => {});
  process.exit(0);
}
for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => void shutdown(signal));
}

try {
  await initializeDatabase();
} catch (error) {
  console.error("[api] Database setup failed:", error.message);
  console.error(
    "[api] Check MYSQL_* values in .env and that the database exists (see server/schema.sql).",
  );
  process.exit(1);
}

server.listen(config.port, () => {
  console.log(`[api] Laundry API listening on http://localhost:${config.port}`);
  console.log(`[api] Allowing browser requests from ${config.clientOrigin}`);
});
