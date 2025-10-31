import React, { useEffect, useMemo, useState, useCallback } from "react";
import axios from "axios";
import { getToken } from "../utils/auth";
import { useNavigate } from "react-router-dom";
import "./invoices.css";


export default function CashierInvoices() {
  // data
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cashierStatus, setCashierStatus] = useState("closed");

  // ui state
  const [query, setQuery] = useState(""); // search
  const [statusFilter, setStatusFilter] = useState("all"); // all | original | partial | refunded
  const [sortBy, setSortBy] = useState("date"); // invoice | date | total | status
  const [sortDir, setSortDir] = useState("desc"); // asc | desc
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const navigate = useNavigate();

  // ---- API ----
  const fetchSales = useCallback(async () => {
    try {
      setLoading(true);
      const token = getToken();
      const { data } = await axios.get("http://localhost:5000/api/pos/my-sales", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSales(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch sales", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCashierStatus = useCallback(async () => {
    try {
      const token = getToken();
      const { data } = await axios.get(
        "http://localhost:5000/api/pos/cashiers-status",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const user = JSON.parse(localStorage.getItem("user"));
      const me = data.find((c) => c.email === user?.email);
      if (me?.status) setCashierStatus(me.status);
    } catch (err) {
      console.error("Failed to fetch cashier status", err);
    }
  }, []);

  useEffect(() => {
    fetchSales();
    fetchCashierStatus();
  }, [fetchSales, fetchCashierStatus]);

  // ---- Refund ----
  const handleRefund = async (id) => {
    if (!window.confirm("Refund this entire invoice?")) return;
    try {
      const token = getToken();
      await axios.post(
        `http://localhost:5000/api/pos/refund/${id}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("Refund processed successfully!");
      fetchSales();
    } catch (err) {
      console.error(err);
      alert("Refund failed: " + (err.response?.data?.message || err.message));
    }
  };

  // ---- Helpers ----
  const currency = useMemo(
    () =>
      new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
      }),
    []
  );

  const normalized = useMemo(() => {
    return sales.map((s) => {
      const hasPartial =
        Array.isArray(s.items) && s.items.some((i) => i.isRefunded === true);
      const fullRefund = Number(s.total) < 0;
      const status = fullRefund ? "refunded" : hasPartial ? "partial" : "original";
      return { ...s, _status: status };
    });
  }, [sales]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return normalized.filter((s) => {
      const byStatus = statusFilter === "all" || s._status === statusFilter;
      if (!byStatus) return false;
      if (!q) return true;
      // search invoice number or date string
      const dateStr = new Date(s.createdAt).toLocaleString().toLowerCase();
      return (
        String(s.invoiceNumber || "").toLowerCase().includes(q) ||
        dateStr.includes(q)
      );
    });
  }, [normalized, query, statusFilter]);

  const sorted = useMemo(() => {
    const dir = sortDir === "asc" ? 1 : -1;
    const copy = [...filtered];
    copy.sort((a, b) => {
      if (sortBy === "invoice") {
        return String(a.invoiceNumber).localeCompare(String(b.invoiceNumber)) * dir;
      }
      if (sortBy === "date") {
        return (new Date(a.createdAt) - new Date(b.createdAt)) * dir;
      }
      if (sortBy === "total") {
        return (a.total - b.total) * dir;
      }
      if (sortBy === "status") {
        return a._status.localeCompare(b._status) * dir;
      }
      return 0;
    });
    return copy;
  }, [filtered, sortBy, sortDir]);

  // reset to page 1 when filters change
  useEffect(() => setPage(1), [query, statusFilter, pageSize]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const paged = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sorted.slice(start, start + pageSize);
  }, [sorted, page, pageSize]);

  const toggleSort = (field) => {
    if (field === sortBy) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortBy(field);
      setSortDir(field === "date" ? "desc" : "asc"); // default for date is newest first
    }
  };

  // ---- UI ----
  if (loading) {
    return (
      <div className="container mt-5 text-center">
        <div className="spinner-border" role="status" />
        <div className="text-muted small mt-2">Loading your invoices…</div>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      {/* Page header */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 className="fw-bold mb-0">📑 Invoices</h3>
        <button className="btn btn-outline-primary" onClick={() => navigate("/cashier/pos")}>
          ← Back to POS
        </button>
      </div>

      {/* Block if cashier closed */}
      {cashierStatus === "closed" ? (
        <div className="text-center mt-5">
          <h5 className="text-danger">
            🚫 You cannot view invoices while your cashier account is closed.
          </h5>
        </div>
      ) : (
        <>
          {/* Toolbar */}
          <div className="card mb-3">
            <div className="card-body d-flex flex-wrap gap-2 align-items-center">
              <input
                type="text"
                className="form-control"
                placeholder="Search invoice # or date…"
                style={{ maxWidth: 340 }}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label="Search"
              />

              <div className="vr d-none d-md-block" />

              <div className="d-flex align-items-center gap-2">
                <label className="form-label mb-0 small text-muted">Status</label>
                <select
                  className="form-select form-select-sm"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  style={{ width: 200 }}
                >
                  <option value="all">All</option>
                  <option value="original">Original</option>
                  <option value="partial">Partially Refunded</option>
                  <option value="refunded">Refunded</option>
                </select>
              </div>

              <div className="ms-auto d-flex align-items-center gap-2">
                <label className="form-label mb-0 small text-muted">Rows</label>
                <select
                  className="form-select form-select-sm"
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  style={{ width: 90 }}
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="card invoice-table shadow-sm">
            <div className="table-responsive">
              <table className="table table-hover table-striped align-middle mb-0">
                <thead>
                  <tr>
                    <th
                      role="button"
                      onClick={() => toggleSort("invoice")}
                      title="Sort by invoice #"
                    >
                      Invoice # {sortBy === "invoice" ? (sortDir === "asc" ? "▲" : "▼") : ""}
                    </th>
                    <th
                      role="button"
                      onClick={() => toggleSort("date")}
                      title="Sort by date"
                      className="text-nowrap"
                    >
                      Date {sortBy === "date" ? (sortDir === "asc" ? "▲" : "▼") : ""}
                    </th>
                    <th
                      role="button"
                      onClick={() => toggleSort("total")}
                      title="Sort by total"
                      className="text-end"
                    >
                      Total {sortBy === "total" ? (sortDir === "asc" ? "▲" : "▼") : ""}
                    </th>
                    <th
                      role="button"
                      onClick={() => toggleSort("status")}
                      title="Sort by status"
                      className="text-nowrap"
                    >
                      Status {sortBy === "status" ? (sortDir === "asc" ? "▲" : "▼") : ""}
                    </th>
                    <th className="text-center">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {paged.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="text-center text-muted py-4">
                        No invoices match your filters.
                      </td>
                    </tr>
                  ) : (
                    paged.map((s) => {
                      const statusText =
                        s._status === "refunded"
                          ? "Refunded"
                          : s._status === "partial"
                          ? "Partially Refunded"
                          : "Original";
                      const badge =
                        s._status === "refunded"
                          ? "badge-refunded"
                          : s._status === "partial"
                          ? "badge-partial"
                          : "badge-original";

                      return (
                        <tr key={s._id}>
                          <td className="text-nowrap">{s.invoiceNumber}</td>
                          <td className="text-nowrap">
                            {new Date(s.createdAt).toLocaleString()}
                          </td>
                          <td className="text-end">{currency.format(s.total)}</td>
                          <td>
                            <span className={`badge ${badge}`}>{statusText}</span>
                          </td>
                          <td className="text-center">
                            <div className="d-flex gap-2 justify-content-center">
                              <button
                                className="btn btn-primary btn-sm"
                                onClick={() => navigate(`/cashier/invoices/${s._id}`)}
                              >
                                View
                              </button>
                              {s._status === "original" && (
                                <button
                                  className="btn btn-danger btn-sm"
                                  onClick={() => handleRefund(s._id)}
                                >
                                  Refund All
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="d-flex justify-content-between align-items-center p-2">
              <small className="text-muted">
                Showing {(page - 1) * pageSize + 1}–
                {Math.min(page * pageSize, sorted.length)} of {sorted.length}
              </small>
              <div className="btn-group">
                <button
                  className="btn btn-outline-secondary btn-sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                >
                  ‹ Prev
                </button>
                <button
                  className="btn btn-outline-secondary btn-sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                >
                  Next ›
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
