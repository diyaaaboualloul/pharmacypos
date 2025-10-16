import React from "react";

export default function InvoiceModal({ isOpen, onClose, sale }) {
  if (!isOpen || !sale) return null;

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    const htmlContent = `
      <html>
        <head>
          <title>Invoice ${sale.invoiceNumber}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h2 { text-align: center; margin-bottom: 10px; }
            .info { text-align: center; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th, td { border: 1px solid #ccc; padding: 8px; text-align: center; }
            th { background-color: #f5f5f5; }
            .total { text-align: right; font-size: 1.2em; margin-top: 10px; }
            .footer { text-align: center; font-size: 0.9em; margin-top: 20px; }
          </style>
        </head>
        <body>
          <h2>🏪 Pharmacy POS</h2>
          <div class="info">
            <p><strong>Invoice #:</strong> ${sale.invoiceNumber}</p>
            <p><strong>Date:</strong> ${new Date(sale.date).toLocaleString()}</p>
            <p><strong>Cashier:</strong> ${sale.cashier || "Cashier 1"}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${sale.items
                .map(
                  (item) => `
                <tr>
                  <td>${item.name}</td>
                  <td>${item.quantity}</td>
                  <td>$${item.price.toFixed(2)}</td>
                  <td>$${(item.price * item.quantity).toFixed(2)}</td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
          <div class="total">
            <strong>Total: $${sale.total.toFixed(2)}</strong>
          </div>
          <div class="footer">
            <p>Thank you for your purchase!</p>
          </div>
        </body>
      </html>
    `;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          background: "#fff",
          padding: "20px",
          borderRadius: "8px",
          maxWidth: "600px",
          width: "100%",
          boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
        }}
      >
        <h3 className="fw-bold text-center mb-3">🧾 Sale Completed</h3>
        <p><strong>Invoice #:</strong> {sale.invoiceNumber}</p>
        <p><strong>Date:</strong> {new Date(sale.date).toLocaleString()}</p>
        <p><strong>Cashier:</strong> {sale.cashier || "Cashier 1"}</p>
        <hr />
        <div style={{ textAlign: "right", fontSize: "1.1em" }}>
          <strong>Total: ${sale.total.toFixed(2)}</strong>
        </div>

        <div style={{ marginTop: "20px", textAlign: "right" }}>
          <button
            onClick={handlePrint}
            style={{
              background: "#0d6efd",
              color: "#fff",
              padding: "8px 12px",
              border: "none",
              borderRadius: "4px",
              marginRight: "10px",
              cursor: "pointer",
            }}
          >
            🖨️ Print / PDF
          </button>
          <button
            onClick={onClose}
            style={{
              background: "#6c757d",
              color: "#fff",
              padding: "8px 12px",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
