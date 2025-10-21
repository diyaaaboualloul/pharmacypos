import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, Link } from "react-router-dom";
import { getToken } from "../utils/auth";
import Layout from "../components/Layout";

export default function CashierSessions() {
  const { cashierId } = useParams();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSessions = async () => {
    try {
      const token = getToken();
      const { data } = await axios.get(
        `http://localhost:5000/api/pos/cashier-sessions/${cashierId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSessions(data);
    } catch (err) {
      console.error("Failed to fetch sessions", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [cashierId]);

  return (
    <Layout>
      <div className="container mt-4">
        <h3>🧾 Cashier Session History</h3>
        <Link to="/admin/cashiers" className="btn btn-secondary btn-sm mb-3">
          ← Back
        </Link>

        {loading ? (
          <p>Loading...</p>
        ) : sessions.length === 0 ? (
          <p className="text-muted">No sessions found for this cashier.</p>
        ) : (
          <table className="table table-bordered table-striped">
            <thead className="table-primary">
              <tr>
                <th>Date</th>
                <th>Status</th>
                <th>Opened At</th>
                <th>Closed At</th>
                <th>Total Sales</th>
                <th>Total Refunds</th>
                <th>Net Total</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((s, i) => (
                <tr key={i}>
                  <td>{new Date(s.date).toLocaleDateString()}</td>
                  <td>
                    {s.status === "open" ? (
                      <span className="badge bg-success">🟢 Open</span>
                    ) : (
                      <span className="badge bg-danger">🔴 Closed</span>
                    )}
                  </td>
                  <td>{s.openedAt ? new Date(s.openedAt).toLocaleTimeString() : "-"}</td>
                  <td>{s.closedAt ? new Date(s.closedAt).toLocaleTimeString() : "-"}</td>
                  <td>${s.totalSales?.toFixed(2) || "0.00"}</td>
                  <td>${s.totalRefunds?.toFixed(2) || "0.00"}</td>
                  <td className="fw-bold">
                    ${s.netTotal?.toFixed(2) || "0.00"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Layout>
  );
}
