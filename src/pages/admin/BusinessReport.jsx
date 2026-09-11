import React, { useEffect, useState, useMemo } from "react";
import { CalendarCheck, IndianRupee, TrendingDown, TrendingUp, Package } from "lucide-react";
import { base44 } from "@/api/base44Client";
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

const FILTERS = ["Today", "This Week", "This Month", "Custom"];

export default function BusinessReport() {
  const [bookings, setBookings] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("This Month");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  useEffect(() => {
    Promise.all([
      base44.entities.Booking.list("-created_date", 10000),
      base44.entities.Expense.list("-date", 10000),
    ]).then(([b, e]) => { setBookings(b); setExpenses(e); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const { rangeStart, rangeEnd } = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];
    if (filter === "Today") return { rangeStart: todayStr, rangeEnd: todayStr };
    if (filter === "This Week") {
      const start = new Date(now); start.setDate(now.getDate() - now.getDay());
      return { rangeStart: start.toISOString().split("T")[0], rangeEnd: todayStr };
    }
    if (filter === "This Month") {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      return { rangeStart: start.toISOString().split("T")[0], rangeEnd: todayStr };
    }
    return { rangeStart: fromDate, rangeEnd: toDate };
  }, [filter, fromDate, toDate]);

  const stats = useMemo(() => {
    const inRange = (dateStr) => {
      if (!dateStr) return false;
      if (rangeStart && dateStr < rangeStart) return false;
      if (rangeEnd && dateStr > rangeEnd) return false;
      return true;
    };
    const filteredBookings = bookings.filter((b) => inRange(b.pickup_date));
    const filteredExpenses = expenses.filter((e) => inRange(e.date));
    const revenue = filteredBookings.filter((b) => b.amount_set).reduce((sum, b) => sum + (b.final_amount || 0), 0);
    const totalExpenses = filteredExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    return {
      totalBookings: filteredBookings.length,
      revenue,
      totalExpenses,
      profit: revenue - totalExpenses,
      delivered: filteredBookings.filter((b) => b.status === "Delivered").length,
    };
  }, [bookings, expenses, rangeStart, rangeEnd]);

  const cards = [
    { label: "Total Bookings", value: stats.totalBookings, icon: Package, color: "text-primary", bg: "bg-primary/10" },
    { label: "Total Revenue", value: `₹${stats.revenue.toLocaleString()}`, icon: IndianRupee, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Total Expenses", value: `₹${stats.totalExpenses.toLocaleString()}`, icon: TrendingDown, color: "text-red-600", bg: "bg-red-50" },
    { label: "Total Profit", value: `₹${stats.profit.toLocaleString()}`, icon: TrendingUp, color: stats.profit >= 0 ? "text-accent" : "text-destructive", bg: stats.profit >= 0 ? "bg-accent/10" : "bg-destructive/10" },
  ];

  return (
    <DashboardLayout role="admin" navItems={NAV} title="Admin Panel">
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold tracking-tight">Business Report</h1>
        <p className="mt-1 text-sm text-muted-foreground">Track revenue, expenses, and profit across time periods.</p>
      </div>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {FILTERS.map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium ${filter === f ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground hover:bg-secondary"}`}>{f}</button>
          ))}
        </div>
        {filter === "Custom" && (
          <div className="flex items-center gap-2">
            <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary" />
            <span className="text-sm text-muted-foreground">to</span>
            <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary" />
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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

      <div className="mt-6 rounded-2xl border border-primary/20 bg-primary/5 p-6">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          <h2 className="font-heading text-lg font-semibold">Profit Summary</h2>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl bg-card p-4">
            <p className="text-xs text-muted-foreground">Revenue</p>
            <p className="mt-1 font-heading text-xl font-bold text-emerald-600">₹{stats.revenue.toLocaleString()}</p>
          </div>
          <div className="rounded-xl bg-card p-4">
            <p className="text-xs text-muted-foreground">Expenses</p>
            <p className="mt-1 font-heading text-xl font-bold text-red-600">₹{stats.totalExpenses.toLocaleString()}</p>
          </div>
          <div className="rounded-xl bg-card p-4">
            <p className="text-xs text-muted-foreground">Profit (Revenue − Expenses)</p>
            <p className={`mt-1 font-heading text-xl font-bold ${stats.profit >= 0 ? "text-primary" : "text-destructive"}`}>₹{stats.profit.toLocaleString()}</p>
          </div>
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          {filter === "Custom" && fromDate && toDate ? `From ${fromDate} to ${toDate}` : filter === "Today" ? "Showing today's data" : `Showing ${filter.toLowerCase()} data`}
          {" • "}{stats.delivered} bookings delivered
        </p>
      </div>
    </DashboardLayout>
  );
}