import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Layout from "../components/Layout";
import { getToken } from "../utils/auth";

// format today's YYYY-MM
function currentPeriod() {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${d.getFullYear()}-${mm}`;
}

/** Lightweight modal dialog (no jQuery) */
function PaymentDialog({ open, defaultMethod = "cash", onCancel, onConfirm }) {
  const [method, setMethod] = useState(defaultMethod);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setMethod(defaultMethod || "cash");
      setError("");
    }
  }, [open, defaultMethod]);

  // Keyboard: Enter confirms, Esc cancels
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        if (!method) return setError("Please choose a payment method.");
        onConfirm(method);
      } else if (e.key === "Escape") {
        onCancel();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, method, onCancel, onConfirm]);

  if (!open) return null;

  return (
    <div
      className="position-fixed top-0 start-0 w-100 h-100"
      style={{ background: "rgba(0,0,0,0.4)", zIndex: 1050 }}
      onMouseDown={onCancel}
    >
      <div
        className="card shadow"
        style={{
          maxWidth: 420,
          width: "92%",
          margin: "10vh auto",
          borderRadius: 12,
        }}
        // stop clicks inside from closing
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="card-header fw-semibold">Mark as Paid</div>
        <div className="card-body">
          <label className="form-label">Payment method</label>
          <select
            className="form-select"
            value={method}
            onChange={(e) => setMethod(e.target.value)}
          >
            <option value="cash">Cash</option>
            <option value="card">Card</option>
            <option value="bank">Bank</option>
          </select>
          {error && <div className="text-danger small mt-2">{error}</div>}
          <div className="d-flex justify-content-end gap-2 mt-4">
            <button className="btn btn-light" onClick={onCancel}>
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={() => {
                if (!method) return setError("Please choose a payment method.");
                onConfirm(method);
              }}
            >
              OK
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PayrollPage() {
  const [period, setPeriod] = useState(currentPeriod());
  const [rows, setRows] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // modal state
  const [payDialogOpen, setPayDialogOpen] = useState(false);
  const [payTarget, setPayTarget] = useState(null); // row object

  const api = useMemo(
    () =>
      axios.create({
        baseURL: "http://localhost:5000",
        headers: { Authorization: `Bearer ${getToken()}` },
      }),
    []
  );

  const loadPayroll = async () => {
    if (!/^\d{4}-\d{2}$/.test(period)) {
      setMessage("Please choose a valid month (YYYY-MM).");
      return;
    }
    setMessage("");
    setLoading(true);
    try {
      const { data } = await api.get("/api/payroll", { params: { period } });
      setRows(data.rows || []);
    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.message || "Failed to load payroll");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayroll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ✅ Local field change with live netPay recalculation
  const updateLocal = (id, patch) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r._id !== id) return r;
        const updated = { ...r, ...patch };

        const base = Number(updated.baseSalary || 0);
        const adv = Number(updated.advances || 0);
        const ded = Number(updated.deductions || 0);
        updated.netPay = Math.max(0, base - adv - ded);

        return updated;
      })
    );
  };

  const saveRow = async (row) => {
    try {
      const payload = {
        baseSalary: Number(row.baseSalary ?? 0),
        advances: Number(row.advances ?? 0),
        deductions: Number(row.deductions ?? 0),
      };
      const { data } = await api.put(`/api/payroll/${row._id}`, payload);
      setMessage(data.message || "Payroll updated");
      await loadPayroll();
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed to update payroll");
    }
  };

  // Called when the user clicks the "Mark Paid"/"Unpay" button
  const togglePaid = async (row) => {
    try {
      // always persist current numbers first
      await api.put(`/api/payroll/${row._id}`, {
        baseSalary: Number(row.baseSalary ?? 0),
        advances: Number(row.advances ?? 0),
        deductions: Number(row.deductions ?? 0),
      });

      if (row.paid) {
        // Unpay immediately
        const { data } = await api.patch(`/api/payroll/${row._id}/pay`, {
          paid: false,
        });
        setMessage(data.message || "Payment updated");
        await loadPayroll();
      } else {
        // Open dialog to choose method before paying
        setPayTarget(row);
        setPayDialogOpen(true);
      }
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed to update payment");
    }
  };

  // Confirm from dialog
  const confirmPay = async (method) => {
    if (!payTarget) return;
    try {
      const body = {
        paid: true,
        paymentMethod: method,
        paidDate: new Date().toISOString(),
      };
      const { data } = await api.patch(`/api/payroll/${payTarget._id}/pay`, body);
      setMessage(data.message || "Payment updated");
      setPayDialogOpen(false);
      setPayTarget(null);
      await loadPayroll();
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed to update payment");
    }
  };

  const exportCsv = async () => {
    try {
      const res = await api.get("/api/payroll/export.csv", {
        params: { period },
        responseType: "blob",
      });
      const blob = new Blob([res.data], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `payroll-${period}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed to export CSV");
    }
  };

  const totals = useMemo(() => {
    const t = { base: 0, adv: 0, ded: 0, net: 0 };
    rows.forEach((r) => {
      const base = Number(r.baseSalary || 0);
      const adv = Number(r.advances || 0);
      const ded = Number(r.deductions || 0);
      const net = Number(r.netPay || 0);
      t.base += base;
      t.adv += adv;
      t.ded += ded;
      t.net += net;
    });
    return t;
  }, [rows]);

  return (
    <Layout>
      <div className="card shadow-sm">
        <div className="card-body">
          <div className="d-flex flex-wrap justify-content-between align-items-center mb-3">
            <h3 className="page-title mb-3 mb-md-0">💵 Payroll Management</h3>

            <div className="d-flex gap-2">
              <input
                type="month"
                className="form-control"
                style={{ minWidth: 170 }}
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
              />
              <button className="btn btn-primary" onClick={loadPayroll} disabled={loading}>
                {loading ? "Loading..." : "Load"}
              </button>
              <button className="btn btn-outline-secondary" onClick={exportCsv} disabled={rows.length === 0}>
                Export CSV
              </button>
            </div>
          </div>

          {message && <div className="alert alert-info py-2 text-center">{message}</div>}

          <div className="table-responsive">
            <table className="table table-striped table-bordered align-middle">
              <thead className="table-dark">
                <tr>
                  <th>Employee</th>
                  <th>Role</th>
                  <th style={{ width: 120 }}>Base</th>
                  <th style={{ width: 120 }}>Advances</th>
                  <th style={{ width: 120 }}>Deductions</th>
                  <th style={{ width: 120 }}>Net</th>
                  <th style={{ width: 140 }}>Paid</th>
                  <th style={{ width: 160 }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center">
                      {loading ? "Loading..." : "No entries for this period"}
                    </td>
                  </tr>
                ) : (
                  rows.map((r) => (
                    <tr key={r._id}>
                      <td>{r.employeeId?.name || "-"}</td>
                      <td>{r.employeeId?.role || "-"}</td>

                      <td>
                        <input
                          type="number"
                          className="form-control form-control-sm"
                          value={r.baseSalary ?? 0}
                          min={0}
                          onChange={(e) =>
                            updateLocal(r._id, { baseSalary: Number(e.target.value) })
                          }
                        />
                      </td>

                      <td>
                        <input
                          type="number"
                          className="form-control form-control-sm"
                          value={r.advances ?? 0}
                          min={0}
                          onChange={(e) =>
                            updateLocal(r._id, { advances: Number(e.target.value) })
                          }
                        />
                      </td>

                      <td>
                        <input
                          type="number"
                          className="form-control form-control-sm"
                          value={r.deductions ?? 0}
                          min={0}
                          onChange={(e) =>
                            updateLocal(r._id, { deductions: Number(e.target.value) })
                          }
                        />
                      </td>

                      <td>
                        <span className="fw-semibold">
                          ${Number(r.netPay || 0).toFixed(2)}
                        </span>
                      </td>

                      <td>
                        {r.paid ? (
                          <span className="badge bg-success">PAID</span>
                        ) : (
                          <span className="badge bg-secondary">UNPAID</span>
                        )}
                        <div className="small text-muted">
                          {r.paidDate ? new Date(r.paidDate).toISOString().slice(0, 10) : ""}
                          {r.paymentMethod ? ` • ${r.paymentMethod}` : ""}
                        </div>
                      </td>

                      <td>
                        <div className="d-flex gap-2">
                          <button
                            className="btn btn-sm btn-warning"
                            onClick={() => saveRow(r)}
                          >
                            Save
                          </button>
                          <button
                            className={`btn btn-sm ${r.paid ? "btn-outline-danger" : "btn-outline-success"}`}
                            onClick={() => togglePaid(r)}
                          >
                            {r.paid ? "Unpay" : "Mark Paid"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>

              {rows.length > 0 && (
                <tfoot>
                  <tr className="table-light">
                    <th colSpan={2} className="text-end">Totals:</th>
                    <th>${totals.base.toFixed(2)}</th>
                    <th>${totals.adv.toFixed(2)}</th>
                    <th>${totals.ded.toFixed(2)}</th>
                    <th>${totals.net.toFixed(2)}</th>
                    <th colSpan={2}></th>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      </div>

      {/* Payment dialog */}
      <PaymentDialog
        open={payDialogOpen}
        defaultMethod="cash"
        onCancel={() => {
          setPayDialogOpen(false);
          setPayTarget(null);
        }}
        onConfirm={confirmPay}
      />
    </Layout>
  );
}
