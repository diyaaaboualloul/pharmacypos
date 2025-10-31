import bcrypt from "bcryptjs";
import User from "../models/User.js"; // adjust path if needed

export const seedAdminUser = async () => {
  try {
    // Check if this specific admin email already exists
    const existing = await User.findOne({ email: "admin2@gmail.com" });
    if (existing) {
      console.log("✅ Default admin (admin2@gmail.com) already exists");
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash("123456", 10);

    // Create the specific admin
    const admin = new User({
      name: "System Admin",
      email: "admin2@gmail.com",
      password: hashedPassword,
      role: "admin",
    });

    await admin.save();
    console.log("🚀 Default admin user added successfully (admin2@gmail.com)");
  } catch (err) {
    console.error("❌ Failed to seed admin user:", err.message);
  }
};
