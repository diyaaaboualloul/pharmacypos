import { useState } from "react";
import axios from "axios";
import "../App.css"; // uses the auth styles

export default function LoginPage() {
  const [email, setEmail]         = useState("");
  const [password, setPassword]   = useState("");
  const [showPwd, setShowPwd]     = useState(false);
  const [error, setError]         = useState("");
  const [loading, setLoading]     = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { data } = await axios.post(
        "http://localhost:5000/api/auth/login",
        { email, password }
      );

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      if (data.user.role === "admin") {
        window.location.href = "/dashboard";
      } else if (data.user.role === "cashier") {
        window.location.href = "/cashier/pos";
      } else if (data.user.role === "accounting" || data.user.role === "finance") {
        window.location.href = "/finance-dashboard";
      } else {
        window.location.href = "/";
      }
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        {/* brand row */}
        <div className="auth-brand">
          <img src="/logo-pharmacy.png" alt="Pharmacy POS" className="auth-logo" width={40} height={40} />
          <div className="auth-brand-text">
            <span className="auth-brand-name">DHL PHARMACY</span>
            <span className="auth-brand-sub">Point of Sale</span>
          </div>
        </div>

        <h2 className="auth-title">Sign in</h2>
        <p className="auth-subtitle">Welcome back! Please enter your details.</p>

        {error && <p className="auth-alert error">{error}</p>}

        <form onSubmit={handleSubmit} className="auth-form">
          <label className="auth-label">
            Email
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="auth-input"
              autoComplete="username"
            />
          </label>

          <label className="auth-label">
            Password
            <div className="auth-input-wrap">
              <input
                type={showPwd ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="auth-input has-toggle"
                autoComplete="current-password"
              />
              <button
                type="button"
                className="auth-eye"
                aria-label={showPwd ? "Hide password" : "Show password"}
                aria-pressed={showPwd}
                onClick={() => setShowPwd((s) => !s)}
              >
                {showPwd ? "Hide" : "Show"}
              </button>
            </div>
          </label>

          <button type="submit" disabled={loading} className="auth-button primary">
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}
