import { useEffect, useState } from "react";
import axios from "axios";
import { getToken, getUser } from "../utils/auth"; // ✅ make sure this returns user from localStorage
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import { motion, AnimatePresence } from "framer-motion";

export default function UserManagementPage() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "cashier" });
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState("");
  const [filterName, setFilterName] = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const navigate = useNavigate();

  // ✅ logged-in user (from localStorage)
  const loggedInUser = getUser(); // should return the user object { _id, name, email, role }
  const loggedInUserId = loggedInUser?._id;

  useEffect(() => {
    fetchUsers();
  }, []);

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

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      const token = getToken();
      const { data } = await axios.post(
        "http://localhost:5000/api/admin/create-user",
        form,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage(data.message);
      setForm({ name: "", email: "", password: "", role: "cashier" });
      setShowForm(false);
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

  // Dashboard counts
  const adminCount = users.filter((u) => u.role === "admin").length;
  const cashierCount = users.filter((u) => u.role === "cashier").length;
  const financeCount = users.filter((u) => u.role === "finance").length;

  // Filters
  const filteredUsers = users.filter((u) => {
    const nameMatch = u.name.toLowerCase().includes(filterName.toLowerCase());
    const roleMatch = filterRole ? u.role === filterRole : true;
    return nameMatch && roleMatch;
  });

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const start = (currentPage - 1) * itemsPerPage;
  const currentUsers = filteredUsers.slice(start, start + itemsPerPage);

  return (
    <Layout>
      <div className="container py-4">
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h3 className="fw-bold text-primary">👥 User Management</h3>
          <button
            className="btn btn-primary rounded-pill shadow"
            onClick={() => setShowForm(true)}
          >
            ➕ Add User
          </button>
        </div>

        {/* Dashboard Summary Cards */}
        <div className="row g-3 mb-4">
          {[
            { title: "Admins", value: adminCount, color: "danger" },
            { title: "Cashiers", value: cashierCount, color: "success" },
            { title: "Finance", value: financeCount, color: "warning" },
          ].map((card, i) => (
            <div className="col-md-4" key={i}>
              <motion.div
                className={`card text-center border-${card.color} shadow-sm`}
                whileHover={{ scale: 1.05 }}
              >
                <div className="card-body">
                  <h6 className={`text-${card.color}`}>{card.title}</h6>
                  <h3>{card.value}</h3>
                </div>
              </motion.div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="row g-3 mb-4">
          <div className="col-md-6">
            <input
              type="text"
              className="form-control"
              placeholder="🔍 Search by name..."
              value={filterName}
              onChange={(e) => {
                setFilterName(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
          <div className="col-md-5">
            <select
              className="form-select"
              value={filterRole}
              onChange={(e) => {
                setFilterRole(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="">All Roles</option>
              <option value="admin">Admin</option>
              <option value="cashier">Cashier</option>
              <option value="finance">Finance</option>
            </select>
          </div>
          <div className="col-md-1">
            <button
              className="btn btn-outline-secondary w-100"
              onClick={() => {
                setFilterName("");
                setFilterRole("");
              }}
            >
              🧹
            </button>
          </div>
        </div>

        {/* Message */}
        {message && <div className="alert alert-info text-center py-2">{message}</div>}

        {/* Table */}
        <div className="table-responsive shadow-sm rounded">
          <table className="table table-hover align-middle">
            <thead className="table-primary text-center">
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {currentUsers.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center text-muted py-3">
                    No users found.
                  </td>
                </tr>
              ) : (
                currentUsers.map((u, i) => (
                  <tr key={u._id}>
                    <td>{start + i + 1}</td>
                    <td>{u.name}</td>
                    <td>{u.email}</td>
                    <td className="text-capitalize">
                      <span
                        className={`badge bg-${
                          u.role === "admin"
                            ? "danger"
                            : u.role === "finance"
                            ? "warning text-dark"
                            : "success"
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td>
                      {/* ✅ Hide delete button for logged-in admin */}
                      {u._id !== loggedInUserId && (
                        <button
                          className="btn btn-sm btn-danger"
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

        {/* Pagination */}
        <div className="d-flex justify-content-between align-items-center mt-3">
          <span>
            Page {currentPage} of {totalPages}
          </span>
          <div>
            <button
              className="btn btn-outline-primary btn-sm me-2"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(currentPage - 1)}
            >
              ← Prev
            </button>
            <button
              className="btn btn-outline-primary btn-sm"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(currentPage + 1)}
            >
              Next →
            </button>
          </div>
        </div>

        {/* ✨ Animated Add User Modal */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50 d-flex justify-content-center align-items-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="card p-4 shadow-lg"
                style={{ width: "400px", borderRadius: "15px" }}
                initial={{ scale: 0.8, y: -50 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.8, y: 50 }}
              >
                <h5 className="text-center mb-3">➕ Add New User</h5>
                <form onSubmit={handleCreateUser}>
                  <input
                    className="form-control mb-3"
                    placeholder="Name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                  <input
                    type="email"
                    className="form-control mb-3"
                    placeholder="Email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                  />
                  <input
                    type="password"
                    className="form-control mb-3"
                    placeholder="Password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    required
                  />
                  <select
                    className="form-select mb-3"
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                  >
                    <option value="admin">Admin</option>
                    <option value="cashier">Cashier</option>
                    <option value="finance">Finance</option>
                  </select>
                  <div className="d-flex justify-content-between">
                    <button type="submit" className="btn btn-success w-50 me-2">
                      Create
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary w-50"
                      onClick={() => setShowForm(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
}
