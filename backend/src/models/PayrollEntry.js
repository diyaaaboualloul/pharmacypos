import mongoose from "mongoose";

const payrollEntrySchema = new mongoose.Schema(
  {
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true, index: true },
    // "YYYY-MM" (e.g. "2025-10")
    period: { type: String, required: true, index: true },
    baseSalary: { type: Number, required: true, min: 0 },
    advances: { type: Number, default: 0, min: 0 },
    deductions: { type: Number, default: 0, min: 0 },
    netPay: { type: Number, required: true, min: 0 },
    paid: { type: Boolean, default: false },
    paidDate: { type: Date },
    paymentMethod: { type: String, enum: ["cash", "card", "bank", null], default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

// Ensure one entry per (employee, period)
payrollEntrySchema.index({ employeeId: 1, period: 1 }, { unique: true });

// Recalculate netPay before save if numbers changed
payrollEntrySchema.pre("validate", function (next) {
  const base = Number(this.baseSalary || 0);
  const adv = Number(this.advances || 0);
  const ded = Number(this.deductions || 0);
  const net = base - adv - ded;
  this.netPay = Math.max(0, Number(net.toFixed(2)));

  if (this.paid) {
    if (!this.paidDate) return next(new Error("paidDate is required when paid is true"));
    if (!this.paymentMethod) return next(new Error("paymentMethod is required when paid is true"));
  }
  next();
});

export default mongoose.model("PayrollEntry", payrollEntrySchema);
