    // frontend/src/pages/InvoiceEdit.jsx
    import React, { useEffect, useState } from "react";
    import axios from "axios";
    import { useParams, useNavigate } from "react-router-dom";
    import { getToken } from "../utils/auth";
    import Layout from "../components/Layout";

    export default function InvoiceEdit() {
      const { id } = useParams(); // invoice ID
      const navigate = useNavigate();

      const [sale, setSale] = useState(null);
      const [cart, setCart] = useState([]);
      const [products, setProducts] = useState([]);
      const [search, setSearch] = useState("");
      const [loading, setLoading] = useState(true);
      const [message, setMessage] = useState("");

      // 🧾 Fetch existing invoice
      useEffect(() => {
        const fetchSale = async () => {
          try {
            const token = getToken();
            const { data } = await axios.get(`http://localhost:5000/api/sales/${id}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            setSale(data);
            setCart(
              data.items.map((item) => ({
                _id: item.product?._id || item.product,
                name: item.product?.name || "Unknown",
                price: item.unitPrice,
                quantity: item.quantity,
              }))
            );
          } catch (err) {
            console.error("Failed to load invoice:", err);
          } finally {
            setLoading(false);
          }
        };
        fetchSale();
      }, [id]);

      // 🔍 Fetch products for replacement or addition
      useEffect(() => {
        const fetchProducts = async () => {
          try {
            const token = getToken();
            const { data } = await axios.get(
              `http://localhost:5000/api/pos/search?q=${encodeURIComponent(search)}`,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            setProducts(data);
          } catch (err) {
            console.error("Failed to fetch products:", err);
          }
        };

        if (search.trim().length >= 2) {
          fetchProducts();
        } else {
          setProducts([]);
        }
      }, [search]);

      // ➕ Add product to edited invoice
      const handleAddToCart = (product) => {
        setCart((prev) => {
          const existing = prev.find((item) => item._id === product._id);
          if (existing) {
            return prev.map((item) =>
              item._id === product._id
                ? { ...item, quantity: item.quantity + 1 }
                : item
            );
          }
          return [...prev, { ...product, quantity: 1 }];
        });
      };

      // ❌ Remove product
      const handleRemoveFromCart = (id) => {
        setCart((prev) => prev.filter((item) => item._id !== id));
      };

      // 💾 Save updated invoice
      const handleUpdateInvoice = async () => {
        try {
          const token = getToken();
          const payload = {
            items: cart.map((item) => ({
              productId: item._id,
              name: item.name,
              quantity: item.quantity,
              price: item.price,
            })),
            notes: "Invoice updated by admin/cashier",
          };

          await axios.put(`http://localhost:5000/api/pos/sales/${id}`, payload, {
            headers: { Authorization: `Bearer ${token}` },
          });

          setMessage("✅ Invoice updated successfully!");
          setTimeout(() => navigate("/admin/invoices"), 2000);
        } catch (err) {
          console.error("Failed to update invoice:", err);
          setMessage("❌ Failed to update invoice.");
        }
      };

      const total = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);

      if (loading) return <p className="text-center mt-5">Loading invoice...</p>;
      if (!sale) return <p className="text-center mt-5 text-danger">Invoice not found.</p>;

      return (
        <Layout>
          <div className="container mt-4">
            <h3 className="mb-3">📝 Edit Invoice #{sale.invoiceNumber}</h3>

            {message && (
              <div
                className={`alert ${
                  message.includes("✅") ? "alert-success" : "alert-danger"
                } text-center`}
              >
                {message}
              </div>
            )}

            <div className="row">
              {/* LEFT: Product Search */}
              <div className="col-md-6">
                <div className="card mb-3">
                  <div className="card-header bg-primary text-white">
                    <h5 className="mb-0">🔍 Add / Replace Products</h5>
                  </div>
                  <div className="card-body">
                    <input
                      type="text"
                      placeholder="Search product..."
                      className="form-control mb-3"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />

                    {products.length > 0 ? (
                      <table className="table table-sm table-hover align-middle">
                        <thead>
                          <tr>
                            <th>Name</th>
                            <th>Category</th>
                            <th>Price</th>
                            <th></th>
                          </tr>
                        </thead>
                        <tbody>
                          {products.map((product) => (
                            <tr key={product._id}>
                              <td>{product.name}</td>
                              <td>{product.category}</td>
                              <td>${product.price.toFixed(2)}</td>
                              <td>
                                <button
                                  className="btn btn-success btn-sm"
                                  onClick={() => handleAddToCart(product)}
                                >
                                  + Add
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <p className="text-center text-muted">
                        Type at least 2 letters to search.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* RIGHT: Current Invoice Items */}
              <div className="col-md-6">
                <div className="card mb-3">
                  <div className="card-header bg-warning text-dark">
                    <h5 className="mb-0">🛒 Current Items</h5>
                  </div>
                  <div className="card-body">
                    {cart.length > 0 ? (
                      <>
                        <table className="table table-sm table-bordered mb-3">
                          <thead className="table-light">
                            <tr>
                              <th>Item</th>
                              <th>Qty</th>
                              <th>Price</th>
                              <th>Total</th>
                              <th></th>
                            </tr>
                          </thead>
                          <tbody>
                            {cart.map((item) => (
                              <tr key={item._id}>
                                <td>{item.name}</td>
                                <td>
                                  <input
                                    type="number"
                                    min="1"
                                    className="form-control form-control-sm text-center"
                                    value={item.quantity}
                                    onChange={(e) => {
                                      const newQty = parseInt(e.target.value) || 1;
                                      setCart((prev) =>
                                        prev.map((p) =>
                                          p._id === item._id
                                            ? { ...p, quantity: newQty }
                                            : p
                                        )
                                      );
                                    }}
                                  />
                                </td>
                                <td>${item.price.toFixed(2)}</td>
                                <td>${(item.price * item.quantity).toFixed(2)}</td>
                                <td className="text-center">
                                  <button
                                    className="btn btn-outline-danger btn-sm"
                                    title="Remove item"
                                    onClick={() => handleRemoveFromCart(item._id)}
                                  >
                                    ✖
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>

                        <div className="text-end">
                          <h5>Total: ${total.toFixed(2)}</h5>
                          <button
                            className="btn btn-success mt-2"
                            onClick={handleUpdateInvoice}
                          >
                            💾 Save Changes
                          </button>
                        </div>
                      </>
                    ) : (
                      <p className="text-center text-muted">No items in invoice.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Layout>
      );
    }
