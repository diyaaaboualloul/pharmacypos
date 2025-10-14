import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import CashierDashboardPage from "./pages/CashierDashboardPage";
import FinanceDashboardPage from "./pages/FinanceDashboardPage";
import ProtectedRoute from "./components/ProtectedRoute";
import GuestRoute from "./components/GuestRoute";
import UserManagementPage from "./pages/UserManagementPage.jsx";  // ✅ import this

function App() {
  return (
    <Router>
      <Routes>
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

        {/* Protected routes for each role */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <AdminDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/cashier-dashboard"
          element={
            <ProtectedRoute>
              <CashierDashboardPage />
            </ProtectedRoute>
          }
        />
                <Route path="/admin/users" element={<UserManagementPage />} />  {/* ✅ must match the URL */}
        <Route
          path="/finance-dashboard"
          element={
            <ProtectedRoute>
              <FinanceDashboardPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
