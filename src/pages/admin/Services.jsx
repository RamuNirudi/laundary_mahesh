import React, { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, X, Save, Power, Search } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "@/components/ui/use-toast";
import DashboardLayout from "@/components/DashboardLayout";
import { LayoutDashboard, CalendarDays, Sparkles, Users, UserCog, Receipt, BarChart3, Settings, Ticket } from "lucide-react";

const NAV = [
  { label: "Dashboard", path: "/admin", icon: LayoutDashboard },
  { label: "Bookings", path: "/admin/bookings", icon: CalendarDays },
  { label: "Services", path: "/admin/services", icon: Sparkles },
  { label: "Coupons", path: "/admin/coupons", icon: Ticket },
  { label: "Customers", path: "/admin/customers", icon: Users },
  { label: "Service Boys", path: "/admin/serviceboys", icon: UserCog },
  { label: "Expenses", path: "/admin/expenses", icon: Receipt },
  { label: "Business Report", path: "/admin/report", icon: BarChart3 },
  { label: "Settings", path: "/admin/settings", icon: Settings },
];

const CATEGORIES = ["General", "Dry Cleaning", "Wash", "Iron", "Saree", "Home Care", "Specialty"];
const UNITS = ["per item", "per kg", "per piece", "fixed"];

const EMPTY = { name: "", description: "", image: "", icon: "", price: 0, price_unit: "per item", active: true, category: "General", sort_order: 0 };

export default function AdminServices() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const load = () => {
    base44.entities.Service.list("sort_order", 500)
      .then(setServices)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const filtered = services.filter((s) => !search || s.name.toLowerCase().includes(search.toLowerCase()));

  const handleSave = async (data) => {
    try {
      if (editing && editing.id) {
        await base44.entities.Service.update(editing.id, data);
        toast({ title: "Service updated" });
      } else {
        await base44.entities.Service.create(data);
        toast({ title: "Service created" });
      }
      setShowForm(false);
      setEditing(null);
      load();
    } catch (err) {
      toast({ title: "Save failed", description: err.message, variant: "destructive" });
    }
  };

  const toggleActive = async (svc) => {
    try {
      await base44.entities.Service.update(svc.id, { active: !svc.active });
      toast({ title: `Service ${!svc.active ? "enabled" : "disabled"}` });
      load();
    } catch (err) {
      toast({ title: "Update failed", description: err.message, variant: "destructive" });
    }
  };

  const handleDelete = async (svc) => {
    if (!confirm(`Delete "${svc.name}"? This cannot be undone.`)) return;
    try {
      await base44.entities.Service.delete(svc.id);
      toast({ title: "Service deleted" });
      load();
    } catch (err) {
      toast({ title: "Delete failed", description: err.message, variant: "destructive" });
    }
  };

  return (
    <DashboardLayout role="admin" navItems={NAV} title="Admin Panel">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">Services</h1>
          <p className="mt-1 text-sm text-muted-foreground">Add, edit, and manage your laundry services.</p>
        </div>
        <button onClick={() => { setEditing(EMPTY); setShowForm(true); }} className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:shadow-lg hover:shadow-primary/30">
          <Plus className="h-4 w-4" /> Add Service
        </button>
      </div>

      <div className="mb-5 relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search services..." className="w-full rounded-xl border border-border bg-card py-2.5 pl-10 pr-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{[1,2,3,4,5,6].map((i) => <div key={i} className="h-40 animate-pulse rounded-2xl bg-secondary/50" />)}</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((svc) => (
            <div key={svc.id} className={`rounded-2xl border border-border bg-card p-5 ${!svc.active ? "opacity-60" : ""}`}>
              <div className="flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Sparkles className="h-5 w-5" />
                </div>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${svc.active ? "bg-emerald-50 text-emerald-700" : "bg-secondary text-muted-foreground"}`}>{svc.active ? "Active" : "Disabled"}</span>
              </div>
              <h3 className="mt-3 font-heading text-base font-semibold">{svc.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{svc.description || "—"}</p>
              <div className="mt-3 flex items-center gap-2">
                <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">{svc.category}</span>
                {svc.price > 0 && <span className="text-sm font-semibold">₹{svc.price} <span className="text-xs font-normal text-muted-foreground">{svc.price_unit}</span></span>}
              </div>
              <div className="mt-4 flex gap-2">
                <button onClick={() => { setEditing(svc); setShowForm(true); }} className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border py-2 text-sm font-medium hover:bg-secondary">
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </button>
                <button onClick={() => toggleActive(svc)} className="flex items-center justify-center rounded-lg border border-border px-3 py-2 hover:bg-secondary" title={svc.active ? "Disable" : "Enable"}>
                  <Power className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => handleDelete(svc)} className="flex items-center justify-center rounded-lg border border-destructive/30 px-3 py-2 text-destructive hover:bg-destructive/5" title="Delete">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && <ServiceForm initial={editing} onClose={() => { setShowForm(false); setEditing(null); }} onSave={handleSave} />}
    </DashboardLayout>
  );
}

function ServiceForm({ initial, onClose, onSave }) {
  const [form, setForm] = useState(initial || EMPTY);
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await onSave({ ...form, price: Number(form.price) || 0, sort_order: Number(form.sort_order) || 0 });
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/30 backdrop-blur-sm sm:items-center" onClick={onClose}>
      <form onSubmit={submit} className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-card p-6 shadow-2xl sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-xl font-bold">{initial.id ? "Edit Service" : "Add Service"}</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-2 hover:bg-secondary"><X className="h-5 w-5" /></button>
        </div>
        <div className="mt-5 space-y-4">
          <div>
            <label className="text-sm font-medium">Service Name *</label>
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
          </div>
          <div>
            <label className="text-sm font-medium">Description</label>
            <textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
          </div>
          <div>
            <label className="text-sm font-medium">Image URL</label>
            <input value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} placeholder="https://..." className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium">Category</label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary">
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Price Unit</label>
              <select value={form.price_unit} onChange={(e) => setForm({ ...form, price_unit: e.target.value })} className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary">
                {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Base Price (₹)</label>
              <input type="number" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
            </div>
            <div>
              <label className="text-sm font-medium">Sort Order</label>
              <input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: e.target.value })} className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm font-medium">
            <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="h-4 w-4 rounded border-border text-primary focus:ring-primary" />
            Active (visible to customers)
          </label>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold hover:bg-secondary">Cancel</button>
          <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:shadow-lg hover:shadow-primary/30 disabled:opacity-50">
            <Save className="h-4 w-4" /> {saving ? "Saving..." : "Save Service"}
          </button>
        </div>
      </form>
    </div>
  );
}