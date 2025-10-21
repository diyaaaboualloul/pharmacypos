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
  getSaleById,   // 👈 add this
} from "../controllers/posController.js";

const router = express.Router();
router.use(requireAuth);

router.get("/search", searchSellable);
router.post("/checkout", checkout);
router.get("/sales", listSales);
router.get("/sales/:id", getSaleById); // 👈 new route for invoice details
router.put("/sales/:id", updateSale);
router.get("/my-sales", listMySales);
router.post("/refund-item/:saleId", refundItem);
router.post("/replace-item/:saleId", replaceItem);

export default router;
