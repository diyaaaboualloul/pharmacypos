// backend/src/controllers/categoryController.js
import Category from "../models/Category.js";
import Product from "../models/Product.js";
export const createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    const exists = await Category.findOne({ name });
    if (exists) return res.status(400).json({ message: "Category already exists" });

    const category = await Category.create({ name, description });
    res.json({ message: "Category created successfully", category });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};



export const getCategories = async (req, res) => {
  try {
    const categories = await Category.find();

    // Add productCount for each category
    const categoriesWithCounts = await Promise.all(
      categories.map(async (cat) => {
        const count = await Product.countDocuments({ category: cat.name });
        return { ...cat.toObject(), productCount: count };
      })
    );

    res.json(categoriesWithCounts);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch categories", error: error.message });
  }
};


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

export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    await Category.findByIdAndDelete(id);
    res.json({ message: "Category deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
