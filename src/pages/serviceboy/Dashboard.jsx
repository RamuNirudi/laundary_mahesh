import React, { useEffect, useState } from "react";
import { MapPin, Clock, Phone, User, Truck, PackageCheck, Loader2, CheckCircle2 } from "lucide-react";
import { authClient } from "@/api/authClient";
import { serviceBoyClient } from "@/api/adminClient";
import { toast } from "@/components/ui/use-toast";
import DashboardLayout from "@/components/DashboardLayout";
import { LayoutDashboard } from "lucide-react";

const NAV = [
  { label: "Today's Pickups", path: "/serviceboy", icon: LayoutDashboard },
];

const NEXT_STEP = {
  "Booking Requested": { status: "Clothes Picked Up", label: "Mark Picked Up", icon: Truck },
  "Booking Confirmed": { status: "Clothes Picked Up", label: "Mark Picked Up", icon: Truck },
  "Service Boy Assigned": { status: "Clothes Picked Up", label: "Mark Picked Up", icon: Truck },
  "Clothes Picked Up": { status: "Cleaning in Progress", label: "Start Cleaning", icon: PackageCheck },
  "Cleaning in Progress": { status: "Ready for Delivery", label: "Mark Ready for Delivery", icon: PackageCheck },
  "Ready for Delivery": { status: "Delivered", label: "Mark Delivered", icon: CheckCircle2 },
};

const nextStep = (status) => NEXT_STEP[status] || null;

export default function ServiceBoyDashboard() {
  const [user, setUser] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);

  useEffect(() => {
    // The API scopes /serviceboy/bookings to the signed-in executive, so the
    // client never has to filter by id (or be trusted to).
    Promise.all([authClient.me(), serviceBoyClient.getBookings()])
      .then(([u, b]) => { setUser(u); setBookings(b); })
      .catch((err) => toast({ title: "Failed to load pickups", description: err.message, variant: "destructive" }))
      .finally(() => setLoading(false));
  }, []);

  const today = new Date().toISOString().split("T")[0];
  const todaysPickups = bookings.filter((b) => b.pickup_date === today && !["Delivered", "Cancelled"].includes(b.status));
  const allActive = bookings.filter((b) => !["Delivered", "Cancelled"].includes(b.status));

  const updateStatus = async (booking, newStatus) => {
    setUpdating(booking.id);
    try {
      await serviceBoyClient.updateStatus(booking.id, newStatus);
      toast({ title: `Status updated to "${newStatus}"` });
      setBookings(await serviceBoyClient.getBookings());
    } catch (err) {
      toast({ title: "Update failed", description: err.message, variant: "destructive" });
    }
    setUpdating(null);
  };

  return (
    <DashboardLayout role="service_boy" navItems={NAV} title="Service Boy">
      <div className="mb-10">
        <p className="eyebrow">Route</p>
        <h1 className="mt-3 font-heading text-3xl font-bold tracking-tight sm:text-4xl">Today's Pickups</h1>
        <p className="mt-2 text-sm text-muted-foreground">{new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}</p>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        {[
          { icon: Truck, tile: "tile-primary", value: todaysPickups.length, label: "Today's Pickups" },
          { icon: PackageCheck, tile: "tile-indigo", value: allActive.length, label: "Active Assignments" },
          { icon: CheckCircle2, tile: "tile-success", value: bookings.filter((b) => b.status === "Delivered").length, label: "Delivered" },
        ].map((card, i) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className={`stat-tile animate-fade-up stagger-${i + 1}`}>
              <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-primary/8 blur-2xl" />
              <div className={`relative flex h-12 w-12 items-center justify-center rounded-xl ${card.tile}`}>
                <Icon className="h-5 w-5" />
              </div>
              <p className="relative mt-5 font-heading text-4xl font-bold tracking-tight tabular">{card.value}</p>
              <p className="relative mt-1 text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">{card.label}</p>
            </div>
          );
        })}
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map((i) => <div key={i} className="skeleton h-32 rounded-2xl" />)}</div>
      ) : allActive.length === 0 ? (
        <div className="surface edge-light rounded-2xl p-12 text-center">
          <Truck className="mx-auto h-10 w-10 text-muted-foreground/40" />
          <p className="mt-3 text-sm font-medium">No active assignments</p>
          <p className="mt-1 text-sm text-muted-foreground">You'll see your assigned pickups here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {allActive.map((b) => (
            <div key={b.id} className="surface edge-light rounded-2xl p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-heading text-base font-semibold">{b.booking_id}</p>
                    <span className={statusColor(b.status)}>{b.status}</span>
                  </div>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    <div className="flex items-center gap-2 text-sm"><User className="h-4 w-4 shrink-0 text-primary" /><div><p className="text-xs text-muted-foreground">Customer</p><p className="font-medium">{b.customer_name}</p></div></div>
                    <div className="flex items-center gap-2 text-sm"><Phone className="h-4 w-4 shrink-0 text-primary" /><div><p className="text-xs text-muted-foreground">Phone</p><p className="font-medium">{b.customer_phone || "—"}</p></div></div>
                    <div className="flex items-start gap-2 text-sm sm:col-span-2"><MapPin className="h-4 w-4 shrink-0 text-primary mt-0.5" /><div><p className="text-xs text-muted-foreground">Address</p><p>{b.pickup_address}</p></div></div>
                    <div className="flex items-center gap-2 text-sm"><Clock className="h-4 w-4 shrink-0 text-primary" /><div><p className="text-xs text-muted-foreground">Pickup</p><p className="font-medium">{b.pickup_date} • {b.pickup_time}</p></div></div>
                  </div>
                </div>
              </div>

              {/* Action bar */}
              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                {nextStep(b.status) ? (
                  <button
                    disabled={updating === b.id}
                    onClick={() => updateStatus(b, nextStep(b.status).status)}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-full py-3 text-sm font-semibold disabled:opacity-50 ${
                      nextStep(b.status).status === "Delivered"
                        ? "bg-emerald-600 text-white hover:shadow-lg hover:shadow-emerald-600/30"
                        : "bg-primary text-primary-foreground hover:shadow-lg hover:shadow-primary/30"
                    }`}
                  >
                    {updating === b.id ? <Loader2 className="h-4 w-4 animate-spin" /> : React.createElement(nextStep(b.status).icon, { className: "h-4 w-4" })}
                    {nextStep(b.status).label}
                  </button>
                ) : (
                  <p className="flex-1 rounded-full bg-secondary/50 py-3 text-center text-sm text-muted-foreground">
                    Waiting for the office to confirm this booking.
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
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