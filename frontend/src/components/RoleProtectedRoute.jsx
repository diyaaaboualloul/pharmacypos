import { Navigate } from "react-router-dom";
import { getUser, getToken } from "../utils/auth";

export default function RoleProtectedRoute({ children, allowedRoles }) {
  const token = getToken();
  const user = getUser();

  // Not logged in → go to login
  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  // Logged in but not allowed → go to Unauthorized
  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}
