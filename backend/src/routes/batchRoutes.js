import express from "express";
import { requireAuth, requireAdmin,requireFinanceOrAdmin} from "../middleware/auth.js";
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
router.get("/product/:productId", requireFinanceOrAdmin, getBatchesByProduct);

// create a new batch
router.post("/", requireFinanceOrAdmin, createBatch);

// update a batch
router.put("/:id", requireFinanceOrAdmin, updateBatch);

// delete a batch
router.delete("/:id", requireAdmin, deleteBatch);

// (optional) list all expiring/expired batches across products
router.get("/expiring", requireFinanceOrAdmin, getExpiringBatches);

export default router;
