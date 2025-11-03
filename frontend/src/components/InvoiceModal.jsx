import React from "react";

/**
 * Print a simple, professional invoice/receipt using a popup window.
 * Works with normal A4 printers and 80mm thermal printers.
 */
function printInvoice(sale) {
  if (!sale) return;

  const fmt = new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  });

  const rows = (sale.items || [])
    .map(
      (it, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${escapeHtml(it.name || "")}</td>
        <td class="ta-r">${it.quantity}</td>
        <td class="ta-r">${fmt.format(it.price)}</td>
        <td class="ta-r">${fmt.format(it.price * it.quantity)}</td>
      </tr>`
    )
    .join("");

  const html = `
<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Invoice ${sale.invoiceNumber || ""}</title>
  <style>
    /* ===== Print Styles (A4 + 80mm thermal friendly) ===== */
    :root{
      --ink:#222;
      --muted:#666;
      --line:#e6eaef;
      --brand:#0d6efd;
      --radius:10px;
    }
    *{ box-sizing:border-box; }
    body{
      font-family: system-ui, -apple-system, Segoe UI, Roboto, "Helvetica Neue", Arial, "Noto Sans", "Liberation Sans", sans-serif;
      margin:0; color:var(--ink);
    }
    .sheet{
      width: 210mm; /* A4 width */
      max-width: 100%;
      margin: 0 auto;
      padding: 18mm 16mm;
    }
    .head{
      display:flex; align-items:flex-start; justify-content:space-between; gap:10px; margin-bottom:14px;
    }
    .brand{
      font-weight:800; font-size: 22px; line-height:1;
    }
    .brand .sub{ font-size:12px; color:var(--muted); font-weight:600; }
    .meta{
      text-align:right; font-size: 13px;
    }
    .h-line{ height:1px; background:var(--line); margin:12px 0; }

    table{ width:100%; border-collapse:collapse; }
    th, td{ padding: 8px 6px; font-size: 13px; }
    thead th{
      text-align:left; border-bottom:1px solid var(--line); color:#111; font-weight:700;
    }
    tbody td{ border-bottom:1px dashed #e9edf2; }
    .ta-r{ text-align:right; }
    .totals{
      margin-top:10px; display:flex; justify-content:flex-end;
    }
    .totals table{ width:280px; }
    .totals td{ padding:6px; }
    .totals .label{ color:var(--muted); }
    .grand td{ border-top:1px solid var(--line); font-weight:800; }

    .foot{
      margin-top:16px; font-size:12px; color:var(--muted);
      display:flex; justify-content:space-between; align-items:center; gap:8px;
    }

    /* 80mm receipt simplification */
    @media print {
      body { background:#fff; }
      .sheet{ padding:10mm 8mm; }
    }
  </style>
</head>
<body>
  <div class="sheet">
    <div class="head">
      <div>
        <div class="brand">DHL PHARMACY</div>
        <div class="sub">Pharmacy Point of Sale</div>
      </div>
      <div class="meta">
        <div><strong>Invoice #:</strong> ${escapeHtml(sale.invoiceNumber || "")}</div>
        <div><strong>Date:</strong> ${formatDate(sale.date)}</div>
        <div><strong>Cashier:</strong> ${escapeHtml(sale.cashier || "")}</div>
      </div>
    </div>

    <div class="h-line"></div>

    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Item</th>
          <th class="ta-r">Qty</th>
          <th class="ta-r">Price</th>
          <th class="ta-r">Line</th>
        </tr>
      </thead>
      <tbody>
        ${rows || `<tr><td colspan="5" style="text-align:center;color:#777;padding:18px 6px;">No items</td></tr>`}
      </tbody>
    </table>

    <div class="totals">
      <table>
        <tbody>
          <tr>
            <td class="label">Subtotal</td>
            <td class="ta-r">${fmt.format(sumLines(sale.items || []))}</td>
          </tr>
          <tr class="grand">
            <td>Total</td>
            <td class="ta-r">${fmt.format(sale.total || 0)}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="foot">
      <div>Thank you for your purchase!</div>
      <div>Return policy: unopened meds within 48h with receipt.</div>
    </div>
  </div>

  <script>
    // auto print, then close if the user confirms
    window.addEventListener('load', () => {
      setTimeout(() => {
        window.print();
        // Optional: close after print on some browsers
        setTimeout(() => { window.close(); }, 300);
      }, 200);
    });
  </script>
</body>
</html>
`;

  const w = window.open("", "_blank", "noopener,noreferrer,width=900,height=700");
  if (!w) {
    alert("Please allow popups to print the invoice.");
    return;
  }
  w.document.open();
  w.document.write(html);
  w.document.close();
}

function sumLines(items) {
  return (items || []).reduce((s, it) => s + (Number(it.price || 0) * Number(it.quantity || 0)), 0);
}

function formatDate(d) {
  try {
    return new Date(d).toLocaleString();
  } catch {
    return "";
  }
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export default function InvoiceModal({ isOpen, onClose, sale }) {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.35)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10000,
      }}
      onClick={onClose}
    >
      <div
        className="card shadow"
        style={{ width: 520, maxWidth: "90%", borderRadius: 12 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="card-body">
          <div className="d-flex align-items-center gap-2 mb-2">
            <span style={{ fontSize: 22 }}>🧾</span>
            <h4 className="m-0">Sale Completed</h4>
          </div>

          <div className="mb-2 small">
            <div><strong>Invoice #:</strong> {sale?.invoiceNumber}</div>
            <div><strong>Date:</strong> {formatDate(sale?.date)}</div>
            <div><strong>Cashier:</strong> {sale?.cashier}</div>
          </div>

          <hr />

          <div className="d-flex justify-content-between align-items-center">
            <div className="fw-bold">Total:</div>
            <div className="fw-bold">
              {new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(
                Number(sale?.total || 0)
              )}
            </div>
          </div>

          <div className="d-flex justify-content-end gap-2 mt-3">
            <button
              className="btn btn-primary"
              onClick={() => printInvoice(sale)}
              title="Print or save as PDF"
            >
              🖨️ Print / PDF
            </button>
            <button className="btn btn-secondary" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
