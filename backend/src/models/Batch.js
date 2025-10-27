import mongoose from "mongoose";

const batchSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    batchNumber: {
      type: Number,
      unique: true,
      required: true,
    },
    supplier: {
      type: String,
      required: true,
      trim: true,
    },
    expiryDate: {
      type: Date,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
    },
    costPrice: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

// ✅ Auto-increment batchNumber before savinggg
batchSchema.pre("validate", async function (next) {
  if (this.isNew) {
    const lastBatch = await this.constructor.findOne().sort({ batchNumber: -1 });
    this.batchNumber = lastBatch ? lastBatch.batchNumber + 1 : 1;
  }
  next();
});

export default mongoose.model("Batch", batchSchema);
