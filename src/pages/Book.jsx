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
    <div className="relative min-h-screen bg-background">
      <PublicNavbar />

      {/* Ambient field behind the wizard. */}
      <div className="pointer-events-none absolute inset-0 bg-grid bg-grid-fade opacity-50" />
      <div className="pointer-events-none absolute left-[-10%] top-[6%] h-[28rem] w-[28rem] animate-aurora rounded-full bg-primary/12 blur-[120px]" />
      <div className="pointer-events-none absolute right-[-10%] top-[40%] h-[26rem] w-[26rem] animate-aurora rounded-full bg-accent/10 blur-[120px]" style={{ animationDelay: "-9s" }} />

      <div className="relative mx-auto max-w-3xl px-4 pb-24 pt-32 sm:px-6 lg:pt-40">
        <div className="animate-fade-up text-center">
          <p className="eyebrow">Booking</p>
          <h1 className="mt-4 font-heading text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Book a <span className="text-gradient">Laundry Service</span>
          </h1>
          <p className="mt-4 text-muted-foreground">Complete the steps below to schedule your pickup.</p>
        </div>

        {/* Stepper */}
        <div className="animate-fade-up stagger-2 mt-12 flex items-center justify-center gap-2 sm:gap-4">
          {steps.map((label, i) => (
            <React.Fragment key={label}>
              <div className="flex flex-col items-center gap-2">
                <div className="relative">
                  {step === i + 1 && <span className="absolute inset-0 animate-ping-ring rounded-full bg-primary/40" />}
                  <div className={`relative flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold transition-all duration-500 ease-swift ${
                    step > i + 1
                      ? "bg-gradient-brand text-primary-foreground shadow-glow-sm"
                      : step === i + 1
                        ? "bg-gradient-brand text-primary-foreground shadow-glow ring-4 ring-primary/20"
                        : "border border-border bg-card text-muted-foreground"
                  }`}>
                    {step > i + 1 ? <Check className="h-4 w-4" /> : i + 1}
                  </div>
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-[0.1em] transition-colors ${step >= i + 1 ? "text-primary" : "text-muted-foreground"}`}>{label}</span>
              </div>
              {i < steps.length - 1 && (
                <div className={`h-0.5 w-8 rounded-full transition-colors duration-500 sm:w-16 ${step > i + 1 ? "bg-gradient-brand" : "bg-border"}`} />
              )}
            </React.Fragment>
          ))}
        </div>

        <div className="surface edge-light animate-fade-up stagger-3 mt-10 rounded-2xl p-6 shadow-panel sm:p-9">
          {/* Step 1: Select services */}
          {step === 1 && (
            <div>
              <h2 className="font-heading text-2xl font-bold tracking-tight">Select your services</h2>
              <p className="mt-1 text-sm text-muted-foreground">Choose one or more services you'd like to book.</p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {services.map((svc) => {
                  const isSelected = selected.find((x) => x.service_id === svc.id);
                  return (
                    <button
                      key={svc.id}
                      onClick={() => toggleService(svc)}
                      className={`group flex items-center justify-between rounded-xl border p-4 text-left transition-all duration-300 ease-swift ${
                        isSelected
                          ? "border-primary/60 bg-primary/8 shadow-glow-sm"
                          : "border-border bg-secondary/30 hover:-translate-y-0.5 hover:border-primary/40 hover:bg-primary/5"
                      }`}
                    >
                      <div>
                        <p className="text-sm font-semibold text-foreground">{svc.name}</p>
                        <p className="mt-0.5 text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">{svc.category}</p>
                      </div>
                      <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-all duration-300 ${
                        isSelected ? "bg-gradient-brand text-primary-foreground shadow-glow-sm" : "border border-border group-hover:border-primary/50"
                      }`}>
                        {isSelected && <Check className="h-3.5 w-3.5" />}
                      </div>
                    </button>
                  );
                })}
              </div>
              <div className="mt-8 flex justify-between">
                <Button variant="ghost" onClick={() => navigate("/services")}>
                  <ArrowLeft className="h-4 w-4" /> Back
                </Button>
                <Button disabled={selected.length === 0} onClick={() => setStep(2)}>
                  Continue <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Details */}
          {step === 2 && (
            <div>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-heading text-2xl font-bold tracking-tight">Service details</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {selected.length} service{selected.length === 1 ? "" : "s"} selected. Set quantities and add any special instructions.
                  </p>
                </div>
                <button
                  onClick={() => setStep(1)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/5 px-4 py-2 text-sm font-semibold text-primary transition-all duration-300 ease-swift hover:border-primary/60 hover:bg-primary/10 hover:shadow-glow-sm"
                >
                  <Plus className="h-4 w-4" /> Add more services
                </button>
              </div>
              <div className="mt-6 space-y-3">
                {selected.map((s) => (
                  <div key={s.service_id} className="flex items-center justify-between gap-4 rounded-xl border border-border bg-secondary/30 p-4 transition-colors duration-300 hover:border-primary/30">
                    <div>
                      <p className="text-sm font-semibold">{s.service_name}</p>
                      {s.price > 0 && (
                        <p className="mt-0.5 text-xs text-muted-foreground tabular">₹{s.price} {s.price_unit || "per item"}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 rounded-full border border-border bg-card p-1">
                      <button
                        onClick={() => updateQty(s.service_id, s.quantity - 1)}
                        className="flex h-8 w-8 items-center justify-center rounded-full text-lg leading-none text-muted-foreground transition-all duration-300 hover:bg-primary/10 hover:text-primary"
                        aria-label={`Decrease ${s.service_name}`}
                      >
                        −
                      </button>
                      <span className="w-8 text-center font-heading text-sm font-bold tabular">{s.quantity}</span>
                      <button
                        onClick={() => updateQty(s.service_id, s.quantity + 1)}
                        className="flex h-8 w-8 items-center justify-center rounded-full text-lg leading-none text-muted-foreground transition-all duration-300 hover:bg-primary/10 hover:text-primary"
                        aria-label={`Increase ${s.service_name}`}
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              {/* Derived from the quantities above: a separate editable field only
                  ever disagreed with the basket (and was never submitted). */}
              <div className="border-gradient mt-6 flex items-center justify-between rounded-xl bg-primary/5 px-5 py-4">
                <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Total items</span>
                <span className="text-gradient font-heading text-2xl font-bold tabular">{totalItems}</span>
              </div>
              <div className="mt-4">
                <label className="field-label">Special instructions</label>
                <textarea
                  rows={3}
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="e.g. Handle delicates with care, starch on collars..."
                  className="field-area mt-2"
                />
              </div>
              <div className="mt-8 flex justify-between">
                <Button variant="ghost" onClick={() => setStep(1)}><ArrowLeft className="h-4 w-4" /> Back</Button>
                <Button onClick={() => setStep(3)}>Continue <ArrowRight className="h-4 w-4" /></Button>
              </div>
            </div>
          )}

          {/* Step 3: Pickup */}
          {step === 3 && (
            <div>
              <h2 className="font-heading text-2xl font-bold tracking-tight">Pickup details</h2>
              <p className="mt-1 text-sm text-muted-foreground">Where and when should we collect your clothes?</p>
              <div className="mt-6 space-y-4">
                <div>
                  <label className="field-label"><MapPin className="h-4 w-4 text-primary" /> Pickup address</label>
                  <textarea
                    rows={2}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="House no, street, area, city"
                    className="field-area mt-2"
                  />
                </div>
                <div>
                  <label className="field-label"><Phone className="h-4 w-4 text-primary" /> Phone number</label>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Your contact number"
                    className="field-area mt-2"
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="field-label"><Calendar className="h-4 w-4 text-primary" /> Pickup date</label>
                    <input
                      type="date"
                      min={today}
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="field mt-2"
                    />
                  </div>
                  <div>
                    <label className="field-label"><Clock className="h-4 w-4 text-primary" /> Pickup time</label>
                    <select
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className="field mt-2"
                    >
                      <option value="">Select slot</option>
                      {TIME_SLOTS.map((slot) => <option key={slot} value={slot}>{slot}</option>)}
                    </select>
                  </div>
                </div>
              </div>
              <div className="mt-8 flex justify-between">
                <Button variant="ghost" onClick={() => setStep(2)}><ArrowLeft className="h-4 w-4" /> Back</Button>
                <Button disabled={!address || !date || !time} onClick={() => setStep(4)}>Continue <ArrowRight className="h-4 w-4" /></Button>
              </div>
            </div>
          )}

          {/* Step 4: Confirm */}
          {step === 4 && (
            <div>
              <h2 className="font-heading text-2xl font-bold tracking-tight">Confirm your booking</h2>
              <p className="mt-1 text-sm text-muted-foreground">Review the details and confirm. No payment needed now.</p>
              <div className="mt-6 space-y-4">
                <div className="rounded-xl border border-border bg-secondary/30 p-5">
                  <p className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.18em] text-primary"><Shirt className="h-3.5 w-3.5" /> Services</p>
                  <div className="mt-2 space-y-1">
                    {selected.map((s) => (
                      <div key={s.service_id} className="flex justify-between text-sm">
                        <span className="font-medium">{s.service_name}</span>
                        <span className="font-bold text-primary tabular">×{s.quantity}</span>
                      </div>
                    ))}
                  </div>
                  <p className="mt-4 border-t border-border/70 pt-3 text-sm text-muted-foreground">
                    Total items: <span className="font-heading font-bold text-foreground tabular">{totalItems}</span>
                  </p>
                  {instructions && <p className="mt-2 text-sm text-muted-foreground">Instructions: {instructions}</p>}
                </div>
                <div className="rounded-xl border border-border bg-secondary/30 p-5">
                  <p className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.18em] text-primary"><MapPin className="h-3.5 w-3.5" /> Pickup</p>
                  <p className="mt-2 text-sm">{address}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{date} • {time}</p>
                  {phone && <p className="mt-1 text-sm text-muted-foreground">📞 {phone}</p>}
                </div>

                {/* Coupon */}
                <div className="rounded-xl border border-border bg-secondary/30 p-5">
                  <p className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.18em] text-primary"><Ticket className="h-3.5 w-3.5" /> Coupon Code</p>
                  {appliedCoupon ? (
                    <div className="mt-3 flex items-center justify-between rounded-xl border border-success/25 bg-success/10 px-4 py-3">
                      <div>
                        <p className="font-heading text-sm font-bold text-success">{appliedCoupon.code}</p>
                        <p className="mt-0.5 text-xs text-success/80">
                          {appliedCoupon.discount_type === "percentage" ? `${appliedCoupon.discount_value}% off` : `₹${appliedCoupon.discount_value} off`}
                          {appliedCoupon.min_order_amount > 0 && ` · Min order ₹${appliedCoupon.min_order_amount}`}
                        </p>
                      </div>
                      <button onClick={removeCoupon} className="text-xs font-medium text-destructive hover:underline">Remove</button>
                    </div>
                  ) : (
                    <div className="mt-3 flex gap-2">
                      <input
                        value={couponCode}
                        onChange={(e) => { setCouponCode(e.target.value.toUpperCase()); setCouponError(""); }}
                        placeholder="Enter coupon code"
                        className="field flex-1 font-bold uppercase tracking-wider"
                      />
                      <button
                        onClick={applyCoupon}
                        disabled={couponChecking || !couponCode.trim()}
                        className="shine rounded-full bg-gradient-brand px-6 text-sm font-semibold text-primary-foreground shadow-glow-sm transition-all duration-300 hover:shadow-glow disabled:opacity-50 disabled:shadow-none"
                      >
                        {couponChecking ? "..." : "Apply"}
                      </button>
                    </div>
                  )}
                  {couponError && <p className="mt-1.5 text-xs text-destructive">{couponError}</p>}
                </div>

                <div className="border-gradient rounded-xl bg-primary/5 p-5">
                  <div className="flex justify-between text-sm tabular">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">₹{subtotal.toLocaleString()}</span>
                  </div>
                  {couponDiscount > 0 && (
                    <div className="mt-2 flex justify-between text-sm text-success tabular">
                      <span>Coupon {appliedCoupon?.code}</span>
                      <span className="font-medium">-₹{couponDiscount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="mt-4 flex items-end justify-between border-t border-border/70 pt-4">
                    <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Estimated total</span>
                    <span className="text-gradient font-heading text-3xl font-bold tabular">₹{payable.toLocaleString()}</span>
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground">
                    Final charges are confirmed after we weigh and inspect your items.
                  </p>
                </div>
              </div>
              <div className="mt-8 flex justify-between">
                <Button variant="ghost" onClick={() => setStep(3)}><ArrowLeft className="h-4 w-4" /> Back</Button>
                <Button size="lg" disabled={submitting} onClick={handleSubmit}>
                  {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Confirming...</> : <><Sparkles className="h-4 w-4" /> Confirm Booking</>}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
