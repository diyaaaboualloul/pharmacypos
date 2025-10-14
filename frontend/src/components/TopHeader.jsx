import { getUser, logout } from "../utils/auth";

export default function TopHeader() {
  const user = getUser();

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-light fixed-top shadow-sm">
      <div className="container-fluid">
        {/* Mobile toggle button */}
        <button
          className="btn btn-outline-primary d-lg-none me-2"
          type="button"
          data-bs-toggle="offcanvas"
          data-bs-target="#sidebarMenu"
          aria-controls="sidebarMenu"
        >
          ☰
        </button>

        <span className="navbar-brand fw-bold">💊 Pharmacy POS</span>

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
