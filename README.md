<<<<<<< HEAD
# Star Laundrovamat

Laundry pickup-and-delivery app: a React (Vite) frontend, a dependency-free
Node.js API, and MySQL. There is no Base44 backend — the app runs entirely on
your own infrastructure.

## Prerequisites

- Node.js 20.19+
- MySQL 8.0+ (XAMPP, Docker, or a managed instance)

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create the database and tables:

   ```bash
   mysql -u root -p < server/schema.sql
   ```

   The API also creates and migrates the tables on boot, so this step is
   optional if the database itself already exists.

3. Copy `.env.example` to `.env` and fill in your MySQL credentials, a random
   `AUTH_JWT_SECRET`, and `ADMIN_EMAIL` / `ADMIN_PASSWORD`.

   **`ADMIN_EMAIL` and `ADMIN_PASSWORD` matter.** Signing up through the UI
   always creates a *customer*, so without them nothing can reach `/admin`. On
   boot the API creates that admin account, or promotes an existing user with
   the same email.

4. Run the API and frontend together:

   ```bash
   npm run dev:all
   ```

   Or in two terminals: `npm run server` and `npm run dev`. The frontend is at
   http://localhost:5173 and the API at http://localhost:3001.

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev:all` | API + frontend together |
| `npm run dev` | Vite dev server only (proxies `/api` to port 3001) |
| `npm run server` | Node API only |
| `npm run build` | Production frontend build into `dist/` |
| `npm run lint` | ESLint |

## Roles

| Role | Reaches | Created by |
| --- | --- | --- |
| `customer` | `/dashboard`, booking flow | Public sign-up |
| `service_boy` | `/serviceboy` | Admin, from **Admin → Service Boys** |
| `admin` | `/admin` | `ADMIN_EMAIL` / `ADMIN_PASSWORD` seed |

New service boys are emailed a one-time password. When SMTP is not configured
the admin UI shows the password once instead.

## Architecture

```
server/
  index.js          HTTP server, routing, error handling
  schema.sql        Full MySQL DDL (reference / clean install)
  lib/
    env.js          Config, validated at startup
    db.js           Connection pool, transaction helper
    schema.js       Table creation, migrations, seed data
    auth.js         Token issue/verify, role guards
    passwords.js    scrypt hashing
    coupons.js      Coupon rules and discount maths
    mail.js         SMTP transport and email templates
    http.js         Errors, body parsing, input coercion
    router.js       Pattern router
  routes/           auth, services, coupons, bookings,
                    admin-users, expenses, reports, settings, contact
src/api/
  client.js         fetch wrapper, token storage
  authClient.js     auth + customer endpoints
  adminClient.js    admin + service-boy endpoints
```

Every handler asks for its own caller with `requireUser` / `requireRole`, so a
new route is never left unguarded by a path prefix rule that forgot to cover it.

### Database

Ten tables. `booking_items` holds order lines priced at booking time, so
changing a service's price never rewrites historical orders.
`coupon_redemptions` records each accepted coupon use, which is what enforces
per-customer limits and gives the business report its discount trail.

```
users ──< bookings ──< booking_items >── services
             │   └──< booking_status_history
             └──< coupon_redemptions >── coupons
expenses     contact_messages     app_settings
```

## API

All routes are under `/api`. Authenticated routes take `Authorization: Bearer <token>`.

### Public

| Method | Route | Purpose |
| --- | --- | --- |
| `POST` | `/auth/signup` | Register a customer |
| `POST` | `/auth/login` | Sign in |
| `POST` | `/auth/forgot-password` | Email a six-digit reset code |
| `POST` | `/auth/reset-password` | Reset with the code |
| `GET` | `/services` | Active service catalogue |
| `GET` | `/settings` | Business name, phone, hours |
| `POST` | `/contact` | Enquiry form |
| `GET` | `/health` | Liveness check |

### Customer

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` `PUT` | `/auth/me` | Read / update own profile |
| `PUT` | `/auth/password` | Change password |
| `POST` | `/coupons/validate` | Check a code against a subtotal |
| `GET` `POST` | `/bookings` | List own / create booking |
| `GET` | `/bookings/:id` | One booking with status history |
| `POST` | `/bookings/:id/cancel` | Cancel while still cancellable |

