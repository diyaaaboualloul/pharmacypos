import express from "express";
import { requireAuth } from "../middleware/auth.js";
import { searchSellable, checkout, listSales } from "../controllers/posController.js";

const router = express.Router();
router.use(requireAuth);

router.get("/search", searchSellable);
router.post("/checkout", checkout);
router.get("/sales", listSales);

export default router;
