import React, { useState, useEffect } from "react";
import axios from "axios";
import { getToken } from "../utils/auth";
import { useNavigate } from "react-router-dom";
import CheckoutModal from "../components/CheckoutModal";
import InvoiceModal from "../components/InvoiceModal";
import "../css/pospage.css";

export default function PosPage() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState("");
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [lastSale, setLastSale] = useState(null);

  const user = JSON.parse(localStorage.getItem("user"));
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  // ✅ Fetch products...
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

const handleRemoveFromCart = (id) => {
  setCart((prev) => prev.filter((item) => item._id !== id));
};

  // ➕ Add product to cart
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

  // 🧾 Confirm Sale (called from CheckoutModal)
  const handleConfirmSale = async (paymentData) => {
    try {
      const token = getToken();
      const payload = {
        items: cart.map((item) => ({
          productId: item._id,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
        })),
        total: cart.reduce((acc, item) => acc + item.price * item.quantity, 0),
        payment: paymentData,
        cashier: "Cashier 1",
      };

      const { data } = await axios.post(
        "http://localhost:5000/api/pos/checkout",
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setLastSale({
        invoiceNumber: data.invoiceNumber,
        date: data.createdAt,
        cashier: "Cashier 1",
        items: cart,
        total: data.total,
      });

      setShowCheckoutModal(false);
      setShowInvoiceModal(true);
      setCart([]);
    } catch (err) {
      console.error("Checkout failed:", err);
      alert(err.response?.data?.message || "Checkout failed");
    }
  };

  // ❌ Close invoice modal and refresh POS page
  const handleCloseInvoice = () => {
    setShowInvoiceModal(false);
    window.location.href = "/cashier/pos";
  };

  const cartTotal = cart.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );

  return (
    <div className="container p-4">
 <div className="d-flex align-items-center ms-auto">
          <span className="me-3 d-none d-sm-inline">
            👤 <strong>{user?.name}</strong> ({user?.role})
          </span>
          <button onClick={logout} className="btn btn-danger btn-sm">
            Logout
          </button>
        </div>
      {/* 🔍 Search bar */}
      <input
        type="text"
        placeholder="Search product..."
        className="form-control mb-3"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
<div className="d-flex flex-column flex-md-row gap-3">
  {/* LEFT: Products Table (60%) */}
  <div style={{ flex: "0 0 60%" }}>
    <div className="card mb-3">
      <div className="card-header bg-primary text-white">
        <h5 className="mb-0">🛍️ Products</h5>
      </div>
      <div className="card-body">
        {products.length > 0 ? (
          <table className="table table-bordered table-hover align-middle">
            <thead className="table-secondary">
              <tr>
                <th>Name</th>
                <th>Category</th>
                <th>Price</th>
                <th>Available Qty</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product._id}>
                  <td>{product.name}</td>
                  <td>{product.category}</td>
                  <td>${product.price.toFixed(2)}</td>
                  <td>{product.totalSellableQty}</td>
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
          <p className="text-center text-muted">No products found.</p>
        )}
      </div>
    </div>
  </div>

  {/* RIGHT: Cart Table (50%) */}
  <div style={{ flex: "0 0 50%" }}>
    <div className="card " style={{ top: "20px" }}>
      <div className="card-header bg-warning text-dark">
        <h5 className="mb-0">🛒 Your Cart</h5>
      </div>
      <div className="card-body">
        {cart.length > 0 ? (
          <>
            <table className="table table-sm table-bordered mb-3">
             <thead className="table-light">
  <tr>
    <th>Item</th>
    <th style={{ width: "70px" }}>Qty</th>
    <th>Price</th>
    <th>Total</th>
    <th>Action</th> {/* 🆕 New column */}
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
                p._id === item._id ? { ...p, quantity: newQty } : p
              )
            );
          }}
        />
      </td>
      <td>${item.price.toFixed(2)}</td>
      <td>${(item.price * item.quantity).toFixed(2)}</td>

      {/* 🗑️ Delete Button */}
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
              <h6 className="fw-bold">Total: ${cartTotal.toFixed(2)}</h6>
              <button
                className="btn btn-primary btn-block mt-2"
                style={{ width: "100%" }}
                onClick={() => setShowCheckoutModal(true)}
              >
                Checkout 💰
              </button>
            </div>
          </>
        ) : (
          <p className="text-center text-muted">Cart is empty.</p>
        )}
      </div>
    </div>
  </div>
</div>


      {/* 🧾 Checkout Modal */}
      <CheckoutModal
        isOpen={showCheckoutModal}
        onClose={() => setShowCheckoutModal(false)}
        total={cartTotal}
        onConfirm={handleConfirmSale}
      />

      {/* 🧾 Invoice Modal */}
      <InvoiceModal
        isOpen={showInvoiceModal}
        onClose={handleCloseInvoice}
        sale={lastSale}
      />
    </div>
  );
}
