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
    { label: "Today's Bookings", value: stats?.todays_bookings ?? 0, icon: CalendarCheck, color: "text-primary", bg: "bg-primary/10" },
    { label: "Today's Revenue", value: money(stats?.todays_revenue), icon: IndianRupee, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Today's Expenses", value: money(stats?.todays_expenses), icon: TrendingDown, color: "text-red-600", bg: "bg-red-50" },
    { label: "Today's Profit", value: money(stats?.profit), icon: TrendingUp, color: "text-accent", bg: "bg-accent/10" },
    { label: "Active Bookings", value: stats?.active_bookings ?? 0, icon: Package, color: "text-indigo-600", bg: "bg-indigo-50" },
  ];

  return (
    <DashboardLayout role="admin" navItems={NAV} title="Admin Panel">
      <div className="mb-8">
        <h1 className="font-heading text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">Business overview for {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.label} className="rounded-2xl border border-border bg-card p-5">
              <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${c.bg} ${c.color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <p className="mt-4 font-heading text-2xl font-bold">{loading ? "—" : c.value}</p>
              <p className="text-sm text-muted-foreground">{c.label}</p>
            </div>
          );
        })}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-lg font-semibold">Recent Bookings</h2>
            <Link to="/admin/bookings" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:gap-2 transition-all">
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          {loading ? (
            <div className="mt-4 space-y-2">{[1,2,3].map((i) => <div key={i} className="h-14 animate-pulse rounded-xl bg-secondary/50" />)}</div>
          ) : recent.length === 0 ? (
            <p className="mt-8 text-center text-sm text-muted-foreground">No bookings yet.</p>
          ) : (
            <div className="mt-4 divide-y divide-border">
              {recent.map((b) => (
                <Link key={b.id} to="/admin/bookings" className="flex items-center justify-between py-3 -mx-2 px-2 rounded-lg hover:bg-secondary/20">
                  <div>
                    <p className="text-sm font-semibold">{b.booking_id}</p>
                    <p className="text-xs text-muted-foreground">{b.customer_name} • {b.pickup_date}</p>
                  </div>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor(b.status)}`}>{b.status}</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="flex items-center gap-2 font-heading text-lg font-semibold"><Receipt className="h-5 w-5 text-primary" /> Quick Actions</h2>
          <div className="mt-4 space-y-2">
            <Link to="/admin/services" className="flex items-center justify-between rounded-xl border border-border p-3 hover:border-primary/30 hover:bg-secondary/30">
              <span className="text-sm font-medium">Manage Services</span><ArrowRight className="h-4 w-4 text-muted-foreground" />
            </Link>
            <Link to="/admin/expenses" className="flex items-center justify-between rounded-xl border border-border p-3 hover:border-primary/30 hover:bg-secondary/30">
              <span className="text-sm font-medium">Add Expense</span><ArrowRight className="h-4 w-4 text-muted-foreground" />
            </Link>
            <Link to="/admin/report" className="flex items-center justify-between rounded-xl border border-border p-3 hover:border-primary/30 hover:bg-secondary/30">
              <span className="text-sm font-medium">View Business Report</span><ArrowRight className="h-4 w-4 text-muted-foreground" />
            </Link>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function statusColor(status) {
  const map = {
    "Booking Requested": "bg-amber-50 text-amber-700",
    "Booking Confirmed": "bg-blue-50 text-blue-700",
    "Service Boy Assigned": "bg-indigo-50 text-indigo-700",
    "Clothes Picked Up": "bg-cyan-50 text-cyan-700",
    "Cleaning in Progress": "bg-violet-50 text-violet-700",
    "Ready for Delivery": "bg-teal-50 text-teal-700",
    "Delivered": "bg-emerald-50 text-emerald-700",
    "Cancelled": "bg-red-50 text-red-700",
  };
  return map[status] || "bg-secondary text-muted-foreground";
}