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

  const handleRefund = async (id) => {
    if (!window.confirm("Are you sure you want to refund this invoice?")) return;
    try {
      const token = getToken();
      await axios.post(
        `http://localhost:5000/api/pos/refund/${id}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("Refund processed successfully!");
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert("Refund failed: " + (err.response?.data?.message || err.message));
    }
  };

  if (loading)
    return <p className="text-center mt-5">Loading your invoices...</p>;

  return (
      <div className="container mt-4">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px",
          }}
        >
          <h3>🧾 My Invoices</h3>
          <button
            onClick={() => navigate("/cashier/pos")}
            style={{
              backgroundColor: "#0090E4",
              color: "white",
              border: "none",
              borderRadius: "6px",
              padding: "8px 16px",
              fontWeight: "500",
              cursor: "pointer",
            }}
          >
            ← Back to POS
          </button>
        </div>

        {sales.length === 0 ? (
          <p className="text-center text-muted">No invoices yet.</p>
        ) : (
          <table className="table table-bordered mt-3">
            <thead className="table-warning">
              <tr>
                <th>Invoice #</th>
                <th>Date</th>
                <th>Total</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {sales.map((s) => {
                const hasPartialRefund =
                  Array.isArray(s.items) &&
                  s.items.some((i) => i.isRefunded === true);

                const isFullyRefunded = s.total < 0;

                return (
                  <tr key={s._id}>
                    <td>{s.invoiceNumber}</td>
                    <td>{new Date(s.createdAt).toLocaleString()}</td>
                    <td>${s.total.toFixed(2)}</td>
                    <td
                      className={
                        isFullyRefunded ? "text-danger" : "text-success"
                      }
                    >
                      {isFullyRefunded
                        ? "Refunded"
                        : hasPartialRefund
                        ? "Partially Refunded"
                        : "Original"}
                    </td>
                    <td>
                      <button
                        className="btn btn-sm btn-outline-primary me-2"
                        onClick={() => navigate(`/cashier/invoices/${s._id}`)}
                      >
                        View
                      </button>

                      {/* Hide Refund All button if any item is refunded or invoice is refunded */}
                      {!hasPartialRefund && !isFullyRefunded && (
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => handleRefund(s._id)}
                        >
                          Refund All
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
  );
}
