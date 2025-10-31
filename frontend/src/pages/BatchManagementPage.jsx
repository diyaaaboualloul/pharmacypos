import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Layout from "../components/Layout";
import { getToken } from "../utils/auth";
import { motion, AnimatePresence } from "framer-motion"; // ✨ Animations

export default function BatchManagementPage() {
  const { productId } = useParams();
  const navigate = useNavigate();

  const [batches, setBatches] = useState([]);
  const [product, setProduct] = useState(null);
  const [form, setForm] = useState({
    supplier: "",
    expiryDate: "",
    quantity: "",
    costPrice: "",
  });
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState("");

  // Filters
  const [filterSupplier, setFilterSupplier] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;

  // 🟡 Fetch batches & product info
  useEffect(() => {
    fetchBatches();
    fetchProduct();
  }, [productId]);

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

  // 🟢 Create batch
  const handleCreateBatch = async (e) => {
    e.preventDefault();
    try {
      const token = getToken();
      const { data } = await axios.post(
        "http://localhost:5000/api/admin/batches",
        { product: productId, ...form },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage(data.message);
      setForm({ supplier: "", expiryDate: "", quantity: "", costPrice: "" });
      setShowForm(false);
      fetchBatches();
    } catch (err) {
      console.error("Batch creation failed", err);
      setMessage("Failed to create batch");
    }
  };

  // 🔴 Delete
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

  // 🟠 Status badge
  const getStatusBadge = (status) => {
    if (status === "expired") return <span className="badge bg-danger">Expired</span>;
    if (status === "expiringSoon")
      return <span className="badge bg-warning text-dark">Expiring Soon</span>;
    return <span className="badge bg-success">Valid</span>;
  };

  // 📊 Filtered batches
  const filteredBatches = batches.filter((b) => {
    const supplierMatch = b.supplier
      ?.toLowerCase()
      .includes(filterSupplier.toLowerCase());
    const statusMatch = filterStatus ? b.status === filterStatus : true;
    const dateMatch = filterDate
      ? new Date(b.expiryDate).toLocaleDateString() ===
        new Date(filterDate).toLocaleDateString()
      : true;
    return supplierMatch && statusMatch && dateMatch;
  });

  // 📄 Pagination
  const totalPages = Math.ceil(filteredBatches.length / itemsPerPage);
  const start = (currentPage - 1) * itemsPerPage;
  const currentBatches = filteredBatches.slice(start, start + itemsPerPage);

  // 📦 Summary Stats
  const total = batches.length;
  const expired = batches.filter((b) => b.status === "expired").length;
  const expiringSoon = batches.filter((b) => b.status === "expiringSoon").length;

  return (
    <Layout>
      <div className="container py-4">
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h3 className="fw-bold text-primary">
            🧪 Batch Management{" "}
            {product && (
              <span className="text-dark">
                for <strong>{product.name}</strong>
              </span>
            )}
          </h3>
          <div className="d-flex gap-2">
            <button className="btn btn-outline-secondary" onClick={() => navigate(-1)}>
              ← Back
            </button>
            <button
              className="btn btn-primary rounded-pill shadow"
              onClick={() => setShowForm(true)}
            >
              ➕ Add Batch
            </button>
          </div>
        </div>

        {/* Cards */}
        <div className="row g-3 mb-4">
          {[
            { title: "Total Batches", value: total, color: "success" },
            { title: "Expiring Soon", value: expiringSoon, color: "warning" },
            { title: "Expired", value: expired, color: "danger" },
          ].map((card, i) => (
            <div className="col-md-4" key={i}>
              <motion.div
                className={`card text-center border-${card.color} shadow-sm`}
                whileHover={{ scale: 1.05 }}
              >
                <div className="card-body">
                  <h6 className={`text-${card.color}`}>{card.title}</h6>
                  <h3>{card.value}</h3>
                </div>
              </motion.div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="row g-3 mb-4">
          <div className="col-md-4">
            <input
              type="text"
              className="form-control"
              placeholder="🔍 Search by supplier..."
              value={filterSupplier}
              onChange={(e) => {
                setFilterSupplier(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
          <div className="col-md-4">
            <select
              className="form-select"
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="">All Statuses</option>
              <option value="valid">Valid</option>
              <option value="expiringSoon">Expiring Soon</option>
              <option value="expired">Expired</option>
            </select>
          </div>
          <div className="col-md-3">
            <input
              type="date"
              className="form-control"
              value={filterDate}
              onChange={(e) => {
                setFilterDate(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
          <div className="col-md-1">
            <button
              className="btn btn-outline-secondary w-100"
              onClick={() => {
                setFilterSupplier("");
                setFilterStatus("");
                setFilterDate("");
              }}
            >
              🧹
            </button>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className="alert alert-info text-center py-2">{message}</div>
        )}

        {/* Table */}
        <div className="table-responsive shadow-sm rounded">
          <table className="table table-hover align-middle">
            <thead className="table-primary text-center">
              <tr>
                <th>#</th>
                <th>Supplier</th>
                <th>Expiry Date</th>
                <th>Quantity</th>
                <th>Cost Price ($)</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {currentBatches.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center text-muted py-3">
                    No batches found.
                  </td>
                </tr>
              ) : (
                currentBatches.map((b, i) => (
                  <tr key={b._id}>
                    <td>{start + i + 1}</td>
                    <td>{b.supplier}</td>
                    <td>{new Date(b.expiryDate).toLocaleDateString()}</td>
                    <td>{b.quantity}</td>
                    <td>{b.costPrice}</td>
                    <td>{getStatusBadge(b.status)}</td>
                    <td>
                      <button
                        className="btn btn-sm btn-danger"
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

        {/* Pagination */}
        <div className="d-flex justify-content-between align-items-center mt-3">
          <span>
            Page {currentPage} of {totalPages}
          </span>
          <div>
            <button
              className="btn btn-outline-primary btn-sm me-2"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(currentPage - 1)}
            >
              ← Prev
            </button>
            <button
              className="btn btn-outline-primary btn-sm"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(currentPage + 1)}
            >
              Next →
            </button>
          </div>
        </div>

        {/* ✨ Animated Add Batch Modal */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50 d-flex justify-content-center align-items-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="card p-4 shadow-lg"
                style={{ width: "400px", borderRadius: "15px" }}
                initial={{ scale: 0.8, y: -50 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.8, y: 50 }}
              >
                <h5 className="text-center mb-3">➕ Add New Batch</h5>
                <form onSubmit={handleCreateBatch}>
                  <input
                    className="form-control mb-3"
                    placeholder="Supplier Name"
                    value={form.supplier}
                    onChange={(e) => setForm({ ...form, supplier: e.target.value })}
                    required
                  />
                  <input
                    type="date"
                    className="form-control mb-3"
                    value={form.expiryDate}
                    onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
                    required
                  />
                  <input
                    type="number"
                    className="form-control mb-3"
                    placeholder="Quantity"
                    value={form.quantity}
                    onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                    required
                  />
                  <input
                    type="number"
                    className="form-control mb-3"
                    placeholder="Cost Price ($)"
                    value={form.costPrice}
                    onChange={(e) => setForm({ ...form, costPrice: e.target.value })}
                    required
                  />
                  <div className="d-flex justify-content-between">
                    <button type="submit" className="btn btn-success w-50 me-2">
                      Add
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary w-50"
                      onClick={() => setShowForm(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
}
