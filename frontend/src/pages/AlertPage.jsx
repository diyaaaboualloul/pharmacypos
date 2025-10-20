import { useEffect, useState } from "react";
import axios from "axios";
import { getToken } from "../utils/auth";
import Layout from "../components/Layout";

export default function AlertPage() {
  const [alerts, setAlerts] = useState({
    expiredBatches: [],
    expiringSoonBatches: [],
    lowStockProducts: [],
  });
  const [loading, setLoading] = useState(true);

  const fetchAlerts = async () => {
    try {
      const token = getToken();
      const { data } = await axios.get("http://localhost:5000/api/admin/alerts", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAlerts(data);
    } catch (err) {
      console.error("Failed to fetch alerts", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  if (loading) {
    return (
      <Layout>
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status"></div>
        </div>
      </Layout>
    );
  }

  const { expiredBatches, expiringSoonBatches, lowStockProducts } = alerts;

  return (
    <Layout>
      <div className="card shadow-sm">
        <div className="card-body">
          <h3 className="page-title mb-4">🚨 Alerts Dashboard</h3>

          {/* 🟥 Expired Batches */}
          <section className="mb-5">
            <h5 className="mb-3 text-danger">🟥 Expired Batches</h5>
            <div className="table-responsive">
              <table className="table table-bordered table-striped align-middle">
                <thead className="table-dark">
                  <tr>
                    <th>Batch Number</th>
                    <th>Product</th>
                    <th>Expiry Date</th>
                    <th>Quantity</th>
                  </tr>
                </thead>
                <tbody>
                  {expiredBatches.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="text-center text-muted">
                        No expired batches 🎉
                      </td>
                    </tr>
                  ) : (
                    expiredBatches.map((b) => (
                      <tr key={b._id}>
                        <td>{b.batchNumber}</td>
                        <td>{b.product?.name || "N/A"}</td>
                        <td>{new Date(b.expiryDate).toLocaleDateString()}</td>
                        <td>{b.quantity}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* 🟨 Expiring Soon Batches */}
          <section className="mb-5">
            <h5 className="mb-3 text-warning">🟨 Expiring Soon Batches (Next 30 Days)</h5>
            <div className="table-responsive">
              <table className="table table-bordered table-striped align-middle">
                <thead className="table-dark">
                  <tr>
                    <th>Batch Number</th>
                    <th>Product</th>
                    <th>Expiry Date</th>
                    <th>Quantity</th>
                  </tr>
                </thead>
                <tbody>
                  {expiringSoonBatches.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="text-center text-muted">
                        No batches expiring soon ✅
                      </td>
                    </tr>
                  ) : (
                    expiringSoonBatches.map((b) => (
                      <tr key={b._id}>
                        <td>{b.batchNumber}</td>
                        <td>{b.product?.name || "N/A"}</td>
                        <td>{new Date(b.expiryDate).toLocaleDateString()}</td>
                        <td>{b.quantity}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* 🟧 Low Stock Products */}
          <section>
            <h5 className="mb-3 text-primary">🟧 Low Stock Products</h5>
            <div className="table-responsive">
              <table className="table table-bordered table-striped align-middle">
                <thead className="table-dark">
                  <tr>
                    <th>Product Name</th>
                    <th>Category</th>
                    <th>Current Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStockProducts.length === 0 ? (
                    <tr>
                      <td colSpan="3" className="text-center text-muted">
                        No low stock products 🎉
                      </td>
                    </tr>
                  ) : (
                    lowStockProducts.map((p) => (
                      <tr key={p._id}>
                        <td>{p.name}</td>
                        <td>{p.category}</td>
                        <td>{p.totalStock}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </Layout>
  );
}
