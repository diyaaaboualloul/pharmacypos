import { useEffect, useState } from "react";
import axios from "axios";
import { getToken } from "../utils/auth";
import { useNavigate } from "react-router-dom";

export default function UserManagementPage() {
  const [users, setUsers] = useState([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("cashier");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const fetchUsers = async () => {
    const token = getToken();
    const { data } = await axios.get("http://localhost:5000/api/admin/users", {
      headers: { Authorization: `Bearer ${token}` },
    });
    setUsers(data);
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
      setName(""); setEmail(""); setPassword(""); setRole("cashier");
      fetchUsers();
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed to create user");
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm("Are you sure?")) return;
    const token = getToken();
    await axios.delete(`http://localhost:5000/api/admin/users/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchUsers();
  };

  const adminCount = users.filter(u => u.role === "admin").length;

  return (
    <div style={styles.container}>
      <h1>👤 Manage Users</h1>
      <button onClick={() => navigate("/dashboard")} style={styles.backBtn}>
        ← Back
      </button>

      <form onSubmit={handleCreateUser} style={styles.form}>
        {message && <p>{message}</p>}
        <input value={name} onChange={e=>setName(e.target.value)} placeholder="Name" required/>
        <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" type="email" required/>
        <input value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password" type="password" required/>
        <select value={role} onChange={e=>setRole(e.target.value)}>
          <option value="admin">Admin</option>
          <option value="cashier">Cashier</option>
          <option value="finance">Finance</option>
        </select>
        <button type="submit" style={styles.submitBtn}>Create</button>
      </form>

      <table style={styles.table}>
        <thead>
          <tr><th>Name</th><th>Email</th><th>Role</th><th>Action</th></tr>
        </thead>
        <tbody>
          {users.map(u => (
            <tr key={u._id}>
              <td>{u.name}</td>
              <td>{u.email}</td>
              <td>{u.role}</td>
              <td>
                {!(u.role === "admin" && adminCount === 1) && (
                  <button onClick={()=>handleDeleteUser(u._id)} style={styles.deleteBtn}>🗑️</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const styles = {
  container: { maxWidth: "800px", margin: "2rem auto", textAlign: "center" },
  form: { display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "2rem" },
  submitBtn: { background: "green", color: "#fff", padding: "0.5rem", cursor: "pointer" },
  table: { width: "100%", borderCollapse: "collapse" },
  deleteBtn: { background: "red", color: "#fff", border: "none", padding: "0.3rem 0.6rem", cursor: "pointer" },
  backBtn: { background: "#007bff", color: "#fff", padding: "0.5rem", marginBottom: "1rem", cursor: "pointer" },
};
