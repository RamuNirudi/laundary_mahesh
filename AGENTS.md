# AGENTS.md

## Project Context

Star Laundrovamat: a React (Vite) frontend on a custom Node.js + MySQL backend.
Treat it as user-owned application code, keep changes focused on the request,
and preserve existing conventions.

This app **does not use Base44**. There is no Base44 SDK, CLI, or hosted
backend — do not reintroduce `@base44/*` packages, `base44 dev`, or
`base44.entities.*` / `base44.functions.invoke` calls. Start with `README.md`
for setup, the API surface, and the database design.

## Key Files

- `server/index.js` — HTTP server and routing.
- `server/lib/` — config, pool, schema/migrations, auth, coupons, mail, helpers.
- `server/routes/` — one module per domain.
- `server/schema.sql` — canonical MySQL DDL.
- `src/api/` — `client.js` (fetch wrapper), `authClient.js`, `adminClient.js`.
- `src/pages/admin/` — admin panel; `src/pages/customer/`, `src/pages/serviceboy/`.
- `.env` — local secrets, gitignored. Never commit it.

## Working Notes

- `npm run dev:all` runs the API and frontend together; `npm run server` and
  `npm run dev` run them separately.
- The frontend never talks to MySQL. Add a route under `server/routes/`, then a
  method on the matching client in `src/api/`, then use it in the page.
- Every route handler calls `requireUser` or `requireRole` itself. There is no
  path-prefix auth middleware, so a new admin route without a guard is public —
  always add one.
- Money and discounts are computed server-side. Prices come from the `services`
  table, never from the request body; treat any client-sent amount as a preview.
- Schema changes go in **both** `server/lib/schema.js` (so existing databases
  migrate on boot) and `server/schema.sql` (so clean installs match).
- Notification email must never fail a request: use `sendMailInBackground` for
  anything the user is not directly waiting on.
- Same for Slack: use `postToSlackInBackground`. `server/lib/slack.js` swallows
  and logs every failure so an outage can never fail a booking.
- Run `npm run lint` and `npm run build` before finishing. `npm run typecheck`
  has pre-existing failures from untyped shadcn components; it is not a gate.
