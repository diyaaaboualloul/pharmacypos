import React, { useEffect, useState } from "react";
import axios from "axios";
import Layout from "../components/Layout";
import { getToken, getUser } from "../utils/auth";

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

  // form state (create / edit)
  const [formData, setFormData] = useState({
    _id: null,
    category: "Other",
    amount: "",
    date: "",
    description: "",
  });

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // summary state
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

  const api = axios.create({
    baseURL: "http://localhost:5000",
    headers: { Authorization: `Bearer ${getToken()}` },
  });

  // load list with filters
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

  // load summary for the month
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

  // handle create or update
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.date || !formData.amount || !formData.category) {
      alert("Please fill date, amount, and category.");
      return;
    }

    try {
      if (formData._id) {
        // update
        const { _id, ...body } = formData;
        const { data } = await api.put(`/api/expenses/${_id}`, body);
        setMessage(data.message || "Updated");
      } else {
        // create
        const { data } = await api.post("/api/expenses", formData);
        setMessage(data.message || "Created");
      }

      // reset form
      setFormData({
        _id: null,
        category: "Other",
        amount: "",
        date: "",
        description: "",
      });

      loadExpenses();
      loadSummary();
    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.message || "Failed to save expense");
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
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this expense?")) return;
    try {
      const { data } = await api.delete(`/api/expenses/${id}`);
      setMessage(data.message || "Deleted");
      loadExpenses();
      loadSummary();
    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.message || "Delete failed");
    }
  };

  return (
    <Layout>
      <div className="container py-4">
        <h3 className="mb-3">💸 Expenses Management</h3>

        {message && (
          <div className="alert alert-info py-2 text-center">{message}</div>
        )}

        {/* ===== Summary Card (Month) ===== */}
        <div className="card mb-4 shadow-sm">
          <div className="card-body">
            <div className="d-flex flex-wrap justify-content-between align-items-center mb-3">
              <h5 className="mb-3 mb-md-0">📊 Monthly Summary (with Payroll)</h5>

              <div className="d-flex gap-2">
                <input
                  type="month"
                  className="form-control"
                  style={{ minWidth: 170 }}
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                />
              </div>
            </div>

            <div className="table-responsive">
              <table className="table table-bordered align-middle text-center">
                <tbody>
                  <tr>
                    <th style={{ width: "200px" }}>Expenses Total</th>
                    <td>${summary.totalExpenses.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <th>Payroll Paid</th>
                    <td>${summary.payrollPaid.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <th>Grand Total</th>
                    <td className="fw-bold text-danger">
                      ${summary.grandTotal.toFixed(2)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ===== Add / Edit Expense Form ===== */}
        <div className="card mb-4 shadow-sm">
          <div className="card-header bg-primary text-white">
            <h5 className="mb-0">
              {formData._id ? "✏️ Edit Expense" : "➕ Add Expense"}
            </h5>
          </div>
          <div className="card-body">
            <form onSubmit={handleSubmit} className="row g-3">
              <div className="col-md-3">
                <label className="form-label">Date</label>
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
                <label className="form-label">Category</label>
                <select
                  className="form-select"
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  required
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-md-3">
                <label className="form-label">Amount ($)</label>
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
                <button className="btn btn-secondary me-2" type="button"
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

                <button className="btn btn-primary" type="submit">
                  {formData._id ? "Update" : "Add"}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* ===== Filters + Table ===== */}
        <div className="card shadow-sm">
          <div className="card-header bg-dark text-white">
            <h5 className="mb-0">📜 Expense History</h5>
          </div>

          <div className="card-body">
            {/* Filters row */}
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

              <div className="col-md-3 d-flex align-items-end">
                <div className="w-100">
                  <div className="text-end small text-muted">
                    Total:{" "}
                    <strong className="text-danger">
                      ${totalAmount.toFixed(2)}
                    </strong>
                  </div>
                </div>
              </div>
            </div>

            {/* table */}
            <div className="table-responsive">
              <table className="table table-striped table-bordered align-middle">
                <thead className="table-light">
                  <tr>
                    <th>Date</th>
                    <th>Category</th>
                    <th>Description</th>
                    <th>Amount ($)</th>
                    <th>Added By</th>
                    <th style={{ width: "120px" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="6" className="text-center">
                        Loading...
                      </td>
                    </tr>
                  ) : expenses.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center">
                        No expenses found
                      </td>
                    </tr>
                  ) : (
                    expenses.map((exp) => (
                      <tr key={exp._id}>
                        <td>{new Date(exp.date).toLocaleDateString()}</td>
                        <td>{exp.category}</td>
                        <td>{exp.description || "-"}</td>
                        <td>${exp.amount.toFixed(2)}</td>
                        <td>{exp.createdBy?.name || "—"}</td>
                        <td>
                          <button
                            className="btn btn-sm btn-outline-warning me-2"
                            onClick={() => handleEdit(exp)}
                          >
                            Edit
                          </button>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleDelete(exp._id)}
                          >
                            Delete
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
      </div>
    </Layout>
  );
}
