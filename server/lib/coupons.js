// Coupon validation and pricing. Kept in one place so the customer-facing
// "apply coupon" check, booking creation and the admin booking editor all agree
// on what a coupon is worth.

import { badRequest } from "./http.js";

export const COUPON_TYPES = ["percentage", "fixed"];

/** Normalizes a row so booleans and money are real JS types for the client. */
export const serializeCoupon = (coupon) =>
  coupon && {
    ...coupon,
    active: Boolean(coupon.active),
    discount_value: Number(coupon.discount_value),
    min_order_amount: Number(coupon.min_order_amount),
    max_discount_amount: Number(coupon.max_discount_amount),
    used_count: Number(coupon.used_count),
    max_uses: Number(coupon.max_uses),
    per_user_limit: Number(coupon.per_user_limit),
    valid_from: coupon.valid_from || "",
    valid_until: coupon.valid_until || "",
  };

/**
 * Money saved by `coupon` on `subtotal`. Returns 0 when the order does not meet
 * the minimum; the caller decides whether that is an error or just no discount.
 */
export function calculateDiscount(coupon, subtotal) {
  const amount = Number(subtotal) || 0;
  if (!coupon || amount <= 0) return 0;
  if (Number(coupon.min_order_amount) > 0 && amount < Number(coupon.min_order_amount)) return 0;

  let discount =
    coupon.discount_type === "percentage"
      ? (amount * Number(coupon.discount_value)) / 100
      : Number(coupon.discount_value);

  const cap = Number(coupon.max_discount_amount);
  if (cap > 0) discount = Math.min(discount, cap);

  // Never discount below zero, and never round a fraction of a paisa into view.
  return Math.round(Math.min(discount, amount) * 100) / 100;
}

/**
 * Checks every rule that can stop a coupon being used, and returns the discount
 * it is worth. `redeemedByUser` is the caller's redemption count for this code.
 *
 * @throws {ApiError} 400 with a customer-readable reason.
 */
export function assertCouponUsable(coupon, { subtotal, redeemedByUser = 0, todayDate }) {
  if (!coupon) throw badRequest("That coupon code is not valid.");
  if (!coupon.active) throw badRequest("This coupon is no longer active.");
  if (coupon.valid_from && todayDate < coupon.valid_from) {
    throw badRequest(`This coupon is not valid until ${coupon.valid_from}.`);
  }
  if (coupon.valid_until && todayDate > coupon.valid_until) {
    throw badRequest("This coupon has expired.");
  }
  if (Number(coupon.max_uses) > 0 && Number(coupon.used_count) >= Number(coupon.max_uses)) {
    throw badRequest("This coupon has reached its usage limit.");
  }
  if (Number(coupon.per_user_limit) > 0 && redeemedByUser >= Number(coupon.per_user_limit)) {
    throw badRequest("You have already used this coupon the maximum number of times.");
  }
  if (Number(coupon.min_order_amount) > 0 && Number(subtotal) < Number(coupon.min_order_amount)) {
    throw badRequest(`This coupon needs a minimum order of Rs. ${coupon.min_order_amount}.`);
  }
  return calculateDiscount(coupon, subtotal);
}
