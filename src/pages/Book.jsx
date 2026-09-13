import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowRight, ArrowLeft, Check, MapPin, Calendar, Clock, Shirt, Sparkles, Loader2, Phone, Ticket, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { authClient, laundryClient } from "@/api/authClient";
import { toast } from "@/components/ui/use-toast";
import PublicNavbar from "@/components/PublicNavbar";

const TIME_SLOTS = [
  "8:00 AM – 10:00 AM",
  "10:00 AM – 12:00 PM",
  "12:00 PM – 2:00 PM",
  "2:00 PM – 4:00 PM",
  "4:00 PM – 6:00 PM",
  "6:00 PM – 8:00 PM",
];

const toLineItem = (svc) => ({
  service_id: svc.id,
  service_name: svc.name,
  quantity: 1,
  price: Number(svc.price) || 0,
  price_unit: svc.price_unit || "per item",
});

export default function Book() {
  const navigate = useNavigate();
  const location = useLocation();
  const preselectedId = location.state?.serviceId;

  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [services, setServices] = useState([]);
  const [step, setStep] = useState(1);
  const [selected, setSelected] = useState([]);
  const [instructions, setInstructions] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponChecking, setCouponChecking] = useState(false);
  const [couponError, setCouponError] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0);

  useEffect(() => {
    authClient.isAuthenticated() ? authClient.me().then((u) => {
      setUser(u);
      setPhone(u.phone || "");
      setAddress(u.address || "");
      setAuthChecked(true);
    }).catch(() => navigate("/login?returnTo=/book")) : (() => {
      navigate("/login?returnTo=/book");
    })();
    laundryClient.getServices().then(setServices).catch(() => {});
  }, []);

  // A coupon applied against one basket may no longer qualify after an edit, so
  // drop it and make the customer re-apply rather than show a stale saving.
  useEffect(() => {
    setAppliedCoupon((current) => {
      if (!current) return current;
      setCouponDiscount(0);
      setCouponError("Your basket changed. Please apply the coupon again.");
      return null;
    });
  }, [selected]);

  // Preselect the service the customer clicked on /services, but leave them on
  // step 1 so they can add more. Runs once, and appends rather than replaces.
  const [preselectApplied, setPreselectApplied] = useState(false);
  useEffect(() => {
    if (preselectApplied || !preselectedId || services.length === 0) return;
    const svc = services.find((s) => s.id === preselectedId);
    setPreselectApplied(true);
    if (!svc) return;
    setSelected((current) =>
      current.some((x) => x.service_id === svc.id) ? current : [...current, toLineItem(svc)],
    );
  }, [preselectedId, services, preselectApplied]);

  if (!authChecked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-secondary/30">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const toggleService = (svc) => {
    setSelected((current) =>
      current.some((x) => x.service_id === svc.id)
        ? current.filter((x) => x.service_id !== svc.id)
        : [...current, toLineItem(svc)],
    );
  };

  const updateQty = (id, qty) => {
    setSelected(selected.map((x) => x.service_id === id ? { ...x, quantity: Math.max(1, qty) } : x));
  };

  const totalItems = selected.reduce((sum, s) => sum + s.quantity, 0);
  const subtotal = Math.round(selected.reduce((sum, s) => sum + s.price * s.quantity, 0) * 100) / 100;
  const payable = Math.max(0, Math.round((subtotal - couponDiscount) * 100) / 100);

  const today = new Date().toISOString().split("T")[0];

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponChecking(true);
    setCouponError("");
    try {
      // The server prices the coupon; this only previews what it returned.
      const { coupon, discount } = await laundryClient.validateCoupon(couponCode.trim(), subtotal);
      setAppliedCoupon(coupon);
      setCouponDiscount(discount);
    } catch (err) {
      setAppliedCoupon(null);
      setCouponDiscount(0);
      setCouponError(err.message);
    }
    setCouponChecking(false);
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponDiscount(0);
    setCouponCode("");
    setCouponError("");
  };

  const handleSubmit = async () => {
    if (!address.trim()) { toast({ title: "Please enter pickup address", variant: "destructive" }); return; }
    if (!date || !time) { toast({ title: "Please select pickup date and time", variant: "destructive" }); return; }
    setSubmitting(true);
    try {
      const booking = await laundryClient.createBooking({
        services: selected,
        number_of_items: totalItems,
        special_instructions: instructions,
        pickup_address: address,
        pickup_date: date,
        pickup_time: time,
        phone,
        coupon_code: appliedCoupon?.code,
      });
      toast({ title: "Booking confirmed!", description: `Your booking ID is ${booking.booking_id}` });
      navigate("/");
    } catch (err) {
      toast({ title: "Booking failed", description: err.message, variant: "destructive" });
    }
    setSubmitting(false);
  };

  const steps = ["Select Service", "Details", "Pickup", "Confirm"];

  return (
    <div className="min-h-screen bg-secondary/30">
      <PublicNavbar />

      <div className="mx-auto max-w-3xl px-4 pt-28 pb-20 sm:px-6 lg:pt-36">
        <div className="text-center">
          <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Book a Laundry Service</h1>
          <p className="mt-2 text-muted-foreground">Complete the steps below to schedule your pickup.</p>
        </div>

        {/* Stepper */}
        <div className="mt-10 flex items-center justify-center gap-2 sm:gap-4">
          {steps.map((label, i) => (
            <React.Fragment key={label}>
              <div className="flex flex-col items-center gap-1.5">
                <div className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold transition-all ${
                  step > i + 1 ? "bg-primary text-primary-foreground" : step === i + 1 ? "bg-primary text-primary-foreground ring-4 ring-primary/20" : "bg-card border border-border text-muted-foreground"
                }`}>
                  {step > i + 1 ? <Check className="h-4 w-4" /> : i + 1}
                </div>
                <span className={`text-[11px] font-medium ${step >= i + 1 ? "text-primary" : "text-muted-foreground"}`}>{label}</span>
              </div>
              {i < steps.length - 1 && <div className={`h-0.5 w-8 sm:w-16 rounded-full ${step > i + 1 ? "bg-primary" : "bg-border"}`} />}
            </React.Fragment>
          ))}
        </div>

        <div className="mt-8 rounded-2xl border border-border bg-card p-6 sm:p-8">
          {/* Step 1: Select services */}
          {step === 1 && (
            <div>
              <h2 className="font-heading text-xl font-semibold">Select your services</h2>
              <p className="mt-1 text-sm text-muted-foreground">Choose one or more services you'd like to book.</p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {services.map((svc) => {
                  const isSelected = selected.find((x) => x.service_id === svc.id);
                  return (
                    <button
                      key={svc.id}
                      onClick={() => toggleService(svc)}
                      className={`flex items-center justify-between rounded-xl border p-4 text-left transition-all ${
                        isSelected ? "border-primary bg-primary/5 ring-2 ring-primary/20" : "border-border hover:border-primary/30"
                      }`}
                    >
                      <div>
                        <p className="text-sm font-semibold text-foreground">{svc.name}</p>
                        <p className="text-xs text-muted-foreground">{svc.category}</p>
                      </div>
                      <div className={`flex h-5 w-5 items-center justify-center rounded-full ${isSelected ? "bg-primary text-primary-foreground" : "border border-border"}`}>
                        {isSelected && <Check className="h-3 w-3" />}
                      </div>
                    </button>
                  );
                })}
              </div>
              <div className="mt-8 flex justify-between">
                <Button variant="ghost" onClick={() => navigate("/services")}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
                <Button disabled={selected.length === 0} onClick={() => setStep(2)} className="rounded-full">
                  Continue <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Details */}
          {step === 2 && (
            <div>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-heading text-xl font-semibold">Service details</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {selected.length} service{selected.length === 1 ? "" : "s"} selected. Set quantities and add any special instructions.
                  </p>
                </div>
                <button
                  onClick={() => setStep(1)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/5"
                >
                  <Plus className="h-4 w-4" /> Add more services
                </button>
              </div>
              <div className="mt-6 space-y-3">
                {selected.map((s) => (
                  <div key={s.service_id} className="flex items-center justify-between rounded-xl border border-border p-4">
                    <div>
                      <p className="text-sm font-semibold">{s.service_name}</p>
                      {s.price > 0 && <p className="text-xs text-muted-foreground">₹{s.price} {s.price_unit || "per item"}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => updateQty(s.service_id, s.quantity - 1)} className="flex h-8 w-8 items-center justify-center rounded-lg border border-border hover:bg-secondary">−</button>
                      <span className="w-8 text-center text-sm font-semibold">{s.quantity}</span>
                      <button onClick={() => updateQty(s.service_id, s.quantity + 1)} className="flex h-8 w-8 items-center justify-center rounded-lg border border-border hover:bg-secondary">+</button>
                    </div>
                  </div>
                ))}
              </div>
              {/* Derived from the quantities above: a separate editable field only
                  ever disagreed with the basket (and was never submitted). */}
              <div className="mt-5 flex items-center justify-between rounded-xl border border-border bg-secondary/30 px-4 py-3">
                <span className="text-sm font-medium">Total items</span>
                <span className="font-heading text-lg font-bold text-primary">{totalItems}</span>
              </div>
              <div className="mt-4">
                <label className="text-sm font-medium">Special instructions</label>
                <textarea
                  rows={3}
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="e.g. Handle delicates with care, starch on collars..."
                  className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="mt-8 flex justify-between">
                <Button variant="ghost" onClick={() => setStep(1)}><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button>
                <Button onClick={() => setStep(3)} className="rounded-full">Continue <ArrowRight className="ml-2 h-4 w-4" /></Button>
              </div>
            </div>
          )}

          {/* Step 3: Pickup */}
          {step === 3 && (
            <div>
              <h2 className="font-heading text-xl font-semibold">Pickup details</h2>
              <p className="mt-1 text-sm text-muted-foreground">Where and when should we collect your clothes?</p>
              <div className="mt-6 space-y-4">
                <div>
                  <label className="flex items-center gap-1.5 text-sm font-medium"><MapPin className="h-4 w-4 text-primary" /> Pickup address</label>
                  <textarea
                    rows={2}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="House no, street, area, city"
                    className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-1.5 text-sm font-medium"><Phone className="h-4 w-4 text-primary" /> Phone number</label>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Your contact number"
                    className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="flex items-center gap-1.5 text-sm font-medium"><Calendar className="h-4 w-4 text-primary" /> Pickup date</label>
                    <input
                      type="date"
                      min={today}
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div>
                    <label className="flex items-center gap-1.5 text-sm font-medium"><Clock className="h-4 w-4 text-primary" /> Pickup time</label>
                    <select
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="">Select slot</option>
                      {TIME_SLOTS.map((slot) => <option key={slot} value={slot}>{slot}</option>)}
                    </select>
                  </div>
                </div>
              </div>
              <div className="mt-8 flex justify-between">
                <Button variant="ghost" onClick={() => setStep(2)}><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button>
                <Button disabled={!address || !date || !time} onClick={() => setStep(4)} className="rounded-full">Continue <ArrowRight className="ml-2 h-4 w-4" /></Button>
              </div>
            </div>
          )}

          {/* Step 4: Confirm */}
          {step === 4 && (
            <div>
              <h2 className="font-heading text-xl font-semibold">Confirm your booking</h2>
              <p className="mt-1 text-sm text-muted-foreground">Review the details and confirm. No payment needed now.</p>
              <div className="mt-6 space-y-4">
                <div className="rounded-xl border border-border p-4">
                  <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground"><Shirt className="h-3.5 w-3.5" /> Services</p>
                  <div className="mt-2 space-y-1">
                    {selected.map((s) => (
                      <div key={s.service_id} className="flex justify-between text-sm">
                        <span>{s.service_name}</span>
                        <span className="text-muted-foreground">×{s.quantity}</span>
                      </div>
                    ))}
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">Total items: <span className="font-semibold text-foreground">{totalItems}</span></p>
                  {instructions && <p className="mt-2 text-sm text-muted-foreground">Instructions: {instructions}</p>}
                </div>
                <div className="rounded-xl border border-border p-4">
                  <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground"><MapPin className="h-3.5 w-3.5" /> Pickup</p>
                  <p className="mt-2 text-sm">{address}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{date} • {time}</p>
                  {phone && <p className="mt-1 text-sm text-muted-foreground">📞 {phone}</p>}
                </div>

                {/* Coupon */}
                <div className="rounded-xl border border-border p-4">
                  <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground"><Ticket className="h-3.5 w-3.5" /> Coupon Code</p>
                  {appliedCoupon ? (
                    <div className="mt-2 flex items-center justify-between rounded-lg bg-green-50 px-3 py-2.5">
                      <div>
                        <p className="text-sm font-semibold text-green-800">{appliedCoupon.code}</p>
                        <p className="text-xs text-green-600">
                          {appliedCoupon.discount_type === "percentage" ? `${appliedCoupon.discount_value}% off` : `₹${appliedCoupon.discount_value} off`}
                          {appliedCoupon.min_order_amount > 0 && ` · Min order ₹${appliedCoupon.min_order_amount}`}
                        </p>
                      </div>
                      <button onClick={removeCoupon} className="text-xs font-medium text-destructive hover:underline">Remove</button>
                    </div>
                  ) : (
                    <div className="mt-2 flex gap-2">
                      <input
                        value={couponCode}
                        onChange={(e) => { setCouponCode(e.target.value.toUpperCase()); setCouponError(""); }}
                        placeholder="Enter coupon code"
                        className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium uppercase outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                      />
                      <button
                        onClick={applyCoupon}
                        disabled={couponChecking || !couponCode.trim()}
                        className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                      >
                        {couponChecking ? "..." : "Apply"}
                      </button>
                    </div>
                  )}
                  {couponError && <p className="mt-1.5 text-xs text-destructive">{couponError}</p>}
                </div>

                <div className="rounded-xl border border-border p-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>₹{subtotal.toLocaleString()}</span>
                  </div>
                  {couponDiscount > 0 && (
                    <div className="mt-1.5 flex justify-between text-sm text-green-700">
                      <span>Coupon {appliedCoupon?.code}</span>
                      <span>-₹{couponDiscount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="mt-2.5 flex justify-between border-t border-border pt-2.5 text-base font-semibold">
                    <span>Estimated total</span>
                    <span>₹{payable.toLocaleString()}</span>
                  </div>
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    Final charges are confirmed after we weigh and inspect your items.
                  </p>
                </div>
              </div>
              <div className="mt-8 flex justify-between">
                <Button variant="ghost" onClick={() => setStep(3)}><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button>
                <Button disabled={submitting} onClick={handleSubmit} className="rounded-full px-6">
                  {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Confirming...</> : <><Sparkles className="mr-2 h-4 w-4" /> Confirm Booking</>}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
