import React, { useEffect, useState } from "react";
import axios from "axios";
import { getToken } from "../utils/auth";
import { Link } from "react-router-dom";
import Layout from "../components/Layout";
import { motion, AnimatePresence } from "framer-motion"; // ✅ Added

export default function AdminCashiers() {
  const [cashiers, setCashiers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // ✅ NEW: For confirm delete modal & toast
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [targetCashier, setTargetCashier] = useState(null);
  const [actionType, setActionType] = useState("");
  const [centerMessage, setCenterMessage] = useState("");

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

  useEffect(() => {
    fetchCashiers();
    const interval = setInterval(fetchCashiers, 10000);
    return () => clearInterval(interval);
  }, []);

  // ✅ Open Modal Instead of window.confirm
  const openConfirm = (cashier, action) => {
    setTargetCashier(cashier);
    setActionType(action);
    setConfirmOpen(true);
  };

  // ✅ Run Action After Confirm
  const handleConfirmedAction = async () => {
    if (!targetCashier || !actionType) return;

    setLoading(true);
    setConfirmOpen(false);

    try {
      const token = getToken();
      const url =
        actionType === "open"
          ? `http://localhost:5000/api/pos/open-day/${targetCashier._id}`
          : `http://localhost:5000/api/pos/end-day/${targetCashier._id}`;

      const { data } = await axios.post(url, {}, { headers: { Authorization: `Bearer ${token}` } });

      // ✅ Shows centered animated toast
      setCenterMessage(data.message || "✅ Action completed");
      setTimeout(() => setCenterMessage(""), 2000);

      fetchCashiers();
    } catch (err) {
      setCenterMessage("❌ " + (err.response?.data?.message || "Failed"));
      setTimeout(() => setCenterMessage(""), 2000);
    } finally {
      setLoading(false);
    }
  };

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

        {/* ✅ Centered Toast */}
        <AnimatePresence>
          {centerMessage && (
            <motion.div
              className="position-fixed top-50 start-50 translate-middle bg-success text-white px-4 py-2 rounded shadow"
              style={{ zIndex: 2000, fontWeight: 500 }}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.25 }}
            >
              {centerMessage}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="d-flex justify-content-between align-items-center mb-4">
          <h3 className="fw-bold text-primary">💼 Cashiers Day Management</h3>
        </div>

        {/* 🔍 Search & Filter */}
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

        {/* 📋 Table */}
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

                          {/* ✅ Replaced with modal trigger */}
                          {c.status === "open" ? (
                            <button
                              className="btn btn-sm btn-danger"
                              onClick={() => openConfirm(c, "close")}
                              disabled={loading}
                            >
                              🕓 Close Day
                            </button>
                          ) : (
                            <button
                              className="btn btn-sm btn-success"
                              onClick={() => openConfirm(c, "open")}
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

        {/* ✅ Confirm Action Modal */}
        <AnimatePresence>
          {confirmOpen && (
            <motion.div
              className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50 d-flex justify-content-center align-items-center"
              style={{ zIndex: 2000 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="card p-4 shadow-lg"
                style={{ width: 420, borderRadius: 16 }}
                initial={{ scale: 0.9, y: -10 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 10 }}
              >
                <h5 className="mb-2">Confirm Action</h5>
                <p className="text-muted mb-4">
                  Are you sure you want to{" "}
                  <strong>{actionType === "open" ? " Open" : " Close"}</strong>{" "}
                  the day for <strong>{targetCashier?.name}</strong>?
                </p>

                <div className="d-flex gap-2">
                  <button className="btn btn-secondary w-50" onClick={() => setConfirmOpen(false)}>
                    Cancel
                  </button>
                  <button className="btn btn-danger w-50" onClick={handleConfirmedAction} autoFocus>
                    Yes, {actionType === "open" ? "Open" : "Close"}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </Layout>
  );
}
