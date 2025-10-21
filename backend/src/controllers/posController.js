// backend/src/controllers/posController.js
import mongoose from "mongoose";
import Product from "../models/Product.js";
import Batch from "../models/Batch.js";
import Sale from "../models/Sale.js";
import Counter from "../models/Counter.js";

// === Helper: today's date at UTC midnight ===
function todayUtc() {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

// === Helper: Asia/Beirut invoice prefix (YYYYMMDD) ===
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

// === Helper: get next invoice number ===
async function nextInvoiceNumber(session) {
  const prefix = beirutInvoicePrefix();
  const ctr = await Counter.findOneAndUpdate(
    { name: `invoice-${prefix}` },
    { $inc: { seq: 1 } },
    { new: true, upsert: true, session }
  );
  return `${prefix}-${String(ctr.seq).padStart(4, "0")}`;
}

// === PUT /api/pos/sales/:id ===
export const updateSale = async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id);
    if (!sale) return res.status(404).json({ message: "Sale not found" });

    const { items, notes } = req.body;

    // Restore old stock
    for (const item of sale.items) {
      await Batch.updateOne({ _id: item.batch }, { $inc: { quantity: item.quantity } });
    }

    // Deduct stock for new items
    const updatedItems = [];
    let newTotal = 0;

    for (const i of items) {
      const product = await Product.findById(i.productId);
      if (!product) throw new Error("Product not found");

      const batch = await Batch.findOne({ product: product._id, quantity: { $gt: 0 } });
      if (!batch) throw new Error("No available stock");

      await Batch.updateOne({ _id: batch._id }, { $inc: { quantity: -i.quantity } });

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

    sale.items = updatedItems;
    sale.total = newTotal;
    sale.subTotal = newTotal;
    sale.isEdited = true;
    sale.notes = notes;
    sale.editHistory = [
      ...(sale.editHistory || []),
      { editedAt: new Date(), editor: req.user?._id },
    ];

    await sale.save();

    res.json({ message: "Invoice updated successfully", sale });
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: err.message || "Update failed" });
  }
};

// === GET /api/pos/search?q=... ===
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

// === POST /api/pos/checkout ===
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
      })
        .sort({ expiryDate: 1, createdAt: 1 })
        .session(session);

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
      [
        {
          invoiceNumber,
          items: saleItems,
          subTotal: Number(subTotal.toFixed(2)),
          total: Number(total.toFixed(2)),
          payment: paymentRecord,
          cashier: req.user?._id || req.user?.id,
          notes,
        },
      ],
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

// === GET /api/pos/my-sales ===
export const listMySales = async (req, res) => {
  try {
    const sales = await Sale.find({ cashier: req.user._id })
      .populate("cashier", "name email")
      .populate("items.product", "name category price")
      .sort({ createdAt: -1 });
    res.json(sales);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch your invoices", error: err.message });
  }
};

// === GET /api/pos/sales ===
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

// === POST /api/pos/replace-item/:saleId ===
export const replaceItem = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { saleId } = req.params;
    const { oldProductId, newProductId, newQuantity } = req.body;

    if (!oldProductId || !newProductId || !newQuantity)
      throw new Error("Missing replacement details");

    const sale = await Sale.findById(saleId).session(session);
    if (!sale) throw new Error("Sale not found");

    // 1️⃣ Find old item to refund
    const oldItem = sale.items.find(
      (i) => i.product.toString() === oldProductId && !i.isRefunded
    );
    if (!oldItem) throw new Error("Old product not found or already refunded");

    // 2️⃣ Restore stock for old item
    await Batch.updateOne(
      { _id: oldItem.batch },
      { $inc: { quantity: oldItem.quantity } },
      { session }
    );
    oldItem.isRefunded = true;
    oldItem.refundedAt = new Date();

    // 3️⃣ Find new product
    const product = await Product.findById(newProductId).session(session);
    if (!product) throw new Error("New product not found");

    // 4️⃣ Find batch for new product
    const batch = await Batch.findOne({
      product: product._id,
      expiryDate: { $gte: new Date() },
      quantity: { $gte: newQuantity },
    }).session(session);
    if (!batch) throw new Error("Insufficient stock for replacement");

    // 5️⃣ Deduct new stock
    await Batch.updateOne(
      { _id: batch._id },
      { $inc: { quantity: -newQuantity } },
      { session }
    );

    // 6️⃣ Add new product to sale
    const newLineTotal = Number((product.price * newQuantity).toFixed(2));
    sale.items.push({
      product: product._id,
      batch: batch._id,
      quantity: newQuantity,
      unitPrice: product.price,
      lineTotal: newLineTotal,
    });

    // 7️⃣ Adjust totals
    sale.total = sale.total - oldItem.lineTotal + newLineTotal;
    sale.subTotal = sale.total;
    sale.notes = `Replaced ${oldProductId} with ${newProductId}`;

    await sale.save({ session });
    await session.commitTransaction();
    session.endSession();

    res.json({
      message: "Item replaced successfully",
      newProduct: product.name,
      newTotal: sale.total,
    });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    res.status(400).json({ message: err.message || "Replace failed" });
  }
};

