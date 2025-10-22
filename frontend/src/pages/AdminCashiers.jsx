import React, { useEffect, useState } from "react";
import axios from "axios";
import { getToken } from "../utils/auth";
import { Link } from "react-router-dom";
import Layout from "../components/Layout";

export default function AdminCashiers() {
  const [cashiers, setCashiers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // 🔹 Fetch cashiers + status
  const fetchCashiers = async () => {
    try {
      const token = getToken();
      const { data } = await axios.get(
        "http://localhost:5000/api/pos/cashiers-status",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCashiers(data);
    } catch (err) {
      console.error("Failed to fetch cashiers", err);
    }
  };

  // 🔁 Auto refresh every 10 seconds
  useEffect(() => {
    fetchCashiers();
    const interval = setInterval(fetchCashiers, 10000);
    return () => clearInterval(interval);
  }, []);

  // 🟢🔴 Open or Close Day
  const handleAction = async (cashierId, action) => {
    if (!window.confirm(`Are you sure you want to ${action} day for this cashier?`)) return;

    setLoading(true);
    setMessage("");

    try {
      const token = getToken();
      const url =
        action === "open"
          ? `http://localhost:5000/api/pos/open-day/${cashierId}`
          : `http://localhost:5000/api/pos/end-day/${cashierId}`;

      const { data } = await axios.post(url, {}, { headers: { Authorization: `Bearer ${token}` } });
      setMessage(data.message || `Cashier day ${action}ed successfully.`);
      fetchCashiers();
    } catch (err) {
      setMessage("❌ " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  // 🔎 Filtered Cashiers
  const filteredCashiers = cashiers.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter ? c.status === statusFilter : true;
    return matchesSearch && matchesStatus;
  });

  return (
    <Layout>
      <div className="container mt-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h3 className="fw-bold text-primary">💼 Cashiers Day Management</h3>
        </div>

        {message && <div className="alert alert-info">{message}</div>}

        {/* 🔍 Search & Filter Controls */}
        <div className="card shadow-sm p-3 mb-3">
          <div className="row g-3 align-items-center">
            <div className="col-md-5">
              <input
                type="text"
                className="form-control"
                placeholder="🔍 Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="col-md-5">
              <select
                className="form-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="open">🟢 Open</option>
                <option value="closed">🔴 Closed</option>
              </select>
            </div>
            <div className="col-md-2">
              <button
                className="btn btn-outline-secondary w-100"
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("");
                }}
              >
                🧹 Clear
              </button>
            </div>
          </div>
        </div>

        {/* 📋 Responsive Table */}
        <div className="card shadow-sm p-3">
          <div className="table-responsive">
            <table className="table table-bordered align-middle table-hover mb-0">
              <thead className="table-primary text-center">
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th style={{ minWidth: "240px" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredCashiers.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="text-center text-muted py-3">
                      No cashiers found.
                    </td>
                  </tr>
                ) : (
                  filteredCashiers.map((c) => (
                    <tr key={c._id}>
                      <td>{c.name}</td>
                      <td>{c.email}</td>
                      <td className="text-center">
                        {c.status === "open" ? (
                          <span className="badge bg-success px-3 py-2">🟢 Open</span>
                        ) : (
                          <span className="badge bg-danger px-3 py-2">🔴 Closed</span>
                        )}
                      </td>
                      <td className="text-center">
                        <div className="d-flex flex-wrap justify-content-center gap-2">
                          {c.status === "open" ? (
                            <button
                              className="btn btn-sm btn-danger"
                              onClick={() => handleAction(c._id, "close")}
                              disabled={loading}
                            >
                              🕓 Close Day
                            </button>
                          ) : (
                            <button
                              className="btn btn-sm btn-success"
                              onClick={() => handleAction(c._id, "open")}
                              disabled={loading}
                            >
                              🔓 Open Day
                            </button>
                          )}
                          <Link
                            to={`/admin/cashiers/${c._id}/sessions`}
                            className="btn btn-sm btn-outline-primary"
                          >
                            📜 View Sessions
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}
