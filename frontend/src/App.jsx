import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import CashierDashboardPage from "./pages/CashierDashboardPage";
import FinanceDashboardPage from "./pages/FinanceDashboardPage";
import GuestRoute from "./components/GuestRoute";
import RoleProtectedRoute from "./components/RoleProtectedRoute";
import UserManagementPage from "./pages/UserManagementPage";

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route
          path="/login"
          element={
            <GuestRoute>
              <LoginPage />
            </GuestRoute>
          }
        />
        <Route
          path="/register"
          element={
            <GuestRoute>
              <RegisterPage />
            </GuestRoute>
          }
        />

        {/* Admin Dashboard */}
        <Route
          path="/dashboard"
          element={
            <RoleProtectedRoute allowedRoles={["admin"]}>
              <AdminDashboardPage />
            </RoleProtectedRoute>
          }
        />

        {/* Cashier Dashboard */}
        <Route
          path="/cashier-dashboard"
          element={
            <RoleProtectedRoute allowedRoles={["cashier"]}>
              <CashierDashboardPage />
            </RoleProtectedRoute>
          }
        />

        {/* Finance Dashboard */}
        <Route
          path="/finance-dashboard"
          element={
            <RoleProtectedRoute allowedRoles={["finance"]}>
              <FinanceDashboardPage />
            </RoleProtectedRoute>
          }
        />

        {/* Admin user management */}
        <Route
          path="/admin/users"
          element={
            <RoleProtectedRoute allowedRoles={["admin"]}>
              <UserManagementPage />
            </RoleProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
