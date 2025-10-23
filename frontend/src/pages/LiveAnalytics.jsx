import React, { useEffect, useState } from "react";
import Layout from "../components/Layout";
import axios from "axios";
import { getToken } from "../utils/auth";
import { motion } from "framer-motion";
import "bootstrap/dist/css/bootstrap.min.css";

export default function LiveAnalytics() {
  const token = getToken();
  const [todayTotals, setTodayTotals] = useState({ gross: 0, refunds: 0, net: 0 });
  const [inventoryStats, setInventoryStats] = useState({});
  const [lastUpdated, setLastUpdated] = useState("");

  // Helper to get local date (yyyy-mm-dd)
  const getLocalDate = () => {
    const today = new Date();
    return today.toLocaleDateString("en-CA"); // ensures correct local date
  };

  const fetchTodaySales = async () => {
    try {
      const localDate = getLocalDate();
      const url = `http://localhost:5000/api/reports/sales/summary?granularity=day&from=${localDate}&to=${localDate}`;
      const res = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });

      const rows = res.data.rows || [];
      if (rows.length === 0) {
        setTodayTotals({ gross: 0, refunds: 0, net: 0 });
      } else {
        const gross = rows.reduce((s, r) => s + (r.grossSales || 0), 0);
        const refunds = rows.reduce((s, r) => s + (r.refunds || 0), 0);
        const net = rows.reduce((s, r) => s + (r.netSales || 0), 0);
        setTodayTotals({ gross, refunds, net });
      }
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (e) {
      console.error("Error fetching today's sales", e);
      setTodayTotals({ gross: 0, refunds: 0, net: 0 });
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
      setInventoryStats({});
    }
  };

  // Auto refresh every 10 seconds, updates after midnight too
  useEffect(() => {
    const fetchAll = () => {
      fetchTodaySales();
      fetchInventory();
    };

    fetchAll();
    const interval = setInterval(fetchAll, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Layout>
      <div className="container py-4">
        <h2 className="fw-bold text-primary mb-4 text-center text-md-start">
        </h2>

        <p className="text-muted mb-4 text-center">
          Last updated: <strong>{lastUpdated || "Loading..."}</strong>
        </p>

        {/* ================== TODAY’S OVERVIEW ================== */}
        <section className="mb-5">
          <h5 className="fw-bold text-primary mb-3">
            📅 Today’s Overview (Auto-updates)
          </h5>
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

        {/* ================== INVENTORY HEALTH ================== */}
        <section className="mb-5">
          <h5 className="fw-bold text-primary mb-3">
            📦 Inventory Health (Auto-updates)
          </h5>
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
      </div>
    </Layout>
  );
}
