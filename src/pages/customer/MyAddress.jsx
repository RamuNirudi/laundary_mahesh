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
      <p className="eyebrow">Account</p>
      <h1 className="mt-3 font-heading text-3xl font-bold tracking-tight sm:text-4xl">My Address</h1>
      <p className="mt-1 text-sm text-muted-foreground">Save your default pickup address for faster booking.</p>

      <form onSubmit={handleSave} className="mt-8 max-w-lg surface edge-light rounded-2xl p-6">
        <label className="flex items-center gap-1.5 text-sm font-medium"><MapPin className="h-4 w-4 text-primary" /> Default Pickup Address</label>
        <textarea
          rows={4}
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="House no, street, area, city, pincode"
          className="field-area mt-2"
        />
        <button type="submit" disabled={saving} className="mt-4 shine inline-flex h-11 items-center gap-2 rounded-full bg-gradient-brand px-6 text-sm font-semibold text-primary-foreground shadow-glow-sm transition-all duration-300 ease-swift hover:shadow-glow active:scale-[0.97] disabled:opacity-50 disabled:shadow-none">
          <Save className="h-4 w-4" /> {saving ? "Saving..." : "Save Address"}
        </button>
      </form>
    </DashboardLayout>
  );
}
