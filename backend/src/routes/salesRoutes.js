import express from "express";
import { requireAuth, requireAdmin,requireFinanceOrAdmin } from "../middleware/auth.js";
import { listMySales, listAllSales, getSaleById } from "../controllers/salesController.js";

const router = express.Router();

// Cashier: see own invoices
router.get("/my", requireAuth, listMySales);

// Admin/Finance: see all invoices
router.get("/all", requireAuth, requireFinanceOrAdmin, listAllSales);

// Admin/Finance: view one invoice
router.get("/:id", requireAuth, requireFinanceOrAdmin, getSaleById);

export default router;
