import Sale from "../models/Sale.js";

// 👨‍💼 Cashier: view own invoices
// 👨‍💼 Cashier: view own invoices
export const listMySales = async (req, res) => {
  try {
    const sales = await Sale.find({ cashier: req.user._id }) // ✅ FIXED HERE
      .populate("cashier", "name email")
      .populate("items.product", "name category price")
      .sort({ createdAt: -1 });
    res.json(sales);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch your invoices", error: err.message });
  }
};


// 🧾 Admin/Finance: view all invoices
export const listAllSales = async (req, res) => {
  try {
    const sales = await Sale.find()
      .populate("cashier", "name email role")
      .populate("items.product", "name category price")
      .sort({ createdAt: -1 });
    res.json(sales);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch all invoices", error: err.message });
  }
};

// 🔎 Admin/Finance: view single invoice details
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
