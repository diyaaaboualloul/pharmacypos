import mongoose from "mongoose";

const dayCloseSchema = new mongoose.Schema({
  cashier: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  date: { type: Date, default: Date.now },
  totalSales: { type: Number, default: 0 },
  totalRefunds: { type: Number, default: 0 },
  netTotal: { type: Number, default: 0 },
  closedAt: { type: Date, default: Date.now },
});

export default mongoose.model("DayClose", dayCloseSchema);
