import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getUser, logout } from "../utils/auth";

export default function TopHeader() {
  const user = getUser();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  const debounceRef = useRef(null);
  const firstRender = useRef(true);

  useEffect(() => {
    // 🛑 Skip effect on first render to avoid unwanted navigation
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }

    // 🧹 Clear any previous debounce timers
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // ⏳ Set new debounce timer
    debounceRef.current = setTimeout(() => {
      const trimmed = query.trim();
      if (trimmed.length >= 2) {
        navigate(`/admin/search?q=${encodeURIComponent(trimmed)}`);
      }
      // When empty: do nothing, stay on current page
    }, 300);

    return () => clearTimeout(debounceRef.current);
  }, [query, navigate]);

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-light fixed-top shadow-sm">
      <div className="container-fluid">
        {/* 🏷 Brand */}
        <span className="navbar-brand fw-bold">💊 Pharmacy POS</span>

     

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
