import { getUser, logout } from "../utils/auth";

export default function FinanceDashboardPage() {
  const user = getUser();

  return (
    <div style={styles.container}>
      <h1>📊 Finance Dashboard</h1>
      <p>Welcome, <strong>{user?.name}</strong> ({user?.role})</p>
      <button onClick={logout} style={styles.logoutBtn}>🚪 Logout</button>
    </div>
  );
}

const styles = {
  container: { textAlign: "center", marginTop: "2rem" },
  logoutBtn: {
    marginTop: "1rem",
    background: "red",
    color: "#fff",
    padding: "0.5rem 1rem",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  },
};
