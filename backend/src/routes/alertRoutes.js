import express from "express";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import { getAlerts } from "../controllers/alertController.js";

const router = express.Router();

router.get("/", requireAuth, requireAdmin, getAlerts);

export default router;
