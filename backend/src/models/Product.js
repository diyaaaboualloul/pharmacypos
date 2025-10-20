// backend/models/Product.js
import mongoose from "mongoose";
import Counter from "./Counter.js";

const productSchema = new mongoose.Schema(
  {
    productId: {
      type: Number,
      unique: true, // 👈 important to make sure it's unique
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
    },
    description: {
      type: String,
    },
    // We will later populate this with related batches
  },
  { timestamps: true }
);

productSchema.pre("save", async function (next) {
  if (this.isNew) {
    const counter = await Counter.findOneAndUpdate(
      { name: "productId" },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    this.productId = counter.seq;
  }
  next();
});

export default mongoose.model("Product", productSchema);