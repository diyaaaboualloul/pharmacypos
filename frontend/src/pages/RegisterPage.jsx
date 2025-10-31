import { useState } from "react";
import axios from "axios";
import "../App.css";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("cashier");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

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
    <div className="login-container">
      <div className="login-card">
        <h2 className="login-title">🧾 Create Pharmacy POS Account</h2>

        {error && <p className="login-alert error">{error}</p>}
        {success && <p className="login-alert success">{success}</p>}

        <form onSubmit={handleSubmit} className="login-form">
          <label className="login-label">
            Full Name
            <input
              type="text"
              className="login-input"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </label>

          <label className="login-label">
            Email
            <input
              type="email"
              className="login-input"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>

          <label className="login-label">
            Password
            <input
              type="password"
              className="login-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>

          <label className="login-label">
            Role
            <select
              className="login-input"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="admin">Admin</option>
              <option value="cashier">Cashier</option>
              <option value="accounting">Accounting</option>
            </select>
          </label>

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? "Registering..." : "Register"}
          </button>
        </form>
      </div>
    </div>
  );
}
