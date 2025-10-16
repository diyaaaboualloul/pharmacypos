import React, { useState, useEffect } from "react";
import axios from "axios";
import { getToken } from "../utils/auth";
import CheckoutModal from "../components/CheckoutModal";
import InvoiceModal from "../components/InvoiceModal";

export default function PosPage() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState("");
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [lastSale, setLastSale] = useState(null);

  // ✅ Fetch products when search changes
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
      <h2 className="fw-bold mb-3">🧾 Point of Sale</h2>

      {/* 🔍 Search bar */}
      <input
        type="text"
        placeholder="Search product..."
        className="form-control mb-3"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* 📋 Product Table */}
      {products.length > 0 && (
        <table className="table table-bordered align-middle">
          <thead>
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
      )}

      {/* 🛒 Cart Table */}
      {cart.length > 0 && (
        <div className="mt-4">
          <h5>🛒 Cart</h5>
          <table className="table table-bordered">
            <thead>
              <tr>
                <th>Item</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {cart.map((item) => (
                <tr key={item._id}>
                  <td>{item.name}</td>
                  <td>{item.quantity}</td>
                  <td>${item.price.toFixed(2)}</td>
                  <td>${(item.price * item.quantity).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="text-end mt-3">
            <h5>Total: ${cartTotal.toFixed(2)}</h5>
            <button
              className="btn btn-primary btn-lg mt-2"
              onClick={() => setShowCheckoutModal(true)}
            >
              Proceed to Checkout 💰
            </button>
          </div>
        </div>
      )}

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
