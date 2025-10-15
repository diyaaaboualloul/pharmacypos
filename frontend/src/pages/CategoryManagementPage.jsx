import { useEffect, useState } from "react";
import axios from "axios";
import Layout from "../components/Layout";
import { getToken } from "../utils/auth";

export default function CategoryManagementPage() {
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState("");

  // ✅ Fetch all categories with product counts
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

  useEffect(() => {
    fetchCategories();
  }, []);

  // ✅ Create new category
  const handleCreateCategory = async (e) => {
    e.preventDefault();
    try {
      const token = getToken();
      const { data } = await axios.post(
        "http://localhost:5000/api/admin/categories",
        { name, description },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage(data.message);
      setName("");
      setDescription("");
      fetchCategories();
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed to create category");
    }
  };

  // ✅ Delete category
  const handleDeleteCategory = async (id) => {
    if (!window.confirm("Are you sure you want to delete this category?")) return;
    try {
      const token = getToken();
      const { data } = await axios.delete(
        `http://localhost:5000/api/admin/categories/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage(data.message);
      fetchCategories();
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed to delete category");
    }
  };

  return (
    <Layout>
      <div className="card shadow-sm">
        <div className="card-body">
          {/* 🧭 Page Header */}
          <div className="d-flex flex-wrap justify-content-between align-items-center mb-3">
            <h3 className="page-title mb-3 mb-md-0">📂 Category Management</h3>
          </div>

          {/* 📨 Message Box */}
          {message && (
            <div className="alert alert-info py-2 text-center">{message}</div>
          )}

          {/* 📝 Create Category Form */}
          <form onSubmit={handleCreateCategory} className="row g-2 g-md-3 mb-4">
            <div className="col-12 col-md-4">
              <input
                type="text"
                className="form-control"
                placeholder="Category Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="col-12 col-md-6">
              <input
                type="text"
                className="form-control"
                placeholder="Description (optional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="col-12 col-md-2 d-grid">
              <button type="submit" className="btn btn-primary w-100">
                Create
              </button>
            </div>
          </form>

          {/* 📋 Categories Table */}
          <div className="table-responsive">
            <table className="table table-striped table-bordered align-middle">
              <thead className="table-dark">
                <tr>
                  <th>Name</th>
                  <th>Description</th>
                  <th>Products</th> {/* 🆕 Product Count Column */}
                  <th style={{ width: "100px" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {categories.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="text-center">
                      No categories found
                    </td>
                  </tr>
                ) : (
                  categories.map((c) => (
                    <tr key={c._id}>
                      <td>{c.name}</td>
                      <td>{c.description}</td>
                      <td>{c.productCount || 0}</td> {/* 🆕 Display product count */}
                      <td>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDeleteCategory(c._id)}
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
