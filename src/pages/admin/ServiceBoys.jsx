import React, { useEffect, useState } from "react";
import { UserPlus, Phone, Mail, X, Send, Power, KeyRound } from "lucide-react";
import { adminClient } from "@/api/adminClient";
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

export default function AdminServiceBoys() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [form, setForm] = useState({ full_name: "", email: "", phone: "" });
  const [inviting, setInviting] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const load = () => {
    adminClient.getServiceBoys()
      .then(setUsers)
      .catch((err) => toast({ title: "Failed to load team", description: err.message, variant: "destructive" }))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  // The Base44 invite flow is gone, so the admin creates the account outright
  // and the API emails a one-time password to change on first sign-in.
  const handleInvite = async (e) => {
    e.preventDefault();
    setInviting(true);
    try {
      const { temporary_password, emailed } = await adminClient.createServiceBoy(form);
      toast({
        title: "Service boy account created",
        description: emailed
          ? `Sign-in details have been emailed to ${form.email}.`
          : `Email is not configured. Temporary password: ${temporary_password}`,
      });
      setForm({ full_name: "", email: "", phone: "" });
      setShowInvite(false);
      load();
    } catch (err) {
      toast({ title: "Could not create account", description: err.message, variant: "destructive" });
    }
    setInviting(false);
  };

  const toggleActive = async (user) => {
    setBusyId(user.id);
    try {
      const { message } = await adminClient.setUserActive(user.id, !user.active);
      toast({ title: message });
      load();
    } catch (err) {
      toast({ title: "Update failed", description: err.message, variant: "destructive" });
    }
    setBusyId(null);
  };

  const resetPassword = async (user) => {
    if (!confirm(`Reset the password for ${user.full_name || user.email}?`)) return;
    setBusyId(user.id);
    try {
      const { temporary_password, emailed } = await adminClient.resetUserPassword(user.id);
      toast({
        title: "Password reset",
        description: emailed
          ? `A new password has been emailed to ${user.email}.`
          : `Temporary password: ${temporary_password}`,
      });
    } catch (err) {
      toast({ title: "Reset failed", description: err.message, variant: "destructive" });
    }
    setBusyId(null);
  };

  return (
    <DashboardLayout role="admin" navItems={NAV} title="Admin Panel">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">Service Boys</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage your field team.</p>
        </div>
        <button onClick={() => setShowInvite(true)} className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:shadow-lg hover:shadow-primary/30">
          <UserPlus className="h-4 w-4" /> Add Service Boy
        </button>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{[1,2,3].map((i) => <div key={i} className="h-32 animate-pulse rounded-2xl bg-secondary/50" />)}</div>
      ) : users.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-12 text-center">
          <UserCog className="mx-auto h-10 w-10 text-muted-foreground/40" />
          <p className="mt-3 text-sm font-medium">No service boys yet</p>
          <p className="mt-1 text-sm text-muted-foreground">Add team members to assign them to bookings.</p>
          <button onClick={() => setShowInvite(true)} className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">
            <UserPlus className="h-4 w-4" /> Add Now
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {users.map((u) => (
            <div key={u.id} className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-lg font-bold text-indigo-600">{(u.full_name || "S").charAt(0).toUpperCase()}</div>
                <div className="min-w-0">
                  <p className="truncate font-heading text-base font-semibold">{u.full_name || "—"}</p>
                  <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                </div>
              </div>
              <div className="mt-4 space-y-1.5 text-sm">
                {u.phone && <p className="flex items-center gap-2 text-muted-foreground"><Phone className="h-3.5 w-3.5" /> {u.phone}</p>}
                <p className="flex items-center gap-2 text-muted-foreground"><Mail className="h-3.5 w-3.5" /> {u.email}</p>
                <p className="text-muted-foreground">{u.active_count} active • {u.assigned_count} total assigned</p>
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${u.active ? "bg-green-50 text-green-700" : "bg-muted text-muted-foreground"}`}>
                  {u.active ? "Active" : "Deactivated"}
                </span>
                <div className="flex gap-1">
                  <button onClick={() => resetPassword(u)} disabled={busyId === u.id} title="Reset password" className="rounded-lg p-1.5 hover:bg-secondary disabled:opacity-40"><KeyRound className="h-3.5 w-3.5" /></button>
                  <button onClick={() => toggleActive(u)} disabled={busyId === u.id} title={u.active ? "Deactivate account" : "Activate account"} className="rounded-lg p-1.5 hover:bg-secondary disabled:opacity-40"><Power className="h-3.5 w-3.5" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showInvite && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/30 backdrop-blur-sm sm:items-center" onClick={() => setShowInvite(false)}>
          <form onSubmit={handleInvite} className="w-full max-w-md rounded-t-3xl bg-card p-6 shadow-2xl sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-xl font-bold">Add Service Boy</h2>
              <button type="button" onClick={() => setShowInvite(false)} className="rounded-lg p-2 hover:bg-secondary"><X className="h-5 w-5" /></button>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">The account is created immediately and a one-time password is emailed to them.</p>
            <div className="mt-5 space-y-4">
              <div>
                <label className="text-sm font-medium">Full Name</label>
                <input required value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder="Ravi Kumar" className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
              </div>
              <div>
                <label className="text-sm font-medium">Email Address</label>
                <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="serviceboy@example.com" className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
              </div>
              <div>
                <label className="text-sm font-medium">Phone</label>
                <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+91 99999 99999" className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
              </div>
            </div>
            <button type="submit" disabled={inviting} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:shadow-lg hover:shadow-primary/30 disabled:opacity-50">
              {inviting ? "Creating..." : <><Send className="h-4 w-4" /> Create Account</>}
            </button>
          </form>
        </div>
      )}
    </DashboardLayout>
  );
}