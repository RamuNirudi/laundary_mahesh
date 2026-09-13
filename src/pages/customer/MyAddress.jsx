import React, { useEffect, useState } from "react";
import { MapPin, Save } from "lucide-react";
import { authClient } from "@/api/authClient";
import { toast } from "@/components/ui/use-toast";
import DashboardLayout from "@/components/DashboardLayout";
import { LayoutDashboard, CalendarDays, User, MapPinIcon } from "lucide-react";

const NAV = [
  { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { label: "My Bookings", path: "/dashboard/bookings", icon: CalendarDays },
  { label: "Profile", path: "/dashboard/profile", icon: User },
  { label: "My Address", path: "/dashboard/address", icon: MapPinIcon },
];

export default function MyAddress() {
  const [address, setAddress] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    authClient.me().then((u) => setAddress(u.address || ""));
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await authClient.updateMe({ address });
      toast({ title: "Address saved", description: "Your default pickup address has been saved." });
    } catch (err) {
      toast({ title: "Save failed", description: err.message, variant: "destructive" });
    }
    setSaving(false);
  };

  return (
    <DashboardLayout role="customer" navItems={NAV} title="Customer Panel" showPublicNavbar>
      <h1 className="font-heading text-2xl font-bold tracking-tight">My Address</h1>
      <p className="mt-1 text-sm text-muted-foreground">Save your default pickup address for faster booking.</p>

      <form onSubmit={handleSave} className="mt-8 max-w-lg rounded-2xl border border-border bg-card p-6">
        <label className="flex items-center gap-1.5 text-sm font-medium"><MapPin className="h-4 w-4 text-primary" /> Default Pickup Address</label>
        <textarea
          rows={4}
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="House no, street, area, city, pincode"
          className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
        <button type="submit" disabled={saving} className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:shadow-lg hover:shadow-primary/30 disabled:opacity-50">
          <Save className="h-4 w-4" /> {saving ? "Saving..." : "Save Address"}
        </button>
      </form>
    </DashboardLayout>
  );
}
