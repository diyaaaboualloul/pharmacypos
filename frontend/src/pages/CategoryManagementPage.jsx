import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Layout from "../components/Layout";
import { getToken } from "../utils/auth";
import { motion, AnimatePresence } from "framer-motion"; // ✅ added

export default function CategoryManagementPage() {
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  // ✅ Added confirm & toast states
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [targetCategory, setTargetCategory] = useState(null);
  const [deleteMessage, setDeleteMessage] = useState("");

  const fetchCategories = async () => {
    try {
      const token = getToken();
      const { data } = await axios.get(
        "http://localhost:5000/api/admin/categories",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCategories(data);
    } catch (err) {
      console.error("Failed to fetch categories", err);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    try {
      const token = getToken();
      const { data } = await axios.post(
        "http://localhost:5000/api/admin/categories",
        { name },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage(data.message);
      setName("");
      fetchCategories();
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed to create category");
    }
  };

  // ✅ New delete function (called when confirmed)
  const confirmDeleteCategory = async () => {
    if (!targetCategory?._id) return;
    try {
      const token = getToken();
      const { data } = await axios.delete(
        `http://localhost:5000/api/admin/categories/${targetCategory._id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setConfirmOpen(false);
      setTargetCategory(null);
      fetchCategories();

      setDeleteMessage("✅ Category deleted successfully");
      setTimeout(() => setDeleteMessage(""), 2000);
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed to delete category");
    }
  };

  return (
    <Layout>
      <div className="card shadow-sm">
        <div className="card-body">

          {/* ✅ Centered delete alert */}
          <AnimatePresence>
            {deleteMessage && (
              <motion.div
                className="position-fixed top-50 start-50 translate-middle bg-success text-white px-4 py-2 rounded shadow"
                style={{ zIndex: 2000, fontWeight: 500 }}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.25 }}
              >
                {deleteMessage}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Page Header */}
          <div className="d-flex flex-wrap justify-content-between align-items-center mb-3">
            <h3 className="page-title mb-3 mb-md-0">📂 Category Management</h3>
          </div>

          {/* Message */}
          {message && (
            <div className="alert alert-info py-2 text-center">{message}</div>
          )}

          {/* Create Category Form */}
          <form onSubmit={handleCreateCategory} className="row g-2 g-md-3 mb-4">
            <div className="col-12 col-md-10">
              <input
                type="text"
                className="form-control"
                placeholder="Category Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="col-12 col-md-2 d-grid">
              <button type="submit" className="btn btn-primary w-100">
                Create
              </button>
            </div>
          </form>

          {/* Categories Table */}
          <div className="table-responsive">
            <table className="table table-striped table-bordered align-middle">
              <thead className="table-dark">
                <tr>
                  <th>Name</th>
                  <th>Number of Products</th>
                  <th style={{ width: "100px" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {categories.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="text-center">
                      No categories found
                    </td>
                  </tr>
                ) : (
                  categories.map((c) => (
                    <tr key={c._id}>
                      <td>
                        <button
                          className="btn btn-link p-0"
                          onClick={() =>
                            navigate(`/admin/categories/${c.name}/products`)
                          }
                        >
                          {c.name}
                        </button>
                      </td>
                      <td>{c.productCount || 0}</td>
                      <td>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => {
                            setTargetCategory(c);
                            setConfirmOpen(true);
                          }}
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

      {/* ✅ Custom Confirm Delete Modal */}
      <AnimatePresence>
        {confirmOpen && (
          <motion.div
            className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50 d-flex justify-content-center align-items-center"
            style={{ zIndex: 1999 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="card p-4 shadow-lg"
              style={{ width: 420, borderRadius: 16 }}
              initial={{ scale: 0.9, y: -10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 10 }}
            >
              <h5 className="mb-2">Delete Category?</h5>
              <p className="text-muted mb-4">
                This will permanently remove <strong>{targetCategory?.name}</strong>.
              </p>

              <div className="d-flex gap-2">
                <button
                  className="btn btn-secondary w-50"
                  onClick={() => setConfirmOpen(false)}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-danger w-50"
                  onClick={confirmDeleteCategory}
                  autoFocus
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Layout>
  );
}
