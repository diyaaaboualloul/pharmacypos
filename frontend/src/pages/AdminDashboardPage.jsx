import { useState } from "react";
import { getUser, logout } from "../utils/auth";
import { useNavigate } from "react-router-dom";

export default function DashboardPage() {
  const [user] = useState(getUser());
  const navigate = useNavigate();

  return (
    <div style={styles.container}>
      <h1>📊 Dashboard</h1>
      {user && <p>Welcome, <strong>{user.name}</strong> ({user.role})</p>}

      <button onClick={logout} style={styles.logoutBtn}>🚪 Logout</button>

      {user?.role === "admin" && (
        <button onClick={() => navigate("/admin/users")} style={styles.createBtn}>
          ➕ Manage Users
        </button>
      )}
    </div>
  );
}

const styles = {
  container: { maxWidth: "600px", margin: "2rem auto", textAlign: "center" },
  logoutBtn: {
    marginTop: "1rem",
    background: "red",
    color: "#fff",
    padding: "0.5rem 1rem",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  },
  createBtn: {
    marginTop: "1rem",
    background: "#007bff",
    color: "#fff",
    padding: "0.5rem 1rem",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  },
};
