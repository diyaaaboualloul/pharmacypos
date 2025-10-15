import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Layout from "../components/Layout";
import { getToken } from "../utils/auth";

export default function BatchManagementPage() {
  const { productId } = useParams();
  const navigate = useNavigate();

  const [batches, setBatches] = useState([]);
  const [product, setProduct] = useState(null);
  const [batchNumber, setBatchNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [quantity, setQuantity] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [message, setMessage] = useState("");

  // 🟡 Fetch batches for this product
  const fetchBatches = async () => {
    try {
      const token = getToken();
      const { data } = await axios.get(
        `http://localhost:5000/api/admin/batches/product/${productId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setBatches(data);
    } catch (err) {
      console.error("Failed to fetch batches", err);
    }
  };

  // 🟡 Fetch product details for header
  const fetchProduct = async () => {
    try {
      const token = getToken();
      const { data } = await axios.get(
        `http://localhost:5000/api/admin/products/${productId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setProduct(data);
    } catch (err) {
      console.error("Failed to fetch product", err);
    }
  };

  useEffect(() => {
    fetchBatches();
    fetchProduct();
  }, [productId]);

  // 🟢 Create batch
  const handleCreateBatch = async (e) => {
    e.preventDefault();
    try {
      const token = getToken();
      const { data } = await axios.post(
        "http://localhost:5000/api/admin/batches",
        { productId, batchNumber, expiryDate, quantity, costPrice },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage(data.message);
      setBatchNumber("");
      setExpiryDate("");
      setQuantity("");
      setCostPrice("");
      fetchBatches();
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed to create batch");
    }
  };

  // 🔴 Delete batch
  const handleDeleteBatch = async (id) => {
    if (!window.confirm("Are you sure?")) return;
    try {
      const token = getToken();
      await axios.delete(`http://localhost:5000/api/admin/batches/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchBatches();
    } catch (err) {
      console.error("Failed to delete batch", err);
    }
  };

  const getStatusBadge = (status) => {
    if (status === "expired") return <span className="badge bg-danger">Expired</span>;
    if (status === "expiringSoon") return <span className="badge bg-warning text-dark">Expiring Soon</span>;
    return <span className="badge bg-success">Valid</span>;
  };

  return (
    <Layout>
      <div className="card shadow-sm">
        <div className="card-body">
          {/* Header */}
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h3 className="page-title mb-0">
              🧪 Manage Batches {product && <>for <strong>{product.name}</strong></>}
            </h3>
            <button className="btn btn-secondary" onClick={() => navigate(-1)}>
              ← Back
            </button>
          </div>

          {message && <div className="alert alert-info text-center">{message}</div>}

          {/* Create Batch Form */}
          <form onSubmit={handleCreateBatch} className="row g-2 g-md-3 mb-4">
            <div className="col-12 col-md-3">
              <input
                type="text"
                className="form-control"
                placeholder="Batch Number"
                value={batchNumber}
                onChange={(e) => setBatchNumber(e.target.value)}
                required
              />
            </div>
            <div className="col-12 col-md-3">
              <input
                type="date"
                className="form-control"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                required
              />
            </div>
            <div className="col-12 col-md-2">
              <input
                type="number"
                className="form-control"
                placeholder="Quantity"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
              />
            </div>
            <div className="col-12 col-md-2">
              <input
                type="number"
                step="0.01"
                className="form-control"
                placeholder="Cost Price"
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value)}
                required
              />
            </div>
            <div className="col-12 col-md-2 d-grid">
              <button type="submit" className="btn btn-primary w-100">Create</button>
            </div>
          </form>

          {/* Batches Table */}
          <div className="table-responsive">
            <table className="table table-striped table-bordered align-middle">
              <thead className="table-dark">
                <tr>
                  <th>Batch Number</th>
                  <th>Expiry Date</th>
                  <th>Quantity</th>
                  <th>Cost Price</th>
                  <th>Status</th>
                  <th style={{ width: "80px" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {batches.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center">No batches found</td>
                  </tr>
                ) : (
                  batches.map((b) => (
                    <tr key={b._id}>
                      <td>{b.batchNumber}</td>
                      <td>{new Date(b.expiryDate).toLocaleDateString()}</td>
                      <td>{b.quantity}</td>
                      <td>{b.costPrice}</td>
                      <td>{getStatusBadge(b.status)}</td>
                      <td>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDeleteBatch(b._id)}
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}
