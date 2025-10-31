import express from "express";
import { requireAuth } from "../middleware/auth.js";
import {
  // 🛒 POS Core
  searchSellable,
  checkout,
  listSales,
  listMySales,
  getSaleById,
  refundItem,
  replaceItem,
  refundSale,

  // 💵 Day Management
  getTodayTotalSales,
  openCashierDay,
  closeCashierDay,
  getCashiersDayStatus,
} from "../controllers/posController.js";
import { getCashierSessions } from "../controllers/posController.js";
import { getCurrentSessionTotal } from "../controllers/posController.js";

const router = express.Router();

// ✅ Require authentication for all POS routes
router.use(requireAuth);

/* ===========================
   🔹 POS Functional Routes
   =========================== */

// 🔍 Search for sellable products
router.get("/search", searchSellable);

// 💰 Checkout and record new sale
router.post("/checkout", checkout);

// 🧾 List all sales (admin)
router.get("/sales", listSales);

// 🧾 Get specific sale / invoice by ID
router.get("/sales/:id", getSaleById);

// ✏️ Update a sale

// 📜 List sales belonging to the logged-in cashier
router.get("/my-sales", listMySales);

/* ===========================
   🔹 Day Open / Close Management
   =========================== */

// 📅 Get today’s total sales for cashier POS page
router.get("/today-total", getTodayTotalSales);

// 🔓 Open cashier workday (admin/finance only)
router.post("/open-day/:cashierId", openCashierDay);

// 🕓 Close cashier workday (admin/finance only)
router.post("/end-day/:cashierId", closeCashierDay);

// 📋 Get all cashiers with open/closed status
router.get("/cashiers-status", getCashiersDayStatus);
router.get("/cashier-sessions/:cashierId", getCashierSessions);

/* ===========================
   🔹 Refunds & Item Replacement
   =========================== */

// 💸 Full invoice refund
router.post("/refund/:id", refundSale);

// 💸 Partial item refund
router.post("/refund-item/:saleId", refundItem);

// 🔁 Replace a product in a sale
router.post("/replace-item/:saleId", replaceItem);

router.get("/current-session-total", getCurrentSessionTotal);

export default router;
