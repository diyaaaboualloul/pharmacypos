import React, { useEffect, useMemo, useRef } from "react";

/** ---------------------------------
 * Printing preferences (edit freely)
 * --------------------------------- */
const PRINT_CFG = {
  paper: "receipt80", // "receipt80" or "A4"
  copiesOnOnePage: 1, // 1 or 2 (2 = Customer + Merchant with cut line)
};

const STORE = {
  name: "DHL PHARMACY",
  subtitle: "Pharmacy Point of Sale",
  address: "123 Main Street, City",
  phone: "+1 (555) 012-3456",
  policy: "Unopened meds returnable within 48h with receipt.",
};

/* ================= Helpers ================= */
function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function sumLines(items) {
  return (items || []).reduce(
    (s, it) => s + Number(it.price || 0) * Number(it.quantity || 0),
    0
  );
}

function formatDate(d) {
  try {
    return new Date(d).toLocaleString();
  } catch {
    return "";
  }
}

function useMoneyFormatter(currency) {
  return useMemo(
    () =>
      new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: currency || "USD",
        minimumFractionDigits: 2,
      }),
    [currency]
  );
}

/* ============== RECEIPT HTML ============== */
function buildReceiptBlock(sale, copyLabel, fmt) {
  const items = sale.items || [];
  const subTotal = sumLines(items);
  const discount = Number(sale.discount || 0);
  const tax = Number(sale.tax || 0);
  const computedTotal = Math.max(0, subTotal - discount + tax);
  const total = Number.isFinite(Number(sale.total)) ? Number(sale.total) : computedTotal;
  const amountPaid = Number(sale.amountPaid ?? total);
  const changeDue = Number(sale.changeDue ?? Math.max(0, amountPaid - total));

  const rows = items
    .map(
      (it) => `
      <tr>
        <td class="qty">${Number(it.quantity || 0)}</td>
        <td class="name">${escapeHtml(it.name || "")}</td>
        <td class="line ta-r">${fmt.format(Number(it.price || 0) * Number(it.quantity || 0))}</td>
      </tr>`
    )
    .join("");

  return `
  <div class="receipt">
    <div class="center store">
      <div class="brand">${escapeHtml(STORE.name)}</div>
      <div class="sub">${escapeHtml(STORE.subtitle)}</div>
      <div class="meta">${escapeHtml(STORE.address)} • ${escapeHtml(STORE.phone)}</div>
    </div>

    <div class="meta-block">
      <div><strong>Invoice #:</strong> ${escapeHtml(sale.invoiceNumber || "")}</div>
      <div><strong>Date:</strong> ${escapeHtml(formatDate(sale.date))}</div>
      <div><strong>Cashier:</strong> ${escapeHtml(sale.cashier || "")}</div>
      ${
        sale.customer
          ? `<div><strong>Customer:</strong> ${
              typeof sale.customer === "string"
                ? escapeHtml(sale.customer)
                : escapeHtml(sale.customer?.name || "")
            }</div>`
          : ""
      }
      ${
        sale.paymentMethod
          ? `<div><strong>Payment:</strong> ${escapeHtml(sale.paymentMethod)}</div>`
          : ""
      }
    </div>

    <table class="items">
      <thead>
        <tr>
          <th class="qty">Qty</th>
          <th>Item</th>
          <th class="ta-r">Total</th>
        </tr>
      </thead>
      <tbody>
        ${
          rows ||
          `<tr><td colspan="3" class="center muted" style="padding:8px 0;">No items</td></tr>`
        }
      </tbody>
    </table>

    <div class="totals">
      <div class="row"><span>Subtotal</span><span>${fmt.format(subTotal)}</span></div>
      ${discount ? `<div class="row"><span>Discount</span><span>- ${fmt.format(discount)}</span></div>` : ""}
      ${tax ? `<div class="row"><span>Tax</span><span>${fmt.format(tax)}</span></div>` : ""}
      <div class="row grand"><span>Total</span><span>${fmt.format(total)}</span></div>
      ${
        sale.amountPaid != null || sale.changeDue != null
          ? `<div class="row"><span>Paid</span><span>${fmt.format(amountPaid)}</span></div>
             <div class="row"><span>Change</span><span>${fmt.format(changeDue)}</span></div>`
          : ""
      }
    </div>

    <div class="center thanks">Thank you for your purchase!</div>
    <div class="center policy">${escapeHtml(STORE.policy)}</div>
    ${copyLabel ? `<div class="center copy-label">— ${escapeHtml(copyLabel)} —</div>` : ""}
  </div>
  `;
}

