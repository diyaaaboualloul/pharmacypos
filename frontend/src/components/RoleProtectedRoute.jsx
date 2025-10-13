import { Navigate } from "react-router-dom";
import { getUser, getToken } from "../utils/auth";

/**
 * Protects a route by role. Usage:
 * <RoleProtectedRoute allowedRoles={['admin', 'cashier']}> ... </RoleProtectedRoute>
 */
export default function RoleProtectedRoute({ children, allowedRoles }) {
  const token = getToken();
  const user = getUser();

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    // If user is logged in but doesn't have the right role
    return <Navigate to="/" replace />;
  }

  return children;
}
