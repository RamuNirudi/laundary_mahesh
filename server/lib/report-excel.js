// Builds the admin business report as a real .xlsx workbook.
// Four sheets: Summary, Orders, Sales (daily), Profit (daily).

import ExcelJS from "exceljs";
import { database } from "./db.js";

const MONEY = '"₹"#,##0.00';
const HEADER_FILL = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E293B" } };

/** Applies the shared header style and freezes the header row. */
function styleSheet(sheet) {
  const header = sheet.getRow(1);
  header.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
  header.fill = HEADER_FILL;
  header.alignment = { vertical: "middle" };
  header.height = 20;
  sheet.views = [{ state: "frozen", ySplit: 1 }];
  sheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: sheet.columnCount },
  };
}

export async function buildReportWorkbook({ from, to }) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Star Laundrovamat";
  workbook.created = new Date();

  // --- Data ----------------------------------------------------------------
  const [orders] = await database.execute(
    `SELECT b.booking_id, b.created_date, b.pickup_date, b.pickup_time, b.status,
            b.customer_name, b.customer_phone, u.email AS customer_email,
            b.service_boy_name, b.number_of_items,
            b.service_price, b.additional_charges, b.discount, b.coupon_code, b.coupon_discount,
            b.final_amount, b.amount_set,
            GROUP_CONCAT(CONCAT(i.service_name, ' x', i.quantity) ORDER BY i.id SEPARATOR ', ') AS services
     FROM bookings b
     JOIN users u ON u.id = b.customer_id
     LEFT JOIN booking_items i ON i.booking_id = b.id
     WHERE b.pickup_date BETWEEN ? AND ?
     GROUP BY b.id
     ORDER BY b.pickup_date ASC, b.created_date ASC`,
    [from, to],
  );

  const [dailySales] = await database.execute(
    `SELECT pickup_date AS date,
            COUNT(*) AS orders,
            SUM(CASE WHEN status = 'Delivered' THEN 1 ELSE 0 END) AS delivered,
            SUM(CASE WHEN status = 'Cancelled' THEN 1 ELSE 0 END) AS cancelled,
            COALESCE(SUM(CASE WHEN status <> 'Cancelled' THEN service_price + additional_charges ELSE 0 END), 0) AS gross,
            COALESCE(SUM(CASE WHEN status <> 'Cancelled' THEN discount + coupon_discount ELSE 0 END), 0) AS discounts,
            COALESCE(SUM(CASE WHEN amount_set AND status <> 'Cancelled' THEN final_amount ELSE 0 END), 0) AS net
     FROM bookings WHERE pickup_date BETWEEN ? AND ?
     GROUP BY pickup_date ORDER BY pickup_date ASC`,
    [from, to],
  );

  const [dailyExpenses] = await database.execute(
    `SELECT date, COALESCE(SUM(amount), 0) AS expenses FROM expenses
     WHERE date BETWEEN ? AND ? GROUP BY date`,
    [from, to],
  );

  const [expensesByCategory] = await database.execute(
    `SELECT category, COALESCE(SUM(amount), 0) AS amount FROM expenses
     WHERE date BETWEEN ? AND ? GROUP BY category ORDER BY amount DESC`,
    [from, to],
  );

  const expenseByDate = new Map(dailyExpenses.map((row) => [String(row.date), Number(row.expenses)]));

  // Every date that saw either a booking or an expense.
  const allDates = [...new Set([...dailySales.map((r) => String(r.date)), ...expenseByDate.keys()])].sort();

  const totals = {
    orders: orders.length,
    delivered: dailySales.reduce((sum, r) => sum + Number(r.delivered || 0), 0),
    cancelled: dailySales.reduce((sum, r) => sum + Number(r.cancelled || 0), 0),
    gross: dailySales.reduce((sum, r) => sum + Number(r.gross), 0),
    discounts: dailySales.reduce((sum, r) => sum + Number(r.discounts), 0),
    net: dailySales.reduce((sum, r) => sum + Number(r.net), 0),
    expenses: [...expenseByDate.values()].reduce((sum, value) => sum + value, 0),
  };
  totals.profit = Math.round((totals.net - totals.expenses) * 100) / 100;

  // --- Summary -------------------------------------------------------------
  const summary = workbook.addWorksheet("Summary");
  summary.columns = [
    { header: "Metric", key: "metric", width: 30 },
    { header: "Value", key: "value", width: 20 },
  ];
  summary.addRows([
    { metric: "Report period", value: `${from} to ${to}` },
    { metric: "Generated", value: new Date().toLocaleString("en-IN") },
    { metric: "", value: "" },
    { metric: "Total orders", value: totals.orders },
    { metric: "Delivered", value: totals.delivered },
    { metric: "Cancelled", value: totals.cancelled },
    { metric: "", value: "" },
    { metric: "Gross sales", value: totals.gross },
    { metric: "Discounts given", value: totals.discounts },
    { metric: "Net sales (revenue)", value: totals.net },
    { metric: "Total expenses", value: totals.expenses },
    { metric: "Profit", value: totals.profit },
  ]);
  for (const row of [8, 9, 10, 11, 12]) summary.getCell(`B${row}`).numFmt = MONEY;
  summary.getRow(12).font = { bold: true };
  summary.getCell("B12").font = {
    bold: true,
    color: { argb: totals.profit >= 0 ? "FF047857" : "FFB91C1C" },
  };
  styleSheet(summary);

  if (expensesByCategory.length) {
    const startRow = summary.rowCount + 2;
    summary.getCell(`A${startRow}`).value = "Expenses by category";
    summary.getCell(`A${startRow}`).font = { bold: true };
    expensesByCategory.forEach((row, index) => {
      const target = startRow + 1 + index;
      summary.getCell(`A${target}`).value = row.category;
      summary.getCell(`B${target}`).value = Number(row.amount);
      summary.getCell(`B${target}`).numFmt = MONEY;
    });
  }

  // --- Orders --------------------------------------------------------------
  const ordersSheet = workbook.addWorksheet("Orders");
  ordersSheet.columns = [
    { header: "Booking ID", key: "booking_id", width: 16 },
    { header: "Pickup Date", key: "pickup_date", width: 13 },
    { header: "Pickup Time", key: "pickup_time", width: 20 },
    { header: "Status", key: "status", width: 20 },
    { header: "Customer", key: "customer_name", width: 22 },
    { header: "Phone", key: "customer_phone", width: 15 },
    { header: "Email", key: "customer_email", width: 28 },
    { header: "Services", key: "services", width: 38 },
    { header: "Items", key: "number_of_items", width: 8 },
    { header: "Service Boy", key: "service_boy_name", width: 20 },
    { header: "Service Price", key: "service_price", width: 14 },
    { header: "Additional", key: "additional_charges", width: 12 },
    { header: "Discount", key: "discount", width: 11 },
    { header: "Coupon", key: "coupon_code", width: 14 },
    { header: "Coupon Discount", key: "coupon_discount", width: 16 },
    { header: "Final Amount", key: "final_amount", width: 14 },
    { header: "Amount Set", key: "amount_set", width: 12 },
  ];
  for (const order of orders) {
    ordersSheet.addRow({
      ...order,
      pickup_date: String(order.pickup_date),
      services: order.services || "",
      service_boy_name: order.service_boy_name || "",
      coupon_code: order.coupon_code || "",
      service_price: Number(order.service_price),
      additional_charges: Number(order.additional_charges),
      discount: Number(order.discount),
      coupon_discount: Number(order.coupon_discount),
      final_amount: Number(order.final_amount),
      amount_set: order.amount_set ? "Yes" : "No",
    });
  }
  for (const column of ["K", "L", "M", "O", "P"]) {
    ordersSheet.getColumn(column).numFmt = MONEY;
  }
  styleSheet(ordersSheet);

  // --- Sales ---------------------------------------------------------------
  const salesSheet = workbook.addWorksheet("Sales");
  salesSheet.columns = [
    { header: "Date", key: "date", width: 13 },
    { header: "Orders", key: "orders", width: 10 },
    { header: "Delivered", key: "delivered", width: 11 },
    { header: "Cancelled", key: "cancelled", width: 11 },
    { header: "Gross Sales", key: "gross", width: 15 },
    { header: "Discounts", key: "discounts", width: 13 },
    { header: "Net Sales", key: "net", width: 15 },
  ];
  for (const row of dailySales) {
    salesSheet.addRow({
      date: String(row.date),
      orders: Number(row.orders),
      delivered: Number(row.delivered || 0),
      cancelled: Number(row.cancelled || 0),
      gross: Number(row.gross),
      discounts: Number(row.discounts),
      net: Number(row.net),
    });
  }
  const salesTotal = salesSheet.addRow({
    date: "TOTAL",
    orders: totals.orders,
    delivered: totals.delivered,
    cancelled: totals.cancelled,
    gross: totals.gross,
    discounts: totals.discounts,
    net: totals.net,
  });
  salesTotal.font = { bold: true };
  for (const column of ["E", "F", "G"]) salesSheet.getColumn(column).numFmt = MONEY;
  styleSheet(salesSheet);

  // --- Profit --------------------------------------------------------------
  const profitSheet = workbook.addWorksheet("Profit");
  profitSheet.columns = [
    { header: "Date", key: "date", width: 13 },
    { header: "Revenue", key: "revenue", width: 15 },
    { header: "Expenses", key: "expenses", width: 15 },
    { header: "Profit", key: "profit", width: 15 },
  ];
  const salesByDate = new Map(dailySales.map((row) => [String(row.date), Number(row.net)]));
  for (const date of allDates) {
    const revenue = salesByDate.get(date) || 0;
    const expenses = expenseByDate.get(date) || 0;
    const row = profitSheet.addRow({
      date,
      revenue,
      expenses,
      profit: Math.round((revenue - expenses) * 100) / 100,
    });
    row.getCell("D").font = { color: { argb: revenue - expenses >= 0 ? "FF047857" : "FFB91C1C" } };
  }
  const profitTotal = profitSheet.addRow({
    date: "TOTAL",
    revenue: totals.net,
    expenses: totals.expenses,
    profit: totals.profit,
  });
  profitTotal.font = { bold: true };
  for (const column of ["B", "C", "D"]) profitSheet.getColumn(column).numFmt = MONEY;
  styleSheet(profitSheet);

  return { workbook, totals };
}
