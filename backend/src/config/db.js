import mongoose from "mongoose";
import { seedAdminUser } from "./seedAdmin.js";

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`✅ MongoDB connected: ${conn.connection.host}`);

    // ✅ Seed admin *after* connection established
    await seedAdminUser();
  } catch (error) {
    console.error(`❌ MongoDB connection failed: ${error.message}`);
    process.exit(1);
  }
};
