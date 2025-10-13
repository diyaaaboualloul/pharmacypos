import { Navigate } from "react-router-dom";
import { getToken } from "../utils/auth";

/**
 * GuestRoute: only accessible if NOT logged in
 * Example:
 * <GuestRoute><LoginPage /></GuestRoute>
 */
export default function GuestRoute({ children }) {
  const token = getToken();
  if (token) {
    // Already logged in → redirect to dashboard
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}
