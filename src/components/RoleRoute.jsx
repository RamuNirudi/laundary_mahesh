import React, { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { authClient } from "@/api/authClient";

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

  if (!allowedRoles.includes(user.role)) {
    // Signing in again cannot change a customer's role. Sending them back to
    // login caused an infinite login -> admin -> login loop.
    const home = user.role === "admin" ? "/admin" : user.role === "service_boy" ? "/serviceboy" : "/dashboard";
    return <Navigate to={home} replace />;
  }

  return children;
}
