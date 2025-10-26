import express from "express";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import {
  listEmployees,
  createEmployee,
  updateEmployee,
  setEmployeeStatus,
} from "../controllers/employeeController.js";

const router = express.Router();

// Admin or Finance can view
router.get("/", requireAuth, listEmployees);

// Admin can create & update
router.post("/", requireAuth, requireAdmin, createEmployee);
router.put("/:id", requireAuth, requireAdmin, updateEmployee);

// Admin can toggle status
router.patch("/:id/status", requireAuth, requireAdmin, setEmployeeStatus);

export default router;
