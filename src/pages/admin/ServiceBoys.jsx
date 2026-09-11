import React, { useEffect, useState } from "react";
import { UserPlus, Phone, Mail, X, Send } from "lucide-react";
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

export default function AdminServiceBoys() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [email, setEmail] = useState("");
  const [inviting, setInviting] = useState(false);

  const load = () => {
    base44.entities.User.filter({ role: "service_boy" })
      .then(setUsers)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleInvite = async (e) => {
    e.preventDefault();
    setInviting(true);
    try {
      await base44.users.inviteUser(email, "user");
      toast({ title: "Invitation sent", description: `${email} has been invited as a service boy.` });
      setEmail("");
      setShowInvite(false);
      load();
    } catch (err) {
      toast({ title: "Invite failed", description: err.message, variant: "destructive" });
    }
    setInviting(false);
  };

  return (
    <DashboardLayout role="admin" navItems={NAV} title="Admin Panel">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">Service Boys</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage your field team.</p>
        </div>
        <button onClick={() => setShowInvite(true)} className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:shadow-lg hover:shadow-primary/30">
          <UserPlus className="h-4 w-4" /> Invite Service Boy
        </button>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{[1,2,3].map((i) => <div key={i} className="h-32 animate-pulse rounded-2xl bg-secondary/50" />)}</div>
      ) : users.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-12 text-center">
          <UserCog className="mx-auto h-10 w-10 text-muted-foreground/40" />
          <p className="mt-3 text-sm font-medium">No service boys yet</p>
          <p className="mt-1 text-sm text-muted-foreground">Invite team members to assign them to bookings.</p>
          <button onClick={() => setShowInvite(true)} className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">
            <UserPlus className="h-4 w-4" /> Invite Now
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
              </div>
            </div>
          ))}
        </div>
      )}

      {showInvite && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/30 backdrop-blur-sm sm:items-center" onClick={() => setShowInvite(false)}>
          <form onSubmit={handleInvite} className="w-full max-w-md rounded-t-3xl bg-card p-6 shadow-2xl sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-xl font-bold">Invite Service Boy</h2>
              <button type="button" onClick={() => setShowInvite(false)} className="rounded-lg p-2 hover:bg-secondary"><X className="h-5 w-5" /></button>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">They'll receive an email invitation to join as a service boy. After joining, set their role to "service_boy".</p>
            <div className="mt-5">
              <label className="text-sm font-medium">Email Address</label>
              <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="serviceboy@example.com" className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
            </div>
            <button type="submit" disabled={inviting} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:shadow-lg hover:shadow-primary/30 disabled:opacity-50">
              {inviting ? "Sending..." : <><Send className="h-4 w-4" /> Send Invitation</>}
            </button>
          </form>
        </div>
      )}
    </DashboardLayout>
  );
}