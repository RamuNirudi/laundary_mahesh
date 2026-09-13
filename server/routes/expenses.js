import { database, newId } from "../lib/db.js";
import { requireRole } from "../lib/auth.js";
import {
  notFound,
  optionalString,
  requireString,
  toDate,
  toMoney,
  today,
} from "../lib/http.js";

const serialize = (expense) => ({ ...expense, amount: Number(expense.amount) });

async function loadExpense(id) {
  const [rows] = await database.execute("SELECT * FROM expenses WHERE id = ? LIMIT 1", [id]);
  if (!rows[0]) throw notFound("Expense not found.");
  return rows[0];
}

function readExpenseInput(body, existing = {}) {
  return {
    name: requireString(body.name ?? existing.name, "Expense name", { max: 160 }),
    category: optionalString(body.category, "Category", {
      max: 64,
      fallback: existing.category || "Other",
    }),
    amount: toMoney(body.amount ?? existing.amount ?? 0, "Amount"),
    date: toDate(body.date ?? existing.date ?? today(), "Date", { required: true }),
    notes: optionalString(body.notes, "Notes", { max: 2000, fallback: existing.notes || "" }) || null,
  };
}

export function registerExpenseRoutes(router) {
  router.get("/api/admin/expenses", async (context) => {
    requireRole(context, "admin");
    const [expenses] = await database.execute(
      "SELECT * FROM expenses ORDER BY date DESC, created_date DESC",
    );
    return { body: { expenses: expenses.map(serialize) } };
  });

  router.post("/api/admin/expenses", async (context) => {
    const admin = requireRole(context, "admin");
    const input = readExpenseInput(context.body);
    const id = newId();
    await database.execute(
      "INSERT INTO expenses (id, name, category, amount, date, notes, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [id, input.name, input.category, input.amount, input.date, input.notes, admin.id],
    );
    return { status: 201, body: { expense: serialize(await loadExpense(id)) } };
  });

  router.put("/api/admin/expenses/:id", async (context) => {
    requireRole(context, "admin");
    const existing = await loadExpense(context.params.id);
    const input = readExpenseInput(context.body, existing);
    await database.execute(
      "UPDATE expenses SET name = ?, category = ?, amount = ?, date = ?, notes = ? WHERE id = ?",
      [input.name, input.category, input.amount, input.date, input.notes, existing.id],
    );
    return { body: { expense: serialize(await loadExpense(existing.id)) } };
  });

  router.delete("/api/admin/expenses/:id", async (context) => {
    requireRole(context, "admin");
    const expense = await loadExpense(context.params.id);
    await database.execute("DELETE FROM expenses WHERE id = ?", [expense.id]);
    return { body: { message: "Expense deleted." } };
  });
}
