import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
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
import ProductManagementPage from "./pages/ProductManagementPage";
import CategoryManagementPage from "./pages/CategoryManagementPage";
import CategoryProductsPage from "./pages/CategoryProductsPage";
import AlertsPage from "./pages/AlertPage";
import SearchResultsPage from "./pages/SearchResultsPage";
import BatchManagementPage from "./pages/BatchManagementPage.jsx";
// ✅ 1. Import the PosPage component at the top
import PosPage from "./pages/PosPage";



function App() {
  return (
    <Router>
      <Routes>
        {/* ✅ Redirect root to /login */}
        <Route path="/" element={<Navigate to="/login" replace />} />

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
        <Route path="/admin/search" element={<SearchResultsPage />} />
        <Route
          path="/admin/users"
          element={
            <RoleProtectedRoute allowedRoles={["admin"]}>
              <UserManagementPage />
            </RoleProtectedRoute>
          }
        />
        <Route path="/admin/alerts" element={<AlertsPage />} />
        <Route path="/admin/categories" element={<CategoryManagementPage />} />
        <Route
          path="/admin/products/:productId/batches"
          element={<BatchManagementPage />}
        />
        <Route
          path="/admin/products"
          element={
            <RoleProtectedRoute allowedRoles={["admin"]}>
              <ProductManagementPage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/admin/categories/:categoryName/products"
          element={<CategoryProductsPage />}
        />
<Route
  path="/cashier/pos"
  element={
    <RoleProtectedRoute allowedRoles={["cashier"]}>
      <PosPage />
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

        {/* 404 Page */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Router>
  );
}

export default App;
