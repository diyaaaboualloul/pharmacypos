// backend/src/controllers/reportController.js
import mongoose from "mongoose";
import Sale from "../models/Sale.js";
import Batch from "../models/Batch.js";
import Product from "../models/Product.js";

// ---------- Helpers ----------
function parseDateRange(query) {
  // from/to as YYYY-MM-DD (local Beirut). If missing, default = last 30 days.
  const tz = "Asia/Beirut";
  const now = new Date();

  const beirutNow = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit"
  }).format(now); // YYYY-MM-DD

  let { from, to } = query || {};
  // defaults
  if (!to) to = beirutNow;

  if (!from) {
    const d = new Date(now);
    d.setDate(d.getDate() - 29);
    from = new Intl.DateTimeFormat("en-CA", {
      timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit"
    }).format(d);
  }

  // Build Date range in Beirut offset (+03 in winter, +03/+02 DST automatically handled by Date parsing of explicit offset)
  // We’ll treat from/to as *local* Beirut days and convert to absolute UTC range.
  const start = new Date(`${from}T00:00:00.000+03:00`);
  const end = new Date(`${to}T23:59:59.999+03:00`);

  return { start, end };
}

function groupDateFormat(granularity) {
  // Mongo $dateToString format for grouping in Beirut time
  const base = { date: "$createdAt", timezone: "Asia/Beirut" };
  switch ((granularity || "day").toLowerCase()) {
    case "month":
      return { $dateToString: { ...base, format: "%Y-%m" } };
    case "week":
      return { $dateToString: { ...base, format: "%G-%V" } }; // ISO week
    case "day":
    default:
      return { $dateToString: { ...base, format: "%Y-%m-%d" } };
  }
}

// ---------- 1) Sales Summary (timeseries) ----------
export const salesSummary = async (req, res) => {
  try {
    const { start, end } = parseDateRange(req.query);
    const granularity = (req.query.granularity || "day").toLowerCase();

    const groupId = groupDateFormat(granularity);

    const data = await Sale.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end } } },
      {
        $group: {
          _id: groupId,
          grossSales: {
            $sum: {
              $cond: [{ $gt: ["$total", 0] }, "$total", 0]
            }
          },
          refunds: {
            $sum: {
              $cond: [{ $lt: ["$total", 0] }, "$total", 0]
            }
          },
          netSales: { $sum: "$total" },
          orders: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({ range: { start, end }, granularity, rows: data });
  } catch (err) {
    res.status(500).json({ message: "Failed to build sales summary", error: err.message });
  }
};

// ---------- 2) Best-Selling Products ----------
export const topProducts = async (req, res) => {
  try {
    const { start, end } = parseDateRange(req.query);
    const limit = Math.min(parseInt(req.query.limit || "10", 10), 50);

    const data = await Sale.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end }, total: { $ne: 0 } } },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.product",
          totalQty: { $sum: "$items.quantity" },
          revenue: { $sum: "$items.lineTotal" }
        }
      },
      { $sort: { totalQty: -1, revenue: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "product"
        }
      },
      { $unwind: "$product" },
      {
        $project: {
          _id: 0,
          productId: "$product._id",
          name: "$product.name",
          category: "$product.category",
          totalQty: 1,
          revenue: 1
        }
      }
    ]);

    res.json({ range: { start, end }, limit, rows: data });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch top products", error: err.message });
  }
};

// ---------- 3) Cashier Performance ----------
export const cashierPerformance = async (req, res) => {
  try {
    const { start, end } = parseDateRange(req.query);

    const data = await Sale.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end } } },
      {
        $group: {
          _id: "$cashier",
          grossSales: {
            $sum: { $cond: [{ $gt: ["$total", 0] }, "$total", 0] }
          },
          refunds: {
            $sum: { $cond: [{ $lt: ["$total", 0] }, "$total", 0] }
          },
          netSales: { $sum: "$total" },
          orders: { $sum: 1 },
          avgOrder: { $avg: "$total" }
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "cashier"
        }
      },
      { $unwind: "$cashier" },
      {
        $project: {
          _id: 0,
          cashierId: "$cashier._id",
          name: "$cashier.name",
          email: "$cashier.email",
          grossSales: 1,
          refunds: 1,
          netSales: 1,
          orders: 1,
          avgOrder: 1
        }
      },
      { $sort: { netSales: -1 } }
    ]);

    res.json({ range: { start, end }, rows: data });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch cashier performance", error: err.message });
  }
};

// ---------- 4) Payment Method Breakdown ----------
export const paymentBreakdown = async (req, res) => {
  try {
    const { start, end } = parseDateRange(req.query);
    const data = await Sale.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end } } },
      {
        $group: {
          _id: "$payment.type",
          total: { $sum: "$total" },
          count: { $sum: 1 }
        }
      },
      { $sort: { total: -1 } },
      {
        $project: {
          _id: 0,
          method: "$_id",
          total: 1,
          count: 1
        }
      }
    ]);
    res.json({ range: { start, end }, rows: data });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch payment breakdown", error: err.message });
  }
};

// ---------- 5) Refunds Time Series ----------
export const refundsTimeseries = async (req, res) => {
  try {
    const { start, end } = parseDateRange(req.query);
    const granularity = (req.query.granularity || "day").toLowerCase();
    const groupId = groupDateFormat(granularity);

    const data = await Sale.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end }, total: { $lt: 0 } } },
      {
        $group: {
          _id: groupId,
          refunds: { $sum: "$total" },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({ range: { start, end }, granularity, rows: data });
  } catch (err) {
    res.status(500).json({ message: "Failed to build refunds timeseries", error: err.message });
  }
};

// ---------- 6) Inventory Health (counts) ----------
export const inventoryHealth = async (req, res) => {
  try {
    const today = new Date();
    const next30 = new Date(today); next30.setDate(today.getDate() + 30);

    // expired & expiring soon
    const expiredCount = await Batch.countDocuments({ expiryDate: { $lt: today } });
    const expiringSoonCount = await Batch.countDocuments({
      expiryDate: { $gte: today, $lte: next30 }
    });

    // low stock (<= threshold)
    const threshold = Math.max(parseInt(req.query.lowStock || "10", 10), 0);

    const products = await Product.find().select("_id");
    const totals = await Promise.all(products.map(async (p) => {
      const agg = await Batch.aggregate([
        { $match: { product: new mongoose.Types.ObjectId(p._id) } },
        { $group: { _id: null, total: { $sum: "$quantity" } } }
      ]);
      return { id: p._id, total: agg[0]?.total || 0 };
    }));

    const lowStockCount = totals.filter(t => t.total <= threshold).length;

    res.json({
      today,
      lowStockThreshold: threshold,
      expiredCount,
      expiringSoonCount,
      lowStockCount
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch inventory health", error: err.message });
  }
};
