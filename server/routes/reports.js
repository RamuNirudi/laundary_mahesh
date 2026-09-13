// Dashboard and business-report aggregates. These run in MySQL rather than
// pulling every booking into the browser, which is what the Base44 version did.

import { database } from "../lib/db.js";
import { requireRole } from "../lib/auth.js";
import { badRequest, toDate, today } from "../lib/http.js";
import { buildReportWorkbook } from "../lib/report-excel.js";

export function registerReportRoutes(router) {
  router.get("/api/admin/dashboard", async (context) => {
    requireRole(context, "admin");
    const date = today();

    const [[totals]] = await database.execute(
      `SELECT
         COUNT(*) AS todays_bookings,
         COALESCE(SUM(CASE WHEN amount_set AND status <> 'Cancelled' THEN final_amount ELSE 0 END), 0) AS todays_revenue
       FROM bookings WHERE pickup_date = ?`,
      [date],
    );
    const [[{ todays_expenses }]] = await database.execute(
      "SELECT COALESCE(SUM(amount), 0) AS todays_expenses FROM expenses WHERE date = ?",
      [date],
    );
    const [[{ active_bookings }]] = await database.execute(
      "SELECT COUNT(*) AS active_bookings FROM bookings WHERE status NOT IN ('Delivered','Cancelled')",
    );
    const [[{ total_customers }]] = await database.execute(
      "SELECT COUNT(*) AS total_customers FROM users WHERE role = 'customer'",
    );
    const [recent] = await database.execute(
      `SELECT id, booking_id, customer_name, pickup_date, pickup_time, status, final_amount, amount_set
       FROM bookings ORDER BY created_date DESC LIMIT 6`,
    );
    const [statusBreakdown] = await database.execute(
      "SELECT status, COUNT(*) AS count FROM bookings GROUP BY status",
    );

    const revenue = Number(totals.todays_revenue);
    const expenses = Number(todays_expenses);

    return {
      body: {
        stats: {
          todays_bookings: Number(totals.todays_bookings),
          todays_revenue: revenue,
          todays_expenses: expenses,
          profit: Math.round((revenue - expenses) * 100) / 100,
          active_bookings: Number(active_bookings),
          total_customers: Number(total_customers),
        },
        recent: recent.map((booking) => ({
          ...booking,
          final_amount: Number(booking.final_amount),
          amount_set: Boolean(booking.amount_set),
        })),
        status_breakdown: statusBreakdown.map((row) => ({ ...row, count: Number(row.count) })),
      },
    };
  });

  router.get("/api/admin/report", async (context) => {
    requireRole(context, "admin");
    // Defaults cover the current month, matching the report page's initial filter.
    const from = toDate(context.query.from, "From date") || `${today().slice(0, 7)}-01`;
    const to = toDate(context.query.to, "To date") || today();

    const [[revenue]] = await database.execute(
      `SELECT
         COUNT(*) AS booking_count,
         SUM(CASE WHEN status = 'Delivered' THEN 1 ELSE 0 END) AS delivered_count,
         SUM(CASE WHEN status = 'Cancelled' THEN 1 ELSE 0 END) AS cancelled_count,
         COALESCE(SUM(CASE WHEN amount_set AND status <> 'Cancelled' THEN final_amount ELSE 0 END), 0) AS revenue,
         COALESCE(SUM(CASE WHEN status <> 'Cancelled' THEN coupon_discount + discount ELSE 0 END), 0) AS discounts
       FROM bookings WHERE pickup_date BETWEEN ? AND ?`,
      [from, to],
    );
    const [[{ expenses }]] = await database.execute(
      "SELECT COALESCE(SUM(amount), 0) AS expenses FROM expenses WHERE date BETWEEN ? AND ?",
      [from, to],
    );
    const [expensesByCategory] = await database.execute(
      `SELECT category, COALESCE(SUM(amount), 0) AS amount FROM expenses
       WHERE date BETWEEN ? AND ? GROUP BY category ORDER BY amount DESC`,
      [from, to],
    );
    const [daily] = await database.execute(
      `SELECT pickup_date AS date,
              COUNT(*) AS bookings,
              COALESCE(SUM(CASE WHEN amount_set AND status <> 'Cancelled' THEN final_amount ELSE 0 END), 0) AS revenue
       FROM bookings WHERE pickup_date BETWEEN ? AND ?
       GROUP BY pickup_date ORDER BY pickup_date ASC`,
      [from, to],
    );
    const [topServices] = await database.execute(
      `SELECT i.service_name, SUM(i.quantity) AS quantity, COALESCE(SUM(i.line_total), 0) AS revenue
       FROM booking_items i
       JOIN bookings b ON b.id = i.booking_id
       WHERE b.pickup_date BETWEEN ? AND ? AND b.status <> 'Cancelled'
       GROUP BY i.service_name ORDER BY revenue DESC LIMIT 10`,
      [from, to],
    );
    const [couponUsage] = await database.execute(
      `SELECT c.code, COUNT(r.id) AS uses, COALESCE(SUM(r.discount_amount), 0) AS discount_given
       FROM coupon_redemptions r
       JOIN coupons c ON c.id = r.coupon_id
       JOIN bookings b ON b.id = r.booking_id
       WHERE b.pickup_date BETWEEN ? AND ?
       GROUP BY c.id ORDER BY discount_given DESC LIMIT 10`,
      [from, to],
    );

    const totalRevenue = Number(revenue.revenue);
    const totalExpenses = Number(expenses);

    return {
      body: {
        range: { from, to },
        summary: {
          booking_count: Number(revenue.booking_count),
          delivered_count: Number(revenue.delivered_count || 0),
          cancelled_count: Number(revenue.cancelled_count || 0),
          revenue: totalRevenue,
          discounts: Number(revenue.discounts),
          expenses: totalExpenses,
          profit: Math.round((totalRevenue - totalExpenses) * 100) / 100,
        },
        daily: daily.map((row) => ({
          date: row.date,
          bookings: Number(row.bookings),
          revenue: Number(row.revenue),
        })),
        expenses_by_category: expensesByCategory.map((row) => ({
          category: row.category,
          amount: Number(row.amount),
        })),
        top_services: topServices.map((row) => ({
          service_name: row.service_name,
          quantity: Number(row.quantity),
          revenue: Number(row.revenue),
        })),
        coupon_usage: couponUsage.map((row) => ({
          code: row.code,
          uses: Number(row.uses),
          discount_given: Number(row.discount_given),
        })),
      },
    };
  });
  // Excel export of the same range: Summary, Orders, Sales and Profit sheets.
  router.get("/api/admin/report/export", async (context) => {
    requireRole(context, "admin");
    const from = toDate(context.query.from, "From date") || `${today().slice(0, 7)}-01`;
    const to = toDate(context.query.to, "To date") || today();
    if (from > to) throw badRequest("The From date must be on or before the To date.");

    const { workbook } = await buildReportWorkbook({ from, to });
    const buffer = Buffer.from(await workbook.xlsx.writeBuffer());

    return {
      buffer,
      contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      filename: `star-laundrovamat-report-${from}_to_${to}.xlsx`,
    };
  });
}
