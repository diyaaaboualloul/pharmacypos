// backend/src/controllers/posController.js
import mongoose from "mongoose";
import Product from "../models/Product.js";
import Batch from "../models/Batch.js";
import Sale from "../models/Sale.js";
import Counter from "../models/Counter.js";
import DayClose from "../models/DayClose.js";
import User from "../models/User.js"; // make sure this is at the top of the file if not already

// === Helper: today's date at UTC midnight ===
function todayUtc() {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

export const getTodayTotalSales = async (req, res) => {
  try {
    const userId = req.user._id;
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    // ✅ Sum all non-refunded sales for this cashier today
    const result = await Sale.aggregate([
      {
        $match: {
          cashier: new mongoose.Types.ObjectId(userId),
          createdAt: { $gte: start, $lte: end },
          total: { $gt: 0 },
          isRefunded: { $ne: true },
        },
      },
      {
        $group: {
          _id: null,
          totalSales: { $sum: "$total" },
        },
      },
    ]);

    const total = result.length > 0 ? result[0].totalSales : 0;

    // ✅ Get cashier status (last open/close record)
    const latestRecord = await DayClose.findOne({ cashier: userId })
      .sort({ date: -1 })
      .lean();
    const status = latestRecord?.status || "closed";

    res.json({ total, status });
  } catch (err) {
    console.error("Error in getTodayTotalSales:", err);
    res
      .status(500)
      .json({ message: "Failed to fetch daily total", error: err.message });
  }
};

// ✅ Fetch all cashiers with their current day status
export const getCashiersDayStatus = async (req, res) => {
  try {
    const cashiers = await User.find({ role: "cashier" }).select("name email");

    const data = await Promise.all(
      cashiers.map(async (c) => {
        // ✅ get the latest record for this cashier
        const record = await DayClose.findOne({ cashier: c._id })
          .sort({ openedAt: -1, closedAt: -1 })
          .lean();

        const status = record?.status || "closed";

        return {
          _id: c._id,
          name: c.name,
          email: c.email,
          status,
        };
      })
    );

    res.json(data);
  } catch (err) {
    console.error("getCashiersDayStatus error:", err);
    res.status(500).json({
      message: "Failed to fetch cashier day status",
      error: err.message,
    });
  }
};

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

export const closeCashierDay = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { cashierId } = req.params;

    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    // ✅ Calculate totals for today
    const result = await Sale.aggregate([
      {
        $match: {
          cashier: new mongoose.Types.ObjectId(cashierId),
          createdAt: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: null,
          totalSales: { $sum: { $cond: [{ $gt: ["$total", 0] }, "$total", 0] } },
          totalRefunds: { $sum: { $cond: [{ $lt: ["$total", 0] }, "$total", 0] } },
          netTotal: { $sum: "$total" },
        },
      },
    ]);

    const data = result[0] || { totalSales: 0, totalRefunds: 0, netTotal: 0 };

    // ✅ Close only the most recent open record
    const latestOpen = await DayClose.findOne({
      cashier: cashierId,
      status: "open",
    })
      .sort({ openedAt: -1 })
      .session(session);

    if (latestOpen) {
      latestOpen.status = "closed";
      latestOpen.closedAt = new Date();
      latestOpen.totalSales = data.totalSales;
      latestOpen.totalRefunds = Math.abs(data.totalRefunds);
      latestOpen.netTotal = data.netTotal;
      await latestOpen.save({ session });
    } else {
      // if none exists, create a new closed record for logging
      await DayClose.create(
        [
          {
            cashier: cashierId,
            status: "closed",
            closedAt: new Date(),
            date: start,
            totalSales: data.totalSales,
            totalRefunds: Math.abs(data.totalRefunds),
            netTotal: data.netTotal,
          },
        ],
        { session }
      );
    }

    // ✅ Mark all today's sales as day-closed
    await Sale.updateMany(
      { cashier: cashierId, createdAt: { $gte: start, $lte: end } },
      { $set: { isDayClosed: true } },
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    res.json({ message: "Day closed successfully", data });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    res.status(400).json({ message: err.message || "Failed to close day" });
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
// ✨ UPDATED: accept paymentType from multiple shapes (new & legacy) and support cash/card/bank/insurance
export const checkout = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const body = req.body || {};
    const { items = [] } = body;
    if (!Array.isArray(items) || items.length === 0) throw new Error("No items provided");

    // Accept payment type from different shapes (legacy + new)
    const paymentTypeRaw =
      body.payment?.type ??
      body.paymentType ??
      body.payment?.paymentType ??
      body.method ??
      null;

    const paymentType = (paymentTypeRaw || "").toString().trim().toLowerCase();

    const ALLOWED = new Set(["cash", "card", "bank", "insurance"]);
    if (!ALLOWED.has(paymentType)) throw new Error("Invalid payment type");

    // Other payment fields (read flexibly)
    const currency = body.payment?.currency ?? body.currency ?? "USD";
    const rate = Number(body.payment?.rate ?? body.rate ?? 0) || 0;
    const received = Number(
      body.payment?.cashReceived ??
      body.payment?.received ??
      body.cashReceived ??
      body.received ??
      0
    );

    const today = todayUtc();
    const saleItems = [];
    let subTotal = 0;

    for (const line of items) {
      const product = await Product.findById(line.productId).session(session);
      if (!product) throw new Error("Product not found");

      // accept either frontend `price` or legacy `unitPrice`
      const unitPrice = Number(line.price ?? line.unitPrice ?? product.price);

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

    // Build payment record saved on the Sale
    const paymentRecord = { type: paymentType, currency, rate };
    if (paymentType === "cash") {
      if (received < total) throw new Error("Cash received is less than total");
      paymentRecord.cashReceived = received;
      paymentRecord.change = Number((received - total).toFixed(2));
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
          notes: body.notes,
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
    console.error("Checkout failed:", err);
    res.status(400).json({ message: err.message || "Checkout failed" });
  }
};

// === GET /api/pos/my-sales ===
export const listMySales = async (req, res) => {
  try {
    const me = req.user;

    const sales = await Sale.find({
      $or: [
        { cashier: me._id },          // new: ObjectId ref
        { cashierId: me._id },        // legacy style
        { cashierName: me.name },     // legacy style (string name)
        { cashierEmail: me.email },   // legacy style (string email)
      ],
    })
      .populate("items.product", "name category price")
      .sort({ createdAt: -1 })
      .lean();

    res.json(sales);
  } catch (err) {
    console.error("listMySales error:", err);
    res
      .status(500)
      .json({ message: "Failed to fetch your invoices", error: err.message });
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

    if (!productId) throw new Error("productId is required");

    // ✅ Find the sale
    const sale = await Sale.findById(saleId).session(session);
    if (!sale) throw new Error("Sale not found");

    // ✅ Find the item we want to refund
    const item = sale.items.find(
      (i) => i.product.toString() === productId && !i.isRefunded
    );
    if (!item) throw new Error("Product not found in sale or already refunded");

    // ✅ Restore stock
    await Batch.updateOne(
      { _id: item.batch },
      { $inc: { quantity: item.quantity } },
      { session }
    );

    // ✅ Mark item as refunded
    item.isRefunded = true;
    item.refundedAt = new Date();

    // ✅ Adjust totals on original sale
    sale.total -= item.lineTotal;
    sale.subTotal -= item.lineTotal;
    await sale.save({ session });

    // ✅ Create a new negative "refund invoice"
    const refundInvoiceNumber =
      sale.invoiceNumber + "-R" + Date.now().toString().slice(-3);

    await Sale.create(
      [
        {
          invoiceNumber: refundInvoiceNumber,
          items: [item],
          subTotal: -item.lineTotal,
          total: -item.lineTotal,
          payment: { type: "cash" },
          // ✅ FIXED cashier field: use id or fallback
          cashier: req.user?._id || req.user?.id || sale.cashier,
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
    console.error("refundItem error:", err);
    res
      .status(400)
      .json({ message: err.message || "Partial refund failed" });
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

// === POST /api/pos/open-day/:cashierId ===
export const openCashierDay = async (req, res) => {
  try {
    const { cashierId } = req.params;

    const start = new Date();
    start.setHours(0, 0, 0, 0);

    // ✅ Always create a new record — no restrictions
    const record = await DayClose.create({
      cashier: cashierId,
      status: "open",
      openedAt: new Date(),
      date: start, // normalized start of day
    });

    res.json({ message: "Day opened successfully", record });
  } catch (err) {
    res.status(400).json({ message: err.message || "Failed to open day" });
  }
};

// === GET /api/pos/cashier-sessions/:cashierId ===
// ✅ Get sessions with sales & refund totals between open/close times
export const getCashierSessions = async (req, res) => {
  try {
    const { cashierId } = req.params;

    // Find all DayClose (open/close) sessions for this cashier
    const sessions = await DayClose.find({ cashier: cashierId })
      .sort({ openedAt: -1 })
      .lean();

    // Compute totals per session dynamically
    const results = await Promise.all(
      sessions.map(async (session) => {
        // define time range
        const start = session.openedAt;
        const end = session.closedAt || new Date();

        // total sales in that session
        const salesAgg = await Sale.aggregate([
          {
            $match: {
              cashier: session.cashier,
              createdAt: { $gte: start, $lte: end },
              total: { $gt: 0 },
            },
          },
          { $group: { _id: null, totalSales: { $sum: "$total" } } },
        ]);

        // total refunds in that session
        const refundsAgg = await Sale.aggregate([
          {
            $match: {
              cashier: session.cashier,
              createdAt: { $gte: start, $lte: end },
              total: { $lt: 0 },
            },
          },
          { $group: { _id: null, totalRefunds: { $sum: "$total" } } },
        ]);

        const totalSales = salesAgg[0]?.totalSales || 0;
        const totalRefunds = Math.abs(refundsAgg[0]?.totalRefunds || 0);
        const netTotal = totalSales - totalRefunds;

        return {
          ...session,
          totalSales,
          totalRefunds,
          netTotal,
        };
      })
    );

    res.json(results);
  } catch (err) {
    console.error("Error fetching cashier sessions:", err);
    res.status(500).json({ message: "Failed to fetch cashier sessions" });
  }
};

// ✅ Get current session total for the logged-in cashier
// ✅ GET /api/pos/current-session-total
export const getCurrentSessionTotal = async (req, res) => {
  try {
    // ✅ Fix: your auth middleware provides req.user.id, not req.user._id
    const cashierId = req.user?._id || req.user?.id;

    if (!cashierId) {
      return res.status(401).json({ message: "Unauthorized: cashier ID missing" });
    }

    // find the latest open session for this cashier
    const currentSession = await DayClose.findOne({
      cashier: cashierId,
      status: "open",
    }).sort({ openedAt: -1 });

    if (!currentSession)
      return res.json({ sessionTotal: 0, message: "No active session" });

    const start = currentSession.openedAt;
    const end = new Date();

    // calculate total sales in current session
    const salesAgg = await Sale.aggregate([
      {
        $match: {
          cashier: new mongoose.Types.ObjectId(cashierId),
          createdAt: { $gte: start, $lte: end },
          total: { $gt: 0 },
        },
      },
      { $group: { _id: null, totalSales: { $sum: "$total" } } },
    ]);

    const refundsAgg = await Sale.aggregate([
      {
        $match: {
          cashier: new mongoose.Types.ObjectId(cashierId),
          createdAt: { $gte: start, $lte: end },
          total: { $lt: 0 },
        },
      },
      { $group: { _id: null, totalRefunds: { $sum: "$total" } } },
    ]);

    const totalSales = salesAgg[0]?.totalSales || 0;
    const totalRefunds = Math.abs(refundsAgg[0]?.totalRefunds || 0);
    const netTotal = totalSales - totalRefunds;

    res.json({
      sessionTotal: netTotal,
      totalSales,
      totalRefunds,
      openedAt: currentSession.openedAt,
    });
  } catch (err) {
    console.error("Error fetching current session total:", err);
    res.status(500).json({ message: "Failed to fetch session total" });
  }
};
