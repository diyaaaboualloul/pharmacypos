import { useEffect, useState } from "react";
import axios from "axios";
import Layout from "../components/Layout";
import { getToken } from "../utils/auth";

export default function EmployeesPage() {
  const [employees, setEmployees] = useState([]);
  const [name, setName] = useState("");
  const [role, setRole] = useState("Pharmacist");
  const [baseSalary, setBaseSalary] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const api = axios.create({
    baseURL: "http://localhost:5000",
    headers: { Authorization: `Bearer ${getToken()}` },
  });

  const fetchEmployees = async () => {
    try {
      const { data } = await api.get("/api/employees");
      setEmployees(data);
    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.message || "Failed to load employees");
    }
  };

  useEffect(() => {
    fetchEmployees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);
    try {
      const payload = { name, role, baseSalary: Number(baseSalary) };
      const { data } = await api.post("/api/employees", payload);
      setMessage(data.message || "Employee created");
      setName("");
      setRole("Pharmacist");
      setBaseSalary("");
      fetchEmployees();
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed to create employee");
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (emp) => {
    try {
      const newStatus = emp.status === "active" ? "inactive" : "active";
      const { data } = await api.patch(`/api/employees/${emp._id}/status`, {
        status: newStatus,
      });
      setMessage(data.message || "Status updated");
      fetchEmployees();
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed to update status");
    }
  };

  const quickEditSalary = async (emp) => {
    const input = prompt(
      `Enter new base salary for ${emp.name}:`,
      String(emp.baseSalary ?? "")
    );
    if (input == null) return;
    const value = Number(input);
    if (Number.isNaN(value) || value < 0) {
      alert("Invalid salary");
      return;
    }
    try {
      const { data } = await api.put(`/api/employees/${emp._id}`, {
        baseSalary: value,
      });
      setMessage(data.message || "Employee updated");
      fetchEmployees();
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed to update employee");
    }
  };

  return (
    <Layout>
      <div className="card shadow-sm">
        <div className="card-body">
          <div className="d-flex flex-wrap justify-content-between align-items-center mb-3">
            <h3 className="page-title mb-3 mb-md-0">👩‍⚕️ Employees Management</h3>
          </div>

          {message && <div className="alert alert-info py-2 text-center">{message}</div>}

          {/* Create employee */}
          <form onSubmit={handleCreate} className="row g-2 g-md-3 mb-4">
            <div className="col-12 col-md-4">
              <input
                type="text"
                className="form-control"
                placeholder="Employee Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="col-12 col-md-3">
              <select
                className="form-select"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option>Pharmacist</option>
                <option>Cashier</option>
                <option>Finance</option>
                <option>Storekeeper</option>
                <option>Assistant</option>
              </select>
            </div>

            <div className="col-12 col-md-3">
              <input
                type="number"
                className="form-control"
                placeholder="Base Salary"
                value={baseSalary}
                onChange={(e) => setBaseSalary(e.target.value)}
                required
                min={0}
              />
            </div>

            <div className="col-12 col-md-2 d-grid">
              <button type="submit" disabled={loading} className="btn btn-primary w-100">
                {loading ? "Creating..." : "Create"}
              </button>
            </div>
          </form>

          {/* Employees table */}
          <div className="table-responsive">
            <table className="table table-striped table-bordered align-middle">
              <thead className="table-dark">
                <tr>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Base Salary</th>
                  <th>Status</th>
                  <th style={{ width: 160 }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {employees.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center">
                      No employees found
                    </td>
                  </tr>
                ) : (
                  employees.map((emp) => (
                    <tr key={emp._id}>
                      <td>{emp.name}</td>
                      <td>{emp.role}</td>
                      <td>${Number(emp.baseSalary || 0).toFixed(2)}</td>
                      <td>
                        <span
                          className={`badge ${
                            emp.status === "active" ? "bg-success" : "bg-secondary"
                          }`}
                        >
                          {emp.status}
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn btn-sm btn-outline-warning me-2"
                          onClick={() => quickEditSalary(emp)}
                          title="Edit base salary"
                        >
                          ✏️ Salary
                        </button>
                        <button
                          className="btn btn-sm btn-outline-info"
                          onClick={() => toggleStatus(emp)}
                          title="Toggle status"
                        >
                          {emp.status === "active" ? "Deactivate" : "Activate"}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}
