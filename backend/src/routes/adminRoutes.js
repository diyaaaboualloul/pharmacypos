import express from "express";
import User from "../models/User.js";
import bcrypt from "bcrypt";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

const router = express.Router();

// ✅ Create user (Admin only)
router.post("/create-user", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({ name, email, password: hashedPassword, role });
    res.json({ message: "User created successfully", user: newUser });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Get all users
router.get("/users", requireAuth, requireAdmin, async (req, res) => {
  const users = await User.find().select("-password");
  res.json(users);
});

// ✅ Delete user (Prevent deleting the last admin)
router.delete("/users/:id", requireAuth, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const user = await User.findById(id);

  if (!user) return res.status(404).json({ message: "User not found" });

  if (user.role === "admin") {
    const adminCount = await User.countDocuments({ role: "admin" });
    if (adminCount === 1) {
      return res.status(400).json({ message: "Cannot delete the last admin" });
    }
  }

  await User.findByIdAndDelete(id);
  res.json({ message: "User deleted successfully" });
});

export default router;
