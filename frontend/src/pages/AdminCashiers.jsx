import React, { useEffect, useState } from "react";
import axios from "axios";
import { getToken } from "../utils/auth";
import { Link } from "react-router-dom";
import Layout from "../components/Layout";

export default function AdminCashiers() {
  const [cashiers, setCashiers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // 🔹 Fetch cashiers + their current day status
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

  return (
    <Layout>
      <div className="container mt-4">
        <h3 className="mb-4">💼 Cashiers Day Management</h3>

        {message && <div className="alert alert-info">{message}</div>}

        <div className="card shadow-sm p-3">
          <table className="table table-bordered align-middle">
            <thead className="table-primary">
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Status</th>
                <th style={{ width: "240px" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {cashiers.length === 0 ? (
                <tr>
                  <td colSpan="4" className="text-center text-muted">
                    No cashiers found.
                  </td>
                </tr>
              ) : (
                cashiers.map((c) => (
                  <tr key={c._id}>
                    <td>{c.name}</td>
                    <td>{c.email}</td>
                    <td>
                      {c.status === "open" ? (
                        <span className="badge bg-success">🟢 Open</span>
                      ) : (
                        <span className="badge bg-danger">🔴 Closed</span>
                      )}
                    </td>
                    <td>
                      {c.status === "open" ? (
                        <button
                          className="btn btn-sm btn-danger me-2"
                          onClick={() => handleAction(c._id, "close")}
                          disabled={loading}
                        >
                          🕓 Close Day
                        </button>
                      ) : (
                        <button
                          className="btn btn-sm btn-success me-2"
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
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
