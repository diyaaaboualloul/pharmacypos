import express from "express";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import {
  createProduct,
  getProducts,
  updateProduct,
  deleteProduct,
  searchProducts, // ✅ included here
} from "../controllers/productController.js";

const router = express.Router();

// 🟡 Auth middleware
router.use(requireAuth); // must be logged in

// 🔍 Search must come BEFORE any :id routes to avoid conflicts
router.get("/search", requireAdmin, searchProducts);

// 🧾 Product CRUD
router.get("/", getProducts);
router.post("/", requireAdmin, createProduct);
router.put("/:id", requireAdmin, updateProduct);
router.delete("/:id", requireAdmin, deleteProduct);

export default router;
