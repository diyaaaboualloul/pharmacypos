import React, { useState, useEffect } from "react";
import axios from "axios";
import Layout from "../components/Layout";
import { getToken } from "../utils/auth";

export default function ReportsPage() {
  const [period, setPeriod] = useState("daily");
  const [data, setData] = useState({
    totalSales: 0,
    totalExpenses: 0,
    totalPayroll: 0,
    netProfit: 0,
  });

  const api = axios.create({
    baseURL: "http://localhost:5000",
    headers: { Authorization: `Bearer ${getToken()}` },
  });

  const loadReport = async () => {
    try {
      const res = await api.get("/api/reports/summary", { params: { period } });
      setData(res.data);
    } catch (err) {
      console.error("Failed to load report", err);
    }
  };

  const downloadPDF = async () => {
    const url = `http://localhost:5000/api/reports/pdf?period=${period}`;
    const token = getToken();
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const blob = await res.blob();
    const link = document.createElement("a");
    link.href = window.URL.createObjectURL(blob);
    link.download = `report_${period}.pdf`;
    link.click();
  };

  useEffect(() => {
    loadReport();
  }, [period]);

  return (
    <Layout>
      <div className="container py-4">
        <h3 className="mb-4">📈 Reports Dashboard</h3>

        <div className="mb-3">
          <div className="btn-group">
            {["daily", "monthly", "yearly"].map((p) => (
              <button
                key={p}
                className={`btn btn-outline-primary ${
                  period === p ? "active" : ""
                }`}
                onClick={() => setPeriod(p)}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
          <button
            className="btn btn-outline-danger ms-3"
            onClick={downloadPDF}
          >
            Export PDF
          </button>
        </div>

        <div className="card shadow-sm">
          <div className="card-body">
            <table className="table table-bordered text-center">
              <tbody>
                <tr>
                  <th>Total Sales</th>
                  <td>${data.totalSales.toFixed(2)}</td>
                </tr>
                <tr>
                  <th>Total Expenses</th>
                  <td>${data.totalExpenses.toFixed(2)}</td>
                </tr>
                <tr>
                  <th>Total Payroll</th>
                  <td>${data.totalPayroll.toFixed(2)}</td>
                </tr>
                <tr>
                  <th>Net Profit</th>
                  <td
                    style={{
                      color: data.netProfit >= 0 ? "green" : "red",
                      fontWeight: "bold",
                    }}
                  >
                    ${data.netProfit.toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}
