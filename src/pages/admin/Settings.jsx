import React, { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { laundryClient } from "@/api/authClient";
import { adminClient } from "@/api/adminClient";
import { toast } from "@/components/ui/use-toast";
import { LayoutDashboard, CalendarDays, Sparkles, Users, UserCog, Receipt, BarChart3, Settings, Store, Ticket, Save, Mail, Hash, Send } from "lucide-react";

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

const FIELDS = [
  { key: "business_name", label: "Business Name" },
  { key: "business_tagline", label: "Tagline" },
  { key: "contact_phone", label: "Contact Phone" },
  { key: "contact_email", label: "Contact Email" },
  { key: "service_area", label: "Service Area" },
  { key: "business_hours", label: "Business Hours" },
];

const STATUS_FLOW = [
  "Booking Requested",
  "Booking Confirmed",
  "Service Boy Assigned",
  "Clothes Picked Up",
  "Cleaning in Progress",
  "Ready for Delivery",
  "Delivered",
];

export default function AdminSettings() {
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [messages, setMessages] = useState([]);
  const [slack, setSlack] = useState(null);
  const [slackTesting, setSlackTesting] = useState(false);

  useEffect(() => {
    laundryClient.getSettings().then(setForm).catch(() => setForm({}));
    adminClient.getContactMessages().then(setMessages).catch(() => {});
    adminClient.getSlackStatus().then(setSlack).catch(() => setSlack({ configured: false }));
  }, []);

  const testSlack = async () => {
    setSlackTesting(true);
    try {
      const { message } = await adminClient.sendSlackTest();
      toast({ title: message });
    } catch (err) {
      toast({ title: "Slack test failed", description: err.message, variant: "destructive" });
    }
    setSlackTesting(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      setForm(await adminClient.updateSettings(form));
      toast({ title: "Settings saved" });
    } catch (err) {
      toast({ title: "Save failed", description: err.message, variant: "destructive" });
    }
    setSaving(false);
  };

  const toggleHandled = async (message) => {
    try {
      await adminClient.setContactMessageHandled(message.id, !message.handled);
      setMessages(await adminClient.getContactMessages());
    } catch (err) {
      toast({ title: "Update failed", description: err.message, variant: "destructive" });
    }
  };

  const openEnquiries = messages.filter((m) => !m.handled);

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
          {!form ? (
            <div className="mt-4 space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-10 animate-pulse rounded-xl bg-secondary/50" />)}</div>
          ) : (
            <>
              <div className="mt-4 space-y-3">
                {FIELDS.map(({ key, label }) => (
                  <div key={key}>
                    <label className="text-sm font-medium">{label}</label>
                    <input
                      value={form[key] || ""}
                      onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                      className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                ))}
              </div>
              <button
                onClick={handleSave}
                disabled={saving}
                className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:shadow-lg hover:shadow-primary/30 disabled:opacity-50"
              >
                {saving ? "Saving..." : <><Save className="h-4 w-4" /> Save Settings</>}
              </button>
            </>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="font-heading text-lg font-semibold">Email Notifications</h2>
          <p className="mt-2 text-sm text-muted-foreground">Automatic emails are sent on these events:</p>
          <div className="mt-4 space-y-2">
            {[
              "New booking — customer confirmation + admin notification",
              "Every status change — customer email",
              "New service boy account — one-time password",
              "Password reset — six-digit code",
              "Contact form — enquiry to the business inbox",
            ].map((item) => (
              <div key={item} className="flex items-start gap-2 text-sm">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 text-xs">✓</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Delivery depends on the SMTP settings in <code>.env</code>. When email is not configured
            the app still works and temporary passwords are shown in the admin UI instead.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Hash className="h-5 w-5 text-primary" />
              <h2 className="font-heading text-lg font-semibold">Slack Notifications</h2>
              {slack && (
                <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${slack.configured ? "bg-green-50 text-green-700" : "bg-muted text-muted-foreground"}`}>
                  {slack.configured ? "Connected" : "Not configured"}
                </span>
              )}
            </div>
            <button
              onClick={testSlack}
              disabled={slackTesting || !slack?.configured}
              className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2 text-sm font-semibold hover:bg-secondary disabled:opacity-50"
            >
              <Send className="h-4 w-4" /> {slackTesting ? "Sending..." : "Send test message"}
            </button>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            {slack?.configured
              ? "Every new booking is posted to your Slack channel with the customer, services, total, pickup date and booking ID."
              : "Add a Slack Incoming Webhook URL as SLACK_WEBHOOK_URL in your .env file and restart the API to post new bookings to your channel."}
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 lg:col-span-2">
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            <h2 className="font-heading text-lg font-semibold">Contact Enquiries</h2>
            {openEnquiries.length > 0 && (
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">{openEnquiries.length} open</span>
            )}
          </div>
          {messages.length === 0 ? (
            <p className="mt-6 text-center text-sm text-muted-foreground">No enquiries yet.</p>
          ) : (
            <div className="mt-4 divide-y divide-border">
              {messages.slice(0, 20).map((m) => (
                <div key={m.id} className="flex items-start justify-between gap-4 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">{m.name} <span className="font-normal text-muted-foreground">· {m.email}</span></p>
                    <p className="mt-0.5 text-sm text-muted-foreground">{m.message}</p>
                  </div>
                  <button
                    onClick={() => toggleHandled(m)}
                    className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${m.handled ? "bg-muted text-muted-foreground" : "bg-primary text-primary-foreground"}`}
                  >
                    {m.handled ? "Handled" : "Mark handled"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 lg:col-span-2">
          <h2 className="font-heading text-lg font-semibold">Booking Status Flow</h2>
          <p className="mt-2 text-sm text-muted-foreground">The standard lifecycle of a booking:</p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {STATUS_FLOW.map((s, i, arr) => (
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
