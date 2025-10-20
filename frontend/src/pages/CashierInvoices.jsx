import React, { useEffect, useState } from "react";
import axios from "axios";
import { getToken } from "../utils/auth";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";

export default function CashierInvoices() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSales = async () => {
      try {
        const token = getToken();
        const { data } = await axios.get("http://localhost:5000/api/pos/my-sales", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSales(data);
      } catch (err) {
        console.error("Failed to fetch sales", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSales();
  }, []);

  if (loading) return <p className="text-center mt-5">Loading your invoices...</p>;

  return (
      <div className="container mt-4">
        <h3>🧾 My Invoices</h3>
        {sales.length === 0 ? (
          <p className="text-center text-muted">No invoices yet.</p>
        ) : (
          <table className="table table-bordered mt-3">
            <thead className="table-light">
              <tr>
                <th>Invoice #</th>
                <th>Date</th>
                <th>Total</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {sales.map((s) => (
                <tr key={s._id}>
                  <td>{s.invoiceNumber}</td>
                  <td>{new Date(s.createdAt).toLocaleString()}</td>
                  <td>${s.total.toFixed(2)}</td>
                  <td>{s.isEdited ? "Edited" : "Original"}</td>
                  <td>
                    <button
                      className="btn btn-sm btn-outline-primary me-2"
                      onClick={() => navigate(`/cashier/invoices/${s._id}`)}
                    >
                      View
                    </button>
                    <button
                      className="btn btn-sm btn-warning"
                      onClick={() => navigate(`/cashier/invoices/${s._id}/edit`)}
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
  );
}
