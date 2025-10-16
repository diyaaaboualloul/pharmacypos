import { useState } from "react";
import axios from "axios";
import { getToken } from "../utils/auth";

export default function CheckoutModal({ show, onHide, items, onSuccess }) {
  const [paymentType, setPaymentType] = useState("cash");
  const [cashReceived, setCashReceived] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [invoice, setInvoice] = useState(null);
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (items.length === 0) return;

    try {
      setSubmitting(true);
      const token = getToken();

      const payload = {
        items: items.map((i) => ({
          productId: i._id,
          quantity: i.quantity,
          unitPrice: i.price,
        })),
        payment: {
          type: paymentType,
          ...(paymentType === "cash" ? { cashReceived: Number(cashReceived) } : {}),
        },
      };

      const { data } = await axios.post("http://localhost:5000/api/pos/checkout", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setInvoice(data);
      onSuccess(); // clear cart on parent
    } catch (err) {
      console.error("Checkout failed", err);
      alert(err.response?.data?.message || "Checkout failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setInvoice(null);
    setPaymentType("cash");
    setCashReceived("");
    onHide();
  };

  if (!show) return null;

  return (
    <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">{invoice ? "✅ Sale Completed" : "💰 Checkout"}</h5>
            <button type="button" className="btn-close" onClick={handleClose}></button>
          </div>

          <div className="modal-body">
            {invoice ? (
              <>
                <p><strong>Invoice #:</strong> {invoice.invoiceNumber}</p>
                <p><strong>Total:</strong> ${invoice.total.toFixed(2)}</p>
                {invoice.change !== undefined && (
                  <p><strong>Change:</strong> ${invoice.change.toFixed(2)}</p>
                )}
                <p><strong>Date:</strong> {new Date(invoice.createdAt).toLocaleString()}</p>
              </>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label">Payment Type</label>
                  <select
                    className="form-select"
                    value={paymentType}
                    onChange={(e) => setPaymentType(e.target.value)}
                    required
                  >
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                  </select>
                </div>

                {paymentType === "cash" && (
                  <div className="mb-3">
                    <label className="form-label">Cash Received</label>
                    <input
                      type="number"
                      className="form-control"
                      value={cashReceived}
                      onChange={(e) => setCashReceived(e.target.value)}
                      required
                      min={total}
                    />
                    {cashReceived && Number(cashReceived) >= total && (
                      <div className="mt-1 text-success">
                        Change: ${(Number(cashReceived) - total).toFixed(2)}
                      </div>
                    )}
                  </div>
                )}

                <div className="text-end">
                  <button
                    type="button"
                    className="btn btn-secondary me-2"
                    onClick={handleClose}
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? "Processing..." : "Confirm Sale"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
