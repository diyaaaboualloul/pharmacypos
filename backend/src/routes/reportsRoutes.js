import express from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { getSummaryReport, exportReportPDF } from "../controllers/reportsController.js";

const router = express.Router();

router.use(requireAuth, requireRole("admin", "finance"));

router.get("/summary", getSummaryReport);
router.get("/pdf", exportReportPDF);

export default router;
