import { database, newId, transaction } from "../lib/db.js";
import { requireRole, requireUser } from "../lib/auth.js";
import { assertCouponUsable, calculateDiscount } from "../lib/coupons.js";
import { BOOKING_STATUSES } from "../lib/schema.js";
import {
  bookingStatusEmail,
  newBookingAdminEmail,
  sendMailInBackground,
} from "../lib/mail.js";
import {
  bookingStatusMessage,
  newBookingMessage,
  postToSlackInBackground,
} from "../lib/slack.js";
import { config } from "../lib/env.js";
import {
  badRequest,
  forbidden,
  notFound,
  optionalString,
  requireString,
  toDate,
  toInteger,
  toMoney,
  today,
} from "../lib/http.js";

/** Statuses a service boy is allowed to set on their own assignments. */
const SERVICE_BOY_STATUSES = [
  "Clothes Picked Up",
  "Cleaning in Progress",
  "Ready for Delivery",
  "Delivered",
];

const TERMINAL_STATUSES = ["Delivered", "Cancelled"];

const serializeBooking = (booking, items = []) => ({
  ...booking,
  services: items,
  amount_set: Boolean(booking.amount_set),
  service_price: Number(booking.service_price),
  additional_charges: Number(booking.additional_charges),
  discount: Number(booking.discount),
  coupon_discount: Number(booking.coupon_discount),
  final_amount: Number(booking.final_amount),
  number_of_items: Number(booking.number_of_items),
});

/** Loads bookings plus their line items in two queries rather than N+1. */
async function attachItems(bookings) {
  if (!bookings.length) return [];
  const ids = bookings.map((booking) => booking.id);
  const [items] = await database.query(
    `SELECT booking_id, service_id, service_name, quantity, price, price_unit, line_total
     FROM booking_items WHERE booking_id IN (?) ORDER BY id ASC`,
    [ids],
  );
  const grouped = new Map(ids.map((id) => [id, []]));
  for (const item of items) {
    grouped.get(item.booking_id)?.push({
      service_id: item.service_id,
      service_name: item.service_name,
      quantity: Number(item.quantity),
      price: Number(item.price),
      price_unit: item.price_unit,
      line_total: Number(item.line_total),
    });
  }
  return bookings.map((booking) => serializeBooking(booking, grouped.get(booking.id) || []));
}

async function loadBooking(id) {
  const [rows] = await database.execute("SELECT * FROM bookings WHERE id = ? LIMIT 1", [id]);
  if (!rows[0]) throw notFound("Booking not found.");
  const [withItems] = await attachItems(rows);
  return withItems;
}

/** Human-facing reference, sequential within the calendar year: SLV-2026-001. */
async function nextBookingReference(connection) {
  const year = new Date().getFullYear();
  const [[{ count }]] = await connection.execute(
    "SELECT COUNT(*) AS count FROM bookings WHERE booking_id LIKE ?",
    [`SLV-${year}-%`],
  );
  return `SLV-${year}-${String(Number(count) + 1).padStart(3, "0")}`;
}

async function recordStatus(connection, bookingId, status, changedBy, note = null) {
  await connection.execute(
    "INSERT INTO booking_status_history (booking_id, status, changed_by, note) VALUES (?, ?, ?, ?)",
    [bookingId, status, changedBy, note],
  );
}

async function notifyCustomer(bookingId, status) {
  const [rows] = await database.execute(
    `SELECT b.*, u.email FROM bookings b JOIN users u ON u.id = b.customer_id WHERE b.id = ? LIMIT 1`,
    [bookingId],
  );
  const booking = rows[0];
  if (!booking) return;
  if (booking.email) {
    sendMailInBackground({ to: booking.email, ...bookingStatusEmail(booking, status) });
  }
  // Off by default: the channel is for new bookings, and echoing every status
  // change turns it into noise. SLACK_NOTIFY_STATUS_CHANGES=true opts in.
  if (config.slackNotifyStatusChanges) {
    postToSlackInBackground(bookingStatusMessage(booking, status));
  }
}