function buildInvoiceHtmlString(sale) {
  const currency = sale.currency || "USD";
  const fmt = new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  });

  const copies = Math.max(1, Math.min(2, PRINT_CFG.copiesOnOnePage || 1));
  const copyLabels = copies === 2 ? ["Customer Copy", "Merchant Copy"] : [null];

  const bodyReceipts = copyLabels
    .map((label, idx) => {
      const block = buildReceiptBlock(sale, label, fmt);
      return idx === 0 && copies === 2
        ? block + '<div class="cut">—————— ✂ CUT HERE ——————</div>'
        : block;
    })
    .join("");

  const paperCSS =
    PRINT_CFG.paper === "A4"
      ? `
        @page { size: A4; margin: 10mm; }
        .page { width: 210mm; margin: 0 auto; padding: 10mm; }
        .receipt { width: 100%; border-bottom: 1px dashed #e5e7eb; padding-bottom: 10px; margin-bottom: 10px; }
      `
      : `
        /* 80mm thermal roll: full-bleed, auto height */
        @page { size: 80mm auto; margin: 0; }
        .page { width: 80mm; margin: 0; padding: 0; }
        .receipt { width: 72mm; margin: 0 auto; padding: 6px 4px 8px; }
      `;

  return `
<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Invoice ${escapeHtml(sale.invoiceNumber || "")}</title>
  <style>
    :root{ --ink:#1f2937; --muted:#6b7280; --line:#e5e7eb; }
    *{ box-sizing:border-box; }
    html,body{ background:#fff; color:var(--ink); margin:0;
      font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, "Helvetica Neue", Arial, "Noto Sans", "Liberation Sans", sans-serif;
      -webkit-print-color-adjust: exact; print-color-adjust: exact;
    }
    ${paperCSS}

    .brand{ font-weight:800; font-size:16px; }
    .sub{ font-size:11px; color:var(--muted); }
    .meta, .policy{ font-size:11px; color:var(--muted); }
    .center{ text-align:center; }
    .muted{ color:var(--muted); }
    .meta-block{ font-size:12px; margin:6px 0 4px; border-top:1px dashed var(--line); border-bottom:1px dashed var(--line); padding:4px 0; }
    table{ width:100%; border-collapse:collapse; }
    th, td{ font-size:12px; padding:4px 0; }
    thead th{ border-bottom:1px solid var(--line); text-align:left; }
    .items tbody td{ border-bottom:1px dashed var(--line); }
    .items tbody tr:last-child td{ border-bottom:0; }
    .qty{ width:30px; }
    .name{ }
    .line{ width:80px; }
    .ta-r{ text-align:right; }
    .totals{ margin-top:6px; }
    .totals .row{ display:flex; justify-content:space-between; padding:2px 0; }
    .totals .grand{ border-top:1px solid var(--line); font-weight:700; margin-top:2px; padding-top:4px; }
    .thanks{ margin-top:6px; font-size:12px; }
    .copy-label{ margin-top:4px; font-size:11px; color:var(--muted); }
    .cut{ text-align:center; color:var(--muted); font-size:11px; margin:6px 0; }
  </style>
</head>
<body>
  <div class="page">
    ${bodyReceipts}
  </div>
</body>
</html>
`;
}

/* ============== Hidden-iframe printing (no popup) ============== */
function printInvoice(sale) {
  if (!sale) return;
  const html = buildInvoiceHtmlString(sale);

  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  iframe.style.visibility = "hidden";
  document.body.appendChild(iframe);

  const win = iframe.contentWindow || iframe;
  const doc = win.document || iframe.contentDocument;
  doc.open();
  doc.write(html);
  doc.close();

  // Let layout finish, then print & cleanup
  setTimeout(() => {
    try {
      win.focus();
      win.print();
    } finally {
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 500);
    }
  }, 150);
}

