import React, { useEffect, useState } from "react";
import { Search, Phone, Mail, Calendar } from "lucide-react";
import { adminClient } from "@/api/adminClient";
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

export default function AdminCustomers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // The API returns each customer with their booking count and lifetime spend
  // already aggregated, so the page no longer downloads every booking to count.
  useEffect(() => {
    adminClient.getCustomers()
      .then(setUsers)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = users.filter((u) => !search || (u.full_name || "").toLowerCase().includes(search.toLowerCase()) || (u.email || "").toLowerCase().includes(search.toLowerCase()));

  return (
    <DashboardLayout role="admin" navItems={NAV} title="Admin Panel">
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold tracking-tight">Customers</h1>
        <p className="mt-1 text-sm text-muted-foreground">All registered customers.</p>
      </div>

      <div className="mb-5 relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search customers..." className="w-full rounded-xl border border-border bg-card py-2.5 pl-10 pr-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{[1,2,3].map((i) => <div key={i} className="h-32 animate-pulse rounded-2xl bg-secondary/50" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center text-sm text-muted-foreground">No customers found.</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((u) => (
            <div key={u.id} className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-lg font-bold text-primary">{(u.full_name || "U").charAt(0).toUpperCase()}</div>
                <div className="min-w-0">
                  <p className="truncate font-heading text-base font-semibold">{u.full_name || "—"}</p>
                  <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                </div>
              </div>
              <div className="mt-4 space-y-1.5 text-sm">
                {u.phone && <p className="flex items-center gap-2 text-muted-foreground"><Phone className="h-3.5 w-3.5" /> {u.phone}</p>}
                <p className="flex items-center gap-2 text-muted-foreground"><Calendar className="h-3.5 w-3.5" /> {u.booking_count} booking{u.booking_count === 1 ? "" : "s"}</p>
                <p className="flex items-center gap-2 text-muted-foreground"><Mail className="h-3.5 w-3.5" /> ₹{u.total_spent.toLocaleString()} lifetime</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}