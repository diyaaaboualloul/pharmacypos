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
useEffect(() => {
  fetchProducts();
  fetchCategories();
}, []);

  useEffect(() => {
    fetchProducts();
  }, []);

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
      setName("");
      setCategory("");
      setPrice("");
      setDescription("");
      fetchProducts();
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed to create product");
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm("Are you sure?")) return;
    try {
      const token = getToken();
      await axios.delete(`http://localhost:5000/api/admin/products/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchProducts();
    } catch (err) {
      console.error("Failed to delete product", err);
    }
  };

  return (
    <Layout>
      <div className="card shadow-sm">
        <div className="card-body">
          <div className="d-flex flex-wrap justify-content-between align-items-center mb-3">
            <h3 className="page-title mb-3 mb-md-0">📦 Product & Inventory Management</h3>
          </div>

          {message && (
            <div className="alert alert-info py-2 text-center">
              {message}
            </div>
          )}

          {/* Create Product Form */}
          <form onSubmit={handleCreateProduct} className="row g-2 g-md-3 mb-4">
            <div className="col-12 col-md-3">
              <input
                type="text"
                className="form-control"
                placeholder="Name"
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
    <option value="">Select category</option>
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
              <button type="submit" className="btn btn-primary w-100">
                Create
              </button>
            </div>
          </form>

          {/* Products Table */}
          <div className="table-responsive">
            <table className="table table-striped table-bordered align-middle">
              <thead className="table-dark">
                <tr>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Description</th>
                  <th>Batches</th>
                  <th style={{ width: "80px" }}>Action</th>
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
                          className="btn btn-danger btn-sm"
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
