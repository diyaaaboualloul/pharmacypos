import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import axios from "axios";
import { getUser, getToken } from "../utils/auth";
import "../css/Sidebar.css"; // ✅ Import sidebar styles

export default function Sidebar() {
  const user = getUser();
  const location = useLocation();

  const [alertCount, setAlertCount] = useState(0);
  const [openDropdown, setOpenDropdown] = useState(false); // for products dropdown

  // 🔽 Toggle dropdown
  const toggleDropdown = () => setOpenDropdown(!openDropdown);

  // 🔔 Fetch alert count from backend
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
      const interval = setInterval(fetchAlerts, 60000); // refresh every minute
      return () => clearInterval(interval);
    }
  }, [user]);

  // ===== Menu Items =====
  const menuItems = [
    { to: "/dashboard", label: "🏠 Dashboard" },

    ...(user?.role === "admin"
      ? [
          { to: "/admin/alerts", label: "🚨 Alerts", isAlert: true },
          { to: "/admin/users", label: "👥 Manage Users" },
          {
            label: "📦 Products",
            dropdown: [
              { to: "/admin/products", label: "Product Management" },
              { to: "/admin/categories", label: "Categories" },
              { to: "/admin/invoices", label: "Invoices" },
            ],
          },
          { to: "/reports", label: "📊 Reports" },
        ]
      : []),

    ...(user?.role === "cashier"
      ? [
          { to: "/cashier/sales", label: "🧾 Sales" },
          { to: "/cashier/inventory", label: "📦 Inventory" },
        ]
      : []),

    ...(user?.role === "finance"
      ? [{ to: "/finance/reports", label: "💰 Finance Reports" }]
      : []),
  ];

  return (
    <>
      {/* 🖥️ Desktop sidebar */}
      <div className="sidebar-custom d-none d-lg-flex flex-column">
        <div className="sidebar-logo">💊 Pharmacy POS</div>
        <ul className="nav flex-column mb-auto sidebar-menu">
          {menuItems.map((item) =>
            item.dropdown ? (
              <li className="nav-item" key={item.label}>
                <button
                  className={`nav-link dropdown-toggle text-start w-100 ${
                    openDropdown ? "open" : ""
                  }`}
                  onClick={toggleDropdown}
                >
                  {item.label}
                </button>
                <div className={`sidebar-dropdown ${openDropdown ? "show" : ""}`}>
                  {item.dropdown.map((sub) => (
                    <Link
                      key={sub.to}
                      to={sub.to}
                      className={`nav-link sub-link ${
                        location.pathname === sub.to ? "active" : ""
                      }`}
                    >
                      {sub.label}
                    </Link>
                  ))}
                </div>
              </li>
            ) : (
              <li className="nav-item d-flex align-items-center" key={item.to}>
                <Link
                  to={item.to}
                  className={`nav-link w-100 ${
                    location.pathname === item.to ? "active" : ""
                  }`}
                >
                  {item.label}
                </Link>
                {item.isAlert && alertCount > 0 && (
                  <span className="badge bg-danger ms-2 me-3">{alertCount}</span>
                )}
              </li>
            )
          )}
        </ul>
      </div>

      {/* 📱 Mobile Sidebar */}
      <div className="offcanvas offcanvas-start bg-dark text-white" tabIndex="-1" id="sidebarMenu">
        <div className="offcanvas-header border-bottom">
          <h5 className="offcanvas-title">📋 Menu</h5>
          <button
            type="button"
            className="btn-close btn-close-white"
            data-bs-dismiss="offcanvas"
            aria-label="Close"
          ></button>
        </div>
        <div className="offcanvas-body">
          <ul className="nav flex-column mb-auto">
            {menuItems.map((item) =>
              item.dropdown ? (
                <li className="nav-item" key={item.label}>
                  <button
                    className={`nav-link dropdown-toggle text-start w-100 ${
                      openDropdown ? "open" : ""
                    }`}
                    onClick={toggleDropdown}
                  >
                    {item.label}
                  </button>
                  <div className={`sidebar-dropdown ${openDropdown ? "show" : ""}`}>
                    {item.dropdown.map((sub) => (
                      <Link
                        key={sub.to}
                        to={sub.to}
                        className={`nav-link sub-link ${
                          location.pathname === sub.to ? "active" : ""
                        }`}
                        data-bs-dismiss="offcanvas"
                      >
                        {sub.label}
                      </Link>
                    ))}
                  </div>
                </li>
              ) : (
                <li className="nav-item d-flex align-items-center" key={item.to}>
                  <Link
                    to={item.to}
                    className={`nav-link w-100 ${
                      location.pathname === item.to ? "active" : ""
                    }`}
                    data-bs-dismiss="offcanvas"
                  >
                    {item.label}
                  </Link>
                  {item.isAlert && alertCount > 0 && (
                    <span className="badge bg-danger ms-2 me-3">{alertCount}</span>
                  )}
                </li>
              )
            )}
          </ul>
        </div>
      </div>
    </>
  );
}
