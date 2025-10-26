import React, { useState, useEffect } from "react";
import axios from "axios";
import Layout from "../components/Layout";
import { getToken } from "../utils/auth";

export default function ReportsPage() {
  const [period, setPeriod] = useState("daily");
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0]; // yyyy-mm-dd
  });
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
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
      const params = { period };
      if (period === "daily") params.date = selectedDate;
      if (period === "monthly") params.month = selectedMonth;
      if (period === "yearly") params.year = selectedYear;

      const res = await api.get("/api/reports/summary", { params });
      setData(res.data);
    } catch (err) {
      console.error("Failed to load report", err);
    }
  };

  const downloadPDF = async () => {
    const params = new URLSearchParams({ period });
    if (period === "daily") params.append("date", selectedDate);
    if (period === "monthly") params.append("month", selectedMonth);
    if (period === "yearly") params.append("year", selectedYear);

    const url = `http://localhost:5000/api/reports/pdf?${params.toString()}`;
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
  }, [period, selectedDate, selectedMonth, selectedYear]);

  return (
    <Layout>
      <div className="container py-4">
        <h3 className="mb-4 text-primary">
          📊 Reports Dashboard
        </h3>

        <div className="d-flex flex-wrap align-items-center mb-3 gap-2">
          <div className="btn-group">
            {["daily", "monthly", "yearly"].map((p) => (
              <button
                key={p}
                className={`btn btn-outline-primary ${period === p ? "active" : ""}`}
                onClick={() => setPeriod(p)}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>

          {/* Date / Month / Year Picker */}
          {period === "daily" && (
            <input
              type="date"
              className="form-control"
              style={{ width: "200px" }}
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          )}

          {period === "monthly" && (
            <input
              type="month"
              className="form-control"
              style={{ width: "200px" }}
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            />
          )}

          {period === "yearly" && (
            <input
              type="number"
              className="form-control"
              style={{ width: "120px" }}
              min="2000"
              max={new Date().getFullYear()}
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
            />
          )}

          <button className="btn btn-outline-danger ms-2" onClick={downloadPDF}>
            Export PDF
          </button>
        </div>

        {/* Summary Table */}
        <div className="card shadow-sm border-0">
          <div className="card-body">
            <h5 className="mb-3 text-secondary text-center">
              {period === "daily" && `Report for ${selectedDate}`}
              {period === "monthly" && `Report for ${selectedMonth}`}
              {period === "yearly" && `Report for ${selectedYear}`}
            </h5>

            <table className="table table-bordered text-center align-middle">
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
                    className={`fw-bold ${
                      data.netProfit >= 0 ? "text-success" : "text-danger"
                    }`}
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
