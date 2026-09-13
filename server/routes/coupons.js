import { database, newId } from "../lib/db.js";
import { requireRole, requireUser } from "../lib/auth.js";
import {
  assertCouponUsable,
  calculateDiscount,
  COUPON_TYPES,
  serializeCoupon,
} from "../lib/coupons.js";
import {
  badRequest,
  conflict,
  notFound,
  optionalString,
  requireString,
  toBoolean,
  toDate,
  toInteger,
  toMoney,
  today,
} from "../lib/http.js";

const normalizeCode = (value) =>
  requireString(value, "Coupon code", { max: 48 }).toUpperCase().replace(/\s+/g, "");

function readCouponInput(body, existing = {}) {
  const discountType = optionalString(body.discount_type, "Discount type", {
    max: 16,
    fallback: existing.discount_type || "percentage",
  });
  if (!COUPON_TYPES.includes(discountType)) {
    throw badRequest("Discount type must be either percentage or fixed.");
  }

  const discountValue = toMoney(body.discount_value ?? existing.discount_value ?? 0, "Discount value");
  if (discountValue <= 0) throw badRequest("Discount value must be greater than 0.");
  if (discountType === "percentage" && discountValue > 100) {
    throw badRequest("A percentage discount cannot exceed 100.");
  }

  const validFrom = toDate(
    body.valid_from === undefined ? existing.valid_from : body.valid_from,
    "Valid from",
  );
  const validUntil = toDate(
    body.valid_until === undefined ? existing.valid_until : body.valid_until,
    "Valid until",
  );
  if (validFrom && validUntil && validUntil < validFrom) {
    throw badRequest("Valid until must be on or after valid from.");
  }

  return {
    code: normalizeCode(body.code ?? existing.code),
    description: optionalString(body.description, "Description", {
      max: 255,
      fallback: existing.description || "",
    }),
    discount_type: discountType,
    discount_value: discountValue,
    min_order_amount: toMoney(body.min_order_amount ?? existing.min_order_amount ?? 0, "Minimum order amount"),
    max_discount_amount: toMoney(
      body.max_discount_amount ?? existing.max_discount_amount ?? 0,
      "Maximum discount amount",
    ),
    max_uses: toInteger(body.max_uses ?? existing.max_uses ?? 0, "Max uses", { min: 0, max: 1_000_000 }),
    per_user_limit: toInteger(body.per_user_limit ?? existing.per_user_limit ?? 0, "Per-user limit", {
      min: 0,
      max: 1000,
    }),
    active: toBoolean(body.active, existing.active === undefined ? true : Boolean(existing.active)),
    valid_from: validFrom,
    valid_until: validUntil,
  };
}

async function loadCoupon(id) {
  const [rows] = await database.execute("SELECT * FROM coupons WHERE id = ? LIMIT 1", [id]);
  if (!rows[0]) throw notFound("Coupon not found.");
  return rows[0];
}

