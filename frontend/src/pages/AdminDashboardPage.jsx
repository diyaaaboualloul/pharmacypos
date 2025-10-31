import React from "react";
import TopHeader from "../components/TopHeader";
import Sidebar from "../components/Sidebar";

export default function AdminDashboardPage() {
  return (
    <div className="d-flex">
      <Sidebar />
      <div className="flex-grow-1" style={{ marginLeft: "220px", marginTop: "56px" }}>
        <TopHeader />
        <div className="p-4">
          <h1>📊 Admin Dashboard</h1>
          <p>Welcome to the admin panel.</p>
        </div>
      </div>
    </div>
  );
}