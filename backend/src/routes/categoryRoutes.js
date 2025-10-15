import express from "express";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import {
  createCategory,
  getCategories,
  updateCategory,
  deleteCategory,
} from "../controllers/categoryController.js";
import Product from "../models/Product.js";

const router = express.Router();

// ✅ Fetch products by category name
// GET /api/admin/categories/:categoryName/products
router.get("/:categoryName/products", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { categoryName } = req.params;
    const products = await Product.find({ category: categoryName });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch products", error: error.message });
  }
});

// ✅ Protected routes for category CRUD
router.use(requireAuth);
router.get("/", getCategories);
router.post("/", requireAdmin, createCategory);
router.put("/:id", requireAdmin, updateCategory);
router.delete("/:id", requireAdmin, deleteCategory);

export default router;
