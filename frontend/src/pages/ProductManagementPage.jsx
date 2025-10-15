import { useEffect, useState } from "react";
import axios from "axios";
import { getToken } from "../utils/auth";
import Layout from "../components/Layout";

export default function ProductManagementPage() {
  const [products, setProducts] = useState([]);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState("");
  const [categories, setCategories] = useState([]);
  const [editingProductId, setEditingProductId] = useState(null); // ✏️ Track editing product

  // ✅ Fetch all products
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

  // ✅ Fetch categories for select dropdown
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
    fetchProducts();
    fetchCategories();
  }, []);

  // ✅ Create new product
  const handleCreateProduct = async (e) => {
    e.preventDefault();
    try {
      const token = getToken();
      const { data } = await axios.post(
        "http://localhost:5000/api/admin/products",
        { name, category, price, description },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage(data.message);
      resetForm();
      fetchProducts();
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed to create product");
    }
  };

  // ✅ Update existing product
  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    try {
      const token = getToken();
      const { data } = await axios.put(
        `http://localhost:5000/api/admin/products/${editingProductId}`,
        { name, category, price, description },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage(data.message);
      resetForm();
      fetchProducts();
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed to update product");
    }
  };

  // ✏️ Fill form with selected product for editing
  const handleEditProduct = (product) => {
    setEditingProductId(product._id);
    setName(product.name);
    setCategory(product.category);
    setPrice(product.price);
    setDescription(product.description || "");
  };

  // 🧼 Reset form to initial state
  const resetForm = () => {
    setEditingProductId(null);
    setName("");
    setCategory("");
    setPrice("");
    setDescription("");
  };

  // 🗑️ Delete product
  const handleDeleteProduct = async (id) => {
    if (!window.confirm("Are you sure?")) return;
    try {
      const token = getToken();
      const { data } = await axios.delete(
        `http://localhost:5000/api/admin/products/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage(data.message);
      fetchProducts();
    } catch (err) {
      console.error("Failed to delete product", err);
    }
  };

  return (
    <Layout>
      <div className="card shadow-sm">
        <div className="card-body">
          {/* 🔸 Header */}
          <div className="d-flex flex-wrap justify-content-between align-items-center mb-3">
            <h3 className="page-title mb-3 mb-md-0">📦 Product & Inventory Management</h3>
          </div>

          {/* 🔸 Messages */}
          {message && (
            <div className="alert alert-info py-2 text-center">{message}</div>
          )}

          {/* 📝 Create / Update Product Form */}
          <form
            onSubmit={editingProductId ? handleUpdateProduct : handleCreateProduct}
            className="row g-2 g-md-3 mb-4"
          >
            <div className="col-12 col-md-3">
              <input
                type="text"
                className="form-control"
                placeholder="Product Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="col-12 col-md-3">
              <select
                className="form-select"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
              >
                <option value="">Select Category</option>
                {categories.map((c) => (
                  <option key={c._id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-12 col-md-2">
              <input
                type="number"
                className="form-control"
                placeholder="Price"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
              />
            </div>

            <div className="col-12 col-md-3">
              <input
                type="text"
                className="form-control"
                placeholder="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="col-12 col-md-1 d-grid">
              <button type="submit" className={`btn ${editingProductId ? "btn-warning" : "btn-primary"} w-100`}>
                {editingProductId ? "Update" : "Create"}
              </button>
            </div>
          </form>

          {/* 📋 Products Table */}
          <div className="table-responsive">
            <table className="table table-striped table-bordered align-middle">
              <thead className="table-dark">
                <tr>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Description</th>
                  <th>Batches</th>
                  <th style={{ width: "100px" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {products.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center">
                      No products found
                    </td>
                  </tr>
                ) : (
                  products.map((p) => (
                    <tr key={p._id}>
                      <td>{p.name}</td>
                      <td>{p.category}</td>
                      <td>{p.price}</td>
                      <td>{p.description}</td>
                      <td>{p.batches?.length || 0}</td>
                      <td>
                        <button
                          className="btn btn-sm btn-warning me-2"
                          onClick={() => handleEditProduct(p)}
                        >
                          ✏️
                        </button>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => handleDeleteProduct(p._id)}
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
