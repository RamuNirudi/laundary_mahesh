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
        <p className="eyebrow">Account</p>
        <h1 className="mt-3 font-heading text-3xl font-bold tracking-tight sm:text-4xl">My Bookings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Track and manage all your laundry bookings.</p>
      </div>

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by booking ID or service..."
            className="field w-full pl-10"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="field w-full sm:w-auto"
        >
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="overflow-hidden surface edge-light rounded-2xl">
        {loading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="skeleton h-14 rounded-xl" />)}
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
              <thead className="border-b border-border/70 bg-secondary/40">
                <tr className="text-left text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                  <th className="px-6 py-3">Booking ID</th>
                  <th className="px-6 py-3">Service</th>
                  <th className="px-6 py-3">Pickup Date</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((b) => (
                  <tr key={b.id} className="transition-colors duration-200 hover:bg-primary/5">
                    <td className="px-6 py-4 text-sm font-semibold">{b.booking_id}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{(b.services || []).map((s) => s.service_name).join(", ") || "—"}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{b.pickup_date}</td>
                    <td className="px-6 py-4"><span className={statusColor(b.status)}>{b.status}</span></td>
                    <td className="px-6 py-4 text-right">
                      <Link to={`/dashboard/bookings/${b.id}`} className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary transition-all duration-300 ease-swift hover:gap-2.5">
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
                <Link key={b.id} to={`/dashboard/bookings/${b.id}`} className="block p-4 transition-colors duration-200 hover:bg-primary/5">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">{b.booking_id}</p>
                    <span className={statusColor(b.status)}>{b.status}</span>
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
