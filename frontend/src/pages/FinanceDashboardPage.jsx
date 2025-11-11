import Sidebar, { SIDEBAR_WIDTH, TOPBAR_HEIGHT } from "../components/Sidebar";
import TopHeader from "../components/TopHeader";

export default function FinanceDashboardPage() {
  return (
    <div style={styles.layout}>
      <TopHeader />
      <Sidebar />

      {/* Page Content */}
      <div
        className="container-fluid"
        style={{
          paddingTop: TOPBAR_HEIGHT + 20,
          paddingLeft: SIDEBAR_WIDTH + 20,
          paddingRight: 20,
        }}
      >
        <div className="p-4">
          <h1 className="fw-bold">📊 Finance Dashboard</h1>
          <p className="text-muted">Welcome to the finance panel.</p>
        </div>
      </div>
    </div>
  );
}

const styles = {
  layout: {
    minHeight: "100vh",
    background: "#f5f7fa",
  },
};
