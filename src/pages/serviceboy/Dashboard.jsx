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
      <div className="mb-8">
        <h1 className="font-heading text-2xl font-bold tracking-tight">Today's Pickups</h1>
        <p className="mt-1 text-sm text-muted-foreground">{new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}</p>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><Truck className="h-5 w-5" /></div>
          <p className="mt-4 font-heading text-2xl font-bold">{todaysPickups.length}</p>
          <p className="text-sm text-muted-foreground">Today's Pickups</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600"><PackageCheck className="h-5 w-5" /></div>
          <p className="mt-4 font-heading text-2xl font-bold">{allActive.length}</p>
          <p className="text-sm text-muted-foreground">Active Assignments</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600"><CheckCircle2 className="h-5 w-5" /></div>
          <p className="mt-4 font-heading text-2xl font-bold">{bookings.filter((b) => b.status === "Delivered").length}</p>
          <p className="text-sm text-muted-foreground">Delivered</p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map((i) => <div key={i} className="h-32 animate-pulse rounded-2xl bg-secondary/50" />)}</div>
      ) : allActive.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-12 text-center">
          <Truck className="mx-auto h-10 w-10 text-muted-foreground/40" />
          <p className="mt-3 text-sm font-medium">No active assignments</p>
          <p className="mt-1 text-sm text-muted-foreground">You'll see your assigned pickups here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {allActive.map((b) => (
            <div key={b.id} className="rounded-2xl border border-border bg-card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-heading text-base font-semibold">{b.booking_id}</p>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor(b.status)}`}>{b.status}</span>
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