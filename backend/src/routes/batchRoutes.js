import express from "express";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import {
  createBatch,
  getBatchesByProduct,
  updateBatch,
  deleteBatch,
  getExpiringBatches,
} from "../controllers/batchController.js";

const router = express.Router();

router.use(requireAuth);

// list batches for a product (admin)
router.get("/product/:productId", requireAdmin, getBatchesByProduct);

// create a new batch
router.post("/", requireAdmin, createBatch);

// update a batch
router.put("/:id", requireAdmin, updateBatch);

// delete a batch
router.delete("/:id", requireAdmin, deleteBatch);

// (optional) list all expiring/expired batches across products
router.get("/expiring", requireAdmin, getExpiringBatches);

export default router;
