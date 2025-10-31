// backend/src/server.js
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";
import { connectDB } from "./config/db.js";

// ====== Route Imports ======
import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import batchRoutes from "./routes/batchRoutes.js";
import alertRoutes from "./routes/alertRoutes.js";
import posRoutes from "./routes/posRoutes.js";
import salesRoutes from "./routes/salesRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import employeeRoutes from "./routes/employeeRoutes.js";
import payrollRoutes from "./routes/payrollRoutes.js";
import expenseRoutes from "./routes/expenseRoutes.js";
import reportsRoutes from "./routes/reportsRoutes.js";

dotenv.config();
const app = express();

// ====== Middleware ======
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// ====== Base Route ======
app.get("/", (req, res) => res.send("Pharmacy POS API 🚀"));

// ====== Mount Routes ======
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/reports", reportsRoutes);

// Product and Category Management
app.use("/api/products", productRoutes);
app.use("/api/admin/products", productRoutes);
app.use("/api/admin/categories", categoryRoutes);

// Batch and Alert Management
app.use("/api/batches", batchRoutes);
app.use("/api/admin/batches", batchRoutes);
app.use("/api/admin/alerts", alertRoutes);

// POS and Sales
app.use("/api/pos", posRoutes);
app.use("/api/sales", salesRoutes);

// Reports and Analytics
app.use("/api/reports", reportRoutes);

// Employees and Payroll
app.use("/api/employees", employeeRoutes);
app.use("/api/payroll", payrollRoutes);

// ====== Start Server ======
connectDB();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
