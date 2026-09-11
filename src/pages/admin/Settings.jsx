import React from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { LayoutDashboard, CalendarDays, Sparkles, Users, UserCog, Receipt, BarChart3, Settings, Store, Ticket } from "lucide-react";

const NAV = [
  { label: "Dashboard", path: "/admin", icon: LayoutDashboard },
  { label: "Bookings", path: "/admin/bookings", icon: CalendarDays },
  { label: "Services", path: "/admin/services", icon: Sparkles },
  { label: "Coupons", path: "/admin/coupons", icon: Ticket },
  { label: "Customers", path: "/admin/customers", icon: Users },
  { label: "Service Boys", path: "/admin/serviceboys", icon: UserCog },
  { label: "Expenses", path: "/admin/expenses", icon: Receipt },
  { label: "Business Report", path: "/admin/report", icon: BarChart3 },
  { label: "Settings", path: "/admin/settings", icon: Settings },
];

export default function AdminSettings() {
  return (
    <DashboardLayout role="admin" navItems={NAV} title="Admin Panel">
      <h1 className="font-heading text-2xl font-bold tracking-tight">Settings</h1>
      <p className="mt-1 text-sm text-muted-foreground">Business and account configuration.</p>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center gap-2">
            <Store className="h-5 w-5 text-primary" />
            <h2 className="font-heading text-lg font-semibold">Business Info</h2>
          </div>
          <div className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between border-b border-border pb-2"><span className="text-muted-foreground">Business Name</span><span className="font-medium">STAR LAUNDROVAMAT</span></div>
            <div className="flex justify-between border-b border-border pb-2"><span className="text-muted-foreground">Booking ID Format</span><span className="font-medium">SLV-YYYY-NNN</span></div>
            <div className="flex justify-between border-b border-border pb-2"><span className="text-muted-foreground">Currency</span><span className="font-medium">INR (₹)</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Payment Mode</span><span className="font-medium">Manual (No gateway)</span></div>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="font-heading text-lg font-semibold">Email Notifications</h2>
          <p className="mt-2 text-sm text-muted-foreground">Automatic emails are sent on these events:</p>
          <div className="mt-4 space-y-2">
            {[
              "New booking — customer confirmation + admin notification",
              "Booking confirmed — customer email",
              "Service boy assigned — customer email",
              "Clothes picked up — customer email",
              "Ready for delivery — customer email",
              "Delivered — customer email",
            ].map((item) => (
              <div key={item} className="flex items-start gap-2 text-sm">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 text-xs">✓</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 lg:col-span-2">
          <h2 className="font-heading text-lg font-semibold">Booking Status Flow</h2>
          <p className="mt-2 text-sm text-muted-foreground">The standard lifecycle of a booking:</p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {["Booking Requested", "Booking Confirmed", "Service Boy Assigned", "Clothes Picked Up", "Cleaning in Progress", "Ready for Delivery", "Delivered"].map((s, i, arr) => (
              <React.Fragment key={s}>
                <span className="rounded-full bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground">{s}</span>
                {i < arr.length - 1 && <span className="text-muted-foreground">→</span>}
              </React.Fragment>
            ))}
          </div>
          <p className="mt-3 text-sm text-muted-foreground">A booking can also be <span className="font-medium text-destructive">Cancelled</span> at any stage.</p>
        </div>
      </div>
    </DashboardLayout>
  );
}