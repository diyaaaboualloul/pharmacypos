// backend/src/models/Employee.js
import mongoose from "mongoose";

const employeeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    role: { type: String, required: true, trim: true },    // e.g., Pharmacist, Cashier
    baseSalary: { type: Number, required: true, min: 0 },  // monthly base salary
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    hireDate: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model("Employee", employeeSchema);
