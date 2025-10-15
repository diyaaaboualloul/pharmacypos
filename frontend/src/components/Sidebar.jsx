import { Link } from "react-router-dom";
import { getUser } from "../utils/auth";

export default function Sidebar() {
  const user = getUser();


  const menuItems = [
    { to: "/dashboard", label: "🏠 Dashboard" },
    ...(user?.role === "admin"
      ? [
          { to: "/admin/users", label: "👥 Manage Users" },
          { to: "/reports", label: "📊 Reports" },
          { to: "/admin/products", label: "📦 Product Management" },
          { to: "/admin/categories", label: "📦Categories" },

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
     <div
  className="d-none d-lg-flex flex-column flex-shrink-0 bg-dark text-white position-fixed top-0 sidebar-custom"
  style={{ width: "220px", height: "100vh", paddingTop: "56px" }}
>
        <ul className="nav nav-pills flex-column mb-auto">
          {menuItems.map((item) => (
            <li className="nav-item" key={item.to}>
              <Link to={item.to} className="nav-link text-white">
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* 📱 Mobile sidebar (offcanvas) */}
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
              <li className="nav-item" key={item.to}>
                <Link
                  to={item.to}
                  className="nav-link text-white"
                  data-bs-dismiss="offcanvas"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}
