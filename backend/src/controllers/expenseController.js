import Expense from "../models/Expense.js";
import PayrollEntry from "../models/PayrollEntry.js";
import mongoose from "mongoose";

// helper: get month start/end from "YYYY-MM"
function getMonthRange(periodStr) {
  // periodStr like "2025-10"
  const [y, m] = periodStr.split("-").map(Number);
  const start = new Date(Date.UTC(y, m - 1, 1, 0, 0, 0));
  const end = new Date(Date.UTC(y, m, 0, 23, 59, 59, 999)); // last day of month
  return { start, end };
}

/**
 * GET /api/expenses
 * Optional filters:
 *  - ?from=YYYY-MM-DD
 *  - ?to=YYYY-MM-DD
 *  - ?category=Rent
 * Returns list + totalAmount
 */
export const listExpenses = async (req, res) => {
  try {
    const { from, to, category } = req.query;

    const filter = {};

    if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = new Date(from + "T00:00:00.000Z");
      if (to)   filter.date.$lte = new Date(to + "T23:59:59.999Z");
    }

    if (category && category !== "All") {
      filter.category = category;
    }

    const rows = await Expense.find(filter)
      .populate("createdBy", "name email role")
      .sort({ date: -1 });

    const totalAmount = rows.reduce((sum, e) => sum + e.amount, 0);

    res.json({
      count: rows.length,
      totalAmount,
      rows,
    });

  } catch (err) {
    console.error("listExpenses error:", err);
    res.status(500).json({ message: "Failed to load expenses", error: err.message });
  }
};

/**
 * POST /api/expenses
 * body: { category, amount, date, description }
 * createdBy is req.user.id
 */
export const createExpense = async (req, res) => {
  try {
    const { category, amount, date, description } = req.body;

    if (!category || amount == null || !date) {
      return res.status(400).json({ message: "category, amount, and date are required" });
    }

    const expense = await Expense.create({
      category,
      amount: Number(amount),
      date: new Date(date),
      description: description || "",
      createdBy: req.user.id, // from JWT middleware
    });

    res.status(201).json({ message: "Expense created", expense });
  } catch (err) {
    console.error("createExpense error:", err);
    res.status(400).json({ message: "Failed to create expense", error: err.message });
  }
};

/**
 * PUT /api/expenses/:id
 * update existing expense
 */
export const updateExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const { category, amount, date, description } = req.body;

    const updated = await Expense.findByIdAndUpdate(
      id,
      {
        ...(category != null ? { category } : {}),
        ...(amount != null ? { amount: Number(amount) } : {}),
        ...(date != null ? { date: new Date(date) } : {}),
        ...(description != null ? { description } : {}),
      },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Expense not found" });
    }

    res.json({ message: "Expense updated", expense: updated });
  } catch (err) {
    console.error("updateExpense error:", err);
    res.status(400).json({ message: "Failed to update expense", error: err.message });
  }
};

/**
 * DELETE /api/expenses/:id
 */
export const deleteExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const removed = await Expense.findByIdAndDelete(id);
    if (!removed) {
      return res.status(404).json({ message: "Expense not found" });
    }
    res.json({ message: "Expense deleted" });
  } catch (err) {
    console.error("deleteExpense error:", err);
    res.status(400).json({ message: "Failed to delete expense", error: err.message });
  }
};

/**
 * GET /api/expenses/summary?period=YYYY-MM
 * returns:
 *   totalExpenses (from Expense model, that month)
 *   payrollPaid   (sum of PayrollEntry.netPay where paid=true in that month)
 *   grandTotal    (expenses + payrollPaid)
 */
export const getMonthlySummary = async (req, res) => {
  try {
    const { period } = req.query; // "2025-10"
    if (!period || !/^\d{4}-\d{2}$/.test(period)) {
      return res.status(400).json({ message: "period must be YYYY-MM" });
    }

    const { start, end } = getMonthRange(period);

    // 1. expenses in that month
    const expenses = await Expense.find({
      date: { $gte: start, $lte: end },
    }).lean();

    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

    // 2. payroll actually paid in that month
    const payroll = await PayrollEntry.find({
      paid: true,
      paidDate: { $gte: start, $lte: end },
    }).lean();

    const payrollPaid = payroll.reduce((sum, p) => sum + (p.netPay || 0), 0);

    res.json({
      period,
      totalExpenses,
      payrollPaid,
      grandTotal: totalExpenses + payrollPaid,
      expenses,
      payroll,
    });
  } catch (err) {
    console.error("getMonthlySummary error:", err);
    res.status(500).json({ message: "Failed to get summary", error: err.message });
  }
};
