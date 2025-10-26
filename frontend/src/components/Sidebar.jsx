import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import axios from "axios";
import { getUser, getToken } from "../utils/auth";
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
  ChevronDown,
  ChevronRight,
} from "lucide-react";

export default function Sidebar() {
  const user = getUser();
  const location = useLocation();
  const [alertCount, setAlertCount] = useState(0);
  const [openDropdown, setOpenDropdown] = useState(null);

  // 🔔 Fetch alerts count
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

  // Handle dropdown toggle
  const toggleDropdown = (label) => {
    setOpenDropdown(openDropdown === label ? null : label);
  };

  // Menu structure with dropdowns
  const menuSections = [
    {
      label: "Dashboard",
      icon: <LayoutDashboard size={18} />,
      to: "/dashboard",
    },
       {
      label: "Alerts",
      icon: <Bell size={18} />,
      to: "/admin/alerts",
      isAlert: true,
    },
    {
      label: "Analytics",
      icon: <BarChart3 size={18} />,
      subItems: [
        { label: "Overview", to: "/admin/analytics" },
        { label: "Live Stats", to: "/admin/live" },
      ],
    },
    {
      label: "Management",
      icon: <Users size={18} />,
      subItems: [
        { label: "Users", to: "/admin/users" },
        { label: "Cashiers", to: "/admin/cashiers" },
        { label: "Employees", to: "/admin/employees" },
      ],
    },
    {
      label: "Products",
      icon: <Package size={18} />,
      subItems: [
        { label: "All Products", to: "/admin/products" },
        { label: "Categories", to: "/admin/categories" },
      ],
    },
{
  label: "Finance",
  icon: <Wallet size={18} />,
  subItems: [
    { label: "Payroll", to: "/finance/payroll" },
    { label: "Expenses", to: "/finance/expenses" },
    { label: "Reports", to: "/finance/reports" },
  ],
},


    {
      label: "Invoices",
      icon: <Receipt size={18} />,
      subItems: [
        { label: "All Invoices", to: "/admin/invoices" },
      ],
    },
 
 
  ];

  return (
    <>
      {/* 🖥️ Desktop Sidebar */}
      <div
        className="d-none d-lg-flex flex-column bg-dark text-white position-fixed top-0 shadow-lg"
        style={{
          width: "240px",
          height: "100vh",
          paddingTop: "60px",
          borderRight: "2px solid rgba(255,255,255,0.1)",
        }}
      >
        <div className="text-center mb-4">
          <h5
            style={{
              fontWeight: 600,
              color: "#00B4D8",
              letterSpacing: "0.5px",
            }}
          >
            💊 Pharmacy POS
          </h5>
          <hr className="border-secondary" />
        </div>

        <ul className="nav flex-column px-2">
          {menuSections.map((item) => {
            const isActive = location.pathname === item.to;
            const isOpen = openDropdown === item.label;

            return (
              <li key={item.label} className="nav-item my-1">
                {item.subItems ? (
                  <>
                    <button
                      className="btn w-100 text-start text-light d-flex align-items-center justify-content-between py-2 px-3"
                      style={{
                        background: "transparent",
                        border: "none",
                        borderRadius: "8px",
                        transition: "all 0.2s ease",
                      }}
                      onClick={() => toggleDropdown(item.label)}
                    >
                      <span className="d-flex align-items-center">
                        <span className="me-2">{item.icon}</span>
                        {item.label}
                      </span>
                      {isOpen ? (
                        <ChevronDown size={16} />
                      ) : (
                        <ChevronRight size={16} />
                      )}
                    </button>

                    {/* Dropdown content */}
                    <ul
                      className={`list-unstyled ps-4 ${
                        isOpen ? "d-block" : "d-none"
                      }`}
                    >
                      {item.subItems.map((sub) => (
                        <li key={sub.to} className="my-1">
                          <Link
                            to={sub.to}
                            className={`nav-link py-1 px-2 rounded-2 ${
                              location.pathname === sub.to
                                ? "bg-primary text-white"
                                : "text-light"
                            }`}
                            style={{
                              fontSize: "0.9rem",
                              transition: "background 0.2s",
                            }}
                          >
                            {sub.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <Link
                    to={item.to}
                    className={`nav-link d-flex align-items-center py-2 px-3 rounded-3 ${
                      isActive ? "bg-primary text-white" : "text-light"
                    }`}
                    style={{ transition: "0.2s" }}
                  >
                    <span className="me-2">{item.icon}</span>
                    <span className="flex-grow-1">{item.label}</span>
                    {item.isAlert && alertCount > 0 && (
                      <span className="badge bg-danger">{alertCount}</span>
                    )}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      {/* 📱 Mobile Sidebar */}
      <div
        className="offcanvas offcanvas-start bg-dark text-white"
        tabIndex="-1"
        id="sidebarMenu"
      >
        <div className="offcanvas-header border-bottom border-secondary">
          <h5 className="offcanvas-title">📋 Menu</h5>
          <button
            type="button"
            className="btn-close btn-close-white"
            data-bs-dismiss="offcanvas"
            aria-label="Close"
          ></button>
        </div>

        <div className="offcanvas-body">
          <ul className="nav flex-column">
            {menuSections.map((item) => (
              <li key={item.label} className="nav-item my-1">
                {item.subItems ? (
                  <>
                    <button
                      className="btn w-100 text-start text-light d-flex align-items-center justify-content-between py-2 px-3"
                      style={{
                        background: "transparent",
                        border: "none",
                      }}
                      onClick={() => toggleDropdown(item.label)}
                    >
                      <span className="d-flex align-items-center">
                        <span className="me-2">{item.icon}</span>
                        {item.label}
                      </span>
                      {openDropdown === item.label ? (
                        <ChevronDown size={16} />
                      ) : (
                        <ChevronRight size={16} />
                      )}
                    </button>
                    <ul
                      className={`list-unstyled ps-4 ${
                        openDropdown === item.label ? "d-block" : "d-none"
                      }`}
                    >
                      {item.subItems.map((sub) => (
                        <li key={sub.to}>
                          <Link
                            to={sub.to}
                            className="nav-link text-light py-1 px-2"
                            data-bs-dismiss="offcanvas"
                          >
                            {sub.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <Link
                    to={item.to}
                    className="nav-link d-flex align-items-center py-2 px-3 rounded-3 text-light"
                    data-bs-dismiss="offcanvas"
                  >
                    <span className="me-2">{item.icon}</span>
                    {item.label}
                    {item.isAlert && alertCount > 0 && (
                      <span className="badge bg-danger ms-auto">
                        {alertCount}
                      </span>
                    )}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}
