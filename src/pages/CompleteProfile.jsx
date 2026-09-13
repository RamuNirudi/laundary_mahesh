import React, { useEffect, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { UserCheck, User, Phone, Loader2 } from "lucide-react";
import { authClient } from "@/api/authClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import AuthLayout from "@/components/AuthLayout";
import { isProfileComplete } from "@/lib/profile";
import { safeReturnTo, roleHome } from "@/lib/authReturnTo";

/**
 * One-time gate for accounts created by sign-up, which only collects an email
 * and a password. RoleRoute sends anyone missing a name or a phone number here
 * and refuses every other guarded page until both are saved.
 */
export default function CompleteProfile() {
  const navigate = useNavigate();
  const location = useLocation();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    authClient
      .me()
      .then((u) => {
        setUser(u);
        setFullName(u.full_name || "");
        setPhone(u.phone || "");
      })
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-secondary/30">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    const returnTo = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?returnTo=${returnTo}`} replace />;
  }

  // Nothing left to complete: don't strand a finished profile on this page.
  if (isProfileComplete(user)) {
    return <Navigate to={safeReturnTo() || roleHome(user.role)} replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    const name = fullName.trim();
    const number = phone.trim();
    if (!name) return setError("Please enter your full name.");
    if (!number) return setError("Please enter your phone number.");
    // Indian mobile numbers, optionally with a country code or separators.
    if (!/^\+?[\d\s-]{7,20}$/.test(number)) return setError("Enter a valid phone number.");

    setSaving(true);
    try {
      const updated = await authClient.updateMe({ full_name: name, phone: number });
      navigate(safeReturnTo() || roleHome(updated.role), { replace: true });
    } catch (err) {
      setError(err.message || "Could not save your profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AuthLayout
      icon={UserCheck}
      title="Complete your profile"
      subtitle="We need a few details before you can continue"
      footer={<>Signed in as {user.email}</>}
    >
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="full-name" className="flex items-center gap-1.5">
            <User className="h-4 w-4 text-primary" /> Full name
          </Label>
          <Input
            id="full-name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            maxLength={120}
            autoComplete="name"
            placeholder="e.g. Priya Sharma"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone" className="flex items-center gap-1.5">
            <Phone className="h-4 w-4 text-primary" /> Phone number
          </Label>
          <Input
            id="phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            maxLength={32}
            inputMode="tel"
            autoComplete="tel"
            placeholder="e.g. 98765 43210"
            required
          />
          <p className="text-xs text-muted-foreground">
            Our pickup executive uses this to reach you on the day of collection.
          </p>
        </div>

        <Button type="submit" disabled={saving} className="w-full h-12">
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {saving ? "Saving..." : "Save and continue"}
        </Button>
      </form>
    </AuthLayout>
  );
}
