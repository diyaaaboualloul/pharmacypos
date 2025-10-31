import mongoose from "mongoose";

const expenseSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      required: true,
      trim: true,
      enum: [
        "Rent",
        "Electricity",
        "Water",
        "Internet",
        "Maintenance",
        "Supplies",
        "Payroll",
        "Other",
      ],
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    date: {
      type: Date,
      required: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

// helpful index for month queries
expenseSchema.index({ date: 1 });

export default mongoose.model("Expense", expenseSchema);
