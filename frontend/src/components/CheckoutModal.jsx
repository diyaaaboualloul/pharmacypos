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

  const handleConfirm = () => {
    if (paymentType === "cash" && change < 0) {
      alert("Received amount is less than total!");
      return;
    }
    onConfirm({
      type: paymentType, // ✅ now correctly lowercase
      cashReceived: paymentType === "cash" ? parseFloat(cashReceived) : null,
      change: paymentType === "cash" ? change : 0,
    });
  };

  return (
    <Modal show={isOpen} onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>🧾 Checkout</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
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
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleConfirm}>
          Confirm Sale
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
