// ✅ backend/routes/categoryRoutes.js
import express from "express";
import { requireAuth, requireAdmin,requireFinanceOrAdmin } from "../middleware/auth.js";
import {
  createCategory,
  getCategories,
  updateCategory,
  deleteCategory,
  getProductsByCategory, // 👈 use the controller function instead of inline
} from "../controllers/categoryController.js";

const router = express.Router();

// ✅ Fetch products by category name (with batch counts)
router.get("/:categoryName/products", requireAuth, requireAdmin, getProductsByCategory);

// ✅ Protected routes for category CRUD
router.use(requireAuth);
router.get("/", getCategories);
router.post("/", requireAdmin, createCategory);
router.put("/:id", requireAdmin, updateCategory);
router.delete("/:id", requireAdmin, deleteCategory);

export default router;
