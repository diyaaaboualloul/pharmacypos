import React, { useEffect, useMemo, useState } from "react";

/**
 * Checkout modal with currency toggle (USD/LBP) and automatic change calc.
 * Props:
 *  - isOpen: bool
 *  - onClose: fn()
 *  - total: number (USD)
 *  - onConfirm: fn(paymentObject)
 */
const FALLBACK_RATE = 89000; // 1 USD -> 89,000 LBP (example default)

export default function CheckoutModal({ isOpen, onClose, total, onConfirm }) {
  const [method, setMethod] = useState("cash");   // "cash" | "card" | "bank" | "insurance"
  const [currency, setCurrency] = useState("USD"); // "USD" | "LBP"
  const [rate, setRate] = useState(FALLBACK_RATE);
  const [received, setReceived] = useState("");    // number in selected currency

  useEffect(() => {
    if (!isOpen) return;
    setMethod("cash");
    setCurrency("USD");
    setRate(Number(localStorage.getItem("lbpRate") || FALLBACK_RATE));
    setReceived("");
  }, [isOpen]);

  // --- derived amounts ---
  const usdTotal = Number(total || 0);
  const lbpTotal = useMemo(
    () => Math.round(usdTotal * (Number(rate) || 0)),
    [usdTotal, rate]
  );

  const rec = Number(received || 0);
  const changeUSD = method === "cash" && currency === "USD" ? Math.max(0, rec - usdTotal) : 0;
  const changeLBP = method === "cash" && currency === "LBP" ? Math.max(0, rec - lbpTotal) : 0;

  const handleConfirm = () => {
    if (method === "cash") {
      if (currency === "USD" && rec < usdTotal) {
        alert("Received (USD) is less than total.");
        return;
      }
      if (currency === "LBP" && rec < lbpTotal) {
        alert("Received (LBP) is less than total.");
        return;
      }
    }

    if (currency === "LBP" && Number(rate) > 0) {
      localStorage.setItem("lbpRate", String(rate));
    }

    onConfirm({
      method,
      currency,
      rate: Number(rate) || 0,
      totals: { usd: usdTotal, lbp: lbpTotal },
      received: rec, // in selected currency
      changeUSD,
      changeLBP,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="modal d-block" role="dialog" style={{ background: "rgba(0,0,0,0.35)" }} onClick={onClose}>
      <div className="modal-dialog" role="document" onClick={(e) => e.stopPropagation()}>
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">🧾 Checkout</h5>
            <button type="button" className="btn-close" onClick={onClose} />
          </div>

          <div className="modal-body">
            {/* Payment method */}
            <div className="mb-3">
              <label className="form-label fw-semibold">Payment Type</label>
              <select className="form-select" value={method} onChange={(e) => setMethod(e.target.value)}>
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="bank">Bank</option>
                <option value="insurance">Insurance</option>
              </select>
            </div>

            {/* Purchase currency */}
            <div className="mb-3">
              <label className="form-label fw-semibold">Purchase Currency</label>
              <select
                className="form-select"
                value={currency}
                onChange={(e) => {
                  setCurrency(e.target.value);
                  setReceived("");
                }}
              >
                <option value="USD">USD ($)</option>
                <option value="LBP">LBP (ل.ل)</option>
              </select>
            </div>

            {/* LBP rate input only when LBP */}
            {currency === "LBP" && (
              <div className="mb-3">
                <label className="form-label fw-semibold">Exchange Rate (1 USD → LBP)</label>
                <input
                  type="number"
                  className="form-control"
                  min="1"
                  value={rate}
                  onChange={(e) => setRate(e.target.value)}
                />
                <div className="form-text">Saved locally for next time.</div>
              </div>
            )}

            {/* Cash received (only for cash method) */}
            {method === "cash" && (
              <div className="mb-3">
                <label className="form-label fw-semibold">
                  Cash Received {currency === "USD" ? "(USD)" : "(LBP)"}
                </label>
                <input
                  type="number"
                  className="form-control"
                  min="0"
                  value={received}
                  onChange={(e) => setReceived(e.target.value)}
                  placeholder={currency === "USD" ? "0.00" : "0"}
                  autoFocus
                />
              </div>
            )}

            <hr />

            {/* Totals */}
            <div className="d-flex justify-content-between">
              <span className="fw-semibold">Total (USD)</span>
              <span className="fw-bold">${usdTotal.toFixed(2)}</span>
            </div>
            <div className="d-flex justify-content-between">
              <span className="fw-semibold">Total (LBP)</span>
              <span className="fw-bold">{lbpTotal.toLocaleString()} ل.ل</span>
            </div>

            {/* Change */}
            {method === "cash" && currency === "USD" && (
              <div className="d-flex justify-content-between mt-2">
                <span className="fw-semibold">Change (USD)</span>
                <span className="fw-bold">${changeUSD.toFixed(2)}</span>
              </div>
            )}
            {method === "cash" && currency === "LBP" && (
              <>
                <div className="d-flex justify-content-between mt-2">
                  <span className="fw-semibold">Change (LBP)</span>
                  <span className="fw-bold">{changeLBP.toLocaleString()} ل.ل</span>
                </div>
                <div className="d-flex justify-content-between" style={{ opacity: 0.8 }}>
                  <span>≈ Change (USD)</span>
                  <span>${(changeLBP / (Number(rate) || 1)).toFixed(2)}</span>
                </div>
              </>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-outline-secondary" onClick={onClose}>Cancel</button>
            <button type="button" className="btn btn-primary" onClick={handleConfirm}>Confirm Sale</button>
          </div>
        </div>
      </div>
    </div>
  );
}
