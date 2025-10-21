import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { getToken } from "../utils/auth";
import Layout from "../components/Layout";

export default function CashierInvoiceDetails() {
  const { id: invoiceId } = useParams();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const token = getToken();
        const { data } = await axios.get(
          `http://localhost:5000/api/pos/sales/${invoiceId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setInvoice(data);
      } catch (err) {
        console.error("Failed to fetch invoice details", err);
        alert("Failed to load invoice details");
      } finally {
        setLoading(false);
      }
    };
    fetchInvoice();
  }, [invoiceId]);

  const handleRefundItem = async (productId) => {
    if (!window.confirm("Refund this product?")) return;
    try {
      const token = getToken();
      const { data } = await axios.post(
        `http://localhost:5000/api/pos/refund-item/${invoiceId}`,
        { productId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert(`Refund successful! Ref. Invoice: ${data.refundInvoiceNumber}`);
      window.location.reload();
    } catch (err) {
      alert("Refund failed: " + (err.response?.data?.message || err.message));
    }
  };

  const handleReplacePrompt = async (oldProductId) => {
    const newProductId = prompt("Enter NEW product ID to replace with:");
    const newQuantity = parseInt(prompt("Enter quantity for the new product:"), 10);

    if (!newProductId || !newQuantity || newQuantity <= 0) {
      alert("Invalid input.");
      return;
    }

    await handleReplaceItem(oldProductId, newProductId, newQuantity);
  };

  const handleReplaceItem = async (oldProductId, newProductId, newQuantity) => {
    try {
      const token = getToken();
      const { data } = await axios.post(
        `http://localhost:5000/api/pos/replace-item/${invoiceId}`,
        { oldProductId, newProductId, newQuantity },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert(`✅ Replacement successful: ${data.message}`);
      window.location.reload();
    } catch (err) {
      alert("Replacement failed: " + (err.response?.data?.message || err.message));
    }
  };

  if (loading)
    return <p className="text-center mt-5">Loading invoice details...</p>;

  if (!invoice)
    return <p className="text-center text-danger">Invoice not found.</p>;

  const isRefundedInvoice = invoice.total < 0 || invoice.isRefunded;

  return (
      <div className="container mt-4">
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px",
          }}
        >
          <h3>🧾 Invoice Details</h3>
          <button
            onClick={() => navigate("/cashier/invoices")}
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
            ← Back to Invoices
          </button>
        </div>

        {/* Invoice Summary */}
        <div className="card p-3 mb-3">
          <h5>Invoice Number: {invoice.invoiceNumber}</h5>
          <p>
            <strong>Date:</strong>{" "}
            {new Date(invoice.createdAt).toLocaleString()}
          </p>
          <p>
            <strong>Total:</strong> ${invoice.total.toFixed(2)}
          </p>
          <p>
            <strong>Status:</strong>{" "}
            {isRefundedInvoice ? (
              <span className="text-danger">Refunded</span>
            ) : (
              <span className="text-success">Original</span>
            )}
          </p>
        </div>

        {/* Items Table */}
        <table className="table table-bordered">
          <thead className="table-warning">
            <tr>
              <th>#</th>
              <th>Product</th>
              <th>Category</th>
              <th>Quantity</th>
              <th>Unit Price</th>
              <th>Line Total</th>
              <th>Status</th>
              {/* 🟡 Hide Action column if invoice is refunded */}
              {!isRefundedInvoice && <th>Action</th>}
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item, idx) => (
              <tr key={idx}>
                <td>{idx + 1}</td>
                <td>{item.product?.name}</td>
                <td>{item.product?.category}</td>
                <td>{item.quantity}</td>
                <td>${item.unitPrice.toFixed(2)}</td>
                <td>${item.lineTotal.toFixed(2)}</td>
                <td>
                  {item.isRefunded ? (
                    <span className="text-danger">Refunded</span>
                  ) : (
                    <span className="text-success">Sold</span>
                  )}
                </td>
                {/* 🟡 Hide entire Action cell if invoice is refunded */}
                {!isRefundedInvoice && (
                  <td>
                    {!item.isRefunded && (
                      <div className="d-flex gap-2">
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => handleRefundItem(item.product._id)}
                        >
                          Refund Item
                        </button>
                        <button
                          className="btn btn-sm btn-warning"
                          onClick={() => handleReplacePrompt(item.product._id)}
                        >
                          Replace
                        </button>
                      </div>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
  );
}
