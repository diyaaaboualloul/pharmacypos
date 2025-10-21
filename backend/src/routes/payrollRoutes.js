import express from "express";
import { requireAuth, requireFinanceOrAdmin } from "../middleware/auth.js";
import {
  listPayrollByPeriod,
  updatePayrollEntry,
  markPayrollPaid,
  exportPayrollCsv,
} from "../controllers/payrollController.js";

const router = express.Router();

router.use(requireAuth, requireFinanceOrAdmin);

router.get("/", listPayrollByPeriod);            // ?period=YYYY-MM
router.put("/:id", updatePayrollEntry);          // update advances/deductions/base
router.patch("/:id/pay", markPayrollPaid);       // mark paid/unpaid
router.get("/export.csv", exportPayrollCsv);     // download CSV

export default router;
