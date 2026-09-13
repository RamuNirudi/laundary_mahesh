import React, { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { authClient } from "@/api/authClient";
import { COMPLETE_PROFILE_PATH, isProfileComplete } from "@/lib/profile";

export default function RoleRoute({ allowedRoles, children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    authClient.me()
      .then((u) => { setUser(u); setLoading(false); })
      .catch(() => { setUser(null); setLoading(false); });
  }, []);

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-secondary/30">
        <div className="w-8 h-8 border-4 border-secondary border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    const returnTo = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?returnTo=${returnTo}`} replace />;
  }

  // Sign-up only collects an email and a password. Until the account has a name
  // and a phone number, every guarded page bounces to the completion form and
  // comes back here afterwards.
  if (!isProfileComplete(user)) {
    const returnTo = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`${COMPLETE_PROFILE_PATH}?returnTo=${returnTo}`} replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    // Signing in again cannot change a customer's role. Sending them back to
    // login caused an infinite login -> admin -> login loop.
    const home = user.role === "admin" ? "/admin" : user.role === "service_boy" ? "/serviceboy" : "/dashboard";
    return <Navigate to={home} replace />;
  }

  return children;
}
