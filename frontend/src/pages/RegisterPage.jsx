import { useState } from "react";
import axios from "axios";
import "../App.css";

export default function RegisterPage() {
  const [name, setName]         = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd]   = useState(false);
  const [role, setRole]         = useState("cashier");
  const [error, setError]       = useState("");
  const [success, setSuccess]   = useState("");
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const { data } = await axios.post("http://localhost:5000/api/auth/register", {
        name,
        email,
        password,
        role,
      });

      setSuccess(data.message || "Registration successful!");
      setName("");
      setEmail("");
      setPassword("");
      setRole("cashier");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
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
            <span className="auth-brand-sub">Create your account</span>
          </div>
        </div>

        <h2 className="auth-title">Register</h2>
        <p className="auth-subtitle">Set up access for a new team member.</p>

        {error && <p className="auth-alert error">{error}</p>}
        {success && <p className="auth-alert success">{success}</p>}

        <form onSubmit={handleSubmit} className="auth-form">
          <label className="auth-label">
            Full Name
            <input
              type="text"
              className="auth-input"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="name"
            />
          </label>

          <label className="auth-label">
            Email
            <input
              type="email"
              className="auth-input"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </label>

          <label className="auth-label">
            Password
            <div className="auth-input-wrap">
              <input
                type={showPwd ? "text" : "password"}
                className="auth-input has-toggle"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
                minLength={6}
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

          <label className="auth-label">
            Role
            <select
              className="auth-input"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="admin">Admin</option>
              <option value="cashier">Cashier</option>
              <option value="finance">Finance</option>
              <option value="accounting">Accounting</option>
            </select>
          </label>

          <button type="submit" className="auth-button primary" disabled={loading}>
            {loading ? "Registering..." : "Register"}
          </button>
        </form>
      </div>
    </div>
  );
}
  