export function registerBookingRoutes(router) {
  // -------------------------------------------------------------------------
  // Customer
  // -------------------------------------------------------------------------
  router.post("/api/bookings", async (context) => {
    const user = requireUser(context);
    const { body } = context;

    // The profile gate in the browser can be skipped by calling the API
    // directly, and a booking without a name or a number is not collectable.
    if (!String(user.full_name || "").trim() || !String(user.phone || "").trim()) {
      throw badRequest("Complete your profile with your full name and phone number before booking.");
    }

    const requested = Array.isArray(body.services) ? body.services : [];
    if (!requested.length) throw badRequest("Choose at least one laundry service.");

    const pickupAddress = requireString(body.pickup_address, "Pickup address", { max: 2000 });
    const pickupTime = requireString(body.pickup_time, "Pickup time", { max: 64 });
    const pickupDate = toDate(body.pickup_date, "Pickup date", { required: true });
    if (pickupDate < today()) throw badRequest("Choose a pickup date that is not in the past.");

    const serviceIds = [...new Set(requested.map((item) => item.service_id).filter(Boolean))];
    if (!serviceIds.length) throw badRequest("Choose valid laundry services.");

    const [available] = await database.query(
      "SELECT * FROM services WHERE active = TRUE AND id IN (?)",
      [serviceIds],
    );
    if (available.length !== serviceIds.length) {
      throw badRequest("One or more selected services are unavailable.");
    }

    // Prices always come from the services table, never from the request body.
    const catalogue = new Map(available.map((service) => [service.id, service]));
    const items = requested.map((item) => {
      const service = catalogue.get(item.service_id);
      const quantity = toInteger(item.quantity ?? 1, "Quantity", { min: 1, max: 999 });
      const price = Number(service.price);
      return {
        service_id: service.id,
        service_name: service.name,
        quantity,
        price,
        price_unit: service.price_unit,
        line_total: Math.round(price * quantity * 100) / 100,
      };
    });

    const servicePrice = Math.round(items.reduce((sum, item) => sum + item.line_total, 0) * 100) / 100;
    const numberOfItems = toInteger(
      body.number_of_items ?? items.reduce((sum, item) => sum + item.quantity, 0),
      "Number of items",
      { min: 1, max: 9999 },
    );

    const booking = await transaction(async (connection) => {
      // ---- Coupon ---------------------------------------------------------
      let coupon = null;
      let couponDiscount = 0;
      const couponCode = optionalString(body.coupon_code, "Coupon code", { max: 48 }).toUpperCase();

      if (couponCode) {
        // Locked for the transaction so two concurrent bookings cannot both
        // consume the final use of a limited coupon.
        const [couponRows] = await connection.execute(
          "SELECT * FROM coupons WHERE code = ? LIMIT 1 FOR UPDATE",
          [couponCode],
        );
        coupon = couponRows[0] || null;
        if (!coupon || !coupon.active) throw badRequest("That coupon code is not valid.");

        const [[{ count }]] = await connection.execute(
          "SELECT COUNT(*) AS count FROM coupon_redemptions WHERE coupon_id = ? AND user_id = ?",
          [coupon.id, user.id],
        );
        couponDiscount = assertCouponUsable(coupon, {
          subtotal: servicePrice,
          redeemedByUser: Number(count),
          todayDate: today(),
        });
      }

      const id = newId();
      const reference = await nextBookingReference(connection);
      const finalAmount = Math.round((servicePrice - couponDiscount) * 100) / 100;

      await connection.execute(
        `INSERT INTO bookings (id, booking_id, customer_id, customer_name, customer_phone,
          number_of_items, special_instructions, pickup_address, pickup_date, pickup_time,
          status, service_price, coupon_id, coupon_code, coupon_discount, final_amount)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Booking Requested', ?, ?, ?, ?, ?)`,
        [
          id,
          reference,
          user.id,
          user.full_name,
          optionalString(body.phone, "Phone", { max: 32 }) || user.phone || "",
          numberOfItems,
          optionalString(body.special_instructions, "Special instructions", { max: 2000 }) || null,
          pickupAddress,
          pickupDate,
          pickupTime,
          servicePrice,
          coupon?.id || null,
          coupon?.code || null,
          couponDiscount,
          finalAmount,
        ],
      );

      for (const item of items) {
        await connection.execute(
          `INSERT INTO booking_items (booking_id, service_id, service_name, quantity, price, price_unit, line_total)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [id, item.service_id, item.service_name, item.quantity, item.price, item.price_unit, item.line_total],
        );
      }

      if (coupon) {
        await connection.execute(
          `INSERT INTO coupon_redemptions (coupon_id, booking_id, user_id, discount_amount)
           VALUES (?, ?, ?, ?)`,
          [coupon.id, id, user.id, couponDiscount],
        );
        await connection.execute("UPDATE coupons SET used_count = used_count + 1 WHERE id = ?", [
          coupon.id,
        ]);
      }

      await recordStatus(connection, id, "Booking Requested", user.id, "Created by customer");
      return { id, booking_id: reference };
    });

    const created = await loadBooking(booking.id);
    notifyCustomer(created.id, "Booking Requested");
    postToSlackInBackground(newBookingMessage(created));

    const [admins] = await database.execute(
      "SELECT email FROM users WHERE role = 'admin' AND active = TRUE",
    );
    for (const admin of admins) {
      sendMailInBackground({ to: admin.email, ...newBookingAdminEmail(created) });
    }

    return { status: 201, body: { booking: created } };
  });

  router.get("/api/bookings", async (context) => {
    const user = requireUser(context);
    const [rows] = await database.execute(
      "SELECT * FROM bookings WHERE customer_id = ? ORDER BY created_date DESC",
      [user.id],
    );
    return { body: { bookings: await attachItems(rows) } };
  });

  router.get("/api/bookings/:id", async (context) => {
    const user = requireUser(context);
    const booking = await loadBooking(context.params.id);
    // Customers see only their own; staff can open any booking.
    if (user.role === "customer" && booking.customer_id !== user.id) throw notFound("Booking not found.");
    if (user.role === "service_boy" && booking.service_boy_id !== user.id) throw forbidden();

    const [history] = await database.execute(
      "SELECT status, note, created_date FROM booking_status_history WHERE booking_id = ? ORDER BY created_date ASC",
      [booking.id],
    );
    return { body: { booking, history } };
  });

  router.post("/api/bookings/:id/cancel", async (context) => {
    const user = requireUser(context);
    const booking = await loadBooking(context.params.id);
    if (booking.customer_id !== user.id) throw notFound("Booking not found.");
    if (TERMINAL_STATUSES.includes(booking.status)) {
      throw badRequest(`A ${booking.status.toLowerCase()} booking cannot be cancelled.`);
    }
    // Once we have collected the clothes, cancelling is a conversation, not a click.
    if (!["Booking Requested", "Booking Confirmed"].includes(booking.status)) {
      throw badRequest("This booking is already in progress. Please contact us to cancel it.");
    }

    await transaction(async (connection) => {
      await connection.execute(
        "UPDATE bookings SET status = 'Cancelled', cancelled_date = CURRENT_TIMESTAMP(3) WHERE id = ?",
        [booking.id],
      );
      await releaseCoupon(connection, booking);
      await recordStatus(connection, booking.id, "Cancelled", user.id, "Cancelled by customer");
    });

    notifyCustomer(booking.id, "Cancelled");
    return { body: { booking: await loadBooking(booking.id) } };
  });

  // -------------------------------------------------------------------------
  // Admin
  // -------------------------------------------------------------------------
  router.get("/api/admin/bookings", async (context) => {
    requireRole(context, "admin");
    const [rows] = await database.execute("SELECT * FROM bookings ORDER BY created_date DESC");
    return { body: { bookings: await attachItems(rows) } };
  });

  router.put("/api/admin/bookings/:id", async (context) => {
    const admin = requireRole(context, "admin");
    const { body } = context;
    const booking = await loadBooking(context.params.id);

    let status = optionalString(body.status, "Status", { max: 64, fallback: booking.status });
    if (!BOOKING_STATUSES.includes(status)) throw badRequest("That booking status is not recognised.");

    // ---- Service boy assignment -------------------------------------------
    let serviceBoyId = booking.service_boy_id;
    let serviceBoyName = booking.service_boy_name;
    if (body.service_boy_id !== undefined) {
      const requestedId = optionalString(body.service_boy_id, "Service boy", { max: 32 });
      if (!requestedId) {
        serviceBoyId = null;
        serviceBoyName = null;
      } else {
        const [staff] = await database.execute(
          "SELECT id, full_name FROM users WHERE id = ? AND role = 'service_boy' AND active = TRUE LIMIT 1",
          [requestedId],
        );
        if (!staff[0]) throw badRequest("That service boy is not available.");
        serviceBoyId = staff[0].id;
        serviceBoyName = staff[0].full_name;

        // Assigning someone while the booking is still in an office-side status
        // used to leave the executive with nothing to act on. Move it along.
        const newlyAssigned = serviceBoyId !== booking.service_boy_id;
        if (newlyAssigned && ["Booking Requested", "Booking Confirmed"].includes(status)) {
          status = "Service Boy Assigned";
        }
      }
    }

    // ---- Amounts -----------------------------------------------------------
    const servicePrice = toMoney(body.service_price ?? booking.service_price, "Service price");
    const additionalCharges = toMoney(
      body.additional_charges ?? booking.additional_charges,
      "Additional charges",
    );
    const manualDiscount = toMoney(body.discount ?? booking.discount, "Discount");
    const subtotal = Math.round((servicePrice + additionalCharges) * 100) / 100;

    // The coupon is re-priced server-side against the new subtotal; the amount
    // the browser computed is only a preview.
    let couponDiscount = 0;
    if (booking.coupon_id) {
      const [coupons] = await database.execute("SELECT * FROM coupons WHERE id = ? LIMIT 1", [
        booking.coupon_id,
      ]);
      couponDiscount = calculateDiscount(coupons[0], subtotal);
    }

    if (manualDiscount + couponDiscount > subtotal) {
      throw badRequest("Discounts cannot exceed the order total.");
    }
    const finalAmount = Math.round((subtotal - manualDiscount - couponDiscount) * 100) / 100;
    const amountSet =
      body.amount_set !== undefined ? Boolean(body.amount_set) : booking.amount_set || subtotal > 0;

    const statusChanged = status !== booking.status;

    await transaction(async (connection) => {
      await connection.execute(
        `UPDATE bookings SET status = ?, service_boy_id = ?, service_boy_name = ?,
          service_price = ?, additional_charges = ?, discount = ?, coupon_discount = ?,
          final_amount = ?, amount_set = ?,
          delivered_date = CASE WHEN ? = 'Delivered' AND delivered_date IS NULL THEN CURRENT_TIMESTAMP(3) ELSE delivered_date END,
          cancelled_date = CASE WHEN ? = 'Cancelled' AND cancelled_date IS NULL THEN CURRENT_TIMESTAMP(3) ELSE cancelled_date END
         WHERE id = ?`,
        [
          status,
          serviceBoyId,
          serviceBoyName,
          servicePrice,
          additionalCharges,
          manualDiscount,
          couponDiscount,
          finalAmount,
          amountSet,
          status,
          status,
          booking.id,
        ],
      );

      if (statusChanged) {
        if (status === "Cancelled") await releaseCoupon(connection, booking);
        await recordStatus(connection, booking.id, status, admin.id, "Updated by admin");
      }
    });

    if (statusChanged) notifyCustomer(booking.id, status);
    return { body: { booking: await loadBooking(booking.id) } };
  });

  // -------------------------------------------------------------------------
  // Service boy
  // -------------------------------------------------------------------------
  router.get("/api/serviceboy/bookings", async (context) => {
    const user = requireRole(context, "service_boy");
    const [rows] = await database.execute(
      "SELECT * FROM bookings WHERE service_boy_id = ? ORDER BY created_date DESC",
      [user.id],
    );
    return { body: { bookings: await attachItems(rows) } };
  });

  router.patch("/api/serviceboy/bookings/:id/status", async (context) => {
    const user = requireRole(context, "service_boy");
    const booking = await loadBooking(context.params.id);
    if (booking.service_boy_id !== user.id) throw forbidden("This booking is not assigned to you.");

    const status = requireString(context.body.status, "Status", { max: 64 });
    if (!SERVICE_BOY_STATUSES.includes(status)) {
      throw forbidden("You cannot set that status.");
    }
    if (TERMINAL_STATUSES.includes(booking.status)) {
      throw badRequest("This booking is already closed.");
    }

    await transaction(async (connection) => {
      await connection.execute(
        `UPDATE bookings SET status = ?,
          delivered_date = CASE WHEN ? = 'Delivered' THEN CURRENT_TIMESTAMP(3) ELSE delivered_date END
         WHERE id = ?`,
        [status, status, booking.id],
      );
      await recordStatus(connection, booking.id, status, user.id, "Updated by service executive");
    });

    notifyCustomer(booking.id, status);
    return { body: { booking: await loadBooking(booking.id) } };
  });
}

/**
 * Gives a coupon use back when a booking is cancelled, so a customer is not
 * charged a redemption for an order that never happened.
 */
async function releaseCoupon(connection, booking) {
  if (!booking.coupon_id) return;
  const [result] = await connection.execute(
    "DELETE FROM coupon_redemptions WHERE booking_id = ?",
    [booking.id],
  );
  if (result.affectedRows) {
    await connection.execute(
      "UPDATE coupons SET used_count = GREATEST(used_count - 1, 0) WHERE id = ?",
      [booking.coupon_id],
    );
  }
}
