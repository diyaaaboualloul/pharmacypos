import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import axios from "axios";
import { getToken } from "../utils/auth";
import { useNavigate } from "react-router-dom";
import CheckoutModal from "../components/CheckoutModal";
import InvoiceModal from "../components/InvoiceModal";
import "../css/pospage.css";

export default function PosPage() {
  // ---------- State ----------
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState("");
  const [loadingProducts, setLoadingProducts] = useState(false);

  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [lastSale, setLastSale] = useState(null);

  const [todayTotal, setTodayTotal] = useState(0);
  const [sessionTotal, setSessionTotal] = useState(0);
  const [cashierStatus, setCashierStatus] = useState("closed");

  const [sortBy, setSortBy] = useState("name"); // "name" | "price" | "qty"
  const [sortDir, setSortDir] = useState("asc"); // "asc" | "desc"

  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user"));
    } catch {
      return null;
    }
  }, []);

  const navigate = useNavigate();
  const searchRef = useRef(null);

  // ---------- Helpers ----------
  const currency = useMemo(
    () =>
      new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
      }),
    []
  );

  const cartTotal = useMemo(
    () => cart.reduce((acc, item) => acc + item.price * item.quantity, 0),
    [cart]
  );

  const authHeaders = useMemo(() => {
    const token = getToken();
    return { headers: { Authorization: `Bearer ${token}` } };
  }, []);

  const isClosed = cashierStatus === "closed";

  const logout = useCallback(() => {
    if (!window.confirm("Logout from cashier?")) return;
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  }, [navigate]);

  // ---------- API calls ----------
  const fetchTodayTotal = useCallback(async () => {
    try {
      const { data } = await axios.get(
        "http://localhost:5000/api/pos/today-total",
        authHeaders
      );
      setTodayTotal(data.total || 0);
    } catch (err) {
      console.error("Failed to fetch today's total", err);
    }
  }, [authHeaders]);

  const fetchSessionTotal = useCallback(async () => {
    try {
      const { data } = await axios.get(
        "http://localhost:5000/api/pos/current-session-total",
        authHeaders
      );
      setSessionTotal(data.sessionTotal || 0);
    } catch (err) {
      console.error("Failed to fetch session total", err);
    }
  }, [authHeaders]);

  const fetchCashierStatus = useCallback(async () => {
    try {
      const { data } = await axios.get(
        "http://localhost:5000/api/pos/cashiers-status",
        authHeaders
      );
      const me = user ? data.find((c) => c.email === user.email) : null;
      if (me?.status) setCashierStatus(me.status);
    } catch (err) {
      console.error("Failed to fetch cashier status", err);
    }
  }, [authHeaders, user]);

  // ---------- Effects ----------
  // Debounced product search (500ms) with spinner & cancel
  useEffect(() => {
    if (search.trim().length < 2) {
      setProducts([]);
      setLoadingProducts(false);
      return;
    }
    const ctrl = new AbortController();
    setLoadingProducts(true);
    const t = setTimeout(async () => {
      try {
        const { data } = await axios.get(
          `http://localhost:5000/api/pos/search?q=${encodeURIComponent(search)}`,
          { ...authHeaders, signal: ctrl.signal }
        );
        setProducts(data || []);
      } catch (err) {
        if (!axios.isCancel(err)) {
          console.error("Failed to fetch products:", err);
        }
      } finally {
        setLoadingProducts(false);
      }
    }, 500);
    return () => {
      ctrl.abort();
      clearTimeout(t);
    };
  }, [search, authHeaders]);

  // Single polling loop (every 5s) for totals + status
  useEffect(() => {
    let mounted = true;

    const tick = async () => {
      if (!mounted) return;
      await Promise.all([
        fetchTodayTotal(),
        fetchSessionTotal(),
        fetchCashierStatus(),
      ]);
    };

    // initial load
    tick();
    const id = setInterval(tick, 5000);

    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, [fetchTodayTotal, fetchSessionTotal, fetchCashierStatus]);

  // Global keyboard shortcuts
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "F2") {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if (e.key === "F4") {
        e.preventDefault();
        if (!isClosed && cart.length) {
          setShowCheckoutModal(true);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [cart.length, isClosed]);

  // ---------- Sorting ----------
  const sortedProducts = useMemo(() => {
    const copy = [...products];
    copy.sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      if (sortBy === "name") return a.name.localeCompare(b.name) * dir;
      if (sortBy === "price") return (a.price - b.price) * dir;
      if (sortBy === "qty")
        return ((a.totalSellableQty || 0) - (b.totalSellableQty || 0)) * dir;
      return 0;
    });
    return copy;
  }, [products, sortBy, sortDir]);

  const toggleSort = (field) => {
    if (field === sortBy) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortBy(field);
      setSortDir("asc");
    }
  };

  // ---------- Cart handlers ----------
  const handleRemoveFromCart = useCallback((id) => {
    setCart((prev) => prev.filter((item) => item._id !== id));
  }, []);

  const handleAddToCart = useCallback(
    (product) => {
      if (isClosed) {
        alert("❌ You cannot add items while your account is closed!");
        return;
      }
      const max = product.totalSellableQty ?? Infinity;
      setCart((prev) => {
        const existing = prev.find((i) => i._id === product._id);
        if (existing) {
          if (existing.quantity >= max) return prev; // cannot exceed stock
          return prev.map((i) =>
            i._id === product._id ? { ...i, quantity: i.quantity + 1 } : i
          );
        }
        if (max <= 0) return prev; // out of stock
        return [...prev, { ...product, quantity: 1 }];
      });
    },
    [isClosed]
  );

  const handleQtyChange = useCallback((id, raw) => {
    setCart((prev) =>
      prev.map((p) => {
        if (p._id !== id) return p;
        const max = p.totalSellableQty ?? Infinity;
        const n = Math.max(1, Math.min(Math.floor(+raw || 1), max));
        return { ...p, quantity: n };
      })
    );
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  // ---------- Checkout ----------
  const handleConfirmSale = useCallback(
    async (paymentData) => {
      if (isClosed) {
        alert("❌ You cannot checkout while your account is closed!");
        return;
      }
      try {
        const payload = {
          items: cart.map((item) => ({
            productId: item._id,
            name: item.name,
            quantity: item.quantity,
            price: item.price,
          })),
          total: cartTotal,
          payment: paymentData,
          cashier: user?.name || "Cashier",
        };

        const { data } = await axios.post(
          "http://localhost:5000/api/pos/checkout",
          payload,
          authHeaders
        );

        setLastSale({
          invoiceNumber: data.invoiceNumber,
          date: data.createdAt,
          cashier: user?.name || "Cashier",
          items: cart,
          total: data.total,
        });

        setShowCheckoutModal(false);
        setShowInvoiceModal(true);
        setCart([]);

        // refresh
        fetchTodayTotal();
        fetchCashierStatus();
        fetchSessionTotal();
      } catch (err) {
        console.error("Checkout failed:", err);
        alert(err.response?.data?.message || "Checkout failed");
      }
    },
    [
      isClosed,
      cart,
      cartTotal,
      user,
      authHeaders,
      fetchTodayTotal,
      fetchCashierStatus,
      fetchSessionTotal,
    ]
  );

  const handleCloseInvoice = useCallback(() => {
    setShowInvoiceModal(false);
    fetchTodayTotal();
    fetchSessionTotal();
  }, [fetchTodayTotal, fetchSessionTotal]);

  // ---------- Render ----------
  return (
    <div className="container p-4">
      {/* Header: user/status on left, Logout alone on right */}
      <div className="d-flex align-items-center justify-content-between mb-2">
        <div className="small">
          <span className="me-3 d-none d-sm-inline">
            👤 <strong>{user?.name}</strong> ({user?.role}){" "}
            {isClosed ? (
              <span className="badge bg-danger ms-2">🔴 Closed</span>
            ) : (
              <span className="badge bg-success ms-2">🟢 Open</span>
            )}
          </span>
        </div>
        <button onClick={logout} className="btn btn-danger btn-sm">
          Logout
        </button>
      </div>

      {/* Toolbar row: Search on the left; Session Total + My Invoices on the right */}
      <div className="d-flex align-items-center justify-content-between gap-3 mb-3">
        <input
          ref={searchRef}
          type="text"
          placeholder="Search product… (F2 to focus)"
          className="form-control"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          disabled={isClosed}
          aria-label="Search product"
          style={{ flex: 1 }}
        />

        <div className="d-flex align-items-center gap-2">
          <div className="bg-primary text-white rounded-3 px-3 py-2 shadow-sm">
            <span className="fw-semibold">
              🕓 Session Total: <strong>{currency.format(sessionTotal)}</strong>
            </span>
          </div>
          <button
            className="btn btn-outline-primary"
            onClick={() => navigate("/cashier/invoices")}
          >
            My Invoices
          </button>
        </div>
      </div>

      <div className="d-flex flex-column flex-md-row gap-3">
        {/* Products */}
        <section className="flex-grow-1" style={{ minWidth: 0 }}>
          <div className="card mb-3">
            <div className="card-header bg-primary text-white">
              <h5 className="mb-0">🛍️ Products</h5>
            </div>
            <div className="card-body">
              {loadingProducts ? (
                <div className="text-center py-4">
                  <div className="spinner-border" role="status" />
                  <div className="small text-muted mt-2">Loading…</div>
                </div>
              ) : products.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-bordered table-hover align-middle">
                    <thead className="table-secondary">
                      <tr>
                        <th
                          role="button"
                          onClick={() => toggleSort("name")}
                          title="Sort by Name"
                        >
                          Name {sortBy === "name" ? (sortDir === "asc" ? "▲" : "▼") : ""}
                        </th>
                        <th>Category</th>
                        <th
                          className="text-end"
                          role="button"
                          onClick={() => toggleSort("price")}
                          title="Sort by Price"
                        >
                          Price {sortBy === "price" ? (sortDir === "asc" ? "▲" : "▼") : ""}
                        </th>
                        <th
                          className="text-end"
                          role="button"
                          onClick={() => toggleSort("qty")}
                          title="Sort by Quantity"
                        >
                          Available Qty{" "}
                          {sortBy === "qty" ? (sortDir === "asc" ? "▲" : "▼") : ""}
                        </th>
                        <th style={{ width: 90 }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedProducts.map((product) => {
                        const inCart = cart.find((i) => i._id === product._id);
                        const stock = product.totalSellableQty || 0;
                        const atMax = inCart && inCart.quantity >= stock;
                        const addDisabled =
                          isClosed || stock === 0 || Boolean(atMax);
                        const qtyBadgeClass =
                          stock <= 5
                            ? "bg-danger"
                            : stock <= 15
                            ? "bg-warning text-dark"
                            : "bg-secondary";

                        return (
                          <tr key={product._id}>
                            <td className="text-truncate" title={product.name}>
                              {product.name}
                            </td>
                            <td>{product.category}</td>
                            <td className="text-end">
                              {currency.format(product.price)}
                            </td>
                            <td className="text-end">
                              <span className={`badge ${qtyBadgeClass}`}>
                                {stock}
                              </span>
                            </td>
                            <td className="text-center">
                              <button
                                className="btn btn-success btn-sm w-100"
                                onClick={() => handleAddToCart(product)}
                                disabled={addDisabled}
                              >
                                {stock === 0
                                  ? "Out"
                                  : atMax
                                  ? "Max"
                                  : "+ Add"}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-center text-muted mb-0">
                  {search.trim().length < 2
                    ? "Start typing (min 2 chars) to search…"
                    : "No products found."}
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Cart */}
        <aside className="flex-grow-1" style={{ minWidth: 0 }}>
          <div className="card">
            <div className="card-header bg-warning text-dark d-flex justify-content-between align-items-center">
              <h5 className="mb-0">🛒 Your Cart</h5>
              <button
                className="btn btn-outline-secondary btn-sm"
                disabled={!cart.length}
                onClick={clearCart}
                title="Clear all items"
              >
                Clear Cart
              </button>
            </div>
            <div className="card-body">
              {cart.length > 0 ? (
                <>
                  <div className="table-responsive">
                    <table className="table table-sm table-bordered mb-3 align-middle">
                      <thead className="table-light">
                        <tr>
                          <th>Item</th>
                          <th style={{ width: 90 }} className="text-center">
                            Qty
                          </th>
                          <th className="text-end">Price</th>
                          <th className="text-end">Total</th>
                          <th style={{ width: 70 }} className="text-center">
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {cart.map((item) => {
                          const stock = item.totalSellableQty ?? Infinity;
                          return (
                            <tr key={item._id}>
                              <td className="text-truncate" title={item.name}>
                                {item.name}
                              </td>
                              <td className="text-center">
                                <input
                                  type="number"
                                  min="1"
                                  max={Number.isFinite(stock) ? stock : undefined}
                                  className="form-control form-control-sm text-center"
                                  value={item.quantity}
                                  onChange={(e) =>
                                    handleQtyChange(item._id, e.target.value)
                                  }
                                  disabled={isClosed}
                                  aria-label={`Quantity for ${item.name}`}
                                />
                                {Number.isFinite(stock) && item.quantity >= stock ? (
                                  <small className="text-danger">Max stock</small>
                                ) : null}
                              </td>
                              <td className="text-end">
                                {currency.format(item.price)}
                              </td>
                              <td className="text-end">
                                {currency.format(item.price * item.quantity)}
                              </td>
                              <td className="text-center">
                                <button
                                  className="btn btn-outline-danger btn-sm"
                                  title="Remove item"
                                  onClick={() => handleRemoveFromCart(item._id)}
                                  disabled={isClosed}
                                >
                                  ✖
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="text-end">
                    <h6 className="fw-bold">Total: {currency.format(cartTotal)}</h6>
                    <button
                      className="btn btn-primary w-100 mt-2"
                      onClick={() => setShowCheckoutModal(true)}
                      disabled={isClosed}
                      title="Open checkout (F4)"
                    >
                      Checkout 💰
                    </button>
                  </div>
                </>
              ) : (
                <p className="text-center text-muted mb-0">Cart is empty.</p>
              )}
            </div>
          </div>
        </aside>
      </div>

      {/* Modals */}
      <CheckoutModal
        isOpen={showCheckoutModal}
        onClose={() => setShowCheckoutModal(false)}
        total={cartTotal}
        onConfirm={handleConfirmSale}
      />

      <InvoiceModal
        isOpen={showInvoiceModal}
        onClose={handleCloseInvoice}
        sale={lastSale}
      />
    </div>
  );
}
