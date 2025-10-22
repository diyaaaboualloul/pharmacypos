import { useNavigate } from "react-router-dom";
import { getUser, logout } from "../utils/auth";

export default function TopHeader() {
  const user = getUser();
  const navigate = useNavigate();

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-light fixed-top shadow-sm">
      <div className="container-fluid">
        {/* 🏷 Brand */}
        <span
          className="navbar-brand fw-bold"
          style={{ cursor: "pointer" }}
          onClick={() => navigate("/dashboard")}
        >
          💊 Pharmacy POS
        </span>

        {/* 👤 User info & Logout */}
        <div className="d-flex align-items-center ms-auto">
          <span className="me-3 d-none d-sm-inline">
            👤 <strong>{user?.name}</strong> ({user?.role})
          </span>
          <button onClick={logout} className="btn btn-danger btn-sm">
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}
