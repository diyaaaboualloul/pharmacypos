import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { getUser } from "../utils/auth";
import {
  Menu,
  Bell,
  LogOut,
  User as UserIcon,
} from "lucide-react";

// Keep this consistent with Sidebar
export const TOPBAR_HEIGHT = 60;

export default function TopHeader() {
  const user = getUser();
  const navigate = useNavigate();

  const roleLabel = useMemo(() => {
    if (!user?.role) return "Guest";
    return user.role.charAt(0).toUpperCase() + user.role.slice(1);
  }, [user]);

  const handleLogout = () => {
    // adjust to your auth utils if you have a dedicated logout
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <header
      className="topbar navbar navbar-dark position-fixed w-100 top-0 start-0 shadow-sm"
      style={{ height: TOPBAR_HEIGHT, zIndex: 1040 }}
    >
      <div className="container-fluid px-3">
        {/* Left: Burger + Brand */}
        <div className="d-flex align-items-center gap-2">
          {/* 📱 Opens the Bootstrap offcanvas sidebar */}
          <button
            className="btn btn-icon d-lg-none"
            type="button"
            data-bs-toggle="offcanvas"
            data-bs-target="#sidebarMenu"
            aria-controls="sidebarMenu"
            aria-label="Open Menu"
          >
            <Menu size={20} />
          </button>

          <div className="topbar-brand d-flex align-items-center gap-2">
            <span style={{ fontSize: 18 }}>💊</span>
            <span className="brand-text">Pharmacy POS</span>
          </div>
        </div>

        {/* Right: User / Alerts / Logout */}
        <div className="topbar-actions d-flex align-items-center gap-2">
          <span className="topbar-chip d-none d-sm-inline-flex">
            <UserIcon size={14} className="me-1" />
            {user?.name || "User"}
          </span>
          <span className="topbar-chip alt d-none d-md-inline-flex">
            {roleLabel}
          </span>

          <button className="btn btn-ghost" type="button" aria-label="Alerts">
            <Bell size={18} />
          </button>

          <button className="btn btn-ghost" type="button" onClick={handleLogout}>
            <LogOut size={18} />
            <span className="d-none d-sm-inline ms-1">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}
