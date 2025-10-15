import Batch from "../models/Batch.js";
import Product from "../models/Product.js";

// ✅ Create a batch for a product
export const createBatch = async (req, res) => {
  try {
    const { productId, batchNumber, expiryDate, quantity, costPrice } = req.body;
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: "Product not found" });

    const batch = await Batch.create({
      product: productId,
      batchNumber,
      expiryDate,
      quantity,
      costPrice,
    });

    res.status(201).json({ message: "Batch created successfully", batch });
  } catch (err) {
    res.status(500).json({ message: "Failed to create batch", error: err.message });
  }
};

// ✅ Get batches for a specific product
export const getBatchesByProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const batches = await Batch.find({ product: productId });
    res.json(batches);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch batches", error: err.message });
  }
};

// ✅ Delete a batch
export const deleteBatch = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Batch.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: "Batch not found" });
    res.json({ message: "Batch deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete batch", error: err.message });
  }
};
