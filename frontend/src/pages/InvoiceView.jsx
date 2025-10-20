// frontend/src/pages/InvoiceView.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import { getToken } from "../utils/auth";
import html2pdf from "html2pdf.js";
import Layout from "../components/Layout"; // ✅ Important import

export default function InvoiceView() {
  const { id } = useParams();
  const [sale, setSale] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSale = async () => {
      try {
        const token = getToken();
        const { data } = await axios.get(`http://localhost:5000/api/sales/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSale(data);
      } catch (err) {
        console.error("Failed to fetch invoice", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSale();
  }, [id]);

  const downloadPDF = () => {
    const element = document.getElementById("invoice-content");
    const options = {
      margin: 0.5,
      filename: `Invoice-${sale.invoiceNumber}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: "in", format: "a4", orientation: "portrait" },
    };
    html2pdf().from(element).set(options).save();
  };

  if (loading) return <p className="text-center mt-5">Loading invoice...</p>;
  if (!sale) return <p className="text-center mt-5 text-danger">Invoice not found.</p>;

  return (
        <Layout>
    
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3>🧾 Invoice #{sale.invoiceNumber}</h3>
        <button className="btn btn-success" onClick={downloadPDF}>
          ⬇️ Download PDF
        </button>
      </div>

      <div id="invoice-content" className="card shadow-sm p-4">
        <div className="mb-4 text-center">
          <h2 className="fw-bold">Pharmacy POS</h2>
          <p>Beirut, Lebanon | Tel: +961 70 123 456</p>
        </div>

        <div className="row mb-3">
          <div className="col-md-6">
            <p><strong>Date:</strong> {new Date(sale.createdAt).toLocaleString()}</p>
            <p><strong>Invoice #:</strong> {sale.invoiceNumber}</p>
          </div>
          <div className="col-md-6 text-md-end">
            <p><strong>Cashier:</strong> {sale.cashier?.name}</p>
            <p><strong>Payment Type:</strong> {sale.payment?.type}</p>
          </div>
        </div>

        <table className="table table-bordered">
          <thead className="table-light">
            <tr>
              <th>Item</th>
              <th>Qty</th>
              <th>Unit Price</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {sale.items.map((item, idx) => (
              <tr key={idx}>
                <td>{item.product?.name || "Unknown"}</td>
                <td>{item.quantity}</td>
                <td>${item.unitPrice.toFixed(2)}</td>
                <td>${item.lineTotal.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="text-end mt-3">
          <h5>Subtotal: ${sale.subTotal.toFixed(2)}</h5>
          <h4 className="fw-bold text-success">Total: ${sale.total.toFixed(2)}</h4>
          {sale.payment?.type === "cash" && (
            <>
              <p>Cash Received: ${sale.payment.cashReceived}</p>
              <p>Change: ${sale.payment.change}</p>
            </>
          )}
        </div>

        <p className="mt-4 text-center text-muted">
          Thank you for your purchase! 💊
        </p>
      </div>
    </div>
        </Layout>
    
  );
}
