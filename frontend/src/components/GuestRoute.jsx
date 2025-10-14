import { Navigate } from "react-router-dom";
import { getUser, getToken } from "../utils/auth";

export default function GuestRoute({ children }) {
  const token = getToken();
  const user = getUser();

  if (token && user) {
    // Redirect based on role
    if (user.role === "admin") return <Navigate to="/dashboard" replace />;
    if (user.role === "cashier") return <Navigate to="/cashier-dashboard" replace />;
    if (user.role === "finance") return <Navigate to="/finance-dashboard" replace />;
  }

  return children;
}
