import Batch from "../models/Batch.js";
import Product from "../models/Product.js";

/** Helper: compute expiry status */
function computeExpiryStatus(expiryDate, thresholdDays = 30) {
  const now = new Date();
  const exp = new Date(expiryDate);
  const MS_PER_DAY = 1000 * 60 * 60 * 24;
  const daysLeft = Math.ceil((exp - now) / MS_PER_DAY);

  if (daysLeft < 0) return { status: "expired", daysLeft };
  if (daysLeft <= thresholdDays) return { status: "expiringSoon", daysLeft };
  return { status: "valid", daysLeft };
}

/** POST /api/admin/batches
 * body: { productId, batchNumber, expiryDate, quantity, costPrice }
 */
export const createBatch = async (req, res) => {
  try {
    const { productId, batchNumber, expiryDate, quantity, costPrice } = req.body;

    if (!productId || !batchNumber || !expiryDate || quantity == null || costPrice == null) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // ensure product exists
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: "Product not found" });

    // ensure unique batch number
    const exists = await Batch.findOne({ batchNumber });
    if (exists) return res.status(400).json({ message: "Batch number already exists" });

    const batch = await Batch.create({
      product: productId,
      batchNumber,
      expiryDate,
      quantity,
      costPrice,
    });

    res.status(201).json({ message: "Batch created successfully", batch });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

/** GET /api/admin/batches/product/:productId
 * Returns batches for a product, each with {status, daysLeft}
 */
export const getBatchesByProduct = async (req, res) => {
  try {
    const { productId } = req.params;

    // verify product exists (nice error messages)
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: "Product not found" });

    const batches = await Batch.find({ product: productId }).sort({ expiryDate: 1, createdAt: -1 });

    const enriched = batches.map((b) => {
      const { status, daysLeft } = computeExpiryStatus(b.expiryDate);
      return { ...b.toObject(), status, daysLeft };
    });

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

/** PUT /api/admin/batches/:id
 * body: { batchNumber?, expiryDate?, quantity?, costPrice? }
 */
export const updateBatch = async (req, res) => {
  try {
    const { id } = req.params;
    const payload = {};
    ["batchNumber", "expiryDate", "quantity", "costPrice"].forEach((k) => {
      if (req.body[k] !== undefined) payload[k] = req.body[k];
    });

    // If batchNumber changes, ensure uniqueness
    if (payload.batchNumber) {
      const exists = await Batch.findOne({ batchNumber: payload.batchNumber, _id: { $ne: id } });
      if (exists) return res.status(400).json({ message: "Batch number already exists" });
    }

    const updated = await Batch.findByIdAndUpdate(id, payload, { new: true, runValidators: true });
    if (!updated) return res.status(404).json({ message: "Batch not found" });

    res.json({ message: "Batch updated", batch: updated });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

/** DELETE /api/admin/batches/:id */
export const deleteBatch = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Batch.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: "Batch not found" });
    res.json({ message: "Batch deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

/** (Optional) GET /api/admin/batches/expiring?days=30
 * Returns all batches across products that are expired or expiring soon
 */
export const getExpiringBatches = async (req, res) => {
  try {
    const thresholdDays = parseInt(req.query.days || "30", 10);
    const batches = await Batch.find({}).populate("product", "name category");
    const flagged = batches
      .map((b) => {
        const info = computeExpiryStatus(b.expiryDate, thresholdDays);
        return { ...b.toObject(), ...info };
      })
      .filter((b) => b.status === "expired" || b.status === "expiringSoon")
      .sort((a, b) => (a.daysLeft || 0) - (b.daysLeft || 0));

    res.json({ thresholdDays, batches: flagged });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
