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
import PosPage from "./pages/PosPage";
import AdminInvoices from "./pages/AdminInvoices";
import InvoiceView from "./pages/InvoiceView";
import InvoiceEdit from "./pages/InvoiceEdit";
import CashierInvoices from "./pages/CashierInvoices";
import EmployeesPage from "./pages/EmployeesPage";   // ✅
import PayrollPage from "./pages/PayrollPage";       // ✅

function App() {
  return (
    <Router>
      <Routes>
        {/* Redirect root to /login */}
        <Route path="/" element={<Navigate to="/login" replace />} />

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
        <Route path="/unauthorized" element={<UnauthorizedPage />} />

        {/* ================== ADMIN ROUTES ================== */}
        <Route
          path="/dashboard"
          element={
            <RoleProtectedRoute allowedRoles={["admin"]}>
              <AdminDashboardPage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/admin/search"
          element={
            <RoleProtectedRoute allowedRoles={["admin"]}>
              <SearchResultsPage />
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
        <Route
          path="/admin/alerts"
          element={
            <RoleProtectedRoute allowedRoles={["admin"]}>
              <AlertsPage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/admin/categories"
          element={
            <RoleProtectedRoute allowedRoles={["admin"]}>
              <CategoryManagementPage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/admin/categories/:categoryName/products"
          element={
            <RoleProtectedRoute allowedRoles={["admin"]}>
              <CategoryProductsPage />
            </RoleProtectedRoute>
          }
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
          path="/admin/products/:productId/batches"
          element={
            <RoleProtectedRoute allowedRoles={["admin"]}>
              <BatchManagementPage />
            </RoleProtectedRoute>
          }
        />

        {/* Invoices (Admin) */}
        <Route
          path="/admin/invoices"
          element={
            <RoleProtectedRoute allowedRoles={["admin"]}>
              <AdminInvoices />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/admin/invoices/:id"
          element={
            <RoleProtectedRoute allowedRoles={["admin"]}>
              <InvoiceView />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/admin/invoices/:id/edit"
          element={
            <RoleProtectedRoute allowedRoles={["admin"]}>
              <InvoiceEdit />
            </RoleProtectedRoute>
          }
        />

        {/* ================== NEW: EMPLOYEES (Admin or Finance) ================== */}
        <Route
          path="/admin/employees"
          element={
            <RoleProtectedRoute allowedRoles={["admin", "finance"]}>
              <EmployeesPage />
            </RoleProtectedRoute>
          }
        />

        {/* ================== CASHIER ROUTES ================== */}
        <Route
          path="/cashier/pos"
          element={
            <RoleProtectedRoute allowedRoles={["cashier"]}>
              <PosPage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/cashier/invoices"
          element={
            <RoleProtectedRoute allowedRoles={["cashier"]}>
              <CashierInvoices />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/cashier/invoices/:id/edit"
          element={
            <RoleProtectedRoute allowedRoles={["cashier"]}>
              <InvoiceEdit />
            </RoleProtectedRoute>
          }
        />

        {/* ================== FINANCE ROUTES ================== */}
        <Route
          path="/finance-dashboard"
          element={
            <RoleProtectedRoute allowedRoles={["finance"]}>
              <FinanceDashboardPage />
            </RoleProtectedRoute>
          }
        />
        {/* NEW: Payroll (Admin or Finance) */}
        <Route
          path="/finance/payroll"
          element={
            <RoleProtectedRoute allowedRoles={["admin", "finance"]}>
              <PayrollPage />
            </RoleProtectedRoute>
          }
        />

        {/* 404 PAGE */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Router>
  );
}

export default App;
