// backend/src/routes/posRoutes.js
import express from "express";
import { requireAuth } from "../middleware/auth.js";
import {
  searchSellable,
  checkout,
  listSales,
  updateSale,
  listMySales,
  refundSale,
} from "../controllers/posController.js";

const router = express.Router();
router.use(requireAuth);

router.get("/search", searchSellable);
router.post("/checkout", checkout);
router.get("/sales", listSales);
router.put("/sales/:id", updateSale);
router.get("/my-sales", listMySales);
router.post("/refund/:id", refundSale);

export default router;
