import React, { useState, useEffect } from "react";
import { Modal, Button, Form } from "react-bootstrap";

export default function CheckoutModal({ isOpen, onClose, total, onConfirm }) {
  const [paymentType, setPaymentType] = useState("cash");
  const [cashReceived, setCashReceived] = useState(0);
  const [change, setChange] = useState(0);

  useEffect(() => {
    const received = parseFloat(cashReceived) || 0;
    setChange(received - total);
  }, [cashReceived, total]);

  // keep your original confirm logic
  const handleConfirm = () => {
    if (paymentType === "cash" && change < 0) {
      alert("Received amount is less than total!");
      return;
    }
    onConfirm({
      type: paymentType,
      cashReceived: paymentType === "cash" ? parseFloat(cashReceived) : null,
      change: paymentType === "cash" ? change : 0,
    });
  };

  // ✅ submit handler so Enter triggers confirm
  const handleSubmit = (e) => {
    e.preventDefault(); // stop default form submit
    handleConfirm();
  };

  return (
    <Modal show={isOpen} onHide={onClose} centered>
      {/* ✅ Wrap header+body+footer in a single <Form> with onSubmit */}
      <Form onSubmit={handleSubmit}>
        <Modal.Header closeButton>
          <Modal.Title>🧾 Checkout</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Payment Type</Form.Label>
            <Form.Select
              value={paymentType}
              onChange={(e) => setPaymentType(e.target.value)}
            >
              <option value="cash">Cash</option>
              <option value="card">Card</option>
            </Form.Select>
          </Form.Group>

          {paymentType === "cash" && (
            <>
              <Form.Group className="mb-3">
                <Form.Label>Cash Received</Form.Label>
                <Form.Control
                  type="number"
                  min="0"
                  value={cashReceived}
                  onChange={(e) => setCashReceived(e.target.value)}
                />
              </Form.Group>

              <div className="text-success fw-bold">
                Change: ${change >= 0 ? change.toFixed(2) : "0.00"}
              </div>
            </>
          )}

          <div className="mt-3">
            <strong>Total: ${total.toFixed(2)}</strong>
          </div>
        </Modal.Body>

        <Modal.Footer>
          {/* ❌ Not a submit button, so Enter won't trigger it */}
          <Button variant="secondary" type="button" onClick={onClose}>
            Cancel
          </Button>

          {/* ✅ The ONLY submit button; Enter will trigger this */}
          <Button variant="primary" type="submit" autoFocus>
            Confirm Sale
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}
