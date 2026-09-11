import { Navigate } from "react-router-dom";

// Password resets now use the in-page email OTP flow rather than email links.
export default function ResetPassword() {
  return <Navigate to="/forgot-password" replace />;
}
