import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { getUser } from "../utils/auth";
import { Menu, Bell, LogOut, User as UserIcon } from "lucide-react";

export const TOPBAR_HEIGHT = 60;

export default function TopHeader() {
  const user = getUser();
  const navigate = useNavigate();

  const roleLabel = useMemo(() => {
    if (!user?.role) return "Guest";
    return user.role.charAt(0).toUpperCase() + user.role.slice(1);
  }, [user]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <header
      className="topbar position-fixed w-100 top-0 start-0 shadow-sm bg-white border-bottom"
      style={{ height: TOPBAR_HEIGHT, zIndex: 1040 }}
    >
      <div className="container-fluid px-4 d-flex justify-content-between align-items-center h-100">
        {/* Left: Burger + Brand */}
        <div className="d-flex align-items-center gap-3">
          <button
            className="btn btn-light d-lg-none rounded-circle p-2 shadow-sm"
            type="button"
            data-bs-toggle="offcanvas"
            data-bs-target="#sidebarMenu"
            aria-controls="sidebarMenu"
          >
            <Menu size={20} />
          </button>

          <div className="topbar-brand d-flex align-items-center gap-2 fw-semibold text-primary">
            <span style={{ fontSize: 20 }}>💊</span>
            <span className="brand-text">Pharmacy POS</span>
          </div>
        </div>

        {/* Right: User / Alerts / Logout */}
        <div className="d-flex align-items-center gap-3">
          <div className="d-none d-sm-flex align-items-center gap-2 px-3 py-1 bg-light rounded-pill text-secondary small fw-medium shadow-sm">
            <UserIcon size={14} />
            <span>{user?.name || "User"}</span>
          </div>

          <div className="d-none d-md-flex align-items-center px-3 py-1 bg-primary text-white rounded-pill small shadow-sm">
            {roleLabel}
          </div>

          <button
            className="btn btn-light rounded-circle p-2 shadow-sm position-relative"
            type="button"
            aria-label="Alerts"
          >
            <Bell size={18} />
            <span
              className="position-absolute top-0 start-100 translate-middle p-1 bg-danger border border-light rounded-circle"
              style={{ width: 8, height: 8 }}
            ></span>
          </button>

          <button
            className="btn btn-outline-danger d-flex align-items-center gap-1 px-3 py-1 rounded-pill shadow-sm"
            type="button"
            onClick={handleLogout}
          >
            <LogOut size={18} />
            <span className="d-none d-sm-inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}
