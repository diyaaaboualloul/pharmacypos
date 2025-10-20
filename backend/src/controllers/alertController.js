// backend/controllers/alertController.js
import Batch from "../models/Batch.js";
import Product from "../models/Product.js";
import mongoose from "mongoose";

export const getAlerts = async (req, res) => {
  try {
    const today = new Date();
    const next30Days = new Date();
    next30Days.setDate(today.getDate() + 30);

    // 🟥 Expired Batches
    const expiredBatches = await Batch.find({ expiryDate: { $lt: today } })
      .populate("product", "name category")
      .sort({ expiryDate: 1 });

    // 🟨 Expiring Soon Batches (within next 30 days)
    const expiringSoonBatches = await Batch.find({
      expiryDate: { $gte: today, $lte: next30Days },
    })
      .populate("product", "name category")
      .sort({ expiryDate: 1 });

    // 🟧 Low Stock Products (stock ≤ 10 by default)
    const lowStockThreshold = 10;
    const products = await Product.find();

    const productStocks = await Promise.all(
      products.map(async (product) => {
        const totalStock = await Batch.aggregate([
          { $match: { product: new mongoose.Types.ObjectId(product._id) } },
          { $group: { _id: null, total: { $sum: "$quantity" } } },
        ]);
        const total = totalStock[0]?.total || 0;
        return { ...product.toObject(), totalStock: total };
      })
    );

    const lowStockProducts = productStocks.filter(
      (p) => p.totalStock <= lowStockThreshold
    );

    res.json({
      expiredBatches,
      expiringSoonBatches,
      lowStockProducts,
      expiredCount: expiredBatches.length,
      expiringSoonCount: expiringSoonBatches.length,
      lowStockCount: lowStockProducts.length,
    });
  } catch (error) {
    console.error("Failed to fetch alerts:", error);
    res.status(500).json({ message: "Failed to fetch alerts" });
  }
};
