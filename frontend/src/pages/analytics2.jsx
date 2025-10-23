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
          case "weeks":
            const [year, week] = period.split("-W");
            const start = new Date(year, 0, (week - 1) * 7 + 1).toISOString().split("T")[0];
            const end = new Date(year, 0, week * 7).toISOString().split("T")[0];
            return `http://localhost:5000/api/reports/sales/summary?granularity=week&from=${start}&to=${end}`;
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

  // -------------------- Helpers --------------------
  const buildDateRange = (mode, value) => {
    switch (mode) {
      case "weeks":
        const [year, week] = value.split("-W");
        const start = new Date(year, 0, (week - 1) * 7 + 1).toISOString().split("T")[0];
        const end = new Date(year, 0, week * 7).toISOString().split("T")[0];
        return { from: start, to: end };
      case "months":
        return { from: `${value}-01`, to: `${value}-31` };
      case "years":
        return { from: `${value}-01-01`, to: `${value}-12-31` };
      default:
        return { from: value, to: value };
    }
  };

  // -------------------- UI --------------------
  return (
    <Layout>
      <div className="container py-4">
        <h2 className="fw-bold text-primary mb-4 text-center text-md-start">
          📊 Admin Analytics Dashboard
        </h2>

        {/* ALERT */}
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
