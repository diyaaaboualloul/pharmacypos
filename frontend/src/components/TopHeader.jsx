import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { getUser } from "../utils/auth";
import { Menu, LogOut, User as UserIcon, AlertTriangle } from "lucide-react";

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

  const roleColor = useMemo(() => {
    switch (user?.role) {
      case "admin":
        return "#00d4b0"; // mint-teal
      case "finance":
        return "#6cb6ff";
      case "cashier":
        return "#f5b342";
      default:
        return "#ccc";
    }
  }, [user]);

  return (
    <>
      <header
        className="topbar navbar navbar-dark position-fixed w-100 top-0 start-0 shadow-sm"
        style={{ height: TOPBAR_HEIGHT, zIndex: 1040 }}
      >
        <div className="container-fluid px-3">
          {/* Left: Burger + Brand */}
          <div className="d-flex align-items-center gap-2">
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
              {/* <span style={{ fontSize: 18 }}>💊</span> */}
              <img
  src="/logo-pharmacy.png"
  alt="DHL Pharmacy Logo"
  width={26}
  height={26}
  style={{ borderRadius: "6px", objectFit: "contain" }}
/>

              <span className="brand-text glow-text">DHL PHARMACY</span>
            </div>
          </div>

          {/* Right: User + Logout */}
          <div className="topbar-actions d-flex align-items-center gap-2">
            <span
              className="topbar-chip d-none d-sm-inline-flex"
              style={{ color: roleColor }}
            >
              <UserIcon size={14} style={{ color: roleColor }} />
              {user?.name || "User"}
            </span>

            <span
              className="topbar-chip alt d-none d-md-inline-flex"
              style={{ color: roleColor }}
            >
              {roleLabel}
            </span>

            <button
              className="btn btn-logout"
              type="button"
              data-bs-toggle="modal"
              data-bs-target="#logoutConfirmModal"
            >
              <LogOut size={18} />
              <span className="d-none d-sm-inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Logout Confirmation Modal */}
      <div
        className="modal fade"
        id="logoutConfirmModal"
        tabIndex={-1}
        aria-labelledby="logoutConfirmLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content modal-glass">
            <div className="modal-hero">
              <div className="hero-icon">
                <AlertTriangle size={18} />
              </div>
              <h5 className="modal-title" id="logoutConfirmLabel">
                Confirm Logout
              </h5>
            </div>

            <div className="modal-body">
              You’re about to sign out of{" "}
              <strong style={{ color: "var(--fg)" }}>Pharmacy POS</strong>.
              <br />
              Any unsaved changes will be lost.
              <div className="modal-tip mt-3">
                <span style={{ fontWeight: 600, color: "var(--fg)" }}>Tip</span>
                You can always sign back in with your credentials.
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn-secondary-ghost"
                data-bs-dismiss="modal"
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-danger-gradient"
                onClick={handleLogout}
                data-bs-dismiss="modal"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
