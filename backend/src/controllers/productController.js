import Product from "../models/Product.js";
import Batch from "../models/Batch.js";

// ✅ Create a new product
export const createProduct = async (req, res) => {
  try {
    const { name, category, price, description } = req.body;
    const product = await Product.create({ name, category, price, description });
    res.status(201).json({ message: "Product created successfully", product });
  } catch (err) {
    res.status(500).json({ message: "Failed to create product", error: err.message });
  }
};

// ✅ Get all products (with their batches)
export const getProducts = async (req, res) => {
  try {
    const products = await Product.find().lean();
    const productsWithBatches = await Promise.all(
      products.map(async (p) => {
        const batches = await Batch.find({ product: p._id });
        return { ...p, batches };
      })
    );
    res.json(productsWithBatches);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch products", error: err.message });
  }
};

// ✅ Update a product
export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await Product.findByIdAndUpdate(id, req.body, { new: true });
    if (!updated) return res.status(404).json({ message: "Product not found" });
    res.json({ message: "Product updated", product: updated });
  } catch (err) {
    res.status(500).json({ message: "Failed to update product", error: err.message });
  }
};

// ✅ Delete a product (and its batches)
export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    await Batch.deleteMany({ product: id });
    const deleted = await Product.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: "Product not found" });
    res.json({ message: "Product and related batches deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete product", error: err.message });
  }
};
export const searchProducts = async (req, res) => {
  try {
    const q = req.query.q?.trim();
    if (!q) return res.json([]);

    // Case-insensitive partial match on product name or category
    const products = await Product.find({
      $or: [
        { name: { $regex: q, $options: "i" } },
        { category: { $regex: q, $options: "i" } },
      ],
    });

    res.json(products);
  } catch (err) {
    res.status(500).json({ message: "Search failed", error: err.message });
  }
};