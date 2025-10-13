import express from "express";
import { registerUser, loginUser, getProfile } from "../controllers/authController.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);

// Verify token / get current user
router.get("/me", requireAuth, getProfile);

export default router;
