import express from "express";
import { requireAuth } from "../middleware/auth.js";
import {
  searchSellable,
  checkout,
  listSales,
  updateSale,
  listMySales,
  refundItem,
  replaceItem,
  getSaleById,
  refundSale, // ✅ make sure this is imported
} from "../controllers/posController.js";
import { getTodayTotalSales } from "../controllers/posController.js";

const router = express.Router();
router.use(requireAuth);

// Routes
router.get("/search", searchSellable);
router.post("/checkout", checkout);
router.get("/sales", listSales);
router.get("/sales/:id", getSaleById); // ✅ for viewing a specific invoice
router.put("/sales/:id", updateSale);
router.get("/my-sales", listMySales);
router.get("/today-total", getTodayTotalSales);

// Refund and Replace routes
router.post("/refund/:id", refundSale); // ✅ ADD THIS LINE
router.post("/refund-item/:saleId", refundItem);
router.post("/replace-item/:saleId", replaceItem);

export default router;
