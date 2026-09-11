import React, { useState } from "react";
import { Link } from "react-router-dom";
import { authClient } from "@/api/authClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, ArrowLeft, Loader2, Lock } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [step, setStep] = useState("email");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const sendCode = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      await authClient.requestPasswordReset(email.trim().toLowerCase());
      setStep("verify");
    } catch (err) {
      setError(err.message || "Unable to send the reset code.");
    } finally { setLoading(false); }
  };

  const resetPassword = async (event) => {
    event.preventDefault();
    setError("");
    if (newPassword !== confirmPassword) return setError("Passwords do not match.");
    if (newPassword.length < 8) return setError("Use a password with at least 8 characters.");
    setLoading(true);
    try {
      await authClient.resetPassword(email.trim().toLowerCase(), otp, newPassword);
      setStep("complete");
    } catch (err) {
      setError(err.message || "Unable to reset your password.");
    } finally { setLoading(false); }
  };

  return (
    <AuthLayout
      icon={step === "email" ? Mail : Lock}
      title={step === "email" ? "Reset password" : step === "complete" ? "Password updated" : "Enter reset code"}
      subtitle={step === "email" ? "We'll email you a six-digit verification code" : step === "complete" ? "You can now log in with your new password" : `We sent a six-digit code to ${email}`}
      footer={<Link to="/login" className="text-primary font-medium hover:underline"><ArrowLeft className="mr-1 inline h-3 w-3" />Back to log in</Link>}
    >
      {error && <div className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
      {step === "email" && (
        <form onSubmit={sendCode} className="space-y-4">
          <div className="space-y-2"><Label htmlFor="email">Email address</Label><div className="relative"><Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input id="email" type="email" autoComplete="email" autoFocus placeholder="you@example.com" value={email} onChange={(event) => setEmail(event.target.value)} className="h-12 pl-10" required /></div></div>
          <Button type="submit" className="h-12 w-full" disabled={loading}>{loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sending code...</> : "Send verification code"}</Button>
        </form>
      )}
      {step === "verify" && (
        <form onSubmit={resetPassword} className="space-y-4">
          <div className="space-y-2"><Label htmlFor="otp">Six-digit code</Label><Input id="otp" inputMode="numeric" autoComplete="one-time-code" autoFocus placeholder="123456" value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))} className="h-12 text-center text-lg tracking-[0.4em]" required /></div>
          <div className="space-y-2"><Label htmlFor="new-password">New password</Label><Input id="new-password" type="password" autoComplete="new-password" minLength={8} value={newPassword} onChange={(event) => setNewPassword(event.target.value)} className="h-12" required /></div>
          <div className="space-y-2"><Label htmlFor="confirm-password">Confirm new password</Label><Input id="confirm-password" type="password" autoComplete="new-password" minLength={8} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="h-12" required /></div>
          <Button type="submit" className="h-12 w-full" disabled={loading || otp.length !== 6}>{loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Verifying...</> : "Verify code and reset password"}</Button>
          <button type="button" onClick={() => { setStep("email"); setOtp(""); setError(""); }} className="w-full text-sm text-primary hover:underline">Send a new code</button>
        </form>
      )}
      {step === "complete" && <Link to="/login" className="block"><Button className="h-12 w-full">Go to login</Button></Link>}
    </AuthLayout>
  );
}