// === POST /api/pos/refund-item/:saleId ===


export const refundItem = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { saleId } = req.params;
    const { productId } = req.body;

    const sale = await Sale.findById(saleId).session(session);
    if (!sale) throw new Error("Sale not found");

    const item = sale.items.find(
      (i) => i.product.toString() === productId && !i.isRefunded
    );
    if (!item) throw new Error("Product not found or already refunded");

    // Restore stock
    await Batch.updateOne(
      { _id: item.batch },
      { $inc: { quantity: item.quantity } },
      { session }
    );

    // Mark item as refunded
    item.isRefunded = true;
    item.refundedAt = new Date();

    // Adjust the sale total
    sale.total -= item.lineTotal;
    sale.subTotal -= item.lineTotal;
    await sale.save({ session });

    // Create a partial refund invoice (negative entry)
    const refundInvoiceNumber = sale.invoiceNumber + "-R" + Date.now().toString().slice(-3);
    const refundSale = await Sale.create(
      [
        {
          invoiceNumber: refundInvoiceNumber,
          items: [item],
          subTotal: -item.lineTotal,
          total: -item.lineTotal,
          payment: { type: "cash" },
          cashier: req.user._id,
          notes: `Partial refund for product ${productId} from ${sale.invoiceNumber}`,
        },
      ],
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    res.json({
      message: "Partial refund processed successfully",
      refundInvoiceNumber,
      refundedAmount: item.lineTotal,
    });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    res.status(400).json({ message: err.message || "Partial refund failed" });
  }
};
// === GET /api/pos/sales/:id ===
export const getSaleById = async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id)
      .populate("cashier", "name email role")
      .populate("items.product", "name category price");
    if (!sale) return res.status(404).json({ message: "Invoice not found" });
    res.json(sale);
  } catch (err) {
    res.status(500).json({ message: "Failed to get invoice details", error: err.message });
  }
};

// === POST /api/pos/refund/:id ===
export const refundSale = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const sale = await Sale.findById(req.params.id).populate("items.product");
    if (!sale) throw new Error("Sale not found");
    if (sale.isRefunded) throw new Error("This invoice was already refunded");

    // ✅ Step 1: Restore stock for each sold item
    for (const item of sale.items) {
      await Batch.updateOne(
        { _id: item.batch },
        { $inc: { quantity: item.quantity } },
        { session }
      );
    }

    // ✅ Step 2: Mark this sale as refunded
    sale.isRefunded = true;
    sale.refundedAt = new Date();
    await sale.save({ session });

    // ✅ Step 3: Record a new negative sale entry for accounting / audit
    const refund = await Sale.create(
      [
        {
          invoiceNumber: sale.invoiceNumber + "-R",
          items: sale.items,
          subTotal: -Math.abs(sale.subTotal),
          total: -Math.abs(sale.total),
          payment: { type: "cash" },
          cashier: sale.cashier,
          notes: `Refund of invoice ${sale.invoiceNumber}`,
        },
      ],
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    res.json({
      message: "Refund processed successfully",
      refundId: refund[0]._id,
    });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    res.status(400).json({ message: err.message || "Refund failed" });
  }
};

