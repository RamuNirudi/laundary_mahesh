import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarCheck, CheckCircle2, Package, ArrowRight, Sparkles } from "lucide-react";
import { laundryClient } from "@/api/authClient";
import DashboardLayout from "@/components/DashboardLayout";
import { LayoutDashboard, CalendarDays, User, MapPin } from "lucide-react";

const NAV = [
  { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { label: "My Bookings", path: "/dashboard/bookings", icon: CalendarDays },
  { label: "Profile", path: "/dashboard/profile", icon: User },
  { label: "My Address", path: "/dashboard/address", icon: MapPin },
];

export default function CustomerDashboard() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    laundryClient.getBookings().then((data) => { setBookings(data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const active = bookings.filter((b) => !["Delivered", "Cancelled"].includes(b.status)).length;
  const completed = bookings.filter((b) => b.status === "Delivered").length;

  const cards = [
    { label: "Active Bookings", value: active, icon: Package, color: "text-primary", bg: "bg-primary/10" },
    { label: "Completed Bookings", value: completed, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Total Bookings", value: bookings.length, icon: CalendarCheck, color: "text-accent", bg: "bg-accent/10" },
  ];

  return (
    <DashboardLayout role="customer" navItems={NAV} title="Customer Panel">
      <div className="mb-8">
        <h1 className="font-heading text-2xl font-bold tracking-tight">Welcome back 👋</h1>
        <p className="mt-1 text-sm text-muted-foreground">Here's an overview of your laundry bookings.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.label} className="rounded-2xl border border-border bg-card p-5">
              <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${c.bg} ${c.color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <p className="mt-4 font-heading text-3xl font-bold">{loading ? "—" : c.value}</p>
              <p className="text-sm text-muted-foreground">{c.label}</p>
            </div>
          );
        })}
      </div>

      <div className="mt-8 rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-lg font-semibold">Recent Bookings</h2>
          <Link to="/dashboard/bookings" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:gap-2 transition-all">
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        {loading ? (
          <div className="mt-4 space-y-2">
            {[1, 2, 3].map((i) => <div key={i} className="h-14 animate-pulse rounded-xl bg-secondary/50" />)}
          </div>
        ) : bookings.length === 0 ? (
          <div className="mt-8 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Sparkles className="h-7 w-7" />
            </div>
            <p className="mt-4 text-sm font-medium">No bookings yet</p>
            <p className="mt-1 text-sm text-muted-foreground">Book your first laundry service today.</p>
            <Link to="/book" className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">
              Book Now <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="mt-4 divide-y divide-border">
            {bookings.slice(0, 5).map((b) => (
              <Link key={b.id} to={`/dashboard/bookings/${b.id}`} className="flex items-center justify-between py-3 hover:bg-secondary/30 -mx-2 px-2 rounded-lg transition-colors">
                <div>
                  <p className="text-sm font-semibold text-foreground">{b.booking_id}</p>
                  <p className="text-xs text-muted-foreground">{(b.services || []).map((s) => s.service_name).join(", ") || "Laundry Service"}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">{b.pickup_date}</p>
                  <span className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor(b.status)}`}>{b.status}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
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
