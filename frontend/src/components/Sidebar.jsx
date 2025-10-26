import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { getUser, getToken } from "../utils/auth";

// Lucide icons
import {
  LayoutDashboard,
  Users,
  BarChart3,
  Package,
  Layers3,
  UserCheck,
  Wallet,
  ShoppingCart,
  Receipt,
  FileChartColumn,
  Bell,
} from "lucide-react";

export default function Sidebar() {
  const user = getUser();
  const [alertCount, setAlertCount] = useState(0);

  // 🔔 Fetch alert count
  const fetchAlerts = async () => {
    try {
      const token = getToken();
      const { data } = await axios.get("http://localhost:5000/api/admin/alerts", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const total = data.expiredCount + data.expiringSoonCount + data.lowStockCount;
      setAlertCount(total);
    } catch (err) {
      console.error("Failed to fetch alerts", err);
    }
  };

  useEffect(() => {
    if (user?.role === "admin") {
      fetchAlerts();
      const interval = setInterval(fetchAlerts, 60000);
      return () => clearInterval(interval);
    }
  }, [user]);

  // Sidebar menu by role
  const menuItems = [
    { to: "/dashboard", label: "Dashboard", icon: <LayoutDashboard size={18} /> },

    ...(user?.role === "admin"
      ? [
          { to: "/admin/analytics", label: "📊 Analytics" },
          { to: "/admin/live", label: "📊 Live" },

          { to: "/admin/invoices", label: "🧾 Invoices" },
          { to: "/admin/cashiers", label: "💼 Cashiers" }, // ✅ new
          { to: "/admin/users", label: "Manage Users", icon: <Users size={18} /> },
          { to: "/admin/products", label: "Product", icon: <Package size={18} /> },
          { to: "/admin/categories", label: "Categories", icon: <Layers3 size={18} /> },
          { to: "/admin/employees", label: "Employees", icon: <UserCheck size={18} /> },
          { to: "/finance/payroll", label: "Payroll", icon: <Wallet size={18} /> },
          {
            to: "/admin/alerts",
            label: "Alerts",
            icon: <Bell size={18} />,
            isAlert: true,
          },
        ]
      : []),

    ...(user?.role === "cashier"
      ? [
          { to: "/cashier/pos", label: "POS", icon: <ShoppingCart size={18} /> },
          { to: "/cashier/invoices", label: "Invoices", icon: <Receipt size={18} /> },
        ]
      : []),

    ...(user?.role === "finance"
      ? [
          { to: "/finance/reports", label: "💰 Finance Reports" },
          { to: "/admin/cashiers", label: "💼 Cashiers" }, // ✅ also for finance
          { to: "/finance/reports", label: "Finance Reports", icon: <FileChartColumn size={18} /> },
          { to: "/finance/payroll", label: "Payroll", icon: <Wallet size={18} /> },
        ]
      : []),
  ];

  return (
    <>
      {/* 🖥️ Desktop Sidebar */}
      <div
        className="d-none d-lg-flex flex-column flex-shrink-0 bg-dark text-white position-fixed top-0 sidebar-custom"
        style={{ width: "220px", height: "100vh", paddingTop: "56px" }}
      >
        <ul className="nav nav-pills flex-column mb-auto">
          {menuItems.map((item) => (
            <li
              className="nav-item d-flex justify-content-between align-items-center px-2"
              key={item.to}
            >
              <Link to={item.to} className="nav-link text-white w-100 d-flex align-items-center">
                <span className="me-2">{item.icon}</span>
                {item.label}
              </Link>
              {item.isAlert && alertCount > 0 && (
                <span className="badge bg-danger ms-2 me-3">{alertCount}</span>
              )}
            </li>
          ))}
        </ul>
      </div>

      {/* 📱 Mobile Sidebar */}
      <div className="offcanvas offcanvas-start bg-dark text-white" tabIndex="-1" id="sidebarMenu">
        <div className="offcanvas-header">
          <h5 className="offcanvas-title">📋 Menu</h5>
          <button
            type="button"
            className="btn-close btn-close-white"
            data-bs-dismiss="offcanvas"
            aria-label="Close"
          ></button>
        </div>
        <div className="offcanvas-body">
          <ul className="nav nav-pills flex-column mb-auto">
            {menuItems.map((item) => (
              <li
                className="nav-item d-flex justify-content-between align-items-center px-2"
                key={item.to}
              >
                <Link
                  to={item.to}
                  className="nav-link text-white w-100 d-flex align-items-center"
                  data-bs-dismiss="offcanvas"
                >
                  <span className="me-2">{item.icon}</span>
                  {item.label}
                </Link>
                {item.isAlert && alertCount > 0 && (
                  <span className="badge bg-danger ms-2 me-3">{alertCount}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}
