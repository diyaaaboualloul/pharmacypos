import mongoose from "mongoose";
import Product from "../models/Product.js";
import Batch from "../models/Batch.js";
import Sale from "../models/Sale.js";
import Counter from "../models/Counter.js";

// 🕒 Helper: Get today's date (UTC midnight)
function todayUtc() {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

// 🕒 Helper: Generate Beirut-based invoice prefix (YYYYMMDD)
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

// 🔢 Helper: Get next invoice number
async function nextInvoiceNumber(session) {
  const prefix = beirutInvoicePrefix();
  const ctr = await Counter.findOneAndUpdate(
    { name: `invoice-${prefix}` },
    { $inc: { seq: 1 } },
    { new: true, upsert: true, session }
  );
  return `${prefix}-${String(ctr.seq).padStart(4, "0")}`;
}

// ===========================================================
// ✅ PUT /api/pos/sales/:id — Edit existing invoice
// ===========================================================
export const updateSale = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const sale = await Sale.findById(req.params.id).session(session);
    if (!sale) return res.status(404).json({ message: "Sale not found" });

    const { items, notes } = req.body;

    // 🧮 Restore old stock
    for (const item of sale.items) {
      await Batch.updateOne({ _id: item.batch }, { $inc: { quantity: item.quantity } }).session(session);
    }

    // 🆕 Deduct stock for new items
    const updatedItems = [];
    let newTotal = 0;

    for (const i of items) {
      const product = await Product.findById(i.productId).session(session);
      if (!product) throw new Error(`Product not found: ${i.productId}`);

      const batch = await Batch.findOne({ product: product._id, quantity: { $gt: 0 } }).session(session);
      if (!batch) throw new Error(`No available stock for ${product.name}`);

      await Batch.updateOne({ _id: batch._id }, { $inc: { quantity: -i.quantity } }).session(session);

      const lineTotal = i.price * i.quantity;
      updatedItems.push({
        product: product._id,
        batch: batch._id,
        quantity: i.quantity,
        unitPrice: i.price,
        lineTotal,
      });
      newTotal += lineTotal;
    }

    // 🧾 Update sale record
    sale.items = updatedItems;
    sale.total = newTotal;
    sale.subTotal = newTotal;
    sale.isEdited = true;
    sale.notes = notes;
    sale.editHistory = [
      ...(sale.editHistory || []),
      { editedAt: new Date(), editor: req.user?._id },
    ];

    await sale.save({ session });
    await session.commitTransaction();
    session.endSession();

    res.json({ message: "Invoice updated successfully", sale });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error(err);
    res.status(400).json({ message: err.message || "Update failed" });
  }
};

// ===========================================================
// ✅ GET /api/pos/my-sales — Sales by logged-in cashier
// ===========================================================
export const listSalesByCashier = async (req, res) => {
  try {
    const sales = await Sale.find({ "cashier._id": req.user._id })
      .sort({ createdAt: -1 });
    res.json(sales);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load your invoices" });
  }
};

// ===========================================================
// ✅ GET /api/pos/search?q=... — Search available products
// ===========================================================
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

// ===========================================================
// ✅ POST /api/pos/checkout — Create new sale (cashier)
// ===========================================================
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
      if (!product) throw new Error(`Product not found: ${line.productId}`);
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
      if (Number(payment.cashReceived) < total)
        throw new Error("Cash received is less than total");
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
        cashier: {
          _id: req.user._id,
          name: req.user.name,
        },
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

// ===========================================================
// ✅ GET /api/pos/sales — List all sales (admin)
// ===========================================================
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