/* ============== Modal UI ============== */
export default function InvoiceModal({ isOpen, onClose, sale }) {
  const printBtnRef = useRef(null);
  const currency = sale?.currency || "USD";
  const fmt = useMoneyFormatter(currency);

  useEffect(() => {
    if (!isOpen) return;
    printBtnRef.current?.focus();

    function onKey(e) {
      if (e.key === "Escape") onClose?.();
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "p") {
        e.preventDefault();
        printInvoice(sale);
      }
    }
    document.addEventListener("keydown", onKey);
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [isOpen, onClose, sale]);

  if (!isOpen) return null;

  const total =
    typeof sale?.total === "number" && !Number.isNaN(sale.total)
      ? sale.total
      : sumLines(sale?.items || []);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Sale completed"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.35)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10000,
        padding: 12,
      }}
      onClick={onClose}
    >
      <div
        className="card shadow"
        style={{
          width: 560,
          maxWidth: "100%",
          borderRadius: 12,
          outline: "1px solid rgba(0,0,0,0.05)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="card-body">
          {/* Header */}
          <div className="d-flex align-items-center gap-2 mb-2">
            <span style={{ fontSize: 22 }} aria-hidden>🧾</span>
            <h4 className="m-0">Sale Completed</h4>
          </div>

          {/* Meta */}
          <div className="mb-2 small">
            <div><strong>Invoice #:</strong> {sale?.invoiceNumber || "—"}</div>
            <div><strong>Date:</strong> {formatDate(sale?.date)}</div>
            <div><strong>Cashier:</strong> {sale?.cashier || "—"}</div>
            {sale?.customer ? (
              <div>
                <strong>Customer:</strong>{" "}
                {typeof sale.customer === "string"
                  ? sale.customer
                  : sale.customer?.name || "—"}
              </div>
            ) : null}
            {sale?.paymentMethod ? (
              <div><strong>Payment:</strong> {sale.paymentMethod}</div>
            ) : null}
          </div>

          <hr />

          {/* Items preview (compact) */}
          {Array.isArray(sale?.items) && sale.items.length > 0 ? (
            <div
              style={{
                maxHeight: 160,
                overflow: "auto",
                border: "1px solid #eee",
                borderRadius: 8,
                marginBottom: 12,
              }}
            >
              <table className="table table-sm mb-0">
                <thead className="table-light">
                  <tr>
                    <th style={{ width: 36 }}>#</th>
                    <th>Item</th>
                    <th className="text-end" style={{ width: 70 }}>Qty</th>
                    <th className="text-end" style={{ width: 110 }}>Line</th>
                  </tr>
                </thead>
                <tbody>
                  {sale.items.map((it, i) => (
                    <tr key={i}>
                      <td>{i + 1}</td>
                      <td>{it.name}</td>
                      <td className="text-end">{Number(it.quantity || 0)}</td>
                      <td className="text-end">
                        {fmt.format(Number(it.price || 0) * Number(it.quantity || 0))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

          {/* Totals */}
          <div className="d-flex justify-content-between align-items-center">
            <div className="fw-bold">Total:</div>
            <div className="fw-bold">{fmt.format(Number(total || 0))}</div>
          </div>

          {/* Actions */}
          <div className="d-flex justify-content-end gap-2 mt-3">
            <button
              ref={printBtnRef}
              className="btn btn-primary"
              onClick={() => printInvoice(sale)}
              title={`Print (${PRINT_CFG.paper === "A4" ? "A4" : "80mm receipt"})`}
            >
              🖨️ Print
            </button>
            <button className="btn btn-secondary" onClick={onClose}>
              Close
            </button>
          </div>

          <div className="form-text mt-2">
            Tip: In the print dialog, select your **thermal printer**, set
            **paper size to 80 mm**, and **turn off headers/footers** for a clean receipt.
          </div>
        </div>
      </div>
    </div>
  );
}
