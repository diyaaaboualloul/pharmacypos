// src/pages/DashboardPage.jsx
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { getUser, getToken } from "../utils/auth";
import {
  DollarSign,
  FileText,
  Package,
  AlertTriangle,
  ShoppingCart,
  CreditCard,
  Wallet,
  Users,
  Bell,
} from "lucide-react";

/** ---- helpers ---- */

// YYYY-MM for payroll period
function currentPeriod() {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${d.getFullYear()}-${mm}`;
}

// YYYY-MM-DD in Asia/Beirut
function todayBeirut() {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Beirut",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = Object.fromEntries(fmt.formatToParts(new Date()).map(p => [p.type, p.value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}

// Sum helper
const sum = (arr, sel) => arr.reduce((acc, x) => acc + (sel ? Number(sel(x) || 0) : Number(x || 0)), 0);

// Axios instance with token
function useApi() {
  return useMemo(() => {
    const instance = axios.create({
      baseURL: import.meta.env.VITE_API_BASE || "http://localhost:5000",
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    return instance;
  }, []);
}

/** ---- tiny UI bits ---- */

function SummaryCard({ title, value, icon, badge, color = "primary" }) {
  return (
    <div className="col-12 col-md-6 col-lg-3 mb-3">
      <div className={`card border-0 shadow-sm h-100`}>
        <div className="card-body d-flex align-items-center">
          <div className={`me-3 d-flex align-items-center justify-content-center rounded-circle bg-${color} bg-opacity-10`} style={{ width: 44, height: 44 }}>
            <span className={`text-${color}`}>{icon}</span>
          </div>
          <div className="flex-grow-1">
            <div className="text-muted small">{title}</div>
            <div className="fs-5 fw-semibold">{value}</div>
          </div>
          {badge != null && (
            <span className={`badge bg-${color} ms-2`}>{badge}</span>
          )}
        </div>
      </div>
    </div>
  );
}

function Table({ cols, rows, empty = "No data" }) {
  return (
    <div className="table-responsive">
      <table className="table table-sm align-middle">
        <thead>
          <tr>{cols.map((c) => <th key={c}>{c}</th>)}</tr>
        </thead>
        <tbody>
          {rows.length ? rows.map((r, i) => <tr key={i}>{r.map((cell, j) => <td key={j}>{cell}</td>)}</tr>) :
            <tr><td colSpan={cols.length} className="text-muted">{empty}</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

/** ---- main page ---- */

export default function DashboardPage() {
  const user = getUser();
  const api = useApi();

  // shared
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // admin
  const [adminSalesTotal, setAdminSalesTotal] = useState(0);
  const [adminInvoicesCount, setAdminInvoicesCount] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [expiringSoonCount, setExpiringSoonCount] = useState(0);
  const [expiredCount, setExpiredCount] = useState(0);
  const [recentInvoices, setRecentInvoices] = useState([]);

  // cashier
  const [cashierTodayTotal, setCashierTodayTotal] = useState(0);
  const [cashierInvoicesCount, setCashierInvoicesCount] = useState(0);
  const [cashVsCard, setCashVsCard] = useState({ cash: 0, card: 0 });

  // finance
  const [payrollTotals, setPayrollTotals] = useState({ employees: 0, total: 0, unpaid: 0 });
  const [financeCashVsCard, setFinanceCashVsCard] = useState({ cash: 0, card: 0 });

  // load role-specific data
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        setErr("");

        const today = todayBeirut();

        if (user?.role === "admin") {
          // alerts
          const alerts = await api.get("/api/admin/alerts");
          if (!mounted) return;
          setLowStockCount(alerts.data.lowStockCount || 0);
          setExpiringSoonCount(alerts.data.expiringSoonCount || 0);
          setExpiredCount(alerts.data.expiredCount || 0);

          // today sales (admin list, we compute totals from page)
          const salesResp = await api.get("/api/pos/sales", { params: { date: today, page: 1, limit: 1000 } });
          if (!mounted) return;
          const rows = salesResp.data.rows || [];
          setAdminInvoicesCount(rows.length);
          setAdminSalesTotal(sum(rows, r => r.total));
          setRecentInvoices(rows.slice(0, 5));
        }

        if (user?.role === "cashier") {
          // my sales (we filter to today)
          const my = await api.get("/api/sales/my");
          if (!mounted) return;
          const todayRows = (my.data || []).filter(s => {
            const d = new Date(s.createdAt);
            return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Beirut", year: "numeric", month: "2-digit", day: "2-digit" })
              .format(d) === today;
          });
          setCashierInvoicesCount(todayRows.length);
          setCashierTodayTotal(sum(todayRows, r => r.total));

          const cash = sum(todayRows.filter(s => s.payment?.type === "cash"), r => r.total);
          const card = sum(todayRows.filter(s => s.payment?.type === "card"), r => r.total);
          setCashVsCard({ cash, card });
        }

        if (user?.role === "finance") {
          const period = currentPeriod();

          // payroll
          const p = await api.get("/api/payroll", { params: { period } });
          if (!mounted) return;
          const rows = p.data?.rows || [];
          const total = sum(rows, r => r.netPay);
          const unpaid = rows.filter(r => !r.paid).length;
          setPayrollTotals({ employees: rows.length, total, unpaid });

          // payment breakdown today (reuse admin endpoint)
          const salesResp = await api.get("/api/pos/sales", { params: { date: today, page: 1, limit: 1000 } });
          if (!mounted) return;
          const rows2 = salesResp.data.rows || [];
          const cash = sum(rows2.filter(s => s.payment?.type === "cash"), r => r.total);
          const card = sum(rows2.filter(s => s.payment?.type === "card"), r => r.total);
          setFinanceCashVsCard({ cash, card });
        }

      } catch (e) {
        console.error(e);
        setErr(e?.response?.data?.message || e.message || "Failed to load dashboard");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    const t = setInterval(load, 60_000); // refresh every minute
    return () => { mounted = false; clearInterval(t); };
  }, [user, api]);

  return (
    <div className="container-fluid p-3 p-md-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 className="mb-0">Dashboard</h3>
        <div className="text-muted small">
          {user?.name} • <span className="badge bg-secondary text-uppercase">{user?.role}</span>
        </div>
      </div>

      {err && (
        <div className="alert alert-danger">{err}</div>
      )}

      {/* ---- ADMIN ---- */}
      {user?.role === "admin" && (
        <>
          <div className="row">
            <SummaryCard title="Today's Sales" value={`$${adminSalesTotal.toFixed(2)}`} icon={<DollarSign size={18} />} color="success" />
            <SummaryCard title="Invoices Today" value={adminInvoicesCount} icon={<FileText size={18} />} color="info" />
            <SummaryCard title="Low Stock" value={lowStockCount} icon={<Package size={18} />} color="warning" />
            <SummaryCard title="Expiry Alerts" value={`${expiringSoonCount} soon • ${expiredCount} expired`} icon={<AlertTriangle size={18} />} color="danger" />
          </div>

          <div className="row mt-3">
            <div className="col-lg-6 mb-3">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-header bg-white d-flex align-items-center">
                  <Bell size={16} className="me-2 text-danger" />
                  <strong>Inventory Alerts</strong>
                </div>
                <div className="card-body">
                  <ul className="list-unstyled mb-0">
                    <li className="mb-2">Low stock items: <span className="fw-semibold">{lowStockCount}</span></li>
                    <li className="mb-2">Expiring soon: <span className="fw-semibold">{expiringSoonCount}</span></li>
                    <li>Expired batches: <span className="fw-semibold">{expiredCount}</span></li>
                  </ul>
                  <a href="/admin/alerts" className="btn btn-sm btn-outline-danger mt-2">View details</a>
                </div>
              </div>
            </div>

            <div className="col-lg-6 mb-3">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-header bg-white"><strong>Recent Invoices</strong></div>
                <div className="card-body">
                  <Table
                    cols={["Invoice #", "Total", "Payment", "Cashier", "Date"]}
                    rows={recentInvoices.map((r) => ([
                      r.invoiceNumber,
                      `$${Number(r.total || 0).toFixed(2)}`,
                      r.payment?.type?.toUpperCase(),
                      (r.cashier?.name || r.cashier) ?? "—",
                      new Date(r.createdAt).toLocaleString("en-GB", { timeZone: "Asia/Beirut", hour12: false }),
                    ]))}
                    empty="No invoices today"
                  />
                  <a href="/admin/reports" className="btn btn-sm btn-outline-secondary mt-2">Go to reports</a>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ---- CASHIER ---- */}
      {user?.role === "cashier" && (
        <>
          <div className="row">
            <SummaryCard title="Today's Sales" value={`$${cashierTodayTotal.toFixed(2)}`} icon={<DollarSign size={18} />} color="success" />
            <SummaryCard title="Invoices Today" value={cashierInvoicesCount} icon={<FileText size={18} />} color="info" />
            <SummaryCard title="Cash Sales" value={`$${cashVsCard.cash.toFixed(2)}`} icon={<Wallet size={18} />} color="primary" />
            <SummaryCard title="Card Sales" value={`$${cashVsCard.card.toFixed(2)}`} icon={<CreditCard size={18} />} color="primary" />
          </div>

          <div className="d-flex gap-2 mt-2">
            <a className="btn btn-success" href="/cashier/pos"><ShoppingCart size={16} className="me-1" /> New Sale</a>
            <a className="btn btn-outline-secondary" href="/cashier/invoices"><FileText size={16} className="me-1" /> View Invoices</a>
          </div>
        </>
      )}

      {/* ---- FINANCE ---- */}
      {user?.role === "finance" && (
        <>
          <div className="row">
            <SummaryCard title="Payroll Employees" value={payrollTotals.employees} icon={<Users size={18} />} color="info" />
            <SummaryCard title="Payroll (This Period)" value={`$${payrollTotals.total.toFixed(2)}`} icon={<Wallet size={18} />} color="primary" />
            <SummaryCard title="Unpaid Payroll" value={payrollTotals.unpaid} icon={<AlertTriangle size={18} />} color="warning" />
            <SummaryCard title="Today: Cash/Card" value={`$${financeCashVsCard.cash.toFixed(0)} / $${financeCashVsCard.card.toFixed(0)}`} icon={<CreditCard size={18} />} color="success" />
          </div>

          <div className="d-flex gap-2 mt-2">
            <a className="btn btn-primary" href="/finance/payroll"><Wallet size={16} className="me-1" /> Open Payroll</a>
            <a className="btn btn-outline-secondary" href="/finance/reports"><FileText size={16} className="me-1" /> Finance Reports</a>
          </div>
        </>
      )}

      {loading && (
        <div className="text-muted small mt-3">Loading…</div>
      )}
    </div>
  );
}
