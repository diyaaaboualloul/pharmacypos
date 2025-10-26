import Employee from "../models/Employee.js";

// GET /api/employees
export const listEmployees = async (req, res) => {
  try {
    const rows = await Employee.find().sort({ createdAt: -1 });
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: "Failed to load employees", error: err.message });
  }
};

// POST /api/employees
export const createEmployee = async (req, res) => {
  try {
    const { name, role, baseSalary, status = "active" } = req.body;
    if (!name || !role || baseSalary == null) {
      return res.status(400).json({ message: "name, role and baseSalary are required" });
    }
    const emp = await Employee.create({ name, role, baseSalary, status });
    res.status(201).json({ message: "Employee created", employee: emp });
  } catch (err) {
    res.status(400).json({ message: "Failed to create employee", error: err.message });
  }
};

// PUT /api/employees/:id
export const updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await Employee.findByIdAndUpdate(id, req.body, { new: true });
    if (!updated) return res.status(404).json({ message: "Employee not found" });
    res.json({ message: "Employee updated", employee: updated });
  } catch (err) {
    res.status(400).json({ message: "Failed to update employee", error: err.message });
  }
};

// PATCH /api/employees/:id/status
export const setEmployeeStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // "active" | "inactive"
    if (!["active", "inactive"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }
    const updated = await Employee.findByIdAndUpdate(id, { status }, { new: true });
    if (!updated) return res.status(404).json({ message: "Employee not found" });
    res.json({ message: "Status updated", employee: updated });
  } catch (err) {
    res.status(400).json({ message: "Failed to update status", error: err.message });
  }
};
