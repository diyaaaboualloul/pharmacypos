import React, { useEffect, useState } from "react";
import Layout from "../components/Layout";
import axios from "axios";
import { getToken } from "../utils/auth";
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
} from "recharts";
import { motion } from "framer-motion";
import "bootstrap/dist/css/bootstrap.min.css";

export default function AdminAnalytics() {
  const token = getToken();
  const COLORS_MAP = { gross: "#007bff", refunds: "#dc3545", net: "#28a745" };

  const [loading, setLoading] = useState(false);

  // --- Sales & Comparison ---
  const [todayTotals, setTodayTotals] = useState({ gross: 0, refunds: 0, net: 0 });
  const [comparisonMode, setComparisonMode] = useState("days");
  const [period1, setPeriod1] = useState("");
  const [period2, setPeriod2] = useState("");
  const [comparisonData, setComparisonData] = useState([]);
  const [totals1, setTotals1] = useState({ gross: 0, refunds: 0, net: 0 });
  const [totals2, setTotals2] = useState({ gross: 0, refunds: 0, net: 0 });

  // --- Other Stats ---
  const [inventoryStats, setInventoryStats] = useState({});
  const [topProducts, setTopProducts] = useState([]);
  const [cashierPerformance, setCashierPerformance] = useState([]);

  // --- Filters ---
  const [productsFilter, setProductsFilter] = useState({ from: "", to: "" });
  const [cashierFilterMode, setCashierFilterMode] = useState("days");
  const [cashiersFilter, setCashiersFilter] = useState({ from: "", to: "" });
  const [alertMessage, setAlertMessage] = useState("");

  // -------------------- Helper --------------------
  const buildDateRange = (mode, value) => {
    switch (mode) {
      case "weeks": {
        const [year, week] = value.split("-W");
        const start = new Date(year, 0, (week - 1) * 7 + 1).toISOString().split("T")[0];
        const end = new Date(year, 0, week * 7).toISOString().split("T")[0];
        return { from: start, to: end };
      }
      case "months":
        return { from: `${value}-01`, to: `${value}-31` };
      case "years":
        return { from: `${value}-01-01`, to: `${value}-12-31` };
      default:
        return { from: value, to: value };
    }
  };

  // -------------------- Fetchers --------------------
  const fetchTodaySales = async () => {
    try {
      const today = new Date().toISOString().split("T")[0];
      const url = `http://localhost:5000/api/reports/sales/summary?granularity=day&from=${today}&to=${today}`;
      const res = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
      const rows = res.data.rows || [];
      const gross = rows.reduce((s, r) => s + (r.grossSales || 0), 0);
      const refunds = rows.reduce((s, r) => s + (r.refunds || 0), 0);
      const net = rows.reduce((s, r) => s + (r.netSales || 0), 0);
      setTodayTotals({ gross, refunds, net });
    } catch (e) {
      console.error("Error fetching today's sales", e);
    }
  };

  const fetchInventory = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/reports/inventory/health", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setInventoryStats(res.data || {});
    } catch (e) {
      console.error("Inventory fetch error", e);
    }
  };

  const fetchTopProducts = async () => {
    const { from, to } = productsFilter;
    if (!from || !to) {
      setAlertMessage("⚠️ Please select both start and end dates for top selling products.");
      return;
    }
    try {
      const url = `http://localhost:5000/api/reports/products/top?from=${from}&to=${to}`;
      const res = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
      setTopProducts(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error("Top products fetch error", e);
    }
  };

  const fetchCashiers = async () => {
    const { from, to } = cashiersFilter;
    try {
      const url = `http://localhost:5000/api/reports/cashiers/performance${
        from || to ? `?${from ? `from=${from}` : ""}${to ? `&to=${to}` : ""}` : ""
      }`;
      const res = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
      setCashierPerformance(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error("Cashier performance fetch error", e);
    }
  };

  const fetchComparison = async () => {
    if (!period1 || !period2) return alert("Please select both periods.");
    setLoading(true);

    try {
      const getURL = (period) => {
        switch (comparisonMode) {
          case "weeks": {
            const [year, week] = period.split("-W");
            const start = new Date(year, 0, (week - 1) * 7 + 1).toISOString().split("T")[0];
            const end = new Date(year, 0, week * 7).toISOString().split("T")[0];
            return `http://localhost:5000/api/reports/sales/summary?granularity=week&from=${start}&to=${end}`;
          }
          case "months":
            return `http://localhost:5000/api/reports/sales/summary?granularity=month&from=${period}-01&to=${period}-31`;
          case "years":
            return `http://localhost:5000/api/reports/sales/summary?granularity=year&from=${period}-01-01&to=${period}-12-31`;
          default:
            return `http://localhost:5000/api/reports/sales/summary?granularity=day&from=${period}&to=${period}`;
        }
      };

      const [res1, res2] = await Promise.all([
        axios.get(getURL(period1), { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(getURL(period2), { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      const sumTotals = (rows) => ({
        gross: rows.reduce((s, r) => s + (r.grossSales || 0), 0),
        refunds: rows.reduce((s, r) => s + (r.refunds || 0), 0),
        net: rows.reduce((s, r) => s + (r.netSales || 0), 0),
      });

      const data1 = sumTotals(res1.data.rows || []);
      const data2 = sumTotals(res2.data.rows || []);

      setTotals1(data1);
      setTotals2(data2);
      setComparisonData([
        { name: period1, ...data1 },
        { name: period2, ...data2 },
      ]);
    } catch (e) {
      console.error("Comparison fetch error", e);
      alert("Failed to fetch comparison data.");
    } finally {
      setLoading(false);
    }
  };

  // -------------------- Auto Refresh --------------------
  useEffect(() => {
    fetchTodaySales();
    fetchInventory();
    fetchCashiers();
    const interval = setInterval(() => {
      fetchTodaySales();
      fetchInventory();
      fetchCashiers();
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  // -------------------- UI --------------------
  return (
    <Layout>
      <div className="container py-4">
        <h2 className="fw-bold text-primary mb-4 text-center text-md-start">
          📊 Admin Analytics Dashboard
        </h2>

        {alertMessage && (
          <div className="alert alert-warning alert-dismissible fade show" role="alert">
            {alertMessage}
            <button type="button" className="btn-close" onClick={() => setAlertMessage("")}></button>
          </div>
        )}

        {/* ================== TODAY'S SALES ================== */}
        <section className="mb-5">
          <h5 className="fw-bold text-primary mb-3">📅 Today’s Overview</h5>
          <div className="row g-3">
            {[
              { label: "Gross Sales", key: "gross", color: "primary" },
              { label: "Refunds", key: "refunds", color: "danger" },
              { label: "Net Sales", key: "net", color: "success" },
            ].map((kpi, i) => (
              <div className="col-12 col-md-4" key={i}>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className={`card border-${kpi.color} shadow-sm text-center`}
                >
                  <div className="card-body">
                    <h6 className={`text-${kpi.color}`}>{kpi.label}</h6>
                    <h5>${todayTotals[kpi.key].toFixed(2)}</h5>
                  </div>
                </motion.div>
              </div>
            ))}
          </div>
        </section>

        {/* ================== COMPARISON ================== */}
        <section className="mb-5">
          <h5 className="fw-bold text-primary mb-3">🔄 Compare Periods</h5>
          <div className="card border-0 shadow-sm p-3 mb-3 bg-light">
            <div className="row g-3 align-items-end">
              <div className="col-md-3">
                <label className="form-label fw-semibold">Comparison Type</label>
                <select
                  className="form-select"
                  value={comparisonMode}
                  onChange={(e) => {
                    setComparisonMode(e.target.value);
                    setPeriod1("");
                    setPeriod2("");
                  }}
                >
                  <option value="days">Days</option>
                  <option value="weeks">Weeks</option>
                  <option value="months">Months</option>
                  <option value="years">Years</option>
                </select>
              </div>
              <div className="col-md-3">
                <label className="form-label fw-semibold">First Period</label>
                <input
                  type={
                    comparisonMode === "weeks"
                      ? "week"
                      : comparisonMode === "months"
                      ? "month"
                      : comparisonMode === "years"
                      ? "number"
                      : "date"
                  }
                  placeholder={comparisonMode === "years" ? "e.g. 2024" : ""}
                  className="form-control"
                  value={period1}
                  onChange={(e) => setPeriod1(e.target.value)}
                />
              </div>
              <div className="col-md-3">
                <label className="form-label fw-semibold">Second Period</label>
                <input
                  type={
                    comparisonMode === "weeks"
                      ? "week"
                      : comparisonMode === "months"
                      ? "month"
                      : comparisonMode === "years"
                      ? "number"
                      : "date"
                  }
                  placeholder={comparisonMode === "years" ? "e.g. 2025" : ""}
                  className="form-control"
                  value={period2}
                  onChange={(e) => setPeriod2(e.target.value)}
                />
              </div>
              <div className="col-md-3 d-grid">
                <button className="btn btn-primary" onClick={fetchComparison} disabled={loading}>
                  {loading ? "Loading..." : "Compare"}
                </button>
              </div>
            </div>
          </div>

          {comparisonData.length > 0 && (
            <>
              <div className="row g-3 my-4">
                {["gross", "refunds", "net"].map((key, i) => (
                  <div className="col-12 col-md-4" key={i}>
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      className={`card border-${
                        key === "refunds" ? "danger" : key === "net" ? "success" : "primary"
                      } shadow-sm text-center`}
                    >
                      <div className="card-body">
                        <h6
                          className={`text-${
                            key === "refunds" ? "danger" : key === "net" ? "success" : "primary"
                          }`}
                        >
                          {key.charAt(0).toUpperCase() + key.slice(1)} Sales
                        </h6>
                        <h5>
                          ${totals1[key].toFixed(2)} → ${totals2[key].toFixed(2)}
                        </h5>
                        <p
                          className={`fw-semibold ${
                            totals2[key] >= totals1[key] ? "text-success" : "text-danger"
                          } mb-0`}
                        >
                          {totals2[key] >= totals1[key] ? "▲" : "▼"}{" "}
                          {Math.abs(
                            ((totals2[key] - totals1[key]) / totals1[key]) * 100 || 0
                          ).toFixed(1)}%
                        </p>
                      </div>
                    </motion.div>
                  </div>
                ))}
              </div>

              <div className="card shadow-sm p-3">
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart data={comparisonData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="gross" stroke={COLORS_MAP.gross} name="Gross" />
                    <Line
                      type="monotone"
                      dataKey="refunds"
                      stroke={COLORS_MAP.refunds}
                      name="Refunds"
                    />
                    <Line type="monotone" dataKey="net" stroke={COLORS_MAP.net} name="Net" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
        </section>

        {/* ================== INVENTORY HEALTH ================== */}
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

        {/* ================== TOP SELLING PRODUCTS ================== */}
        <section className="card shadow-sm p-3 mb-5">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-3 gap-3">
            <h5 className="text-primary mb-0">🏆 Top Selling Products</h5>
            <div className="row g-2 align-items-center w-100 w-md-auto">
              <div className="col-sm-6 col-md-3">
                <label className="form-label">From</label>
                <input
                  type="date"
                  className="form-control"
                  value={productsFilter.from}
                  onChange={(e) =>
                    setProductsFilter({ ...productsFilter, from: e.target.value })
                  }
                />
              </div>
              <div className="col-sm-6 col-md-3">
                <label className="form-label">To</label>
                <input
                  type="date"
                  className="form-control"
                  value={productsFilter.to}
                  onChange={(e) =>
                    setProductsFilter({ ...productsFilter, to: e.target.value })
                  }
                />
              </div>
              <div className="col-sm-6 col-md-3 d-grid">
                <button className="btn btn-primary" onClick={fetchTopProducts}>
                  🔍 Apply
                </button>
              </div>
              <div className="col-sm-6 col-md-3 d-grid">
                <button
                  className="btn btn-outline-secondary"
                  onClick={() => setProductsFilter({ from: "", to: "" })}
                >
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

        {/* ================== CASHIER PERFORMANCE ================== */}
         <section className="card shadow-sm p-3 mb-5">
                 <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-3 gap-3">
                   <h5 className="text-primary mb-0">👨‍💼 Cashier Performance</h5>
       
                   <div className="row g-2 align-items-center w-100 w-md-auto">
                     <div className="col-sm-6 col-md-3">
                       <label className="form-label fw-semibold">Filter Type</label>
                       <select
                         className="form-select"
                         value={cashierFilterMode}
                         onChange={(e) => {
                           setCashierFilterMode(e.target.value);
                           setCashiersFilter({ from: "", to: "" });
                         }}
                       >
                         <option value="days">Day</option>
                         <option value="weeks">Week</option>
                         <option value="months">Month</option>
                         <option value="years">Year</option>
                       </select>
                     </div>
       
                     <div className="col-sm-6 col-md-3">
                       <label className="form-label fw-semibold">Select Period</label>
                       <input
                         type={
                           cashierFilterMode === "weeks"
                             ? "week"
                             : cashierFilterMode === "months"
                             ? "month"
                             : cashierFilterMode === "years"
                             ? "number"
                             : "date"
                         }
                         placeholder={cashierFilterMode === "years" ? "e.g. 2024" : ""}
                         className="form-control"
                         value={cashiersFilter.from}
                         onChange={(e) => {
                           const { from, to } = buildDateRange(cashierFilterMode, e.target.value);
                           setCashiersFilter({ from, to });
                         }}
                       />
                     </div>
       
                     <div className="col-sm-6 col-md-3 d-grid">
                       <button className="btn btn-primary" onClick={fetchCashiers}>
                         🔍 Apply
                       </button>
                     </div>
       
                     <div className="col-sm-6 col-md-3 d-grid">
                       <button
                         className="btn btn-outline-secondary"
                         onClick={() => setCashiersFilter({ from: "", to: "" })}
                       >
                         ♻️ Reset
                       </button>
                     </div>
                   </div>
                 </div>
       
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
             </div>
           </Layout>
         );
       }