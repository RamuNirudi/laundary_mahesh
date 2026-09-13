import React, { useEffect, useState, useMemo } from "react";
import { IndianRupee, TrendingDown, TrendingUp, Package, Download } from "lucide-react";
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

const FILTERS = ["Today", "This Week", "This Month", "Custom"];

export default function BusinessReport() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("This Month");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [downloading, setDownloading] = useState(false);

  const { rangeStart, rangeEnd } = useMemo(() => {
    const now = new Date();
    const asDate = (value) => {
      const offset = value.getTimezoneOffset() * 60000;
      return new Date(value.getTime() - offset).toISOString().split("T")[0];
    };
    const todayStr = asDate(now);
    if (filter === "Today") return { rangeStart: todayStr, rangeEnd: todayStr };
    if (filter === "This Week") {
      const start = new Date(now); start.setDate(now.getDate() - now.getDay());
      return { rangeStart: asDate(start), rangeEnd: todayStr };
    }
    if (filter === "This Month") {
      return { rangeStart: `${todayStr.slice(0, 7)}-01`, rangeEnd: todayStr };
    }
    return { rangeStart: fromDate, rangeEnd: toDate };
  }, [filter, fromDate, toDate]);

  // MySQL does the aggregation, so changing the range is one small request
  // rather than a re-reduce over every booking ever made.
  useEffect(() => {
    if (filter === "Custom" && (!rangeStart || !rangeEnd)) return;
    setLoading(true);
    adminClient.getReport(rangeStart, rangeEnd)
      .then(setReport)
      .catch(() => setReport(null))
      .finally(() => setLoading(false));
  }, [filter, rangeStart, rangeEnd]);

  const handleDownload = async () => {
    if (!rangeStart || !rangeEnd) {
      toast({ title: "Pick both a From and a To date", variant: "destructive" });
      return;
    }
    if (rangeStart > rangeEnd) {
      toast({ title: "The From date must be on or before the To date", variant: "destructive" });
      return;
    }
    setDownloading(true);
    try {
      await adminClient.downloadReportExcel(rangeStart, rangeEnd);
      toast({ title: "Report downloaded", description: `${rangeStart} to ${rangeEnd}` });
    } catch (err) {
      toast({ title: "Download failed", description: err.message, variant: "destructive" });
    }
    setDownloading(false);
  };

  const stats = {
    totalBookings: report?.summary.booking_count ?? 0,
    revenue: report?.summary.revenue ?? 0,
    totalExpenses: report?.summary.expenses ?? 0,
    profit: report?.summary.profit ?? 0,
    delivered: report?.summary.delivered_count ?? 0,
    discounts: report?.summary.discounts ?? 0,
  };

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

      <div className="mb-6 space-y-3">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {FILTERS.map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium ${filter === f ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground hover:bg-secondary"}`}>{f}</button>
          ))}
        </div>

        <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">From Date</label>
              <input
                type="date"
                value={rangeStart || ""}
                max={rangeEnd || undefined}
                onChange={(e) => { setFilter("Custom"); setFromDate(e.target.value); if (!toDate) setToDate(rangeEnd); }}
                className="mt-1 block rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">To Date</label>
              <input
                type="date"
                value={rangeEnd || ""}
                min={rangeStart || undefined}
                onChange={(e) => { setFilter("Custom"); setToDate(e.target.value); if (!fromDate) setFromDate(rangeStart); }}
                className="mt-1 block rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </div>
          </div>

          <button
            onClick={handleDownload}
            disabled={downloading || loading}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:shadow-lg hover:shadow-emerald-600/30 disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            {downloading ? "Preparing..." : "Download Excel"}
          </button>
        </div>
        <p className="text-xs text-muted-foreground">
          The Excel file has four sheets: Summary, Orders, Sales (daily) and Profit (daily).
        </p>
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
          {stats.discounts > 0 && ` • ₹${stats.discounts.toLocaleString()} given as discounts`}
        </p>
      </div>

      {report?.top_services?.length > 0 && (
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="font-heading text-lg font-semibold">Top Services</h2>
            <div className="mt-4 divide-y divide-border">
              {report.top_services.map((s) => (
                <div key={s.service_name} className="flex items-center justify-between py-2.5">
                  <div>
                    <p className="text-sm font-medium">{s.service_name}</p>
                    <p className="text-xs text-muted-foreground">{s.quantity} item{s.quantity === 1 ? "" : "s"}</p>
                  </div>
                  <p className="text-sm font-semibold">₹{s.revenue.toLocaleString()}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="font-heading text-lg font-semibold">Coupon Usage</h2>
            {report.coupon_usage.length === 0 ? (
              <p className="mt-8 text-center text-sm text-muted-foreground">No coupons redeemed in this period.</p>
            ) : (
              <div className="mt-4 divide-y divide-border">
                {report.coupon_usage.map((c) => (
                  <div key={c.code} className="flex items-center justify-between py-2.5">
                    <div>
                      <p className="text-sm font-semibold text-primary">{c.code}</p>
                      <p className="text-xs text-muted-foreground">{c.uses} redemption{c.uses === 1 ? "" : "s"}</p>
                    </div>
                    <p className="text-sm font-semibold text-red-600">-₹{c.discount_given.toLocaleString()}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}