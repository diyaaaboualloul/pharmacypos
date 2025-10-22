// backend/src/routes/reportRoutes.js
import express from "express";
import { requireAuth } from "../middleware/auth.js";
import { requireAdminOrFinance } from "../middleware/roles.js";
import {
  salesSummary,
  topProducts,
  cashierPerformance,
  paymentBreakdown,
  refundsTimeseries,
  inventoryHealth,
} from "../controllers/reportController.js";

const router = express.Router();

// All report routes require auth + (admin or finance)
router.get("/sales/summary", requireAuth, requireAdminOrFinance, salesSummary);
router.get("/products/top", requireAuth, requireAdminOrFinance, topProducts);
router.get("/cashiers/performance", requireAuth, requireAdminOrFinance, cashierPerformance);
router.get("/payments/breakdown", requireAuth, requireAdminOrFinance, paymentBreakdown);
router.get("/refunds/timeseries", requireAuth, requireAdminOrFinance, refundsTimeseries);
router.get("/inventory/health", requireAuth, requireAdminOrFinance, inventoryHealth);

export default router;
