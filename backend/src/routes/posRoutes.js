import express from "express";
import { requireAuth } from "../middleware/auth.js";
import { searchSellable, checkout, listSales, updateSale,listSalesByCashier  } from "../controllers/posController.js";

const router = express.Router();
router.use(requireAuth);

router.get("/search", searchSellable);
router.post("/checkout", checkout);
router.get("/sales", listSales);
router.put("/sales/:id", requireAuth, updateSale);
router.get("/my-sales", requireAuth, listSalesByCashier);

export default router;
