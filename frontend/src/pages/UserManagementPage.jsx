import { useEffect, useState } from "react";
import axios from "axios";
import { getToken } from "../utils/auth";
import { useNavigate } from "react-router-dom";
import TopHeader from "../components/TopHeader";
import Sidebar from "../components/Sidebar";

export default function UserManagementPage() {
  const [users, setUsers] = useState([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("cashier");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const fetchUsers = async () => {
    try {
      const token = getToken();
      const { data } = await axios.get("http://localhost:5000/api/admin/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(data);
    } catch (err) {
      console.error("Failed to fetch users", err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      const token = getToken();
      const { data } = await axios.post(
        "http://localhost:5000/api/admin/create-user",
        { name, email, password, role },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage(data.message);
      setName("");
      setEmail("");
      setPassword("");
      setRole("cashier");
      fetchUsers();
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed to create user");
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm("Are you sure?")) return;
    try {
      const token = getToken();
      await axios.delete(`http://localhost:5000/api/admin/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchUsers();
    } catch (err) {
      console.error("Failed to delete user", err);
    }
  };

  const adminCount = users.filter((u) => u.role === "admin").length;

  return (
    <>
      <TopHeader />
      <div className="d-flex">
        <Sidebar />

        <div className="container-fluid mt-4" style={{ marginLeft: "220px" }}>
          <div className="card shadow-sm">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h3>👤 Manage Users</h3>
                <button
                  className="btn btn-secondary"
                  onClick={() => navigate("/dashboard")}
                >
                  ← Back
                </button>
              </div>

              {message && (
                <div className="alert alert-info py-2 text-center">{message}</div>
              )}

              {/* Create User Form */}
              <form onSubmit={handleCreateUser} className="row g-3 mb-4">
                <div className="col-md-3">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="col-md-3">
                  <input
                    type="email"
                    className="form-control"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="col-md-3">
                  <input
                    type="password"
                    className="form-control"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="col-md-2">
                  <select
                    className="form-select"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                  >
                    <option value="admin">Admin</option>
                    <option value="cashier">Cashier</option>
                    <option value="finance">Finance</option>
                  </select>
                </div>
                <div className="col-md-1 d-grid">
                  <button type="submit" className="btn btn-success">
                    Create
                  </button>
                </div>
              </form>

              {/* Users Table */}
              <div className="table-responsive">
                <table className="table table-striped table-bordered align-middle">
                  <thead className="table-dark">
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th style={{ width: "80px" }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="text-center">
                          No users found
                        </td>
                      </tr>
                    ) : (
                      users.map((u) => (
                        <tr key={u._id}>
                          <td>{u.name}</td>
                          <td>{u.email}</td>
                          <td className="text-capitalize">{u.role}</td>
                          <td>
                            {!(u.role === "admin" && adminCount === 1) && (
                              <button
                                className="btn btn-danger btn-sm"
                                onClick={() => handleDeleteUser(u._id)}
                              >
                                🗑️
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
