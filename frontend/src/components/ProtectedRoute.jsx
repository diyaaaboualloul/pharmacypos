import { Navigate } from "react-router-dom";
import { getToken } from "../utils/auth";

// This component wraps any protected page
export default function ProtectedRoute({ children }) {
  const token = getToken();

  if (!token) {
    // Not logged in → redirect to login page
    return <Navigate to="/login" replace />;
  }

  // Logged in → show the protected page
  return children;
}
