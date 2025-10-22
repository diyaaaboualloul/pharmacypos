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

// ✅ All routes require authentication and (admin or finance) role
router.use(requireAuth, requireAdminOrFinance);

// Analytics routes
router.get("/sales/summary", salesSummary);
router.get("/products/top", topProducts);
router.get("/cashiers/performance", cashierPerformance);
router.get("/payments/breakdown", paymentBreakdown);
router.get("/refunds/timeseries", refundsTimeseries);
router.get("/inventory/health", inventoryHealth);

export default router;
