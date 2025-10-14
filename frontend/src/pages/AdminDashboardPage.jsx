import TopHeader from "../components/TopHeader";
import Sidebar from "../components/Sidebar";

export default function AdminDashboardPage() {
  return (
    <>
      <TopHeader />
      <Sidebar />
      <div className="container-fluid" style={{ marginTop: "56px", marginLeft: "20px" }}>
        <div className="p-4">
          <h1 className="fw-bold">📊 Admin Dashboard</h1>
          <p className="text-muted">Welcome to the admin panel.</p>
        </div>
      </div>
    </>
  );
}
