import Sidebar from "../components/Sidebar";
import TopHeader from "../components/TopHeader";

export default function FinanceDashboardPage() {
  return (
    <div style={styles.layout}>
      <TopHeader />
      <Sidebar />
       <div className="container-fluid" style={{ marginTop: "56px", marginLeft: "20px" }}>
        <div className="p-4">
          <h1 className="fw-bold">📊 Finance Dashboard</h1>
          <p className="text-muted">Welcome to the finance panel.</p>
        </div>
      </div>
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
