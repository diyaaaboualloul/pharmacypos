import mongoose from "mongoose";

const saleItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    batch: { type: mongoose.Schema.Types.ObjectId, ref: "Batch", required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    lineTotal: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const paymentSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["cash", "card"], required: true },
    cashReceived: { type: Number },
    change: { type: Number },
  },
  { _id: false }
);

const saleSchema = new mongoose.Schema(
  {
    invoiceNumber: { type: String, required: true, unique: true },
    items: { type: [saleItemSchema], required: true },
    subTotal: { type: Number, required: true },
    total: { type: Number, required: true },
    payment: { type: paymentSchema, required: true },
    cashier: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    notes: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model("Sale", saleSchema);
