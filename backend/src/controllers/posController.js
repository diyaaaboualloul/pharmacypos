import mongoose from "mongoose";
import Product from "../models/Product.js";
import Batch from "../models/Batch.js";
import Sale from "../models/Sale.js";
import Counter from "../models/Counter.js";

// Helper: get today's date at UTC midnight
function todayUtc() {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

// Helper: Asia/Beirut invoice prefix (YYYYMMDD)
function beirutInvoicePrefix() {
  const fmt = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Beirut",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = Object.fromEntries(fmt.formatToParts(new Date()).map(p => [p.type, p.value]));
  return `${parts.year}${parts.month}${parts.day}`;
}

// Helper: get next invoice number
async function nextInvoiceNumber(session) {
  const prefix = beirutInvoicePrefix();
  const ctr = await Counter.findOneAndUpdate(
    { name: `invoice-${prefix}` },
    { $inc: { seq: 1 } },
    { new: true, upsert: true, session }
  );
  return `${prefix}-${String(ctr.seq).padStart(4, "0")}`;
}

// GET /api/pos/search?q=...
export const searchSellable = async (req, res) => {
  try {
    const q = (req.query.q || "").trim();
    const today = todayUtc();

    const pipeline = [
      { $match: { expiryDate: { $gte: today }, quantity: { $gt: 0 } } },
      { $group: { _id: "$product", totalSellableQty: { $sum: "$quantity" } } },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "product",
        },
      },
      { $unwind: "$product" },
    ];

    if (q) {
      pipeline.push({
        $match: {
          $or: [
            { "product.name": { $regex: q, $options: "i" } },
            { "product.category": { $regex: q, $options: "i" } },
          ],
        },
      });
    }

    pipeline.push({
      $project: {
        _id: "$product._id",
        name: "$product.name",
        category: "$product.category",
        price: "$product.price",
        totalSellableQty: 1,
      },
    });

    const results = await Batch.aggregate(pipeline);
    res.json(results);
  } catch (err) {
    res.status(500).json({ message: "Failed to search sellable products", error: err.message });
  }
};

// POST /api/pos/checkout
export const checkout = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { items = [], payment = {}, notes } = req.body || {};
    if (!Array.isArray(items) || items.length === 0) throw new Error("No items provided");
    if (!payment?.type || !["cash", "card"].includes(payment.type)) throw new Error("Invalid payment type");

    const today = todayUtc();
    const saleItems = [];
    let subTotal = 0;

    for (const line of items) {
      const product = await Product.findById(line.productId).session(session);
      if (!product) throw new Error("Product not found");
      const unitPrice = Number(line.unitPrice ?? product.price);

      const batches = await Batch.find({
        product: product._id,
        expiryDate: { $gte: today },
        quantity: { $gt: 0 },
      }).sort({ expiryDate: 1, createdAt: 1 }).session(session);

      const totalAvailable = batches.reduce((sum, b) => sum + b.quantity, 0);
      if (totalAvailable < line.quantity) throw new Error(`Insufficient stock for ${product.name}`);

      let remaining = line.quantity;
      for (const b of batches) {
        if (remaining <= 0) break;
        const take = Math.min(remaining, b.quantity);
        const upd = await Batch.updateOne(
          { _id: b._id, quantity: { $gte: take } },
          { $inc: { quantity: -take } },
          { session }
        );
        if (upd.modifiedCount !== 1) throw new Error("Concurrent stock update detected");

        const lineTotal = Number((take * unitPrice).toFixed(2));
        saleItems.push({ product: product._id, batch: b._id, quantity: take, unitPrice, lineTotal });
        subTotal += lineTotal;
        remaining -= take;
      }
    }

    const total = subTotal;
    let paymentRecord = { type: payment.type };
    if (payment.type === "cash") {
      if (Number(payment.cashReceived) < total) throw new Error("Cash received is less than total");
      paymentRecord.cashReceived = Number(payment.cashReceived);
      paymentRecord.change = Number((paymentRecord.cashReceived - total).toFixed(2));
    }

    const invoiceNumber = await nextInvoiceNumber(session);

    const sale = await Sale.create(
      [{
        invoiceNumber,
        items: saleItems,
        subTotal: Number(subTotal.toFixed(2)),
        total: Number(total.toFixed(2)),
        payment: paymentRecord,
        cashier: req.user?._id || req.user?.id,
        notes,
      }],
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      invoiceNumber,
      total: Number(total.toFixed(2)),
      change: paymentRecord.change ?? 0,
      createdAt: sale[0].createdAt,
    });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    res.status(400).json({ message: err.message || "Checkout failed" });
  }
};

// GET /api/pos/sales
export const listSales = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || "20", 10)));
    const date = (req.query.date || "").trim();

    const filter = {};
    if (date) {
      const start = new Date(`${date}T00:00:00+03:00`);
      const end = new Date(`${date}T23:59:59.999+03:00`);
      filter.createdAt = { $gte: start, $lte: end };
    }

    const docs = await Sale.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select("invoiceNumber total payment cashier createdAt")
      .lean();

    const count = await Sale.countDocuments(filter);
    res.json({ page, limit, total: count, rows: docs });
  } catch (err) {
    res.status(500).json({ message: "Failed to list sales", error: err.message });
  }
};
