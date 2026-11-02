import React, { useEffect, useState } from "react";
import { User, Phone, Save } from "lucide-react";
import { authClient } from "@/api/authClient";
import { toast } from "@/components/ui/use-toast";
import DashboardLayout from "@/components/DashboardLayout";
import { LayoutDashboard, CalendarDays, UserIcon, MapPinIcon } from "lucide-react";

const NAV = [
  { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { label: "My Bookings", path: "/dashboard/bookings", icon: CalendarDays },
  { label: "Profile", path: "/dashboard/profile", icon: UserIcon },
  { label: "My Address", path: "/dashboard/address", icon: MapPinIcon },
];

export default function Profile() {
  const [user, setUser] = useState(null);
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    authClient.me().then((u) => {
      setUser(u);
      setPhone(u.phone || "");
      setName(u.full_name || "");
    });
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    // Both are mandatory account-wide: a booking cannot be collected without
    // someone to ask for and a number to call.
    if (!name.trim() || !phone.trim()) {
      toast({
        title: "Missing details",
        description: "Your full name and phone number are both required.",
        variant: "destructive",
      });
      return;
    }
    setSaving(true);
    try {
      const updatedUser = await authClient.updateMe({ full_name: name.trim(), phone: phone.trim() });
      setUser(updatedUser);
      setName(updatedUser.full_name || "");
      setPhone(updatedUser.phone || "");
      toast({ title: "Profile updated", description: "Your account details have been saved." });
    } catch (err) {
      toast({ title: "Update failed", description: err.message, variant: "destructive" });
    }
    setSaving(false);
  };

  return (
    <DashboardLayout role="customer" navItems={NAV} title="Customer Panel" showPublicNavbar>
      <p className="eyebrow">Account</p>
      <h1 className="mt-3 font-heading text-3xl font-bold tracking-tight sm:text-4xl">My Profile</h1>
      <p className="mt-1 text-sm text-muted-foreground">Manage your account information.</p>

      <div className="mt-8 max-w-lg surface edge-light rounded-2xl p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-2xl font-bold text-primary-foreground">
            {(user?.full_name || "U").charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-heading text-lg font-bold tracking-tight">{user?.full_name}</p>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="mt-6 space-y-4">
          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium"><User className="h-4 w-4 text-primary" /> Full Name <span className="text-destructive">*</span></label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={120}
              required
              placeholder="Enter your full name"
              className="field mt-2"
            />
          </div>
          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium"><Phone className="h-4 w-4 text-primary" /> Phone Number <span className="text-destructive">*</span></label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              maxLength={32}
              inputMode="tel"
              required
              placeholder="Enter your phone number"
              className="field mt-2"
            />
          </div>
          <button type="submit" disabled={saving} className="shine inline-flex h-11 items-center gap-2 rounded-full bg-gradient-brand px-6 text-sm font-semibold text-primary-foreground shadow-glow-sm transition-all duration-300 ease-swift hover:shadow-glow active:scale-[0.97] disabled:opacity-50 disabled:shadow-none">
            <Save className="h-4 w-4" /> {saving ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </div>
    </DashboardLayout>
  );
}