export function registerCouponRoutes(router) {
  // -------------------------------------------------------------------------
  // Customer: check a code against a running subtotal before booking.
  // -------------------------------------------------------------------------
  router.post("/api/coupons/validate", async (context) => {
    const user = requireUser(context);
    const code = normalizeCode(context.body.code);
    const subtotal = toMoney(context.body.subtotal ?? 0, "Order subtotal");

    const [rows] = await database.execute("SELECT * FROM coupons WHERE code = ? LIMIT 1", [code]);
    const coupon = rows[0];
    // An inactive or unknown code gets the same answer so the endpoint cannot be
    // used to enumerate which codes exist.
    if (!coupon || !coupon.active) throw badRequest("That coupon code is not valid.");

    const [[{ count }]] = await database.execute(
      "SELECT COUNT(*) AS count FROM coupon_redemptions WHERE coupon_id = ? AND user_id = ?",
      [coupon.id, user.id],
    );
    const discount = assertCouponUsable(coupon, {
      subtotal,
      redeemedByUser: Number(count),
      todayDate: today(),
    });

    return {
      body: {
        coupon: serializeCoupon(coupon),
        discount,
        // Public view only - usage counters and limits stay in the admin panel.
        summary: {
          code: coupon.code,
          description: coupon.description,
          discount_type: coupon.discount_type,
          discount_value: Number(coupon.discount_value),
          min_order_amount: Number(coupon.min_order_amount),
        },
      },
    };
  });

  // -------------------------------------------------------------------------
  // Admin: full coupon management.
  // -------------------------------------------------------------------------
  router.get("/api/admin/coupons", async (context) => {
    requireRole(context, "admin");
    const [coupons] = await database.execute("SELECT * FROM coupons ORDER BY created_date DESC");
    return { body: { coupons: coupons.map(serializeCoupon) } };
  });

  router.get("/api/admin/coupons/:id", async (context) => {
    requireRole(context, "admin");
    const coupon = await loadCoupon(context.params.id);
    const [redemptions] = await database.execute(
      `SELECT r.id, r.discount_amount, r.created_date, b.booking_id, u.full_name, u.email
       FROM coupon_redemptions r
       JOIN bookings b ON b.id = r.booking_id
       JOIN users u ON u.id = r.user_id
       WHERE r.coupon_id = ? ORDER BY r.created_date DESC LIMIT 200`,
      [coupon.id],
    );
    return { body: { coupon: serializeCoupon(coupon), redemptions } };
  });

  router.post("/api/admin/coupons", async (context) => {
    const admin = requireRole(context, "admin");
    const input = readCouponInput(context.body);

    const [existing] = await database.execute("SELECT id FROM coupons WHERE code = ? LIMIT 1", [
      input.code,
    ]);
    if (existing.length) throw conflict(`Coupon code "${input.code}" already exists.`);

    const id = newId();
    await database.execute(
      `INSERT INTO coupons (id, code, description, discount_type, discount_value, min_order_amount,
        max_discount_amount, max_uses, per_user_limit, active, valid_from, valid_until, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        input.code,
        input.description,
        input.discount_type,
        input.discount_value,
        input.min_order_amount,
        input.max_discount_amount,
        input.max_uses,
        input.per_user_limit,
        input.active,
        input.valid_from,
        input.valid_until,
        admin.id,
      ],
    );
    return { status: 201, body: { coupon: serializeCoupon(await loadCoupon(id)) } };
  });

  router.put("/api/admin/coupons/:id", async (context) => {
    requireRole(context, "admin");
    const existing = await loadCoupon(context.params.id);
    const input = readCouponInput(context.body, existing);

    if (input.code !== existing.code) {
      const [clash] = await database.execute(
        "SELECT id FROM coupons WHERE code = ? AND id <> ? LIMIT 1",
        [input.code, existing.id],
      );
      if (clash.length) throw conflict(`Coupon code "${input.code}" already exists.`);
    }
    if (input.max_uses > 0 && input.max_uses < Number(existing.used_count)) {
      throw badRequest(
        `This coupon has already been used ${existing.used_count} times. Max uses cannot be lower than that.`,
      );
    }

    await database.execute(
      `UPDATE coupons SET code = ?, description = ?, discount_type = ?, discount_value = ?,
        min_order_amount = ?, max_discount_amount = ?, max_uses = ?, per_user_limit = ?,
        active = ?, valid_from = ?, valid_until = ? WHERE id = ?`,
      [
        input.code,
        input.description,
        input.discount_type,
        input.discount_value,
        input.min_order_amount,
        input.max_discount_amount,
        input.max_uses,
        input.per_user_limit,
        input.active,
        input.valid_from,
        input.valid_until,
        existing.id,
      ],
    );
    return { body: { coupon: serializeCoupon(await loadCoupon(existing.id)) } };
  });

  // Dedicated activate/deactivate endpoint so the admin list's power toggle does
  // not have to round-trip the whole coupon and risk clobbering a concurrent edit.
  router.patch("/api/admin/coupons/:id/status", async (context) => {
    requireRole(context, "admin");
    const coupon = await loadCoupon(context.params.id);
    const active = toBoolean(context.body.active, !coupon.active);
    await database.execute("UPDATE coupons SET active = ? WHERE id = ?", [active, coupon.id]);
    return {
      body: {
        coupon: serializeCoupon(await loadCoupon(coupon.id)),
        message: active ? "Coupon activated." : "Coupon deactivated.",
      },
    };
  });

  router.delete("/api/admin/coupons/:id", async (context) => {
    requireRole(context, "admin");
    const coupon = await loadCoupon(context.params.id);
    const [[{ count }]] = await database.execute(
      "SELECT COUNT(*) AS count FROM coupon_redemptions WHERE coupon_id = ?",
      [coupon.id],
    );
    // Redemptions cascade, which would erase the discount trail on real orders.
    if (count) {
      throw conflict(
        `"${coupon.code}" has been redeemed on ${count} booking${count === 1 ? "" : "s"}. Deactivate it instead of deleting.`,
      );
    }
    await database.execute("DELETE FROM coupons WHERE id = ?", [coupon.id]);
    return { body: { message: "Coupon deleted." } };
  });
}

export { calculateDiscount };
