import { useState } from "react";
import TopHeader from "../components/TopHeader";
import Sidebar from "../components/Sidebar";
import PosSearchBar from "../components/PosSearchBar";
import PosCart from "../components/PosCart";
import CheckoutModal from "../components/CheckoutModal";

export default function PosPage() {
  const [cartItems, setCartItems] = useState([]);
  const [showCheckout, setShowCheckout] = useState(false);

  const handleAddToCart = (product) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item._id === product._id);
      if (existing) {
        return prev.map((item) =>
          item._id === product._id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const handleUpdateQuantity = (productId, qty) => {
    setCartItems((prev) =>
      prev.map((item) => (item._id === productId ? { ...item, quantity: qty } : item))
    );
  };

  const handleRemove = (productId) => {
    setCartItems((prev) => prev.filter((item) => item._id !== productId));
  };

  const handleCheckoutSuccess = () => {
    setCartItems([]);
    setShowCheckout(false);
  };

  return (
    <>
      <div className="d-flex">
        <div className="flex-grow-1" style={{ marginLeft: "220px", marginTop: "56px" }}>
          <div className="container-fluid p-4">
            <h1 className="fw-bold mb-4">🧾 Point of Sale</h1>

            <PosSearchBar onAdd={handleAddToCart} />

            <PosCart
              items={cartItems}
              onUpdateQuantity={handleUpdateQuantity}
              onRemove={handleRemove}
              onCheckout={() => setShowCheckout(true)}
            />

            <CheckoutModal
              show={showCheckout}
              onHide={() => setShowCheckout(false)}
              items={cartItems}
              onSuccess={handleCheckoutSuccess}
            />
          </div>
        </div>
      </div>
    </>
  );
}
