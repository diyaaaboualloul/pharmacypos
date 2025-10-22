import React, { useEffect, useState } from "react";
import Layout from "../components/Layout";
import axios from "axios";
import { getToken } from "../utils/auth";
import { motion } from "framer-motion";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import "bootstrap/dist/css/bootstrap.min.css";

export default function AdminAnalytics() {
  const token = getToken();
  const COLORS = ["#007bff", "#28a745", "#ffc107", "#dc3545", "#17a2b8", "#6610f2"];

  const [loading, setLoading] = useState(true);
  const [salesSummary, setSalesSummary] = useState([]);
  const [comparisonSales, setComparisonSales] = useState([]);
  const [inventoryStats, setInventoryStats] = useState({});
  const [topProducts, setTopProducts] = useState([]);
  const [cashierPerformance, setCashierPerformance] = useState([]);
  const [payments, setPayments] = useState([]);

  // KPI totals
  const [totals, setTotals] = useState({ gross: 0, refunds: 0, net: 0 });
  const [comparisonTotals, setComparisonTotals] = useState({
    gross: 0,
    refunds: 0,
    net: 0,
  });

  // Filters
  const [salesFilter, setSalesFilter] = useState(
    JSON.parse(localStorage.getItem("salesFilter")) || {
      from: "",
      to: "",
      granularity: "day",
    }
  );
  const [comparisonEnabled, setComparisonEnabled] = useState(false);
  const [comparisonFilter, setComparisonFilter] = useState({ from: "", to: "" });

  const [productsFilter, setProductsFilter] = useState({ from: "", to: "" });
  const [cashiersFilter, setCashiersFilter] = useState({ from: "", to: "" });
  const [paymentsFilter, setPaymentsFilter] = useState({ from: "", to: "" });

  /* ------------------ API Fetchers ------------------ */
  const fetchSalesSummary = async () => {
    setLoading(true);
    try {
      const { from, to, granularity } = salesFilter;
      const url = `http://localhost:5000/api/reports/sales/summary?granularity=${granularity}${
        from ? `&from=${from}` : ""
      }${to ? `&to=${to}` : ""}`;
      const res = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
      const rows = res.data.rows || [];
      setSalesSummary(rows);

      const gross = rows.reduce((s, r) => s + (r.grossSales || 0), 0);
      const refunds = rows.reduce((s, r) => s + (r.refunds || 0), 0);
      const net = rows.reduce((s, r) => s + (r.netSales || 0), 0);
      setTotals({ gross, refunds, net });

      // Comparison
      if (comparisonEnabled && comparisonFilter.from && comparisonFilter.to) {
        const compUrl = `http://localhost:5000/api/reports/sales/summary?granularity=${granularity}&from=${comparisonFilter.from}&to=${comparisonFilter.to}`;
        const compRes = await axios.get(compUrl, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const compRows = compRes.data.rows || [];
        setComparisonSales(compRows);

        const cgross = compRows.reduce((s, r) => s + (r.grossSales || 0), 0);
        const crefunds = compRows.reduce((s, r) => s + (r.refunds || 0), 0);
        const cnet = compRows.reduce((s, r) => s + (r.netSales || 0), 0);
        setComparisonTotals({ gross: cgross, refunds: crefunds, net: cnet });
      } else {
        setComparisonSales([]);
        setComparisonTotals({ gross: 0, refunds: 0, net: 0 });
      }
    } catch (err) {
      console.error("Sales summary fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchInventory = async () => {
    const res = await axios.get("http://localhost:5000/api/reports/inventory/health", {
      headers: { Authorization: `Bearer ${token}` },
    });
    setInventoryStats(res.data || {});
  };

  const fetchTopProducts = async () => {
    const { from, to } = productsFilter;
    const url = `http://localhost:5000/api/reports/products/top${
      from || to ? `?${from ? `from=${from}` : ""}${to ? `&to=${to}` : ""}` : ""
    }`;
    const res = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
    setTopProducts(Array.isArray(res.data) ? res.data : []);
  };

  const fetchCashiers = async () => {
    const { from, to } = cashiersFilter;
    const url = `http://localhost:5000/api/reports/cashiers/performance${
      from || to ? `?${from ? `from=${from}` : ""}${to ? `&to=${to}` : ""}` : ""
    }`;
    const res = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
    setCashierPerformance(Array.isArray(res.data) ? res.data : []);
  };

  const fetchPayments = async () => {
    const { from, to } = paymentsFilter;
    const url = `http://localhost:5000/api/reports/payments/breakdown${
      from || to ? `?${from ? `from=${from}` : ""}${to ? `&to=${to}` : ""}` : ""
    }`;
    const res = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
    setPayments(Array.isArray(res.data) ? res.data : []);
  };

  /* ------------------ Auto Refresh ------------------ */
  useEffect(() => {
    const fetchAll = () => {
      fetchSalesSummary();
      fetchInventory();
      fetchTopProducts();
      fetchCashiers();
      fetchPayments();
    };

    fetchAll();
    const interval = setInterval(fetchAll, 10000);
    return () => clearInterval(interval);
  }, [salesFilter, comparisonEnabled, comparisonFilter, productsFilter, cashiersFilter, paymentsFilter]);

  useEffect(() => {
    localStorage.setItem("salesFilter", JSON.stringify(salesFilter));
  }, [salesFilter]);

  /* ------------------ Reset Handlers ------------------ */
  const resetSalesFilter = () => setSalesFilter({ from: "", to: "", granularity: "day" });
  const resetProductsFilter = () => setProductsFilter({ from: "", to: "" });
  const resetCashiersFilter = () => setCashiersFilter({ from: "", to: "" });
  const resetPaymentsFilter = () => setPaymentsFilter({ from: "", to: "" });

  /* ------------------ Helpers ------------------ */
  const percentChange = (current, prev) => {
    if (prev === 0) return 0;
    return ((current - prev) / prev) * 100;
  };

  /* =======================================================
     UI START
  ======================================================= */
  return (
    <Layout>
      <div className="container py-4">
        <h2 className="fw-bold text-primary mb-4 text-center text-md-start">
          📊 Admin Analytics Dashboard
        </h2>

        {/* ================= Sales Overview ================= */}
      <section className="mb-5">
  <h5 className="fw-bold text-primary mb-3">💰 Sales Overview</h5>

  {/* ===== Main Period Selection ===== */}
  <div className="card border-0 shadow-sm p-3 mb-3">
    <label className="fw-semibold mb-2 text-secondary">
      📅 Choose the main period you want to analyze
    </label>

    <div className="row g-3 align-items-end">
      <div className="col-12 col-sm-6 col-md-3">
        <label className="form-label mb-1">From (Start Date)</label>
        <input
          type="date"
          value={salesFilter.from}
          onChange={(e) => setSalesFilter({ ...salesFilter, from: e.target.value })}
          className="form-control"
        />
      </div>

      <div className="col-12 col-sm-6 col-md-3">
        <label className="form-label mb-1">To (End Date)</label>
        <input
          type="date"
          value={salesFilter.to}
          onChange={(e) => setSalesFilter({ ...salesFilter, to: e.target.value })}
          className="form-control"
        />
      </div>

      <div className="col-6 col-md-2">
        <button className="btn btn-primary w-100" onClick={fetchSalesSummary}>
          🔍 Apply
        </button>
      </div>

      <div className="col-6 col-md-2">
        <button className="btn btn-outline-secondary w-100" onClick={resetSalesFilter}>
          ♻️ Reset
        </button>
      </div>
    </div>
  </div>

  {/* ===== Enable Comparison Toggle ===== */}
  <div className="card border-0 shadow-sm p-3 mb-4 bg-light">
    <div className="d-flex align-items-center justify-content-between flex-wrap">
      <label className="fw-semibold mb-2 text-secondary">
        🔄 Enable Comparison with Previous Period
      </label>
      <div className="form-check form-switch">
        <input
          className="form-check-input"
          type="checkbox"
          checked={comparisonEnabled}
          onChange={(e) => {
            const checked = e.target.checked;
            setComparisonEnabled(checked);
            if (checked && salesFilter.from && salesFilter.to) {
              const fromDate = new Date(salesFilter.from);
              const toDate = new Date(salesFilter.to);
              const diffDays = Math.ceil((toDate - fromDate) / (1000 * 60 * 60 * 24)) + 1;

              const compTo = new Date(fromDate);
              compTo.setDate(compTo.getDate() - 1);
              const compFrom = new Date(compTo);
              compFrom.setDate(compFrom.getDate() - diffDays + 1);

              setComparisonFilter({
                from: compFrom.toISOString().split("T")[0],
                to: compTo.toISOString().split("T")[0],
              });
            }
          }}
        />
      </div>
    </div>

    {comparisonEnabled && (
      <>
        <div className="row g-3 mt-2">
          <div className="col-12 col-sm-6 col-md-3">
            <label className="form-label mb-1">Compare From</label>
            <input
              type="date"
              className="form-control"
              value={comparisonFilter.from}
              onChange={(e) =>
                setComparisonFilter({ ...comparisonFilter, from: e.target.value })
              }
            />
          </div>
          <div className="col-12 col-sm-6 col-md-3">
            <label className="form-label mb-1">Compare To</label>
            <input
              type="date"
              className="form-control"
              value={comparisonFilter.to}
              onChange={(e) =>
                setComparisonFilter({ ...comparisonFilter, to: e.target.value })
              }
            />
          </div>
          <div className="col-12 col-md-auto d-flex align-items-end">
            <button
              className="btn btn-outline-primary w-100"
              onClick={() => {
                if (salesFilter.from && salesFilter.to) {
                  const fromDate = new Date(salesFilter.from);
                  const toDate = new Date(salesFilter.to);
                  const diffDays = Math.ceil(
                    (toDate - fromDate) / (1000 * 60 * 60 * 24)
                  ) + 1;

                  const compTo = new Date(fromDate);
                  compTo.setDate(compTo.getDate() - 1);
                  const compFrom = new Date(compTo);
                  compFrom.setDate(compFrom.getDate() - diffDays + 1);

                  setComparisonFilter({
                    from: compFrom.toISOString().split("T")[0],
                    to: compTo.toISOString().split("T")[0],
                  });
                }
              }}
            >
              🧠 Auto Previous Period
            </button>
          </div>
        </div>

        {/* ===== Info Summary ===== */}
        <div className="alert alert-info mt-3 mb-0 p-2">
          <small>
            Currently comparing <strong>{salesFilter.from}</strong> →{" "}
            <strong>{salesFilter.to}</strong> with the previous period{" "}
            <strong>{comparisonFilter.from}</strong> →{" "}
            <strong>{comparisonFilter.to}</strong>.
          </small>
        </div>
      </>
    )}
  </div>

  {/* ===== KPI Cards ===== */}
  <div className="row g-3 my-4">
    {[
      { label: "Gross Sales", key: "gross", color: "success" },
      { label: "Refunds", key: "refunds", color: "danger" },
      { label: "Net Sales", key: "net", color: "primary" },
    ].map((kpi, i) => {
      const curr = totals[kpi.key];
      const prev = comparisonTotals[kpi.key];
      const diff = percentChange(curr, prev);
      const arrow = diff >= 0 ? "▲" : "▼";
      const sentence =
        comparisonEnabled && prev > 0
          ? `${kpi.label} ${diff >= 0 ? "increased" : "decreased"} by ${Math.abs(
              diff
            ).toFixed(1)}% compared to the previous period.`
          : "";
      return (
        <div className="col-12 col-md-4" key={i}>
          <motion.div
            whileHover={{ scale: 1.05 }}
            className={`card border-${kpi.color} shadow-sm text-center`}
          >
            <div className="card-body">
              <h6 className={`text-${kpi.color}`}>{kpi.label}</h6>
              <h5>{curr.toFixed(2)}</h5>
              {comparisonEnabled && prev > 0 && (
                <>
                  <p
                    className={`fw-semibold ${
                      diff >= 0 ? "text-success" : "text-danger"
                    } mb-0`}
                  >
                    {arrow} {Math.abs(diff).toFixed(1)}%
                  </p>
                  <small className="text-muted">{sentence}</small>
                </>
              )}
            </div>
          </motion.div>
        </div>
      );
    })}
  </div>

  {/* ===== Sales Trend Chart ===== */}
  <ResponsiveContainer width="100%" height={350}>
    <LineChart>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="_id" />
      <YAxis />
      <Tooltip />
      <Legend />
      <Line
        type="monotone"
        dataKey="grossSales"
        data={salesSummary}
        stroke="#007bff"
        name="Gross (Current)"
      />
      {comparisonEnabled && comparisonSales.length > 0 && (
        <Line
          type="monotone"
          dataKey="grossSales"
          data={comparisonSales}
          stroke="#ffc107"
          name="Gross (Comparison)"
        />
      )}
    </LineChart>
  </ResponsiveContainer>
</section>


        {/* ================= Inventory Health ================= */}
        <section className="mb-5">
          <h5 className="fw-bold text-primary mb-3">📦 Inventory Health</h5>
          <div className="row g-3">
            {[
              { label: "Low Stock", value: inventoryStats.lowStockCount || 0, color: "warning" },
              { label: "Expiring Soon", value: inventoryStats.expiringSoonCount || 0, color: "info" },
              { label: "Expired", value: inventoryStats.expiredCount || 0, color: "secondary" },
            ].map((kpi, i) => (
              <div className="col-12 col-md-4" key={i}>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className={`card border-${kpi.color} shadow-sm text-center`}
                >
                  <div className="card-body">
                    <h6 className={`text-${kpi.color}`}>{kpi.label}</h6>
                    <h5>{kpi.value}</h5>
                  </div>
                </motion.div>
              </div>
            ))}
          </div>
        </section>

        {/* ================= Top Products ================= */}
        <section className="card shadow-sm p-3 mb-5">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-3 gap-3">
            <h5 className="text-primary mb-0">🏆 Top Selling Products</h5>
            <div className="row g-2 g-sm-3 align-items-center w-100 w-md-auto">
              <div className="col-12 col-sm-6 col-md-3">
                <input
                  type="date"
                  value={productsFilter.from}
                  onChange={(e) =>
                    setProductsFilter({ ...productsFilter, from: e.target.value })
                  }
                  className="form-control"
                />
              </div>
              <div className="col-12 col-sm-6 col-md-3">
                <input
                  type="date"
                  value={productsFilter.to}
                  onChange={(e) =>
                    setProductsFilter({ ...productsFilter, to: e.target.value })
                  }
                  className="form-control"
                />
              </div>
              <div className="col-6 col-md-3">
                <button className="btn btn-primary w-100" onClick={fetchTopProducts}>
                  🔍 Apply
                </button>
              </div>
              <div className="col-6 col-md-3">
                <button className="btn btn-outline-secondary w-100" onClick={resetProductsFilter}>
                  ♻️ Reset
                </button>
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topProducts}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="totalSold" fill="#007bff" name="Units Sold" />
            </BarChart>
          </ResponsiveContainer>
        </section>

        {/* ================= Cashier Performance ================= */}
        <section className="card shadow-sm p-3 mb-5">
          <h5 className="text-primary mb-3">👨‍💼 Cashier Performance</h5>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={cashierPerformance}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="cashierName" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="totalSales" fill="#28a745" name="Total Sales ($)" />
            </BarChart>
          </ResponsiveContainer>
        </section>

        {/* ================= Payment Breakdown ================= */}
        <section className="card shadow-sm p-3 mb-4">
          <h5 className="text-primary mb-3">💳 Payment Breakdown</h5>
          <ResponsiveContainer width="100%" height={350}>
            <PieChart>
              <Pie data={payments} dataKey="amount" nameKey="_id" cx="50%" cy="50%" outerRadius={120} label>
                {payments.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </section>
      </div>
    </Layout>
  );
}
