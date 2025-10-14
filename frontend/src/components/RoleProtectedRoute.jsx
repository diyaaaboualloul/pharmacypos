import { Navigate } from "react-router-dom";
import { getUser, getToken } from "../utils/auth";

/**
 * Protects a route by user role.
 * Example:
 * <RoleProtectedRoute allowedRoles={['admin']}>
 *   <AdminDashboardPage />
 * </RoleProtectedRoute>
 */
export default function RoleProtectedRoute({ children, allowedRoles }) {
  const token = getToken();
  const user = getUser();

  // Not authenticated
  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  // Authenticated but not authorized
  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  // Authorized
  return children;
}
