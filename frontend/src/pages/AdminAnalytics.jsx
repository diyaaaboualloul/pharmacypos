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
  const [inventoryStats, setInventoryStats] = useState({});
  const [topProducts, setTopProducts] = useState([]);
  const [cashierPerformance, setCashierPerformance] = useState([]);
  const [payments, setPayments] = useState([]);
  const [totals, setTotals] = useState({ gross: 0, refunds: 0, net: 0 });

  // Filters
  const [salesFilter, setSalesFilter] = useState({ from: "", to: "", granularity: "day" });
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
      const gross = rows.reduce((sum, r) => sum + (r.grossSales || 0), 0);
      const refunds = rows.reduce((sum, r) => sum + (r.refunds || 0), 0);
      const net = rows.reduce((sum, r) => sum + (r.netSales || 0), 0);
      setTotals({ gross, refunds, net });
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
 /* ------------------ Initial Load & Auto Refresh ------------------ */
useEffect(() => {
  // Function to fetch all sections using current filters
  const fetchAllData = () => {
    fetchSalesSummary();   // uses current salesFilter state
    fetchInventory();      // static, no filter
    fetchTopProducts();    // uses current productsFilter state
    fetchCashiers();       // uses current cashiersFilter state
    fetchPayments();       // uses current paymentsFilter state
  };

  // Initial load
  fetchAllData();

  // Auto-refresh every 10 seconds using current filters
  const interval = setInterval(() => {
    fetchAllData();
  }, 10000);

  // Cleanup interval when component unmounts
  return () => clearInterval(interval);
}, [
  salesFilter,
  productsFilter,
  cashiersFilter,
  paymentsFilter
]);

  /* ------------------ Reset Handlers ------------------ */
  const resetSalesFilter = () => setSalesFilter({ from: "", to: "", granularity: "day" });
  const resetProductsFilter = () => setProductsFilter({ from: "", to: "" });
  const resetCashiersFilter = () => setCashiersFilter({ from: "", to: "" });
  const resetPaymentsFilter = () => setPaymentsFilter({ from: "", to: "" });

  /* =======================================================
     UI START
  ======================================================= */
  return (
    <Layout>
      <div className="container py-4">
        <h2 className="fw-bold text-primary mb-4">📊 Admin Analytics Dashboard</h2>

        {/* KPI - Sales Summary */}
        <h5 className="fw-bold text-primary mb-2">💰 Sales Overview</h5>
         <div className="d-flex gap-2">
              <select
                className="form-select"
                style={{ width: 120 }}
                value={salesFilter.granularity}
                onChange={(e) => setSalesFilter({ ...salesFilter, granularity: e.target.value })}
              >
                <option value="day">Daily</option>
                <option value="week">Weekly</option>
                <option value="month">Monthly</option>
              </select>
              <input
                type="date"
                value={salesFilter.from}
                onChange={(e) => setSalesFilter({ ...salesFilter, from: e.target.value })}
                className="form-control"
              />
              <input
                type="date"
                value={salesFilter.to}
                onChange={(e) => setSalesFilter({ ...salesFilter, to: e.target.value })}
                className="form-control"
              />
              <button className="btn btn-primary" onClick={fetchSalesSummary}>
                🔍 Apply
              </button>
              <button className="btn btn-outline-secondary" onClick={resetSalesFilter}>
                ♻️ Reset
              </button>
            </div>
        <div className="row g-3 mb-4">
          {[
            { label: "Gross Sales", value: totals.gross, color: "success" },
            { label: "Refunds", value: totals.refunds, color: "danger" },
            { label: "Net Sales", value: totals.net, color: "primary" },
          ].map((kpi, i) => (
            <div className="col-md-4" key={i}>
              <motion.div whileHover={{ scale: 1.05 }} className={`card border-${kpi.color} shadow-sm text-center`}>
                <div className="card-body">
                  <h6 className={`text-${kpi.color}`}>{kpi.label}</h6>
                  <h5>{kpi.value.toFixed ? kpi.value.toFixed(2) : kpi.value}</h5>
                </div>
              </motion.div>
            </div>
          ))}
        </div>

        {/* KPI - Inventory Health */}
        <h5 className="fw-bold text-primary mb-2">📦 Inventory Health</h5>
        <div className="row g-3 mb-4">
          {[
            { label: "Low Stock", value: inventoryStats.lowStockCount || 0, color: "warning" },
            { label: "Expiring Soon", value: inventoryStats.expiringSoonCount || 0, color: "info" },
            { label: "Expired", value: inventoryStats.expiredCount || 0, color: "secondary" },
          ].map((kpi, i) => (
            <div className="col-md-4" key={i}>
              <motion.div whileHover={{ scale: 1.05 }} className={`card border-${kpi.color} shadow-sm text-center`}>
                <div className="card-body">
                  <h6 className={`text-${kpi.color}`}>{kpi.label}</h6>
                  <h5>{kpi.value}</h5>
                </div>
              </motion.div>
            </div>
          ))}
        </div>

     

        {/* Top Products */}
        <div className="card shadow-sm p-3 mb-4">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="text-primary mb-0">🏆 Top Selling Products</h5>
            <div className="d-flex gap-2">
              <input
                type="date"
                value={productsFilter.from}
                onChange={(e) => setProductsFilter({ ...productsFilter, from: e.target.value })}
                className="form-control"
              />
              <input
                type="date"
                value={productsFilter.to}
                onChange={(e) => setProductsFilter({ ...productsFilter, to: e.target.value })}
                className="form-control"
              />
              <button className="btn btn-primary" onClick={fetchTopProducts}>
                🔍 Apply
              </button>
              <button className="btn btn-outline-secondary" onClick={resetProductsFilter}>
                ♻️ Reset
              </button>
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
        </div>

        {/* Cashier Performance */}
        <div className="card shadow-sm p-3 mb-4">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="text-primary mb-0">👨‍💼 Cashier Performance</h5>
            <div className="d-flex gap-2">
              <input
                type="date"
                value={cashiersFilter.from}
                onChange={(e) => setCashiersFilter({ ...cashiersFilter, from: e.target.value })}
                className="form-control"
              />
              <input
                type="date"
                value={cashiersFilter.to}
                onChange={(e) => setCashiersFilter({ ...cashiersFilter, to: e.target.value })}
                className="form-control"
              />
              <button className="btn btn-primary" onClick={fetchCashiers}>
                🔍 Apply
              </button>
              <button className="btn btn-outline-secondary" onClick={resetCashiersFilter}>
                ♻️ Reset
              </button>
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
        </div>

        {/* Payment Breakdown */}
        <div className="card shadow-sm p-3 mb-4">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="text-primary mb-0">💳 Payment Breakdown</h5>
            <div className="d-flex gap-2">
              <input
                type="date"
                value={paymentsFilter.from}
                onChange={(e) => setPaymentsFilter({ ...paymentsFilter, from: e.target.value })}
                className="form-control"
              />
              <input
                type="date"
                value={paymentsFilter.to}
                onChange={(e) => setPaymentsFilter({ ...paymentsFilter, to: e.target.value })}
                className="form-control"
              />
              <button className="btn btn-primary" onClick={fetchPayments}>
                🔍 Apply
              </button>
              <button className="btn btn-outline-secondary" onClick={resetPaymentsFilter}>
                ♻️ Reset
              </button>
            </div>
          </div>
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
        </div>
      </div>
    </Layout>
  );
}
