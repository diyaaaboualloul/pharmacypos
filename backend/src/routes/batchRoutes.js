import express from "express";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import {
  createBatch,
  getBatchesByProduct,
  deleteBatch,
} from "../controllers/batchController.js";

const router = express.Router();

router.use(requireAuth);
router.get("/:productId", getBatchesByProduct);
router.post("/", requireAdmin, createBatch);
router.delete("/:id", requireAdmin, deleteBatch);

export default router;
