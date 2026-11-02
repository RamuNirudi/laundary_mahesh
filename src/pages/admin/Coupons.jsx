import React, { useEffect, useState } from "react";
import { adminClient } from "@/api/adminClient";
import { toast } from "@/components/ui/use-toast";
import DashboardLayout from "@/components/DashboardLayout";
import { LayoutDashboard, CalendarDays, Sparkles, Users, UserCog as UserCogIcon, Receipt, BarChart3, Settings, Ticket, Plus, Pencil, Trash2, X, Save, Power } from "lucide-react";

const NAV = [
  { label: "Dashboard", path: "/admin", icon: LayoutDashboard },
  { label: "Bookings", path: "/admin/bookings", icon: CalendarDays },
  { label: "Services", path: "/admin/services", icon: Sparkles },
  { label: "Coupons", path: "/admin/coupons", icon: Ticket },
  { label: "Customers", path: "/admin/customers", icon: Users },
  { label: "Service Boys", path: "/admin/serviceboys", icon: UserCogIcon },
  { label: "Expenses", path: "/admin/expenses", icon: Receipt },
  { label: "Business Report", path: "/admin/report", icon: BarChart3 },
  { label: "Settings", path: "/admin/settings", icon: Settings },
];

const EMPTY = {
  code: "",
  description: "",
  discount_type: "percentage",
  discount_value: 0,
  min_order_amount: 0,
  max_discount_amount: 0,
  max_uses: 0,
  per_user_limit: 0,
  active: true,
  valid_from: "",
  valid_until: "",
};

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const data = await adminClient.getCoupons();
      setCoupons(data);
    } catch (err) {
      toast({ title: "Failed to load coupons", description: err.message, variant: "destructive" });
    }
    setLoading(false);
  };

  useEffect(() => { fetchCoupons(); }, []);

  const openCreate = () => { setEditing(null); setForm(EMPTY); setShowForm(true); };
  const openEdit = (c) => { setEditing(c); setForm({ ...EMPTY, ...c }); setShowForm(true); };

  const handleSave = async () => {
    if (!form.code.trim()) { toast({ title: "Coupon code is required", variant: "destructive" }); return; }
    if (form.discount_value <= 0) { toast({ title: "Discount value must be greater than 0", variant: "destructive" }); return; }
    if (form.discount_type === "percentage" && form.discount_value > 100) { toast({ title: "Percentage cannot exceed 100", variant: "destructive" }); return; }
    setSaving(true);
    try {
      const payload = {
        code: form.code.trim().toUpperCase(),
        description: form.description,
        discount_type: form.discount_type,
        discount_value: Number(form.discount_value) || 0,
        min_order_amount: Number(form.min_order_amount) || 0,
        max_discount_amount: Number(form.max_discount_amount) || 0,
        max_uses: Number(form.max_uses) || 0,
        per_user_limit: Number(form.per_user_limit) || 0,
        active: form.active,
        valid_from: form.valid_from || null,
        valid_until: form.valid_until || null,
      };
      if (editing) {
        await adminClient.updateCoupon(editing.id, payload);
        toast({ title: "Coupon updated" });
      } else {
        await adminClient.createCoupon(payload);
        toast({ title: "Coupon created" });
      }
      setShowForm(false);
      fetchCoupons();
    } catch (err) {
      toast({ title: "Save failed", description: err.message, variant: "destructive" });
    }
    setSaving(false);
  };

  const handleToggle = async (c) => {
    setBusyId(c.id);
    try {
      const { message } = await adminClient.setCouponActive(c.id, !c.active);
      toast({ title: message });
      fetchCoupons();
    } catch (err) {
      toast({ title: "Toggle failed", description: err.message, variant: "destructive" });
    }
    setBusyId(null);
  };

  const handleDelete = async (c) => {
    if (!confirm(`Delete coupon "${c.code}"? This cannot be undone.`)) return;
    setBusyId(c.id);
    try {
      await adminClient.deleteCoupon(c.id);
      toast({ title: "Coupon deleted" });
      fetchCoupons();
    } catch (err) {
      // A redeemed coupon cannot be deleted; the API explains why.
      toast({ title: "Delete failed", description: err.message, variant: "destructive" });
    }
    setBusyId(null);
  };

  const filtered = coupons.filter((c) =>
    c.code?.toLowerCase().includes(search.toLowerCase()) ||
    c.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout role="admin" navItems={NAV} title="Admin Panel">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">Coupons</h1>
          <p className="text-sm text-muted-foreground">Create and manage discount coupons</p>
        </div>
        <button onClick={openCreate} className="shine inline-flex h-11 items-center gap-2 rounded-full bg-gradient-brand px-5 text-sm font-semibold text-primary-foreground shadow-glow-sm transition-all duration-300 ease-swift hover:shadow-glow active:scale-[0.97]">
          <Plus className="h-4 w-4" /> New Coupon
        </button>
      </div>

      <div className="mt-5">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search coupons..."
          className="field w-full"
        />
      </div>

      {loading ? (
        <div className="mt-8 flex justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-secondary border-t-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-border p-12 text-center">
          <Ticket className="mx-auto h-10 w-10 text-muted-foreground/40" />
          <p className="mt-3 text-sm text-muted-foreground">No coupons yet. Create your first one.</p>
        </div>
      ) : (
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => (
            <div key={c.id} className="surface edge-light rounded-2xl p-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-lg bg-primary/10 px-2.5 py-1 font-heading text-sm font-bold text-primary">{c.code}</span>
                    <span className={`status-pill ${c.active ? "flag-on" : "flag-off"}`}>
                      {c.active ? "Active" : "Inactive"}
                    </span>
                  </div>
                  {c.description && <p className="mt-2 text-xs text-muted-foreground">{c.description}</p>}
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(c)} title="Edit coupon" className="rounded-lg p-1.5 hover:bg-secondary"><Pencil className="h-3.5 w-3.5" /></button>
                  <button onClick={() => handleToggle(c)} disabled={busyId === c.id} title={c.active ? "Deactivate coupon" : "Activate coupon"} className="rounded-lg p-1.5 hover:bg-secondary disabled:opacity-40"><Power className="h-3.5 w-3.5" /></button>
                  <button onClick={() => handleDelete(c)} disabled={busyId === c.id} title="Delete coupon" className="rounded-lg p-1.5 hover:bg-destructive/10 hover:text-destructive disabled:opacity-40"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </div>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="font-heading text-2xl font-bold text-foreground">
                  {c.discount_type === "percentage" ? `${c.discount_value}%` : `₹${c.discount_value}`}
                </span>
                <span className="text-xs text-muted-foreground">{c.discount_type === "percentage" ? "off" : "flat off"}</span>
              </div>
              <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                {c.min_order_amount > 0 && <p>Min order: ₹{c.min_order_amount}</p>}
                {c.max_discount_amount > 0 && <p>Max discount: ₹{c.max_discount_amount}</p>}
                <p>Used: {c.used_count || 0}{c.max_uses > 0 ? ` / ${c.max_uses}` : " (unlimited)"}</p>
                {c.per_user_limit > 0 && <p>Limit: {c.per_user_limit} per customer</p>}
                {c.valid_from && <p>From: {c.valid_from}</p>}
                {c.valid_until && <p>Until: {c.valid_until}</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/30 backdrop-blur-sm sm:items-center" onClick={() => setShowForm(false)}>
          <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto animate-scale-in rounded-t-3xl border border-border/70 bg-card/95 p-7 shadow-2xl backdrop-blur-2xl sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-xl font-bold">{editing ? "Edit Coupon" : "New Coupon"}</h2>
              <button onClick={() => setShowForm(false)} className="rounded-lg p-2 hover:bg-secondary"><X className="h-5 w-5" /></button>
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <label className="text-sm font-medium">Coupon Code</label>
                <input
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  placeholder="e.g. WELCOME10"
                  className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold uppercase outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <input
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="e.g. 10% off for new customers"
                  className="field mt-2"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium">Discount Type</label>
                  <select
                    value={form.discount_type}
                    onChange={(e) => setForm({ ...form, discount_type: e.target.value })}
                    className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (₹)</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Discount Value</label>
                  <input
                    type="number"
                    min="0"
                    value={form.discount_value}
                    onChange={(e) => setForm({ ...form, discount_value: e.target.value })}
                    className="field mt-2"
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium">Min Order Amount (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={form.min_order_amount}
                    onChange={(e) => setForm({ ...form, min_order_amount: e.target.value })}
                    className="field mt-2"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Max Discount Cap (₹, 0 = none)</label>
                  <input
                    type="number"
                    min="0"
                    value={form.max_discount_amount}
                    onChange={(e) => setForm({ ...form, max_discount_amount: e.target.value })}
                    className="field mt-2"
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium">Max Uses (0 = unlimited)</label>
                  <input
                    type="number"
                    min="0"
                    value={form.max_uses}
                    onChange={(e) => setForm({ ...form, max_uses: e.target.value })}
                    className="field mt-2"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Uses Per Customer (0 = unlimited)</label>
                  <input
                    type="number"
                    min="0"
                    value={form.per_user_limit}
                    onChange={(e) => setForm({ ...form, per_user_limit: e.target.value })}
                    className="field mt-2"
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium">Valid From</label>
                  <input
                    type="date"
                    value={form.valid_from}
                    onChange={(e) => setForm({ ...form, valid_from: e.target.value })}
                    className="field mt-2"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Valid Until</label>
                  <input
                    type="date"
                    value={form.valid_until}
                    onChange={(e) => setForm({ ...form, valid_until: e.target.value })}
                    className="field mt-2"
                  />
                </div>
              </div>
              <label className="flex items-center gap-2.5">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) => setForm({ ...form, active: e.target.checked })}
                  className="h-4 w-4 rounded border-border"
                />
                <span className="text-sm font-medium">Active</span>
              </label>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setShowForm(false)} className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold hover:bg-secondary">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="shine inline-flex h-11 items-center gap-2 rounded-full bg-gradient-brand px-6 text-sm font-semibold text-primary-foreground shadow-glow-sm transition-all duration-300 ease-swift hover:shadow-glow active:scale-[0.97] disabled:opacity-50 disabled:shadow-none">
                {saving ? "Saving..." : <><Save className="h-4 w-4" /> Save Coupon</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}