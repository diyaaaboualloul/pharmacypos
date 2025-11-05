import React, { useEffect, useState } from "react";
import axios from "axios";
import Layout from "../components/Layout";
import { getToken } from "../utils/auth";
import { PlusCircle, Edit, Trash2, DollarSign, Calendar, Filter } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion"; // ✅ added

const CATEGORIES = [
  "Rent",
  "Electricity",
  "Water",
  "Internet",
  "Maintenance",
  "Supplies",
  "Payroll",
  "Other",
];

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [filters, setFilters] = useState({
    from: "",
    to: "",
    category: "All",
  });
  const [formData, setFormData] = useState({
    _id: null,
    category: "Other",
    amount: "",
    date: "",
    description: "",
  });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // ✅ monthly summary
  const [period, setPeriod] = useState(() => {
    const d = new Date();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    return `${d.getFullYear()}-${mm}`;
  });
  const [summary, setSummary] = useState({
    totalExpenses: 0,
    payrollPaid: 0,
    grandTotal: 0,
  });

  // ✅ added: confirm modal + centered toast states
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [targetExpenseId, setTargetExpenseId] = useState(null);
  const [deleteMessage, setDeleteMessage] = useState("");

  const api = axios.create({
    baseURL: "http://localhost:5000",
    headers: { Authorization: `Bearer ${getToken()}` },
  });

  const loadExpenses = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/api/expenses", {
        params: {
          from: filters.from || undefined,
          to: filters.to || undefined,
          category: filters.category !== "All" ? filters.category : undefined,
        },
      });
      setExpenses(data.rows || []);
      setTotalAmount(data.totalAmount || 0);
    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.message || "Failed to load expenses");
    } finally {
      setLoading(false);
    }
  };

  const loadSummary = async () => {
    try {
      const { data } = await api.get("/api/expenses/summary/month", {
        params: { period },
      });
      setSummary({
        totalExpenses: data.totalExpenses || 0,
        payrollPaid: data.payrollPaid || 0,
        grandTotal: data.grandTotal || 0,
      });
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadExpenses();
  }, [filters]);

  useEffect(() => {
    loadSummary();
  }, [period]);

  // ✅ optional: allow ESC to close the confirm modal
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && setConfirmOpen(false);
    if (confirmOpen) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [confirmOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.date || !formData.amount || !formData.category) {
      alert("Please fill date, amount, and category.");
      return;
    }
    try {
      if (formData._id) {
        const { _id, ...body } = formData;
        await api.put(`/api/expenses/${_id}`, body);
        setMessage("✅ Expense updated successfully.");
      } else {
        await api.post("/api/expenses", formData);
        setMessage("✅ Expense added successfully.");
      }
      setFormData({
        _id: null,
        category: "Other",
        amount: "",
        date: "",
        description: "",
      });
      setShowForm(false);
      loadExpenses();
      loadSummary();
    } catch (err) {
      console.error(err);
      setMessage("❌ Failed to save expense.");
    }
  };

  const handleEdit = (exp) => {
    setFormData({
      _id: exp._id,
      category: exp.category,
      amount: exp.amount,
      date: exp.date ? exp.date.slice(0, 10) : "",
      description: exp.description || "",
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ✅ changed minimal behavior: clicking delete opens custom confirm modal
  const handleDelete = (id) => {
    setTargetExpenseId(id);
    setConfirmOpen(true);
  };

  // ✅ actual deletion happens after user confirms in the modal
  const confirmDeleteExpense = async () => {
    if (!targetExpenseId) return;
    try {
      await api.delete(`/api/expenses/${targetExpenseId}`);
      setConfirmOpen(false);
      setTargetExpenseId(null);
      setMessage("🗑️ Expense deleted successfully.");
      setDeleteMessage("✅ Expense deleted successfully"); // centered toast
      setTimeout(() => setDeleteMessage(""), 2000);
      loadExpenses();
      loadSummary();
    } catch {
      setConfirmOpen(false);
      setTargetExpenseId(null);
      setMessage("❌ Delete failed.");
    }
  };

  // helper to show info in the confirm modal
  const targetExpense = expenses.find((e) => e._id === targetExpenseId);

  return (
    <Layout>
      <div className="container py-4">
        {/* ✅ centered success toast */}
        <AnimatePresence>
          {deleteMessage && (
            <motion.div
              className="position-fixed top-50 start-50 translate-middle bg-success text-white px-4 py-2 rounded shadow"
              style={{ zIndex: 2000, fontWeight: 500 }}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.25 }}
            >
              {deleteMessage}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="d-flex justify-content-between align-items-center mb-4">
          <h3 className="fw-bold mb-0 text-primary">💰 Expenses Dashboard</h3>
          <button
            className="btn btn-primary d-flex align-items-center"
            onClick={() => setShowForm(!showForm)}
          >
            <PlusCircle size={18} className="me-2" />
            {showForm ? "Close Form" : "Add Expense"}
          </button>
        </div>

        {message && (
          <div className="alert alert-info py-2 text-center fw-semibold shadow-sm">
            {message}
          </div>
        )}

        {/* ===== Monthly Summary Cards ===== */}
        <div className="row g-3 mb-4">
          <div className="col-md-4">
            <div className="card shadow-sm border-0 bg-light h-100">
              <div className="card-body text-center">
                <h6 className="text-muted">Total Expenses</h6>
                <h4 className="text-danger fw-bold">
                  ${summary.totalExpenses.toFixed(2)}
                </h4>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card shadow-sm border-0 bg-light h-100">
              <div className="card-body text-center">
                <h6 className="text-muted">Payroll Paid</h6>
                <h4 className="text-warning fw-bold">
                  ${summary.payrollPaid.toFixed(2)}
                </h4>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card shadow-sm border-0 bg-light h-100">
              <div className="card-body text-center">
                <h6 className="text-muted">Grand Total</h6>
                <h4 className="fw-bold text-success">
                  ${summary.grandTotal.toFixed(2)}
                </h4>
              </div>
            </div>
          </div>
        </div>

        {/* ===== Collapsible Add/Edit Form ===== */}
        {showForm && (
          <div className="card shadow-sm mb-4 animate__animated animate__fadeIn">
            <div className="card-header bg-primary text-white d-flex justify-content-between">
              <h5 className="mb-0">
                {formData._id ? "✏️ Edit Expense" : "➕ Add New Expense"}
              </h5>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit} className="row g-3">
                <div className="col-md-3">
                  <label className="form-label">
                    <Calendar size={16} className="me-1" />
                    Date
                  </label>
                  <input
                    type="date"
                    className="form-control"
                    value={formData.date}
                    onChange={(e) =>
                      setFormData({ ...formData, date: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="col-md-3">
                  <label className="form-label">
                    <Filter size={16} className="me-1" />
                    Category
                  </label>
                  <select
                    className="form-select"
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    required
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-3">
                  <label className="form-label">
                    <DollarSign size={16} className="me-1" />
                    Amount ($)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="form-control"
                    value={formData.amount}
                    onChange={(e) =>
                      setFormData({ ...formData, amount: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="col-md-3">
                  <label className="form-label">Description</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Optional note"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                  />
                </div>
                <div className="col-12 text-end">
                  <button
                    type="button"
                    className="btn btn-secondary me-2"
                    onClick={() =>
                      setFormData({
                        _id: null,
                        category: "Other",
                        amount: "",
                        date: "",
                        description: "",
                      })
                    }
                  >
                    Clear
                  </button>
                  <button type="submit" className="btn btn-success">
                    {formData._id ? "Update Expense" : "Add Expense"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ===== Filter and Table ===== */}
        <div className="card shadow-sm">
          <div className="card-header bg-dark text-white d-flex justify-content-between">
            <h5 className="mb-0">📜 Expense History</h5>
            <div>
              <input
                type="month"
                className="form-control form-control-sm"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
              />
            </div>
          </div>
          <div className="card-body">
            <div className="row g-3 mb-3">
              <div className="col-md-3">
                <label className="form-label">From</label>
                <input
                  type="date"
                  className="form-control"
                  value={filters.from}
                  onChange={(e) =>
                    setFilters((f) => ({ ...f, from: e.target.value }))
                  }
                />
              </div>
              <div className="col-md-3">
                <label className="form-label">To</label>
                <input
                  type="date"
                  className="form-control"
                  value={filters.to}
                  onChange={(e) =>
                    setFilters((f) => ({ ...f, to: e.target.value }))
                  }
                />
              </div>
              <div className="col-md-3">
                <label className="form-label">Category</label>
                <select
                  className="form-select"
                  value={filters.category}
                  onChange={(e) =>
                    setFilters((f) => ({ ...f, category: e.target.value }))
                  }
                >
                  <option>All</option>
                  {CATEGORIES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-3 d-flex align-items-end justify-content-end">
                <h6 className="text-end text-muted mb-0">
                  Total:{" "}
                  <span className="fw-bold text-danger">
                    ${totalAmount.toFixed(2)}
                  </span>
                </h6>
              </div>
            </div>

            <div className="table-responsive">
              <table className="table table-hover align-middle table-bordered">
                <thead className="table-light">
                  <tr>
                    <th>Date</th>
                    <th>Category</th>
                    <th>Description</th>
                    <th>Amount</th>
                    <th>Added By</th>
                    <th style={{ width: "130px" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="6" className="text-center py-3">
                        Loading...
                      </td>
                    </tr>
                  ) : expenses.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center py-3">
                        No expenses found
                      </td>
                    </tr>
                  ) : (
                    expenses.map((exp) => (
                      <tr key={exp._id}>
                        <td>{new Date(exp.date).toLocaleDateString()}</td>
                        <td>
                          <span className="badge bg-secondary">{exp.category}</span>
                        </td>
                        <td>{exp.description || "—"}</td>
                        <td className="fw-semibold text-danger">
                          ${exp.amount.toFixed(2)}
                        </td>
                        <td>{exp.createdBy?.name || "—"}</td>
                        <td className="text-center">
                          <button
                            className="btn btn-sm btn-outline-warning me-2"
                            onClick={() => handleEdit(exp)}
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleDelete(exp._id)} // ✅ now opens modal
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ✅ Custom Confirm Delete Modal */}
        <AnimatePresence>
          {confirmOpen && (
            <motion.div
              className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50 d-flex justify-content-center align-items-center"
              style={{ zIndex: 1999 }}
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
                role="dialog"
                aria-modal="true"
              >
                <h5 className="mb-2">Delete Expense?</h5>
                <p className="text-muted mb-4">
                  This will remove the expense
                  {targetExpense
                    ? ` of $${Number(targetExpense.amount).toFixed(2)} on ${new Date(
                        targetExpense.date
                      ).toLocaleDateString()}`
                    : ""} permanently.
                </p>

                <div className="d-flex gap-2">
                  <button
                    className="btn btn-secondary w-50"
                    onClick={() => setConfirmOpen(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn btn-danger w-50"
                    onClick={confirmDeleteExpense}
                    autoFocus
                  >
                    Delete
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
