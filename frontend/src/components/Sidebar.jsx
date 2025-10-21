import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { getUser, getToken } from "../utils/auth";

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

  const menuItems = [
    { to: "/dashboard", label: "🏠 Dashboard" },

    ...(user?.role === "admin"
      ? [
          { to: "/admin/alerts", label: "🚨 Alerts", isAlert: true },
          { to: "/admin/users", label: "👥 Manage Users" },
          { to: "/reports", label: "📊 Reports" },
          { to: "/admin/products", label: "📦 Product Management" },
          { to: "/admin/categories", label: "📂 Categories" },
          { to: "/admin/invoices", label: "🧾 Invoices" },
          { to: "/admin/cashiers", label: "💼 Cashiers" }, // ✅ new
        ]
      : []),

    ...(user?.role === "cashier"
      ? [
          { to: "/cashier/sales", label: "🧾 Sales" },
          { to: "/cashier/inventory", label: "📦 Inventory" },
        ]
      : []),

    ...(user?.role === "finance"
      ? [
          { to: "/finance/reports", label: "💰 Finance Reports" },
          { to: "/admin/cashiers", label: "💼 Cashiers" }, // ✅ also for finance
        ]
      : []),
  ];

  return (
    <>
      {/* 🖥️ Desktop sidebar */}
      <div
        className="d-none d-lg-flex flex-column flex-shrink-0 bg-dark text-white position-fixed top-0 sidebar-custom"
        style={{ width: "220px", height: "100vh", paddingTop: "56px" }}
      >
        <ul className="nav nav-pills flex-column mb-auto">
          {menuItems.map((item) => (
            <li className="nav-item d-flex justify-content-between align-items-center" key={item.to}>
              <Link to={item.to} className="nav-link text-white w-100">
                {item.label}
              </Link>
              {item.isAlert && alertCount > 0 && (
                <span className="badge bg-danger ms-2 me-3">{alertCount}</span>
              )}
            </li>
          ))}
        </ul>
      </div>

      {/* 📱 Mobile sidebar */}
      <div
        className="offcanvas offcanvas-start bg-dark text-white"
        tabIndex="-1"
        id="sidebarMenu"
      >
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
              <li className="nav-item d-flex justify-content-between align-items-center" key={item.to}>
                <Link
                  to={item.to}
                  className="nav-link text-white w-100"
                  data-bs-dismiss="offcanvas"
                >
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
