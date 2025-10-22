import { useEffect, useState } from "react";
import axios from "axios";
import { getToken } from "../utils/auth";
import Layout from "../components/Layout";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion"; // 🪄 Smooth animations

export default function ProductManagementPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({ name: "", category: "", price: "" });
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState("");

  // Filters & pagination
  const [filterName, setFilterName] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterStock, setFilterStock] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const navigate = useNavigate();

  // Fetch Data
  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    try {
      const token = getToken();
      const { data } = await axios.get("http://localhost:5000/api/admin/products", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProducts(data);
    } catch (err) {
      console.error("Failed to fetch products", err);
    }
  };

  const fetchCategories = async () => {
    try {
      const token = getToken();
      const { data } = await axios.get("http://localhost:5000/api/admin/categories", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCategories(data);
    } catch (err) {
      console.error("Failed to fetch categories", err);
    }
  };

  // Helpers
  const getTotalQuantity = (p) =>
    p.batches?.reduce((t, b) => t + (b.quantity || 0), 0) || 0;

  const totalProducts = products.length;
  const outOfStock = products.filter((p) => getTotalQuantity(p) === 0).length;
  const lowStock = products.filter(
    (p) => getTotalQuantity(p) > 0 && getTotalQuantity(p) <= 10
  ).length;

  // Filtering
  const filteredProducts = products.filter((p) => {
    const nameMatch = p.name.toLowerCase().includes(filterName.toLowerCase());
    const categoryMatch = filterCategory ? p.category === filterCategory : true;
    const qty = getTotalQuantity(p);
    const stockMatch =
      filterStock === "low"
        ? qty > 0 && qty <= 10
        : filterStock === "out"
        ? qty === 0
        : true;
    return nameMatch && categoryMatch && stockMatch;
  });

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const start = (currentPage - 1) * itemsPerPage;
  const currentProducts = filteredProducts.slice(start, start + itemsPerPage);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = getToken();
      const endpoint = editingId
        ? `http://localhost:5000/api/admin/products/${editingId}`
        : "http://localhost:5000/api/admin/products";
      const method = editingId ? "put" : "post";
      const { data } = await axios[method](endpoint, form, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessage(data.message);
      setForm({ name: "", category: "", price: "" });
      setEditingId(null);
      setShowForm(false);
      fetchProducts();
    } catch (err) {
      setMessage("Operation failed");
    }
  };

  const handleEdit = (p) => {
    setForm({ name: p.name, category: p.category, price: p.price });
    setEditingId(p._id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this product?")) return;
    const token = getToken();
    await axios.delete(`http://localhost:5000/api/admin/products/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchProducts();
  };

  return (
    <Layout>
      <div className="container py-4">
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h3 className="fw-bold text-primary">📦 Product Dashboard</h3>
          <button
            className="btn btn-primary rounded-pill shadow"
            onClick={() => setShowForm(true)}
          >
            ➕ Add Product
          </button>
        </div>

        {/* Summary Cards */}
        <div className="row g-3 mb-4">
          {[
            { title: "Total Products", value: totalProducts, color: "success" },
            { title: "Low Stock (≤10)", value: lowStock, color: "warning" },
            { title: "Out of Stock", value: outOfStock, color: "danger" },
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
              className="form-control"
              placeholder="🔍 Search by name"
              value={filterName}
              onChange={(e) => {
                setFilterName(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
          <div className="col-md-4">
            <select
              className="form-select"
              value={filterCategory}
              onChange={(e) => {
                setFilterCategory(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c._id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="col-md-3">
            <select
              className="form-select"
              value={filterStock}
              onChange={(e) => {
                setFilterStock(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="">All Stock Levels</option>
              <option value="low">Low Stock (≤10)</option>
              <option value="out">Out of Stock</option>
            </select>
          </div>
          <div className="col-md-1">
            <button
              className="btn btn-outline-secondary w-100"
              onClick={() => {
                setFilterName("");
                setFilterCategory("");
                setFilterStock("");
              }}
            >
              🧹
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="table-responsive shadow-sm rounded">
          <table className="table table-hover align-middle">
            <thead className="table-primary text-center">
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Category</th>
                <th>Price ($)</th>
                <th>Qty</th>
                <th>Batches</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentProducts.length ? (
                currentProducts.map((p, i) => (
                  <tr key={p._id}>
                    <td>{start + i + 1}</td>
                    <td>{p.name}</td>
                    <td>{p.category}</td>
                    <td>{p.price}</td>
                    <td
                      className={
                        getTotalQuantity(p) === 0
                          ? "text-danger fw-bold"
                          : getTotalQuantity(p) <= 10
                          ? "text-warning fw-bold"
                          : "text-success fw-bold"
                      }
                    >
                      {getTotalQuantity(p)}
                    </td>
                    <td>
                      <button
                        className="btn btn-link p-0"
                        onClick={() => navigate(`/admin/products/${p._id}/batches`)}
                      >
                        {p.batches?.length || 0}
                      </button>
                    </td>
                    <td>
                      <button
                        className="btn btn-sm btn-warning me-2"
                        onClick={() => handleEdit(p)}
                      >
                        ✏️
                      </button>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDelete(p._id)}
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="text-center text-muted py-3">
                    No products found.
                  </td>
                </tr>
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

        {/* ✨ Animated Modal Form */}
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
                <h5 className="text-center mb-3">
                  {editingId ? "✏️ Edit Product" : "➕ Add New Product"}
                </h5>
                <form onSubmit={handleSubmit}>
                  <input
                    className="form-control mb-3"
                    placeholder="Product Name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                  <select
                    className="form-select mb-3"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    required
                  >
                    <option value="">Select Category</option>
                    {categories.map((c) => (
                      <option key={c._id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    className="form-control mb-3"
                    placeholder="Price"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    required
                  />
                  <div className="d-flex justify-content-between">
                    <button type="submit" className="btn btn-success w-50 me-2">
                      {editingId ? "Update" : "Add"}
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary w-50"
                      onClick={() => {
                        setShowForm(false);
                        setEditingId(null);
                      }}
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
