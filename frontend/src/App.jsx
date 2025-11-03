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
import BatchManagementPage from "./pages/BatchManagementPage.jsx";
import PosPage from "./pages/PosPage";
import AdminInvoices from "./pages/AdminInvoices";
import InvoiceView from "./pages/InvoiceView";
import CashierInvoices from "./pages/CashierInvoices";
import CashierInvoiceDetails from "./pages/CashierInvoiceDetails.jsx";
import AdminCashiers from "./pages/AdminCashiers";
import CashierSessions from "./pages/CashierSessions";
import AdminAnalytics from "./pages/AdminAnalytics";
import LiveAnalytics from "./pages/LiveAnalytics.jsx";
import ExpensesPage from "./pages/ExpensesPage.jsx";
import ReportsPage from "./pages/ReportsPage.jsx";
import EmployeesPage from "./pages/EmployeesPage";
import PayrollPage from "./pages/PayrollPage";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/admin/cashiers" element={<AdminCashiers />} />
        <Route
          path="/finance/expenses"
          element={
            <RoleProtectedRoute allowedRoles={["admin", "finance"]}>
              <ExpensesPage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/finance/reports"
          element={
            <RoleProtectedRoute allowedRoles={["admin", "finance"]}>
              <ReportsPage />
            </RoleProtectedRoute>
          }
        />

        {/* Redirect root to /login */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/admin/cashiers/:cashierId/sessions" element={<CashierSessions />} />
        <Route path="/admin/analytics" element={<AdminAnalytics />} />
        <Route path="/admin/live" element={<LiveAnalytics />} />

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
            <RoleProtectedRoute allowedRoles={["admin", "finance"]}>
              <CategoryManagementPage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/admin/categories/:categoryName/products"
          element={
            <RoleProtectedRoute allowedRoles={["admin", "finance"]}>
              <CategoryProductsPage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/admin/products"
          element={
            <RoleProtectedRoute allowedRoles={["admin", "finance"]}>
              <ProductManagementPage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/admin/products/:productId/batches"
          element={
            <RoleProtectedRoute allowedRoles={["admin","finance"]}>
              <BatchManagementPage />
            </RoleProtectedRoute>
          }
        />

        {/* Invoices (Admin) */}
        <Route
          path="/admin/invoices"
          element={
            <RoleProtectedRoute allowedRoles={["admin","finance"]}>
              <AdminInvoices />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/admin/invoices/:id"
          element={
            <RoleProtectedRoute allowedRoles={["admin","finance"]}>
              <InvoiceView />
            </RoleProtectedRoute>
          }
        />

        {/* Employees (Admin/Finance) */}
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
          path="/cashier/invoices/:id"
          element={
            <RoleProtectedRoute allowedRoles={["cashier"]}>
              <CashierInvoiceDetails />
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
