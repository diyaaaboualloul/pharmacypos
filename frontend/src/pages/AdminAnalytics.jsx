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
  const [loading, setLoading] = useState(true);
  const [salesSummary, setSalesSummary] = useState([]);
  const [inventoryStats, setInventoryStats] = useState({});
  const [topProducts, setTopProducts] = useState([]);
  const [cashierPerformance, setCashierPerformance] = useState([]);
  const [payments, setPayments] = useState([]); // ✅ array, not object
  const [totals, setTotals] = useState({ gross: 0, refunds: 0, net: 0 });
  const [dateRange, setDateRange] = useState({ from: "", to: "" });

  const COLORS = ["#007bff", "#28a745", "#ffc107", "#dc3545", "#17a2b8", "#6610f2"];

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = getToken();

      const [salesRes, inventoryRes, productsRes, cashiersRes, paymentsRes] =
        await Promise.all([
          axios.get("http://localhost:5000/api/reports/sales/summary?granularity=day", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get("http://localhost:5000/api/reports/inventory/health", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get("http://localhost:5000/api/reports/products/top", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get("http://localhost:5000/api/reports/cashiers/performance", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get("http://localhost:5000/api/reports/payments/breakdown", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

      const rows = Array.isArray(salesRes.data.rows) ? salesRes.data.rows : [];
      setSalesSummary(rows);
      setInventoryStats(inventoryRes.data || {});
      setTopProducts(Array.isArray(productsRes.data) ? productsRes.data : []);
      setCashierPerformance(Array.isArray(cashiersRes.data) ? cashiersRes.data : []);
      setPayments(Array.isArray(paymentsRes.data) ? paymentsRes.data : []);

      // 🧮 Totals
      const gross = rows.reduce((sum, r) => sum + (r.grossSales || 0), 0);
      const refunds = rows.reduce((sum, r) => sum + (r.refunds || 0), 0);
      const net = rows.reduce((sum, r) => sum + (r.netSales || 0), 0);
      setTotals({ gross, refunds, net });
    } catch (err) {
      console.error("Failed to load analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <Layout>
      <div className="container py-4">
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="fw-bold text-primary">📊 Admin Analytics Dashboard</h2>
          <div className="d-flex gap-2">
            <input
              type="date"
              className="form-control"
              style={{ width: "160px" }}
              value={dateRange.from}
              onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
            />
            <input
              type="date"
              className="form-control"
              style={{ width: "160px" }}
              value={dateRange.to}
              onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
            />
            <button className="btn btn-primary" onClick={fetchData}>
              🔍 Apply
            </button>
          </div>
        </div>

        {/* Loading Spinner */}
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status"></div>
            <p className="mt-3">Loading analytics...</p>
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            <div className="row g-3 mb-4">
              {[
                { label: "Gross Sales", value: totals.gross, color: "success" },
                { label: "Refunds", value: totals.refunds, color: "danger" },
                { label: "Net Sales", value: totals.net, color: "primary" },
                { label: "Low Stock", value: inventoryStats.lowStockCount || 0, color: "warning" },
                { label: "Expiring Soon", value: inventoryStats.expiringSoonCount || 0, color: "info" },
                { label: "Expired Batches", value: inventoryStats.expiredCount || 0, color: "secondary" },
              ].map((kpi, i) => (
                <div className="col-md-4 col-lg-2" key={i}>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className={`card border-${kpi.color} shadow-sm text-center`}
                  >
                    <div className="card-body">
                      <h6 className={`text-${kpi.color}`}>{kpi.label}</h6>
                      <h5>{kpi.value.toFixed ? kpi.value.toFixed(2) : kpi.value}</h5>
                    </div>
                  </motion.div>
                </div>
              ))}
            </div>

            {/* Sales Trend */}
            <div className="card shadow-sm p-3 mb-4">
              <h5 className="text-primary mb-3">📈 Daily Sales Trend</h5>
              {salesSummary.length === 0 ? (
                <p className="text-center text-muted py-5">No sales data found.</p>
              ) : (
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart data={salesSummary}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="_id" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="grossSales" stroke="#28a745" name="Gross Sales" />
                    <Line type="monotone" dataKey="refunds" stroke="#dc3545" name="Refunds" />
                    <Line type="monotone" dataKey="netSales" stroke="#007bff" name="Net Sales" />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Top Products & Cashier Performance */}
            <div className="row g-4 mb-4">
              <div className="col-lg-6">
                <div className="card shadow-sm p-3 h-100">
                  <h5 className="text-primary">🏆 Top Selling Products</h5>
                  {topProducts.length === 0 ? (
                    <p className="text-center text-muted py-5">No product data available.</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={topProducts}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="totalSold" fill="#007bff" name="Units Sold" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              <div className="col-lg-6">
                <div className="card shadow-sm p-3 h-100">
                  <h5 className="text-primary">👨‍💼 Cashier Performance</h5>
                  {cashierPerformance.length === 0 ? (
                    <p className="text-center text-muted py-5">No cashier data found.</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={cashierPerformance}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="cashierName" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="totalSales" fill="#28a745" name="Total Sales ($)" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </div>

            {/* Payment Breakdown */}
            <div className="card shadow-sm p-3">
              <h5 className="text-primary">💳 Payment Breakdown</h5>
              {Array.isArray(payments) && payments.length === 0 ? (
                <p className="text-center text-muted py-5">No payment data found.</p>
              ) : (
                <ResponsiveContainer width="100%" height={350}>
                  <PieChart>
                    <Pie
                      data={Array.isArray(payments) ? payments : []}
                      dataKey="amount"
                      nameKey="_id"
                      cx="50%"
                      cy="50%"
                      outerRadius={120}
                      label
                    >
                      {Array.isArray(payments) &&
                        payments.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
