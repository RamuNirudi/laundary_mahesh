import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarCheck, IndianRupee, TrendingDown, TrendingUp, Package, ArrowRight, Receipt } from "lucide-react";
import { adminClient } from "@/api/adminClient";
import DashboardLayout from "@/components/DashboardLayout";
import { LayoutDashboard, CalendarDays, Sparkles, Users, UserCog, Receipt as ReceiptIcon, BarChart3, Settings, Ticket } from "lucide-react";

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

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);

  // Totals are aggregated by MySQL rather than by pulling every booking and
  // expense into the browser and reducing over them.
  useEffect(() => {
    adminClient.getDashboard()
      .then((data) => { setStats(data.stats); setRecent(data.recent); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const money = (value) => `₹${Number(value || 0).toLocaleString()}`;

  const cards = [
    { label: "Today's Bookings", value: stats?.todays_bookings ?? 0, icon: CalendarCheck, tile: "tile-primary" },
    { label: "Today's Revenue", value: money(stats?.todays_revenue), icon: IndianRupee, tile: "tile-success" },
    { label: "Today's Expenses", value: money(stats?.todays_expenses), icon: TrendingDown, tile: "tile-danger" },
    { label: "Today's Profit", value: money(stats?.profit), icon: TrendingUp, tile: "tile-accent" },
    { label: "Active Bookings", value: stats?.active_bookings ?? 0, icon: Package, tile: "tile-indigo" },
  ];

  return (
    <DashboardLayout role="admin" navItems={NAV} title="Admin Panel">
      <div className="mb-10">
        <p className="eyebrow">Command Centre</p>
        <h1 className="mt-3 font-heading text-3xl font-bold tracking-tight sm:text-4xl">Dashboard</h1>
        <p className="mt-2 text-sm text-muted-foreground">Business overview for {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {cards.map((c, i) => {
          const Icon = c.icon;
          return (
            <div key={c.label} className={`stat-tile animate-fade-up stagger-${i + 1}`}>
              <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-primary/8 blur-2xl" />
              <div className={`relative flex h-12 w-12 items-center justify-center rounded-xl ${c.tile}`}>
                <Icon className="h-5 w-5" />
              </div>
              <p className="relative mt-5 font-heading text-3xl font-bold tracking-tight tabular">
                {loading ? <span className="text-muted-foreground/40">—</span> : c.value}
              </p>
              <p className="relative mt-1 text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">{c.label}</p>
            </div>
          );
        })}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 surface edge-light rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-lg font-bold tracking-tight">Recent Bookings</h2>
            <Link to="/admin/bookings" className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary transition-all duration-300 ease-swift hover:gap-2.5">
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          {loading ? (
            <div className="mt-4 space-y-2">{[1,2,3].map((i) => <div key={i} className="skeleton h-14 rounded-xl" />)}</div>
          ) : recent.length === 0 ? (
            <p className="mt-8 text-center text-sm text-muted-foreground">No bookings yet.</p>
          ) : (
            <div className="mt-4 divide-y divide-border">
              {recent.map((b) => (
                <Link key={b.id} to="/admin/bookings" className="flex items-center justify-between py-3 -mx-2 px-2 rounded-lg transition-colors duration-200 hover:bg-primary/5">
                  <div>
                    <p className="text-sm font-semibold">{b.booking_id}</p>
                    <p className="text-xs text-muted-foreground">{b.customer_name} • {b.pickup_date}</p>
                  </div>
                  <span className={statusColor(b.status)}>{b.status}</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="surface edge-light rounded-2xl p-6">
          <h2 className="flex items-center gap-2 font-heading text-lg font-bold tracking-tight"><Receipt className="h-5 w-5 text-primary" /> Quick Actions</h2>
          <div className="mt-4 space-y-2">
            {[
              { to: "/admin/services", label: "Manage Services" },
              { to: "/admin/expenses", label: "Add Expense" },
              { to: "/admin/report", label: "View Business Report" },
            ].map((action) => (
              <Link
                key={action.to}
                to={action.to}
                className="group flex items-center justify-between rounded-xl border border-border bg-secondary/30 p-4 transition-all duration-300 ease-swift hover:translate-x-1 hover:border-primary/40 hover:bg-primary/5"
              >
                <span className="text-sm font-medium transition-colors group-hover:text-primary">{action.label}</span>
                <ArrowRight className="h-4 w-4 text-muted-foreground transition-all duration-300 ease-swift group-hover:translate-x-0.5 group-hover:text-primary" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function statusColor(status) {
  const map = {
    "Booking Requested": "status-requested",
    "Booking Confirmed": "status-confirmed",
    "Service Boy Assigned": "status-assigned",
    "Clothes Picked Up": "status-pickedup",
    "Cleaning in Progress": "status-cleaning",
    "Ready for Delivery": "status-ready",
    "Delivered": "status-delivered",
    "Cancelled": "status-cancelled",
  };
  return `status-pill ${map[status] || "status-neutral"}`;
}