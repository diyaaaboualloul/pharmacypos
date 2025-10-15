// ✅ src/pages/CategoryProductsPage.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { getToken } from "../utils/auth";
import Layout from "../components/Layout";

export default function CategoryProductsPage() {
  const { categoryName } = useParams(); // 👈 get from URL
  const [products, setProducts] = useState([]);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const fetchProducts = async () => {
    try {
      const token = getToken();
      const { data } = await axios.get(
        `http://localhost:5000/api/admin/categories/${categoryName}/products`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setProducts(data);
    } catch (err) {
      console.error("Failed to fetch products for category", err);
      setMessage("Failed to load products.");
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [categoryName]);

  return (
    <Layout>
      <div className="card shadow-sm">
        <div className="card-body">
          <div className="d-flex flex-wrap justify-content-between align-items-center mb-3">
            <h3 className="page-title mb-3 mb-md-0">
              📂 Products in Category: <span className="text-primary">{categoryName}</span>
            </h3>
            <button onClick={() => navigate(-1)} className="btn btn-secondary">
              ← Back
            </button>
          </div>

          {message && <div className="alert alert-danger">{message}</div>}

          <div className="table-responsive">
            <table className="table table-striped table-bordered align-middle">
              <thead className="table-dark">
                <tr>
                  <th>Name</th>
                  <th>Price</th>
                  <th>Description</th>
                  <th>Batches</th>
                </tr>
              </thead>
              <tbody>
                {products.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="text-center">
                      No products found in this category
                    </td>
                  </tr>
                ) : (
                  products.map((p) => (
                    <tr key={p._id}>
                      <td>{p.name}</td>
                      <td>{p.price}</td>
                      <td>{p.description}</td>
                      <td>{p.batches?.length || 0}</td>
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
