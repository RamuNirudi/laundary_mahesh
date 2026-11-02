import React, { useEffect, useState } from "react";
import { Plus, X, Save, Trash2, Receipt } from "lucide-react";
import { adminClient } from "@/api/adminClient";
import { toast } from "@/components/ui/use-toast";
import DashboardLayout from "@/components/DashboardLayout";
import { LayoutDashboard, CalendarDays, Sparkles, Users, UserCog, ReceiptIcon, BarChart3, Settings, Ticket } from "lucide-react";

const NAV = [
  { label: "Dashboard", path: "/admin", icon: LayoutDashboard },
  { label: "Bookings", path: "/admin/bookings", icon: CalendarDays },
  { label: "Services", path: "/admin/services", icon: Sparkles },
  { label: "Coupons", path: "/admin/coupons", icon: Ticket },
  { label: "Customers", path: "/admin/customers", icon: Users },
  { label: "Service Boys", path: "/admin/serviceboys", icon: UserCog },
  { label: "Expenses", path: "/admin/expenses", icon: ReceiptIcon },
  { label: "Business Report", path: "/admin/report", icon: BarChart3 },
  { label: "Settings", path: "/admin/settings", icon: Settings },
];

const CATEGORIES = ["Electricity", "Water", "Employee Salary", "Fuel", "Rent", "Detergent", "Packaging", "Maintenance", "Other"];
const today = new Date().toISOString().split("T")[0];

export default function AdminExpenses() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", category: "Other", amount: "", date: today, notes: "" });

  const load = () => {
    adminClient.getExpenses()
      .then(setExpenses)
      .catch((err) => toast({ title: "Failed to load expenses", description: err.message, variant: "destructive" }))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.name || !form.amount || !form.date) { toast({ title: "Please fill all required fields", variant: "destructive" }); return; }
    try {
      await adminClient.createExpense({ ...form, amount: Number(form.amount) });
      toast({ title: "Expense added" });
      setForm({ name: "", category: "Other", amount: "", date: today, notes: "" });
      setShowForm(false);
      load();
    } catch (err) {
      toast({ title: "Add failed", description: err.message, variant: "destructive" });
    }
  };

  const handleDelete = async (exp) => {
    if (!confirm(`Delete "${exp.name}"?`)) return;
    try {
      await adminClient.deleteExpense(exp.id);
      toast({ title: "Expense deleted" });
      load();
    } catch (err) {
      toast({ title: "Delete failed", description: err.message, variant: "destructive" });
    }
  };

  const total = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

  return (
    <DashboardLayout role="admin" navItems={NAV} title="Admin Panel">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="eyebrow">Ledger</p>
          <h1 className="mt-3 font-heading text-3xl font-bold tracking-tight sm:text-4xl">Expenses</h1>
          <p className="mt-1 text-sm text-muted-foreground">Track all business expenses.</p>
        </div>
        <button onClick={() => setShowForm(true)} className="shine inline-flex h-11 items-center gap-2 rounded-full bg-gradient-brand px-5 text-sm font-semibold text-primary-foreground shadow-glow-sm transition-all duration-300 ease-swift hover:shadow-glow active:scale-[0.97]">
          <Plus className="h-4 w-4" /> Add Expense
        </button>
      </div>

      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        <div className="surface edge-light rounded-2xl p-5">
          <div className="tile-danger flex h-12 w-12 items-center justify-center rounded-xl"><Receipt className="h-5 w-5" /></div>
          <p className="mt-4 font-heading text-2xl font-bold">₹{total.toLocaleString()}</p>
          <p className="text-sm text-muted-foreground">Total Expenses</p>
        </div>
        <div className="surface edge-light rounded-2xl p-5">
          <div className="tile-primary flex h-12 w-12 items-center justify-center rounded-xl"><Receipt className="h-5 w-5" /></div>
          <p className="mt-4 font-heading text-2xl font-bold">{expenses.length}</p>
          <p className="text-sm text-muted-foreground">Total Entries</p>
        </div>
      </div>

      <div className="overflow-hidden surface edge-light rounded-2xl">
        {loading ? (
          <div className="p-6 space-y-3">{[1,2,3].map((i) => <div key={i} className="skeleton h-14 rounded-xl" />)}</div>
        ) : expenses.length === 0 ? (
          <div className="p-12 text-center text-sm text-muted-foreground">No expenses recorded yet.</div>
        ) : (
          <>
            <table className="hidden w-full sm:table">
              <thead className="border-b border-border/70 bg-secondary/40">
                <tr className="text-left text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                  <th className="px-6 py-3">Name</th>
                  <th className="px-6 py-3">Category</th>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Amount</th>
                  <th className="px-6 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {expenses.map((exp) => (
                  <tr key={exp.id} className="transition-colors duration-200 hover:bg-primary/5">
                    <td className="px-6 py-4"><p className="text-sm font-medium">{exp.name}</p>{exp.notes && <p className="text-xs text-muted-foreground">{exp.notes}</p>}</td>
                    <td className="px-6 py-4"><span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">{exp.category}</span></td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{exp.date}</td>
                    <td className="px-6 py-4 text-sm font-semibold">₹{exp.amount}</td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => handleDelete(exp)} className="rounded-lg p-2 text-destructive hover:bg-destructive/5"><Trash2 className="h-4 w-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="sm:hidden divide-y divide-border">
              {expenses.map((exp) => (
                <div key={exp.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{exp.name}</p>
                    <p className="text-sm font-semibold">₹{exp.amount}</p>
                  </div>
                  <div className="mt-1 flex items-center justify-between">
                    <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">{exp.category}</span>
                    <span className="text-xs text-muted-foreground">{exp.date}</span>
                  </div>
                  <button onClick={() => handleDelete(exp)} className="mt-2 text-xs font-medium text-destructive">Delete</button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/30 backdrop-blur-sm sm:items-center" onClick={() => setShowForm(false)}>
          <form onSubmit={handleAdd} className="w-full max-w-lg animate-scale-in rounded-t-3xl border border-border/70 bg-card/95 p-7 shadow-2xl backdrop-blur-2xl sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-xl font-bold">Add Expense</h2>
              <button type="button" onClick={() => setShowForm(false)} className="rounded-lg p-2 hover:bg-secondary"><X className="h-5 w-5" /></button>
            </div>
            <div className="mt-5 space-y-4">
              <div>
                <label className="text-sm font-medium">Expense Name *</label>
                <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="field mt-2" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium">Category *</label>
                  <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary">
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Amount (₹) *</label>
                  <input required type="number" min="0" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="field mt-2" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Date *</label>
                <input required type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="field mt-2" />
              </div>
              <div>
                <label className="text-sm font-medium">Notes</label>
                <textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="field-area mt-2" />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={() => setShowForm(false)} className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold hover:bg-secondary">Cancel</button>
              <button type="submit" className="shine inline-flex h-11 items-center gap-2 rounded-full bg-gradient-brand px-6 text-sm font-semibold text-primary-foreground shadow-glow-sm transition-all duration-300 ease-swift hover:shadow-glow active:scale-[0.97]">
                <Save className="h-4 w-4" /> Add Expense
              </button>
            </div>
          </form>
        </div>
      )}
    </DashboardLayout>
  );
}