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
  Legend,
  ResponsiveContainer,
} from "recharts";
import { motion } from "framer-motion";
import "bootstrap/dist/css/bootstrap.min.css";

export default function AdminAnalytics() {
  const token = getToken();
  const [loading, setLoading] = useState(false);

  const [todayTotals, setTodayTotals] = useState({ gross: 0, refunds: 0, net: 0 });
  const [comparisonMode, setComparisonMode] = useState("days");
  const [period1, setPeriod1] = useState("");
  const [period2, setPeriod2] = useState("");
  const [comparisonData, setComparisonData] = useState([]);
  const [totals1, setTotals1] = useState({ gross: 0, refunds: 0, net: 0 });
  const [totals2, setTotals2] = useState({ gross: 0, refunds: 0, net: 0 });

  const COLORS = { gross: "#007bff", refunds: "#dc3545", net: "#28a745" };

  // Fetch today's sales
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

  // Fetch comparison data
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

  // Fetch today's sales immediately and auto-refresh every 10 seconds
  useEffect(() => {
    fetchTodaySales();
    const interval = setInterval(fetchTodaySales, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Layout>
      <div className="container py-4">
        <h2 className="fw-bold text-primary mb-4 text-center text-md-start">
          📊 Admin Analytics Dashboard
        </h2>

        {/* ================= Today's Sales ================= */}
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
                    <h5>
                      ${todayTotals[kpi.key].toFixed(2)}
                    </h5>
                  </div>
                </motion.div>
              </div>
            ))}
          </div>
        </section>

        {/* ================= Comparison ================= */}
        <section className="mb-5">
          <h5 className="fw-bold text-primary mb-3">🔄 Compare Periods</h5>

          <div className="card border-0 shadow-sm p-3 mb-3 bg-light">
            <div className="row g-3 align-items-end">
              <div className="col-md-3">
                <label className="form-label fw-semibold">Select Comparison Type</label>
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
                <button
                  className="btn btn-primary"
                  onClick={fetchComparison}
                  disabled={loading}
                >
                  {loading ? "Loading..." : "Compare"}
                </button>
              </div>
            </div>
          </div>

          {/* ================= KPI Comparison ================= */}
          {comparisonData.length > 0 && (
            <div className="row g-3 my-4">
              {["gross", "refunds", "net"].map((key, i) => (
                <div className="col-12 col-md-4" key={i}>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className={`card border-${key === "refunds" ? "danger" : key === "net" ? "success" : "primary"} shadow-sm text-center`}
                  >
                    <div className="card-body">
                      <h6 className={`text-${key === "refunds" ? "danger" : key === "net" ? "success" : "primary"}`}>
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
          )}

          {/* ================= Chart ================= */}
          {comparisonData.length > 0 && (
            <div className="card shadow-sm p-3">
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={comparisonData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="gross"
                    stroke={COLORS.gross}
                    name="Gross"
                  />
                  <Line
                    type="monotone"
                    dataKey="refunds"
                    stroke={COLORS.refunds}
                    name="Refunds"
                  />
                  <Line
                    type="monotone"
                    dataKey="net"
                    stroke={COLORS.net}
                    name="Net"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>
      </div>
    </Layout>
  );
}
