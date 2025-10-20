// frontend/src/pages/AdminInvoices.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { getToken } from "../utils/auth";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout"; // ✅ Important import

export default function AdminInvoices() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const fetchSales = async () => {
    try {
      setLoading(true);
      const token = getToken();
      const { data } = await axios.get("http://localhost:5000/api/sales/all", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSales(data);
    } catch (err) {
      console.error(err);
      setError("Failed to load invoices");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, []);

  // Filter by cashier name
  const filteredSales = sales.filter((sale) =>
    sale.cashier?.name?.toLowerCase().includes(filter.toLowerCase())
  );

  if (loading) return <p className="text-center mt-5">Loading invoices...</p>;
  if (error) return <p className="text-danger text-center mt-5">{error}</p>;

  return (
        <Layout>
    
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3>📄 Invoices (All Cashiers)</h3>
        <input
          type="text"
          className="form-control"
          placeholder="Search by cashier name..."
          style={{ maxWidth: "300px" }}
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>

      {filteredSales.length === 0 ? (
        <p className="text-center text-muted">No invoices found.</p>
      ) : (
        <div className="table-responsive">
          <table className="table table-bordered table-striped align-middle">
            <thead className="table-warning">
              <tr>
                <th>Invoice #</th>
                <th>Date</th>
                <th>Cashier</th>
                <th>Payment Type</th>
                <th>Total</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredSales.map((sale) => (
                <tr key={sale._id}>
                  <td>{sale.invoiceNumber}</td>
                  <td>{new Date(sale.createdAt).toLocaleString()}</td>
                  <td>{sale.cashier?.name || "Unknown"}</td>
                  <td>{sale.payment?.type}</td>
                  <td>${sale.total.toFixed(2)}</td>
                <td>
  <button
    className="btn btn-sm btn-outline-primary"
    onClick={() => navigate(`/admin/invoices/${sale._id}`)}
  >
    View
  </button>
</td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
        </Layout>
    
  );
}
