import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { getToken } from "../utils/auth";
import Layout from "../components/Layout";

export default function CashierInvoiceDetails() {
  const { id: invoiceId } = useParams();
  const navigate = useNavigate();

  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);

  // Replace modal state
  const [replaceOpen, setReplaceOpen] = useState(false);
  const [replaceCtx, setReplaceCtx] = useState({ oldProductId: null, defaultQty: 1 });
  const [allProducts, setAllProducts] = useState([]); // { _id, name, category, price, totalSellableQty }
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [newQty, setNewQty] = useState(1);
  const [loadingProducts, setLoadingProducts] = useState(false);

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const token = getToken();
        const { data } = await axios.get(
          `http://localhost:5000/api/pos/sales/${invoiceId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setInvoice(data);
      } catch (err) {
        console.error("Failed to fetch invoice details", err);
        alert("Failed to load invoice details");
      } finally {
        setLoading(false);
      }
    };
    fetchInvoice();
  }, [invoiceId]);

  const handleRefundItem = async (productId) => {
    if (!window.confirm("Refund this product?")) return;
    try {
      const token = getToken();
      const { data } = await axios.post(
        `http://localhost:5000/api/pos/refund-item/${invoiceId}`,
        { productId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      alert(`Refund successful! Ref. Invoice: ${data.refundInvoiceNumber}`);
      window.location.reload();
    } catch (err) {
      alert("Refund failed: " + (err.response?.data?.message || err.message));
    }
  };

  // Open Replace modal → load ALL products once, then filter locally
  const openReplace = async (oldItem) => {
    setReplaceCtx({
      oldProductId: oldItem.product?._id || oldItem.product,
      defaultQty: oldItem.quantity || 1,
    });
    setNewQty(oldItem.quantity || 1);
    setSelectedProduct(null);
    setSearchTerm("");
    setReplaceOpen(true);

    // fetch all sellable products if not loaded yet
    if (allProducts.length === 0) {
      try {
        setLoadingProducts(true);
        const token = getToken();
        // no q param → your searchSellable returns ALL sellable, non-expired products aggregated by product
        const { data } = await axios.get(`http://localhost:5000/api/pos/search`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setAllProducts(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error("Failed to load products", e);
        setAllProducts([]);
      } finally {
        setLoadingProducts(false);
      }
    }
  };

  const handleReplaceItem = async (oldProductId, newProductId, newQuantity) => {
    try {
      const token = getToken();
      const { data } = await axios.post(
        `http://localhost:5000/api/pos/replace-item/${invoiceId}`,
        { oldProductId, newProductId, newQuantity },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert(`✅ Replacement successful: ${data.message}`);
      window.location.reload();
    } catch (err) {
      alert("Replacement failed: " + (err.response?.data?.message || err.message));
    }
  };

  const confirmReplace = () => {
    if (!selectedProduct) return alert("Pick a product to replace with.");
    if (newQty <= 0) return alert("Quantity must be at least 1.");
    handleReplaceItem(replaceCtx.oldProductId, selectedProduct._id, newQty);
  };

  // local filtering on name/category (case-insensitive)
  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return allProducts;
    return allProducts.filter(
      (p) =>
        p.name?.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q)
    );
  }, [allProducts, searchTerm]);

  if (loading) return <p className="text-center mt-5">Loading invoice details...</p>;
  if (!invoice) return <p className="text-center text-danger">Invoice not found.</p>;

  const isRefundedInvoice = invoice.total < 0 || invoice.isRefunded;

  return (
    <div className="container mt-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3>🧾 Invoice Details</h3>
        <button
          onClick={() => navigate("/cashier/invoices")}
          className="btn btn-primary"
        >
          ← Back to Invoices
        </button>
      </div>

      {/* Summary */}
      <div className="card p-3 mb-3">
        <h5>Invoice Number: {invoice.invoiceNumber}</h5>
        <p><strong>Date:</strong> {new Date(invoice.createdAt).toLocaleString()}</p>
        <p><strong>Total:</strong> ${invoice.total.toFixed(2)}</p>
        <p>
          <strong>Status:</strong>{" "}
          {isRefundedInvoice ? (
            <span className="text-danger">Refunded</span>
          ) : (
            <span className="text-success">Original</span>
          )}
        </p>
      </div>

      {/* Items */}
      <table className="table table-bordered">
        <thead className="table-warning">
          <tr>
            <th>#</th>
            <th>Product</th>
            <th>Category</th>
            <th>Qty</th>
            <th>Unit</th>
            <th>Line</th>
            <th>Status</th>
            {!isRefundedInvoice && <th>Action</th>}
          </tr>
        </thead>
        <tbody>
          {invoice.items.map((item, idx) => (
            <tr key={idx}>
              <td>{idx + 1}</td>
              <td>{item.product?.name}</td>
              <td>{item.product?.category}</td>
              <td>{item.quantity}</td>
              <td>${item.unitPrice.toFixed(2)}</td>
              <td>${item.lineTotal.toFixed(2)}</td>
              <td>
                {item.isRefunded ? (
                  <span className="text-danger">Refunded</span>
                ) : (
                  <span className="text-success">Sold</span>
                )}
              </td>
              {!isRefundedInvoice && (
                <td>
                  {!item.isRefunded && (
                    <div className="d-flex gap-2">
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => handleRefundItem(item.product?._id || item.product)}
                      >
                        Refund
                      </button>
                      <button
                        className="btn btn-sm btn-warning"
                        onClick={() => openReplace(item)}
                      >
                        Replace
                      </button>
                    </div>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Replace Modal */}
      {replaceOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
          onClick={() => setReplaceOpen(false)}
        >
          <div
            className="card"
            style={{ width: 900, maxWidth: "95%", padding: 16 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h5 className="m-0">Replace Item</h5>
              <button className="btn btn-sm btn-outline-secondary" onClick={() => setReplaceOpen(false)}>✕</button>
            </div>

            {/* Search + Qty row */}
            <div className="row g-2 mb-2">
              <div className="col-8">
                <label className="form-label fw-semibold">Search products</label>
                <input
                  className="form-control"
                  placeholder="Type name or category…"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="col-4">
                <label className="form-label fw-semibold">Quantity</label>
                <input
                  type="number"
                  min={1}
                  className="form-control"
                  value={newQty}
                  onChange={(e) => setNewQty(parseInt(e.target.value || "1", 10))}
                />
                <div className="form-text">
                  Default = original ({replaceCtx.defaultQty})
                </div>
              </div>
            </div>

            {/* Products table */}
            <div style={{ maxHeight: 360, overflow: "auto", border: "1px solid #eee", borderRadius: 6 }}>
              {loadingProducts ? (
                <div className="p-3">Loading products…</div>
              ) : filtered.length === 0 ? (
                <div className="p-3 text-muted">No products</div>
              ) : (
                <table className="table table-sm m-0">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Category</th>
                      <th className="text-end">Price</th>
                      <th className="text-end">Available</th>
                      <th className="text-end">Pick</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((p) => {
                      const isSelected = selectedProduct?._id === p._id;
                      return (
                        <tr key={p._id} className={isSelected ? "table-primary" : ""}>
                          <td>{p.name}</td>
                          <td>{p.category}</td>
                          <td className="text-end">${Number(p.price).toFixed(2)}</td>
                          <td className="text-end">{p.totalSellableQty}</td>
                          <td className="text-end">
                            <button
                              className={`btn btn-sm ${isSelected ? "btn-secondary" : "btn-outline-primary"}`}
                              onClick={() => setSelectedProduct(p)}
                            >
                              {isSelected ? "Selected" : "Select"}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Actions */}
            <div className="d-flex justify-content-end gap-2 mt-3">
              <button className="btn btn-outline-secondary" onClick={() => setReplaceOpen(false)}>Cancel</button>
              <button
                className="btn btn-primary"
                disabled={!selectedProduct || newQty <= 0}
                onClick={confirmReplace}
              >
                Confirm Replace
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
