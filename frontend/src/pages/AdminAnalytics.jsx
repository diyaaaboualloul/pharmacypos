// src/pages/AdminAnalytics.jsx
import React, { useState } from "react";
import Layout from "../components/Layout";
import axios from "axios";
import { getToken } from "../utils/auth";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, BarChart, Bar,
} from "recharts";
import { motion } from "framer-motion";
import "bootstrap/dist/css/bootstrap.min.css";

export default function AdminAnalytics() {
  const token = getToken();
  const COLORS_MAP = { gross: "#007bff", refunds: "#dc3545", net: "#28a745" };

  const [comparisonMode, setComparisonMode] = useState("days");
  const [period1, setPeriod1] = useState("");
  const [period2, setPeriod2] = useState("");
  const [comparisonData, setComparisonData] = useState([]);
  const [totals1, setTotals1] = useState({ gross: 0, refunds: 0, net: 0 });
  const [totals2, setTotals2] = useState({ gross: 0, refunds: 0, net: 0 });

  const [productsFilter, setProductsFilter] = useState({ from: "", to: "" });
  const [topProducts, setTopProducts] = useState([]);
  const [cashierPerformance, setCashierPerformance] = useState([]);
  const [cashierFilterMode, setCashierFilterMode] = useState("days");
  const [cashiersFilter, setCashiersFilter] = useState({ from: "", to: "" });
  const [alertMessage, setAlertMessage] = useState("");

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

  // ---- Fetch Comparison ----
  const fetchComparison = async () => {
    if (!period1 || !period2) return alert("Please select both periods.");
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
    setComparisonData([{ name: period1, ...data1 }, { name: period2, ...data2 }]);
  };

  const fetchTopProducts = async () => {
    const { from, to } = productsFilter;
    if (!from || !to) return setAlertMessage("⚠️ Select both dates.");
    const url = `http://localhost:5000/api/reports/products/top?from=${from}&to=${to}`;
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

  return (
    <Layout>
      <div className="container py-4">
        <h2 className="fw-bold text-primary mb-4">📊 Admin Analytics Dashboard</h2>

        {alertMessage && (
          <div className="alert alert-warning">{alertMessage}</div>
        )}

        {/* ================== COMPARISON ================== */}
        <section className="mb-5">
          <h5 className="fw-bold text-primary mb-3">🔄 Compare Periods</h5>
          <div className="card border-0 shadow-sm p-3 bg-light mb-3">
            <div className="row g-3 align-items-end">
              <div className="col-md-3">
                <label>Type</label>
                <select className="form-select" value={comparisonMode} onChange={(e) => setComparisonMode(e.target.value)}>
                  <option value="days">Days</option>
                  <option value="weeks">Weeks</option>
                  <option value="months">Months</option>
                  <option value="years">Years</option>
                </select>
              </div>
              <div className="col-md-3">
                <label>First</label>
                <input type={comparisonMode === "weeks" ? "week" : comparisonMode === "months" ? "month" : comparisonMode === "years" ? "number" : "date"} className="form-control" value={period1} onChange={(e) => setPeriod1(e.target.value)} />
              </div>
              <div className="col-md-3">
                <label>Second</label>
                <input type={comparisonMode === "weeks" ? "week" : comparisonMode === "months" ? "month" : comparisonMode === "years" ? "number" : "date"} className="form-control" value={period2} onChange={(e) => setPeriod2(e.target.value)} />
              </div>
              <div className="col-md-3 d-grid">
                <button className="btn btn-primary" onClick={fetchComparison}>Compare</button>
              </div>
            </div>
          </div>

          {comparisonData.length > 0 && (
            <div className="card shadow-sm p-3">
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={comparisonData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="gross" stroke={COLORS_MAP.gross} name="Gross" />
                  <Line type="monotone" dataKey="refunds" stroke={COLORS_MAP.refunds} name="Refunds" />
                  <Line type="monotone" dataKey="net" stroke={COLORS_MAP.net} name="Net" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>

        {/* ================== TOP PRODUCTS ================== */}
        <section className="card shadow-sm p-3 mb-5">
          <h5 className="text-primary mb-3">🏆 Top Selling Products</h5>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topProducts}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="totalSold" fill="#007bff" />
            </BarChart>
          </ResponsiveContainer>
        </section>

        {/* ================== CASHIER PERFORMANCE ================== */}
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
      </div>
    </Layout>
  );
}
