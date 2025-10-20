import Category from "../models/Category.js";
import Product from "../models/Product.js";
import Batch from "../models/Batch.js";
// ✅ Create Category
export const createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;

    const exists = await Category.findOne({ name });
    if (exists) {
      return res.status(400).json({ message: "Category already exists" });
    }

    const category = await Category.create({ name, description });
    res.json({ message: "Category created successfully", category });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// ✅ Get all categories with product counts
export const getCategories = async (req, res) => {
  try {
    const categories = await Category.find().lean();

    // Attach product counts to each category
    const categoriesWithCounts = await Promise.all(
      categories.map(async (cat) => {
        const productCount = await Product.countDocuments({ category: cat.name });
        return { ...cat, productCount };
      })
    );

    res.json(categoriesWithCounts);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch categories", error: err.message });
  }
};

// ✅ Get products by category with batch counts
export const getProductsByCategory = async (req, res) => {
  try {
    const { categoryName } = req.params;

    // 1️⃣ Get all products in the category
    const products = await Product.find({ category: categoryName }).lean();

    // 2️⃣ Attach batch counts to each product
    const productsWithBatchCounts = await Promise.all(
      products.map(async (product) => {
        const batchCount = await Batch.countDocuments({ product: product._id });
        return {
          ...product,
          batches: Array(batchCount).fill({}), // 👈 so .length works on frontend
        };
      })
    );

    // 3️⃣ Return
    res.json(productsWithBatchCounts);
  } catch (err) {
    res.status(500).json({
      message: "Failed to load products",
      error: err.message,
    });
  }
};


// ✅ Update Category
export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    const updated = await Category.findByIdAndUpdate(
      id,
      { name, description },
      { new: true }
    );

    res.json({ message: "Category updated", updated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ✅ Delete Category
export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    await Category.findByIdAndDelete(id);
    res.json({ message: "Category deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
