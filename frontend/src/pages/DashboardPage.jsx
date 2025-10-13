import { getUser, logout } from "../utils/auth";

export default function DashboardPage() {
  const user = getUser();

  return (
    <div style={styles.container}>
      <h1>📊 Dashboard</h1>
      {user && (
        <p style={styles.welcome}>
          Welcome, <strong>{user.name}</strong> ({user.role})
        </p>
      )}

      <button onClick={logout} style={styles.logoutBtn}>
        🚪 Logout
      </button>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100vh",
    background: "#f5f6fa",
    fontFamily: "Arial, sans-serif",
  },
  welcome: {
    marginBottom: "20px",
    fontSize: "18px",
  },
  logoutBtn: {
    padding: "10px 20px",
    backgroundColor: "#e74c3c",
    color: "#fff",
    border: "none",
    borderRadius: "5px",
    fontSize: "16px",
    cursor: "pointer",
  },
};
