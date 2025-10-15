// backend/src/routes/categoryRoutes.js
import express from "express";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import {
  createCategory,
  getCategories,
  updateCategory,
  deleteCategory,
} from "../controllers/categoryController.js";

const router = express.Router();

router.use(requireAuth);
router.get("/", getCategories);
router.post("/", requireAdmin, createCategory);
router.put("/:id", requireAdmin, updateCategory);
router.delete("/:id", requireAdmin, deleteCategory);

export default router;
