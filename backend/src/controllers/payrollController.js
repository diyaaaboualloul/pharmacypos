import PayrollEntry from "../models/PayrollEntry.js";
import Employee from "../models/Employee.js";
import { Parser } from "json2csv";

// GET /api/payroll?period=YYYY-MM
// Auto-creates missing entries for ACTIVE employees with snapshot baseSalary
export const listPayrollByPeriod = async (req, res) => {
  try {
    const period = (req.query.period || "").trim();
    if (!/^\d{4}-\d{2}$/.test(period)) {
      return res.status(400).json({ message: "period must be YYYY-MM" });
    }

    // Load all active employees
    const employees = await Employee.find({ status: "active" }).lean();

    // Existing entries map
    const existing = await PayrollEntry.find({ period }).lean();
    const existingMap = new Map(existing.map(e => [String(e.employeeId), e]));

    // Create missing entries in bulk (base snapshot)
    const toCreate = employees
      .filter(emp => !existingMap.has(String(emp._id)))
      .map(emp => ({
        employeeId: emp._id,
        period,
        baseSalary: emp.baseSalary,
        advances: 0,
        deductions: 0,
        netPay: emp.baseSalary, // will also be set by pre-validate
        paid: false,
        createdBy: req.user?._id,
      }));

    if (toCreate.length) {
      await PayrollEntry.insertMany(toCreate);
    }

    // Return fresh list
    const rows = await PayrollEntry.find({ period })
      .populate("employeeId", "name role status baseSalary")
      .sort({ "employeeId.name": 1, createdAt: 1 });

    res.json({ period, rows });
  } catch (err) {
    res.status(500).json({ message: "Failed to load payroll", error: err.message });
  }
};

// PUT /api/payroll/:id
// Update advances/deductions (and optionally baseSalary snapshot); netPay recalculated by model
export const updatePayrollEntry = async (req, res) => {
  try {
    const { id } = req.params;
    const { baseSalary, advances, deductions } = req.body;

    const entry = await PayrollEntry.findById(id);
    if (!entry) return res.status(404).json({ message: "Payroll entry not found" });

    if (baseSalary != null) entry.baseSalary = Number(baseSalary);
    if (advances != null) entry.advances = Number(advances);
    if (deductions != null) entry.deductions = Number(deductions);

    await entry.validate(); // fail early with clear message
    await entry.save();

    res.json({ message: "Payroll updated", entry });
  } catch (err) {
    res.status(400).json({ message: "Failed to update payroll", error: err.message });
  }
};

// PATCH /api/payroll/:id/pay
// Mark as paid (paid=true, paidDate, paymentMethod)
export const markPayrollPaid = async (req, res) => {
  try {
    const { id } = req.params;
    const { paid, paidDate, paymentMethod } = req.body;

    const entry = await PayrollEntry.findById(id);
    if (!entry) return res.status(404).json({ message: "Payroll entry not found" });

    entry.paid = Boolean(paid);
    entry.paidDate = entry.paid ? (paidDate ? new Date(paidDate) : new Date()) : null;
    entry.paymentMethod = entry.paid ? paymentMethod : null;

    await entry.validate();
    await entry.save();

    res.json({ message: "Payroll payment updated", entry });
  } catch (err) {
    res.status(400).json({ message: "Failed to update payment", error: err.message });
  }
};

// GET /api/payroll/export.csv?period=YYYY-MM
export const exportPayrollCsv = async (req, res) => {
  try {
    const period = (req.query.period || "").trim();
    if (!/^\d{4}-\d{2}$/.test(period)) {
      return res.status(400).json({ message: "period must be YYYY-MM" });
    }

    const rows = await PayrollEntry.find({ period })
      .populate("employeeId", "name role")
      .lean();

    const data = rows.map(r => ({
      period,
      employee: r.employeeId?.name || "",
      role: r.employeeId?.role || "",
      baseSalary: r.baseSalary,
      advances: r.advances,
      deductions: r.deductions,
      netPay: r.netPay,
      paid: r.paid ? "YES" : "NO",
      paidDate: r.paidDate ? new Date(r.paidDate).toISOString().slice(0, 10) : "",
      paymentMethod: r.paymentMethod || "",
    }));

    const parser = new Parser({ fields: Object.keys(data[0] || {
      period: "",
      employee: "",
      role: "",
      baseSalary: 0,
      advances: 0,
      deductions: 0,
      netPay: 0,
      paid: "",
      paidDate: "",
      paymentMethod: "",
    })});
    const csv = parser.parse(data);

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="payroll-${period}.csv"`);
    res.status(200).send(csv);
  } catch (err) {
    res.status(500).json({ message: "Failed to export CSV", error: err.message });
  }
};