### Admin

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/admin/dashboard` | Today's totals, recent bookings |
| `GET` | `/admin/report?from=&to=` | Revenue, expenses, top services, coupon usage |
| `GET` | `/admin/report/export?from=&to=` | Same range as an .xlsx download (Summary, Orders, Sales, Profit) |
| `GET` `PUT` | `/admin/bookings`, `/admin/bookings/:id` | List / update status, assignment, amounts |
| `GET` `POST` `PUT` `DELETE` | `/admin/services[/:id]` | Service catalogue |
| `GET` `POST` `PUT` `DELETE` | `/admin/coupons[/:id]` | Coupon CRUD |
| `PATCH` | `/admin/coupons/:id/status` | Activate / deactivate |
| `GET` | `/admin/coupons/:id` | One coupon with its redemptions |
| `GET` | `/admin/customers` | Customers with booking counts and spend |
| `GET` `POST` | `/admin/serviceboys` | List / create staff |
| `PUT` `PATCH` `POST` | `/admin/users/:id[/status\|/reset-password]` | Edit, activate, reset password |
| `GET` `POST` `PUT` `DELETE` | `/admin/expenses[/:id]` | Expense tracking |
| `PUT` | `/admin/settings` | Business settings |
| `GET` `POST` | `/admin/slack/status`, `/admin/slack/test` | Check Slack config / send a test message |
| `GET` `PATCH` | `/admin/contact-messages[/:id]` | Enquiry inbox |

### Service boy

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/serviceboy/bookings` | Own assignments only |
| `PATCH` | `/serviceboy/bookings/:id/status` | Advance pickup / cleaning / delivery |

## Coupons

Created and managed from **Admin → Coupons**: create, edit, activate,
deactivate, delete, with percentage or fixed discounts, a minimum order, a
discount cap, a total usage limit, a per-customer limit, and a validity window.

Discounts are always calculated on the server. The browser's figure is a
preview; the stored amount comes from `server/lib/coupons.js`, which the
customer check, booking creation and the admin booking editor all share.

Two rules protect the audit trail:

- A coupon that has been redeemed cannot be deleted, only deactivated —
  deleting would cascade away the discount record on real orders.
- Cancelling a booking returns its coupon use, so a customer is not charged a
  redemption for an order that never happened.

Limited coupons are locked (`SELECT ... FOR UPDATE`) while a booking is
created, so two simultaneous bookings cannot both claim the last use.

## Slack notifications

Every new booking is posted to a Slack channel. Setup:

1. Go to https://api.slack.com/apps and **Create New App → From scratch**. Name
   it (e.g. "Star Laundrovamat") and pick your workspace.
2. Open **Incoming Webhooks**, turn the toggle **On**, then
   **Add New Webhook to Workspace** and choose your channel
   (e.g. `#laundary-booking-services`). For a private channel, invite the app
   first with `/invite @YourAppName`.
3. Copy the webhook URL (`https://hooks.slack.com/services/T.../B.../...`) into
   `.env`:

   ```
   SLACK_WEBHOOK_URL=https://hooks.slack.com/services/XXX/YYY/ZZZ
   ```

4. Restart the API, then open **Admin → Settings → Slack Notifications** and
   click **Send test message**.

The webhook URL is a credential — anyone holding it can post to the channel.
It lives only in `.env`, which is gitignored.

Set `SLACK_NOTIFY_STATUS_CHANGES=true` to also post each status change
(confirmed, picked up, delivered). Off by default so the channel stays a clean
feed of new bookings.

Slack never blocks a booking: posts are fire-and-forget, and an outage, a bad
URL or a deleted channel is logged to the server console while the booking still
succeeds. With `SLACK_WEBHOOK_URL` unset the whole integration is a no-op.

## Deployment notes

- Set `NODE_ENV=production`. The API then refuses to start without
  `AUTH_JWT_SECRET` and `MYSQL_PASSWORD`.
- Set `CLIENT_ORIGIN` to the deployed frontend origin; it is the CORS allowlist.
- Build the frontend with `npm run build` and serve `dist/` from any static host.
- Sessions are bearer tokens in `localStorage` with a 7-day expiry. Deactivating
  an account revokes access immediately, since every request re-reads the user.
=======
