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
    { label: "Active Bookings", value: active, icon: Package, tile: "tile-primary" },
    { label: "Completed Bookings", value: completed, icon: CheckCircle2, tile: "tile-success" },
    { label: "Total Bookings", value: bookings.length, icon: CalendarCheck, tile: "tile-accent" },
  ];

  return (
    <DashboardLayout role="customer" navItems={NAV} title="Customer Panel" showPublicNavbar>
      <div className="mb-10">
        <p className="eyebrow">Overview</p>
        <h1 className="mt-3 font-heading text-3xl font-bold tracking-tight sm:text-4xl">
          Welcome back <span className="inline-block animate-float">👋</span>
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">Here's an overview of your laundry bookings.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {cards.map((c, i) => {
          const Icon = c.icon;
          return (
            <div key={c.label} className={`stat-tile animate-fade-up stagger-${i + 1}`}>
              <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-primary/8 blur-2xl" />
              <div className={`relative flex h-12 w-12 items-center justify-center rounded-xl ${c.tile}`}>
                <Icon className="h-5 w-5" />
              </div>
              <p className="relative mt-5 font-heading text-4xl font-bold tracking-tight tabular">
                {loading ? <span className="text-muted-foreground/40">—</span> : c.value}
              </p>
              <p className="relative mt-1 text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">{c.label}</p>
            </div>
          );
        })}
      </div>

      <div className="mt-8 surface edge-light rounded-2xl p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-lg font-bold tracking-tight">Recent Bookings</h2>
          <Link to="/dashboard/bookings" className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary transition-all duration-300 ease-swift hover:gap-2.5">
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        {loading ? (
          <div className="mt-4 space-y-2">
            {[1, 2, 3].map((i) => <div key={i} className="skeleton h-14 rounded-xl" />)}
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
              <Link key={b.id} to={`/dashboard/bookings/${b.id}`} className="flex items-center justify-between py-3 transition-colors duration-200 hover:bg-primary/5 -mx-2 px-2 rounded-lg transition-colors">
                <div>
                  <p className="text-sm font-semibold text-foreground">{b.booking_id}</p>
                  <p className="text-xs text-muted-foreground">{(b.services || []).map((s) => s.service_name).join(", ") || "Laundry Service"}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">{b.pickup_date}</p>
                  <span className={`mt-1.5 inline-block ${statusColor(b.status)}`}>{b.status}</span>
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
