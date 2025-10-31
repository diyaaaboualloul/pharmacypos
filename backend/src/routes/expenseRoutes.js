import express from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import {
  listExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
  getMonthlySummary,
} from "../controllers/expenseController.js";

const router = express.Router();

// all expense routes require finance OR admin
router.use(requireAuth, requireRole("admin", "finance"));

// CRUD
router.get("/", listExpenses);
router.post("/", createExpense);
router.put("/:id", updateExpense);
router.delete("/:id", deleteExpense);

// summary with payroll
router.get("/summary/month", getMonthlySummary);

export default router;
