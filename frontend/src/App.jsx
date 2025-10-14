import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import CashierDashboardPage from "./pages/CashierDashboardPage";
import FinanceDashboardPage from "./pages/FinanceDashboardPage";
import GuestRoute from "./components/GuestRoute";
import RoleProtectedRoute from "./components/RoleProtectedRoute";
import UserManagementPage from "./pages/UserManagementPage";
import UnauthorizedPage from "./pages/UnauthorizedPage";
import NotFoundPage from "./pages/NotFoundPage";

function App() {
  return (
    <Router>
      <Routes>
        {/* Public */}
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
        <Route path="/unauthorized" element={<UnauthorizedPage />} />

        {/* Admin */}
        <Route
          path="/dashboard"
          element={
            <RoleProtectedRoute allowedRoles={["admin"]}>
              <AdminDashboardPage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <RoleProtectedRoute allowedRoles={["admin"]}>
              <UserManagementPage />
            </RoleProtectedRoute>
          }
        />

        {/* Cashier */}
        <Route
          path="/cashier-dashboard"
          element={
            <RoleProtectedRoute allowedRoles={["cashier"]}>
              <CashierDashboardPage />
            </RoleProtectedRoute>
          }
        />

        {/* Finance */}
        <Route
          path="/finance-dashboard"
          element={
            <RoleProtectedRoute allowedRoles={["finance"]}>
              <FinanceDashboardPage />
            </RoleProtectedRoute>
          }
        />

        {/* 404 Page - Catch All */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Router>
  );
}

export default App;
