import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, MapPin, Calendar, Clock, Phone, User, Shirt, Sparkles, Ticket } from "lucide-react";
import { laundryClient } from "@/api/authClient";
import StatusTracker from "@/components/StatusTracker";

export default function BookingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    laundryClient.getBooking(id)
      .then(({ booking }) => setBooking(booking))
      .catch(() => setBooking(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><div className="h-8 w-8 border-4 border-secondary border-t-primary rounded-full animate-spin" /></div>;
  }

  if (!booking) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Booking not found.</p>
        <Link to="/dashboard/bookings" className="mt-4 inline-block rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground">Back to bookings</Link>
      </div>
    );
  }

  return (
    <div>
      <button onClick={() => navigate(-1)} className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Booking header */}
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Booking ID</p>
                <h1 className="font-heading text-2xl font-bold">{booking.booking_id}</h1>
              </div>
              <span className={`rounded-full px-3 py-1 text-sm font-medium ${statusColor(booking.status)}`}>{booking.status}</span>
            </div>
          </div>

          {/* Status tracker */}
          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="font-heading text-lg font-semibold">Booking Progress</h2>
            <div className="mt-6">
              <StatusTracker status={booking.status} />
            </div>
          </div>

          {/* Services */}
          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="flex items-center gap-2 font-heading text-lg font-semibold"><Shirt className="h-5 w-5 text-primary" /> Services</h2>
            <div className="mt-4 space-y-2">
              {(booking.services || []).map((s, i) => (
                <div key={i} className="flex items-center justify-between rounded-xl border border-border p-3">
                  <span className="text-sm font-medium">{s.service_name}</span>
                  <span className="text-sm text-muted-foreground">×{s.quantity}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-secondary/40 p-3">
                <p className="text-xs text-muted-foreground">Total Items</p>
                <p className="text-sm font-semibold">{booking.number_of_items || (booking.services || []).reduce((a, s) => a + (s.quantity || 0), 0)}</p>
              </div>
              {booking.special_instructions && (
                <div className="rounded-xl bg-secondary/40 p-3">
                  <p className="text-xs text-muted-foreground">Special Instructions</p>
                  <p className="text-sm font-semibold">{booking.special_instructions}</p>
                </div>
              )}
            </div>
          </div>

          {/* Amount (if set by admin) */}
          {booking.amount_set && (
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6">
              <h2 className="flex items-center gap-2 font-heading text-lg font-semibold"><Sparkles className="h-5 w-5 text-primary" /> Bill Summary</h2>
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Service Price</span><span>₹{booking.service_price || 0}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Additional Charges</span><span>₹{booking.additional_charges || 0}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Discount</span><span>−₹{booking.discount || 0}</span></div>
                {booking.coupon_code && (
                  <div className="flex justify-between"><span className="flex items-center gap-1 text-muted-foreground"><Ticket className="h-3.5 w-3.5" /> Coupon ({booking.coupon_code})</span><span>−₹{booking.coupon_discount || 0}</span></div>
                )}
                <div className="flex justify-between border-t border-primary/20 pt-2 text-base font-bold"><span>Final Amount</span><span className="text-primary">₹{booking.final_amount || 0}</span></div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar info */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="font-heading text-base font-semibold">Pickup Details</h2>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex gap-3"><MapPin className="h-4 w-4 shrink-0 text-primary mt-0.5" /><div><p className="text-xs text-muted-foreground">Address</p><p>{booking.pickup_address}</p></div></div>
              <div className="flex gap-3"><Calendar className="h-4 w-4 shrink-0 text-primary mt-0.5" /><div><p className="text-xs text-muted-foreground">Date</p><p>{booking.pickup_date}</p></div></div>
              <div className="flex gap-3"><Clock className="h-4 w-4 shrink-0 text-primary mt-0.5" /><div><p className="text-xs text-muted-foreground">Time</p><p>{booking.pickup_time}</p></div></div>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="font-heading text-base font-semibold">Customer Info</h2>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex gap-3"><User className="h-4 w-4 shrink-0 text-primary mt-0.5" /><div><p className="text-xs text-muted-foreground">Name</p><p>{booking.customer_name}</p></div></div>
              {booking.customer_phone && <div className="flex gap-3"><Phone className="h-4 w-4 shrink-0 text-primary mt-0.5" /><div><p className="text-xs text-muted-foreground">Phone</p><p>{booking.customer_phone}</p></div></div>}
            </div>
          </div>

          {booking.service_boy_name && (
            <div className="rounded-2xl border border-border bg-card p-6">
              <h2 className="font-heading text-base font-semibold">Service Boy</h2>
              <div className="mt-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">{booking.service_boy_name.charAt(0)}</div>
                <div><p className="text-sm font-semibold">{booking.service_boy_name}</p><p className="text-xs text-muted-foreground">Assigned</p></div>
              </div>
            </div>
          )}
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
