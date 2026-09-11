import React, { useEffect, useState, useMemo } from "react";
import { Search, X, User, Phone, MapPin, Calendar, Clock, IndianRupee, Save, UserCog, CheckCircle2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "@/components/ui/use-toast";
import DashboardLayout from "@/components/DashboardLayout";
import StatusTracker from "@/components/StatusTracker";
import { LayoutDashboard, CalendarDays, Sparkles, Users, UserCog as UserCogIcon, Receipt, BarChart3, Settings, Ticket } from "lucide-react";

const NAV = [
  { label: "Dashboard", path: "/admin", icon: LayoutDashboard },
  { label: "Bookings", path: "/admin/bookings", icon: CalendarDays },
  { label: "Services", path: "/admin/services", icon: Sparkles },
  { label: "Coupons", path: "/admin/coupons", icon: Ticket },
  { label: "Customers", path: "/admin/customers", icon: Users },
  { label: "Service Boys", path: "/admin/serviceboys", icon: UserCogIcon },
  { label: "Expenses", path: "/admin/expenses", icon: Receipt },
  { label: "Business Report", path: "/admin/report", icon: BarChart3 },
  { label: "Settings", path: "/admin/settings", icon: Settings },
];

const STATUSES = ["Booking Requested", "Booking Confirmed", "Service Boy Assigned", "Clothes Picked Up", "Cleaning in Progress", "Ready for Delivery", "Delivered", "Cancelled"];
const FILTERS = ["All", "Today", "This Week", "This Month"];

export default function AdminBookings() {
  const [bookings, setBookings] = useState([]);
  const [serviceBoys, setServiceBoys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("All");
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    Promise.all([
      base44.entities.Booking.list("-created_date", 10000),
      base44.entities.User.filter({ role: "service_boy" }),
    ]).then(([b, sb]) => {
      setBookings(b);
      setServiceBoys(sb);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const today = now.toISOString().split("T")[0];

    return bookings.filter((b) => {
      const matchSearch = !search || b.booking_id.toLowerCase().includes(search.toLowerCase()) || (b.customer_name || "").toLowerCase().includes(search.toLowerCase()) || (b.customer_phone || "").includes(search);
      const matchStatus = statusFilter === "All" || b.status === statusFilter;
      let matchDate = true;
      if (dateFilter === "Today") matchDate = b.pickup_date === today;
      else if (dateFilter === "This Week") matchDate = new Date(b.pickup_date) >= startOfWeek;
      else if (dateFilter === "This Month") matchDate = new Date(b.pickup_date) >= startOfMonth;
      return matchSearch && matchStatus && matchDate;
    });
  }, [bookings, search, statusFilter, dateFilter]);

  return (
    <DashboardLayout role="admin" navItems={NAV} title="Admin Panel">
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold tracking-tight">All Bookings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage, assign, and update all customer bookings.</p>
      </div>

      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by ID, name, or phone..."
            className="w-full rounded-xl border border-border bg-card py-2.5 pl-10 pr-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {FILTERS.map((f) => (
            <button key={f} onClick={() => setDateFilter(f)} className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium ${dateFilter === f ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground hover:bg-secondary"}`}>{f}</button>
          ))}
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-xl border border-border bg-card px-4 py-2.5 text-sm outline-none focus:border-primary">
          <option value="All">All Statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        {loading ? (
          <div className="p-6 space-y-3">{[1,2,3,4].map((i) => <div key={i} className="h-14 animate-pulse rounded-xl bg-secondary/50" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-sm text-muted-foreground">No bookings found.</div>
        ) : (
          <>
            <table className="hidden w-full lg:table">
              <thead className="border-b border-border bg-secondary/30">
                <tr className="text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <th className="px-6 py-3">Booking ID</th>
                  <th className="px-6 py-3">Customer</th>
                  <th className="px-6 py-3">Service</th>
                  <th className="px-6 py-3">Pickup</th>
                  <th className="px-6 py-3">Amount</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((b) => (
                  <tr key={b.id} className="hover:bg-secondary/20">
                    <td className="px-6 py-4 text-sm font-semibold">{b.booking_id}</td>
                    <td className="px-6 py-4"><p className="text-sm font-medium">{b.customer_name}</p><p className="text-xs text-muted-foreground">{b.customer_phone}</p></td>
                    <td className="px-6 py-4 text-sm text-muted-foreground max-w-[160px] truncate">{(b.services || []).map((s) => s.service_name).join(", ")}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{b.pickup_date}<br /><span className="text-xs">{b.pickup_time}</span></td>
                    <td className="px-6 py-4 text-sm">{b.amount_set ? `₹${b.final_amount}` : <span className="text-muted-foreground">—</span>}</td>
                    <td className="px-6 py-4"><span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor(b.status)}`}>{b.status}</span></td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => setSelected(b)} className="rounded-lg bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary/20">Manage</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="lg:hidden divide-y divide-border">
              {filtered.map((b) => (
                <button key={b.id} onClick={() => setSelected(b)} className="block w-full p-4 text-left hover:bg-secondary/20">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">{b.booking_id}</p>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor(b.status)}`}>{b.status}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{b.customer_name} • {b.pickup_date}</p>
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {selected && <BookingModal booking={selected} serviceBoys={serviceBoys} onClose={() => setSelected(null)} />}
    </DashboardLayout>
  );
}

function BookingModal({ booking, serviceBoys, onClose }) {
  const [status, setStatus] = useState(booking.status);
  const [serviceBoyId, setServiceBoyId] = useState(booking.service_boy_id || "");
  const [servicePrice, setServicePrice] = useState(booking.service_price || 0);
  const [additionalCharges, setAdditionalCharges] = useState(booking.additional_charges || 0);
  const [discount, setDiscount] = useState(booking.discount || 0);
  const [coupon, setCoupon] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (booking.coupon_code) {
      base44.entities.Coupon.filter({}, "-created_date", 500).then((all) => {
        const found = all.find((c) => (c.code || "").toUpperCase() === booking.coupon_code.toUpperCase());
        if (found) setCoupon(found);
      }).catch(() => {});
    }
  }, [booking.coupon_code]);

  const subtotal = (Number(servicePrice) || 0) + (Number(additionalCharges) || 0);
  let couponDiscount = 0;
  if (coupon && subtotal > 0) {
    if (coupon.min_order_amount > 0 && subtotal < coupon.min_order_amount) {
      couponDiscount = 0;
    } else if (coupon.discount_type === "percentage") {
      couponDiscount = Math.round(subtotal * (coupon.discount_value / 100) * 100) / 100;
    } else {
      couponDiscount = Math.min(coupon.discount_value, subtotal);
    }
  }
  const finalAmount = subtotal - (Number(discount) || 0) - couponDiscount;

  const handleSave = async () => {
    setSaving(true);
    try {
      const sb = serviceBoys.find((s) => s.id === serviceBoyId);
      const update = {
        booking_id: booking.id,
        status,
        service_boy_id: serviceBoyId || undefined,
        service_boy_name: sb ? sb.full_name : undefined,
        service_price: Number(servicePrice) || 0,
        additional_charges: Number(additionalCharges) || 0,
        discount: Number(discount) || 0,
        coupon_discount: couponDiscount,
        final_amount: finalAmount,
      };
      await base44.functions.invoke("updateBookingStatus", update);
      toast({ title: "Booking updated", description: "Status and amount saved. Email sent if applicable." });
      onClose();
    } catch (err) {
      toast({ title: "Update failed", description: err.message, variant: "destructive" });
    }
    setSaving(false);
  };

  const handleCancel = async () => {
    setSaving(true);
    try {
      await base44.functions.invoke("updateBookingStatus", { booking_id: booking.id, status: "Cancelled" });
      toast({ title: "Booking cancelled" });
      onClose();
    } catch (err) {
      toast({ title: "Cancel failed", description: err.message, variant: "destructive" });
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/30 backdrop-blur-sm sm:items-center" onClick={onClose}>
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl bg-card p-6 shadow-2xl sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Manage Booking</p>
            <h2 className="font-heading text-xl font-bold">{booking.booking_id}</h2>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 hover:bg-secondary"><X className="h-5 w-5" /></button>
        </div>

        {/* Customer info */}
        <div className="mt-5 grid gap-3 rounded-xl border border-border p-4 sm:grid-cols-2">
          <div className="flex gap-2 text-sm"><User className="h-4 w-4 shrink-0 text-primary mt-0.5" /><div><p className="text-xs text-muted-foreground">Customer</p><p className="font-medium">{booking.customer_name}</p></div></div>
          <div className="flex gap-2 text-sm"><Phone className="h-4 w-4 shrink-0 text-primary mt-0.5" /><div><p className="text-xs text-muted-foreground">Phone</p><p className="font-medium">{booking.customer_phone || "—"}</p></div></div>
          <div className="flex gap-2 text-sm sm:col-span-2"><MapPin className="h-4 w-4 shrink-0 text-primary mt-0.5" /><div><p className="text-xs text-muted-foreground">Address</p><p>{booking.pickup_address}</p></div></div>
          <div className="flex gap-2 text-sm"><Calendar className="h-4 w-4 shrink-0 text-primary mt-0.5" /><div><p className="text-xs text-muted-foreground">Date</p><p>{booking.pickup_date}</p></div></div>
          <div className="flex gap-2 text-sm"><Clock className="h-4 w-4 shrink-0 text-primary mt-0.5" /><div><p className="text-xs text-muted-foreground">Time</p><p>{booking.pickup_time}</p></div></div>
        </div>

        {/* Services */}
        <div className="mt-3 rounded-xl border border-border p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Services</p>
          <div className="mt-2 space-y-1">
            {(booking.services || []).map((s, i) => (
              <div key={i} className="flex justify-between text-sm"><span>{s.service_name}</span><span className="text-muted-foreground">×{s.quantity}</span></div>
            ))}
          </div>
        </div>

        {/* Status tracker */}
        <div className="mt-3 rounded-xl border border-border p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Current Progress</p>
          <StatusTracker status={booking.status} compact />
        </div>

        {/* Update status */}
        <div className="mt-5">
          <label className="text-sm font-medium">Update Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary">
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* Assign service boy */}
        <div className="mt-4">
          <label className="flex items-center gap-1.5 text-sm font-medium"><UserCog className="h-4 w-4 text-primary" /> Assign Service Boy</label>
          <select value={serviceBoyId} onChange={(e) => setServiceBoyId(e.target.value)} className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary">
            <option value="">— Select —</option>
            {serviceBoys.map((sb) => <option key={sb.id} value={sb.id}>{sb.full_name}</option>)}
          </select>
        </div>

        {/* Amount */}
        <div className="mt-5 rounded-xl border border-primary/20 bg-primary/5 p-4">
          <p className="flex items-center gap-1.5 text-sm font-semibold text-primary"><IndianRupee className="h-4 w-4" /> Booking Amount (Manual)</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <div>
              <label className="text-xs text-muted-foreground">Service Price</label>
              <input type="number" min="0" value={servicePrice} onChange={(e) => setServicePrice(e.target.value)} className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Additional Charges</label>
              <input type="number" min="0" value={additionalCharges} onChange={(e) => setAdditionalCharges(e.target.value)} className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Discount</label>
              <input type="number" min="0" value={discount} onChange={(e) => setDiscount(e.target.value)} className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
            </div>
          </div>
          {coupon && (
            <div className="mt-3 rounded-lg border border-green-200 bg-green-50 px-4 py-2.5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-green-800">Coupon: {coupon.code}</span>
                <span className="text-sm font-bold text-green-700">−₹{couponDiscount}</span>
              </div>
              <p className="mt-0.5 text-xs text-green-600">
                {coupon.discount_type === "percentage" ? `${coupon.discount_value}% off` : `₹${coupon.discount_value} flat off`}
                {coupon.min_order_amount > 0 && ` · Min order ₹${coupon.min_order_amount}`}
                {coupon.min_order_amount > 0 && subtotal < coupon.min_order_amount && " (min not met)"}
              </p>
            </div>
          )}
          <div className="mt-3 flex items-center justify-between rounded-lg bg-card px-4 py-2.5">
            <span className="text-sm font-medium">Final Amount</span>
            <span className="font-heading text-lg font-bold text-primary">₹{finalAmount}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-between">
          <button onClick={handleCancel} disabled={saving || booking.status === "Cancelled"} className="rounded-full border border-destructive/30 px-5 py-2.5 text-sm font-semibold text-destructive hover:bg-destructive/5 disabled:opacity-50">Cancel Booking</button>
          <button onClick={handleSave} disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:shadow-lg hover:shadow-primary/30 disabled:opacity-50">
            {saving ? "Saving..." : <><Save className="h-4 w-4" /> Save Changes</>}
          </button>
        </div>
      </div>
    </div>
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