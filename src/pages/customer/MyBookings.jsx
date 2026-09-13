import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search, Eye, CalendarDays } from "lucide-react";
import { laundryClient } from "@/api/authClient";
import DashboardLayout from "@/components/DashboardLayout";
import { LayoutDashboard, CalendarDays as CalIcon, User, MapPin } from "lucide-react";

const NAV = [
  { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { label: "My Bookings", path: "/dashboard/bookings", icon: CalIcon },
  { label: "Profile", path: "/dashboard/profile", icon: User },
  { label: "My Address", path: "/dashboard/address", icon: MapPin },
];

const STATUSES = ["All", "Booking Requested", "Booking Confirmed", "Service Boy Assigned", "Clothes Picked Up", "Cleaning in Progress", "Ready for Delivery", "Delivered", "Cancelled"];

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  useEffect(() => {
    laundryClient.getBookings().then((data) => { setBookings(data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const filtered = bookings.filter((b) => {
    const matchSearch = !search || b.booking_id.toLowerCase().includes(search.toLowerCase()) || (b.services || []).some((s) => s.service_name.toLowerCase().includes(search.toLowerCase()));
    const matchStatus = statusFilter === "All" || b.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <DashboardLayout role="customer" navItems={NAV} title="Customer Panel" showPublicNavbar>
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold tracking-tight">My Bookings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Track and manage all your laundry bookings.</p>
      </div>

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by booking ID or service..."
            className="w-full rounded-xl border border-border bg-card py-2.5 pl-10 pr-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl border border-border bg-card px-4 py-2.5 text-sm outline-none focus:border-primary"
        >
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        {loading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="h-14 animate-pulse rounded-xl bg-secondary/50" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <CalendarDays className="mx-auto h-10 w-10 text-muted-foreground/40" />
            <p className="mt-3 text-sm font-medium">No bookings found</p>
            <Link to="/book" className="mt-3 inline-block rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground">Book a service</Link>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <table className="hidden w-full sm:table">
              <thead className="border-b border-border bg-secondary/30">
                <tr className="text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <th className="px-6 py-3">Booking ID</th>
                  <th className="px-6 py-3">Service</th>
                  <th className="px-6 py-3">Pickup Date</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((b) => (
                  <tr key={b.id} className="hover:bg-secondary/20">
                    <td className="px-6 py-4 text-sm font-semibold">{b.booking_id}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{(b.services || []).map((s) => s.service_name).join(", ") || "—"}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{b.pickup_date}</td>
                    <td className="px-6 py-4"><span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor(b.status)}`}>{b.status}</span></td>
                    <td className="px-6 py-4 text-right">
                      <Link to={`/dashboard/bookings/${b.id}`} className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:gap-2 transition-all">
                        <Eye className="h-4 w-4" /> View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {/* Mobile cards */}
            <div className="sm:hidden divide-y divide-border">
              {filtered.map((b) => (
                <Link key={b.id} to={`/dashboard/bookings/${b.id}`} className="block p-4 hover:bg-secondary/20">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">{b.booking_id}</p>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor(b.status)}`}>{b.status}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{(b.services || []).map((s) => s.service_name).join(", ") || "—"}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{b.pickup_date} • {b.pickup_time}</p>
                </Link>
              ))}
            </div>
          </>
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
