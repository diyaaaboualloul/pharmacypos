import { useEffect, useMemo, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import axios from "axios";
import { getUser, getToken } from "../utils/auth";
import { hideOffcanvasById } from "../utils/offcanvas";
import {
  LayoutDashboard,
  Users,
  BarChart3,
  Package,
  Wallet,
  Receipt,
  Bell,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

export const SIDEBAR_WIDTH = 240; // keep width in one place
export const TOPBAR_HEIGHT = 60;  // matches your TopHeader height

export default function Sidebar() {
  const user = getUser();
  const location = useLocation();
  const [alertCount, setAlertCount] = useState(0);
  const [openDropdown, setOpenDropdown] = useState(null);

  const api = useMemo(() => {
    const token = getToken();
    return axios.create({
      baseURL: "http://localhost:5000",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  }, []);

  // 🔔 Fetch alerts count (admins only)
  const fetchAlerts = async () => {
    if (user?.role !== "admin") return;
    try {
      const { data } = await api.get("/api/admin/alerts");
      const total =
        (data?.expiredCount || 0) +
        (data?.expiringSoonCount || 0) +
        (data?.lowStockCount || 0);
      setAlertCount(total);
    } catch (err) {
      console.error("Failed to fetch alerts", err);
    }
  };

  useEffect(() => {
    if (user?.role === "admin") {
      fetchAlerts();
      const id = setInterval(fetchAlerts, 60_000);
      return () => clearInterval(id);
    }
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  // Menu structure with dropdowns
  const menuSections = [
    { label: "Dashboard", icon: <LayoutDashboard size={18} />, to: "/dashboard" },
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
      subItems: [{ label: "All Invoices", to: "/admin/invoices" }],
    },
  ];

  // Auto-open the dropdown that matches the current route
  useEffect(() => {
    const activeSection = menuSections.find(
      (sec) =>
        sec.subItems &&
        sec.subItems.some((s) => location.pathname.startsWith(s.to))
    );
    setOpenDropdown(activeSection?.label ?? null);
  }, [location.pathname]);

  const toggleDropdown = (label) => {
    setOpenDropdown((prev) => (prev === label ? null : label));
  };

  // ✅ Close the mobile drawer when a link is clicked
  const handleMobileNavClick = () => hideOffcanvasById("sidebarMenu");

  return (
    <>
      {/* 🖥️ Desktop Sidebar */}
      <nav
        role="navigation"
        aria-label="Primary"
        className="d-none d-lg-flex flex-column bg-dark text-white position-fixed top-0 shadow-lg"
        style={{
          width: `${SIDEBAR_WIDTH}px`,
          height: "100vh",
          left: 0,
          paddingTop: `${TOPBAR_HEIGHT}px`,
          borderRight: "2px solid rgba(255,255,255,0.08)",
          boxSizing: "border-box",
          overflowY: "auto",
          WebkitOverflowScrolling: "touch",
          zIndex: 1030,
        }}
      >
        <div className="text-center mb-3 px-3">
          <h5
            className="mb-2"
            style={{ fontWeight: 600, color: "#00B4D8", letterSpacing: "0.5px" }}
          >
            💊 Pharmacy POS
          </h5>
          <hr className="border-secondary opacity-25 m-0" />
        </div>

        <ul className="nav flex-column px-2 mb-4">
          {menuSections.map((item) => {
            const isSectionOpen = openDropdown === item.label;

            if (item.subItems) {
              const sectionActive = item.subItems.some((s) =>
                location.pathname.startsWith(s.to)
              );
              return (
                <li key={item.label} className="nav-item my-1">
                  <button
                    type="button"
                    className={`w-100 text-start text-light d-flex align-items-center justify-content-between py-2 px-3 rounded-3 ${
                      sectionActive ? "bg-secondary bg-opacity-25" : ""
                    }`}
                    style={{
                      background: "transparent",
                      border: "none",
                      transition: "all 0.2s ease",
                    }}
                    aria-expanded={isSectionOpen}
                    aria-controls={`sec-${item.label}`}
                    onClick={() => toggleDropdown(item.label)}
                  >
                    <span className="d-flex align-items-center">
                      <span className="me-2">{item.icon}</span>
                      {item.label}
                    </span>
                    {isSectionOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </button>

                  <ul
                    id={`sec-${item.label}`}
                    className={`list-unstyled ps-4 ${isSectionOpen ? "d-block" : "d-none"}`}
                  >
                    {item.subItems.map((sub) => (
                      <li key={sub.to} className="my-1">
                        <NavLink
                          to={sub.to}
                          className={({ isActive }) =>
                            `nav-link py-1 px-2 rounded-2 ${
                              isActive ? "bg-primary text-white" : "text-light"
                            }`
                          }
                          style={{ fontSize: "0.9rem", transition: "background 0.2s" }}
                        >
                          {sub.label}
                        </NavLink>
                      </li>
                    ))}
                  </ul>
                </li>
              );
            }

            // Simple single-link item
            return (
              <li key={item.label} className="nav-item my-1">
                <NavLink
                  to={item.to}
                  end
                  className={({ isActive }) =>
                    `nav-link d-flex align-items-center py-2 px-3 rounded-3 ${
                      isActive ? "bg-primary text-white" : "text-light"
                    }`
                  }
                  style={{ transition: "0.2s" }}
                >
                  <span className="me-2">{item.icon}</span>
                  <span className="flex-grow-1">{item.label}</span>
                  {item.isAlert && alertCount > 0 && (
                    <span className="badge bg-danger">{alertCount}</span>
                  )}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* 📱 Mobile Sidebar (Bootstrap Offcanvas) */}
      <div
        className="offcanvas offcanvas-start bg-dark text-white"
        tabIndex={-1}
        id="sidebarMenu"
        aria-labelledby="sidebarMenuLabel"
      >
        <div className="offcanvas-header border-bottom border-secondary">
          <h5 id="sidebarMenuLabel" className="offcanvas-title">
            📋 Menu
          </h5>
          <button
            type="button"
            className="btn-close btn-close-white"
            data-bs-dismiss="offcanvas"
            aria-label="Close"
          />
        </div>

        <div className="offcanvas-body">
          <ul className="nav flex-column">
            {menuSections.map((item) => {
              if (item.subItems) {
                const isOpen = openDropdown === item.label;
                return (
                  <li key={item.label} className="nav-item my-1">
                    <button
                      type="button"
                      className="w-100 text-start text-light d-flex align-items-center justify-content-between py-2 px-3 rounded-2"
                      style={{ background: "transparent", border: "none" }}
                      aria-expanded={isOpen}
                      aria-controls={`m-sec-${item.label}`}
                      onClick={() => toggleDropdown(item.label)}
                    >
                      <span className="d-flex align-items-center">
                        <span className="me-2">{item.icon}</span>
                        {item.label}
                      </span>
                      {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </button>
                    <ul
                      id={`m-sec-${item.label}`}
                      className={`list-unstyled ps-4 ${isOpen ? "d-block" : "d-none"}`}
                    >
                      {item.subItems.map((sub) => (
                        <li key={sub.to}>
                          <NavLink
                            to={sub.to}
                            className="nav-link text-light py-1 px-2"
                            onClick={handleMobileNavClick}  // ✅ close then navigate
                          >
                            {sub.label}
                          </NavLink>
                        </li>
                      ))}
                    </ul>
                  </li>
                );
              }

              return (
                <li key={item.label} className="nav-item my-1">
                  <NavLink
                    to={item.to}
                    end
                    className="nav-link d-flex align-items-center py-2 px-3 rounded-3 text-light"
                    onClick={handleMobileNavClick} // ✅ close then navigate
                  >
                    <span className="me-2">{item.icon}</span>
                    <span className="flex-grow-1">{item.label}</span>
                    {item.isAlert && alertCount > 0 && (
                      <span className="badge bg-danger ms-auto">{alertCount}</span>
                    )}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </>
  );
}
