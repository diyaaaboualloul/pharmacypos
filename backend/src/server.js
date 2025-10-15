import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";
import { connectDB } from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import batchRoutes from "./routes/batchRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import alertRoutes from "./routes/alertRoutes.js";



dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.get("/", (req, res) => res.send("Pharmacy POS API 🚀"));

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);  // ✅ Add this line

app.use("/api/products", productRoutes);
app.use("/api/batches", batchRoutes);
app.use("/api/admin/products", productRoutes);
app.use("/api/admin/categories", categoryRoutes);
app.use("/api/admin/batches", batchRoutes);
app.use("/api/admin/alerts", alertRoutes);

connectDB();

app.listen(process.env.PORT, () =>
  console.log(`🚀 Server running on http://localhost:${process.env.PORT}`)
);
