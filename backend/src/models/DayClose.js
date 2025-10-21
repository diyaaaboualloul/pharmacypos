import mongoose from "mongoose";

const dayCloseSchema = new mongoose.Schema({
  cashier: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  totalSales: { type: Number, default: 0 },
  totalRefunds: { type: Number, default: 0 },
  netTotal: { type: Number, default: 0 },
  status: { type: String, enum: ["open", "closed"], default: "open" },
  openedAt: { type: Date, default: Date.now },
  closedAt: { type: Date },
  date: { type: Date, default: Date.now },
});

export default mongoose.model("DayClose", dayCloseSchema);
