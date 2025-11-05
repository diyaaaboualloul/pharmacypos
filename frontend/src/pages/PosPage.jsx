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

  // NEW: logout confirm modal
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

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

  // NEW: logout with custom confirmation modal
  const openLogoutConfirm = () => setShowLogoutConfirm(true);
  const cancelLogout = () => setShowLogoutConfirm(false);
  const logout = useCallback(() => {
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

    tick();
    const id = setInterval(tick, 5000);

    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, [fetchTodayTotal, fetchSessionTotal, fetchCashierStatus]);

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
    const dir = sortDir === "asc" ? 1 : -1;
    copy.sort((a, b) => {
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
          if (existing.quantity >= max) return prev;
          return prev.map((i) =>
            i._id === product._id ? { ...i, quantity: i.quantity + 1 } : i
          );
        }
        if (max <= 0) return prev;
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
            price: item.price, // USD unit price
          })),
          totalUSD: cartTotal,
          totalLBP: Math.round(cartTotal * (paymentData?.rate || 0)),

          // Send paymentType both top-level and inside payment for compatibility
          paymentType: paymentData?.paymentType,
          payment: {
            type: paymentData?.paymentType,         // backward-compat for server expecting payment.type
            paymentType: paymentData?.paymentType,  // modern shape
            currency: paymentData?.currency,
            rate: paymentData?.rate,
            received: paymentData?.received,
            cashReceived:
              paymentData?.paymentType === "cash" ? paymentData?.received : 0,
          },

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
          total: data.totalUSD ?? data.total ?? cartTotal,
          payment: paymentData,
        });

        setShowCheckoutModal(false);
        setShowInvoiceModal(true);
        setCart([]);

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
    <div className="pos-wrap">
      <div className="pos-container">
        {/* Header (Admin look) */}
        <div className="page-head">
          <div>
            <div className="page-title">Cashier Page</div>
            <div className="page-sub">Process sales with the Admin theme.</div>
          </div>
          <div className="right-actions">
            <span className="badge-chip" title="Cashier status">
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 999,
                  background: isClosed ? "#ef4444" : "var(--primary)",
                  boxShadow: isClosed
                    ? "0 0 0 3px rgba(239,68,68,.25)"
                    : "0 0 0 3px rgba(16,185,129,.25)",
                }}
              />
              {isClosed ? "Closed" : "Open"}
            </span>
            <span className="badge-role">
              {user?.name || user?.username || "cashier"} ({user?.role || "cashier"})
            </span>
            <button onClick={openLogoutConfirm} className="btn-logout">Logout</button>
          </div>
        </div>

        {/* Toolbar row */}
        <div className="row gap-3 mb-3" style={{ display: "flex", alignItems: "center" }}>
          <input
            ref={searchRef}
            type="text"
            placeholder="Search product… (F2 to focus)"
            className="searchbar"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            disabled={isClosed}
            aria-label="Search product"
            style={{ flex: 1 }}
          />
          <div className="right-actions">
            <span className="badge-chip" title="Session total">
              🕓 Session Total:&nbsp;<strong>{currency.format(sessionTotal)}</strong>
            </span>
            <button
              className="btn-primary"
              onClick={() => navigate("/cashier/invoices")}
            >
              My Invoices
            </button>
          </div>
        </div>

        {/* Main grid */}
        <div className="grid">
          {/* PRODUCTS */}
          <section className="panel">
            <div className="panel-head">
              <div className="head-left">
                <span className="head-accent" />
                <span>Products</span>
              </div>
              <span className="section-title">Browse & add to cart</span>
            </div>
            <div className="panel-body">
              {loadingProducts ? (
                <div className="products-empty">Loading…</div>
              ) : products.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-bordered table-hover align-middle">
                    <thead className="table-secondary">
                      <tr>
                        <th role="button" onClick={() => toggleSort("name")} title="Sort by Name">
                          Name {sortBy === "name" ? (sortDir === "asc" ? "▲" : "▼") : ""}
                        </th>
                        <th>Category</th>
                        <th className="text-end" role="button" onClick={() => toggleSort("price")} title="Sort by Price">
                          Price {sortBy === "price" ? (sortDir === "asc" ? "▲" : "▼") : ""}
                        </th>
                        <th className="text-end" role="button" onClick={() => toggleSort("qty")} title="Sort by Quantity">
                          Available Qty {sortBy === "qty" ? (sortDir === "asc" ? "▲" : "▼") : ""}
                        </th>
                        <th style={{ width: 90 }} />
                      </tr>
                    </thead>
                    <tbody>
                      {sortedProducts.map((product) => {
                        const inCart = cart.find((i) => i._id === product._id);
                        const stock = product.totalSellableQty || 0;
                        const atMax = inCart && inCart.quantity >= stock;
                        const addDisabled = isClosed || stock === 0 || Boolean(atMax);
                        const qtyBadgeClass =
                          stock <= 5
                            ? "bg-danger"
                            : stock <= 15
                            ? "bg-warning text-dark"
                            : "bg-secondary";

                        return (
                          <tr key={product._id}>
                            <td className="text-truncate" title={product.name}>{product.name}</td>
                            <td>{product.category}</td>
                            <td className="text-end">{currency.format(product.price)}</td>
                            <td className="text-end"><span className={`badge ${qtyBadgeClass}`}>{stock}</span></td>
                            <td className="text-center">
                              <button
                                className="btn-primary"
                                style={{ width: "100%" }}
                                onClick={() => handleAddToCart(product)}
                                disabled={addDisabled}
                              >
                                {stock === 0 ? "Out" : atMax ? "Max" : "+ Add"}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="products-empty">
                  {search.trim().length < 2
                    ? "Start typing (min 2 chars) to search…"
                    : "No products found."}
                </p>
              )}
            </div>
          </section>

          {/* CART */}
          <aside className="panel">
            <div className="panel-head">
              <div className="head-left">
                <span className="head-accent" />
                <span>Your Cart</span>
              </div>
              <div className="cart-head-actions">
                <button className="btn-clear" disabled={!cart.length} onClick={clearCart} title="Clear all items">
                  Clear Cart
                </button>
              </div>
            </div>

            <div className="panel-body">
              {cart.length > 0 ? (
                <>
                  <div className="table-responsive">
                    <table className="table table-sm table-bordered mb-3 align-middle">
                      <thead className="table-light">
                        <tr>
                          <th>Item</th>
                          <th style={{ width: 90 }} className="text-center">Qty</th>
                          <th className="text-end">Price</th>
                          <th className="text-end">Total</th>
                          <th style={{ width: 70 }} className="text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cart.map((item) => {
                          const stock = item.totalSellableQty ?? Infinity;
                          return (
                            <tr key={item._id}>
                              <td className="text-truncate" title={item.name}>{item.name}</td>
                              <td className="text-center">
                                <input
                                  type="number"
                                  min="1"
                                  max={Number.isFinite(stock) ? stock : undefined}
                                  className="form-control form-control-sm text-center"
                                  value={item.quantity}
                                  onChange={(e) => handleQtyChange(item._id, e.target.value)}
                                  disabled={isClosed}
                                  aria-label={`Quantity for ${item.name}`}
                                />
                                {Number.isFinite(stock) && item.quantity >= stock ? (
                                  <small className="text-danger">Max stock</small>
                                ) : null}
                              </td>
                              <td className="text-end">{currency.format(item.price)}</td>
                              <td className="text-end">{currency.format(item.price * item.quantity)}</td>
                              <td className="text-center">
                                <button
                                  className="btn-clear"
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

                  <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
                    <span className="total-chip">Total</span>
                    <div style={{ fontWeight: 800, fontSize: 20 }}>{currency.format(cartTotal)}</div>
                  </div>

                  <div className="row" style={{ justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
                    <span className="page-sub">Session Total:</span>
                    <span className="badge-chip" title="Today’s sales">
                      {currency.format(todayTotal)}
                    </span>
                  </div>

                  <div className="actions-row">
                    <button
                      className="btn-primary"
                      onClick={() => setShowCheckoutModal(true)}
                      disabled={isClosed}
                      title="Open checkout (F4)"
                      style={{ flex: 1 }}
                    >
                      Confirm Sale
                    </button>
                    <button className="btn-clear" onClick={clearCart}>Cancel</button>
                  </div>
                </>
              ) : (
                <p className="cart-empty">Cart is empty.</p>
              )}
            </div>
          </aside>
        </div>
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

      {/* Logout Confirm Modal */}
      {showLogoutConfirm && (
        <div className="logout-overlay" role="dialog" aria-modal="true">
          <div className="logout-modal">
            <div className="logout-icon">▲</div>
            <h5 className="logout-title">Confirm Logout</h5>
            <p className="logout-text">
              You’re about to sign out of <strong>Pharmacy POS</strong>.<br />
              Any unsaved changes will be lost.
            </p>
            <div className="logout-tip">Tip&nbsp; You can always sign back in with your credentials.</div>

            <div className="logout-actions">
              <button className="btn-clear" onClick={cancelLogout}>Cancel</button>
              <button className="btn-primary" onClick={logout}>Logout</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
