import Sale from "../models/Sale.js";
import Expense from "../models/Expense.js";
import PayrollEntry from "../models/PayrollEntry.js";
import mongoose from "mongoose";

function getDateRange(period) {
  const now = new Date();
  let start, end;

  switch (period) {
    case "daily":
      start = new Date(now.setHours(0, 0, 0, 0));
      end = new Date(now.setHours(23, 59, 59, 999));
      break;
    case "monthly":
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      break;
    case "yearly":
      start = new Date(now.getFullYear(), 0, 1);
      end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
      break;
    default:
      start = new Date(0);
      end = new Date();
  }
  return { start, end };
}

/**
 * GET /api/reports/summary?period=daily|monthly|yearly
 * Calculates totals for sales, expenses, payroll, and profit.
 */
export const getSummaryReport = async (req, res) => {
  try {
    const { period = "daily" } = req.query;
    const { start, end } = getDateRange(period);

    // ---- SALES ----
    const sales = await Sale.find({
      createdAt: { $gte: start, $lte: end },
    }).lean();

    const totalSales = sales.reduce((sum, s) => sum + (s.total || 0), 0);

    // ---- EXPENSES ----
    const expenses = await Expense.find({
      date: { $gte: start, $lte: end },
    }).lean();
    const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

    // ---- PAYROLL ----
    const payrolls = await PayrollEntry.find({
      paid: true,
      paidDate: { $gte: start, $lte: end },
    }).lean();
    const totalPayroll = payrolls.reduce((sum, p) => sum + (p.netPay || 0), 0);

    // ---- NET PROFIT ----
    const netProfit = totalSales - (totalExpenses + totalPayroll);

    res.json({
      period,
      totalSales,
      totalExpenses,
      totalPayroll,
      netProfit,
    });
  } catch (err) {
    console.error("getSummaryReport error:", err);
    res.status(500).json({ message: "Failed to generate report" });
  }
};

/**
 * GET /api/reports/pdf?period=daily|monthly|yearly
 * Generates and streams a PDF version of the summary report.
 */
export const exportReportPDF = async (req, res) => {
  try {
    const { period = "daily" } = req.query;
    const { start, end } = getDateRange(period);

    // same calculations
    const sales = await Sale.find({
      createdAt: { $gte: start, $lte: end },
    }).lean();
    const totalSales = sales.reduce((sum, s) => sum + (s.total || 0), 0);

    const expenses = await Expense.find({
      date: { $gte: start, $lte: end },
    }).lean();
    const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

    const payrolls = await PayrollEntry.find({
      paid: true,
      paidDate: { $gte: start, $lte: end },
    }).lean();
    const totalPayroll = payrolls.reduce((sum, p) => sum + (p.netPay || 0), 0);

    const netProfit = totalSales - (totalExpenses + totalPayroll);

    // create PDF
    const doc = new PDFDocument();
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=report_${period}.pdf`
    );
    doc.pipe(res);

    doc.fontSize(18).text(`Pharmacy Financial Report (${period})`, { align: "center" });
    doc.moveDown();

    doc.fontSize(14).text(`Total Sales: $${totalSales.toFixed(2)}`);
    doc.text(`Total Expenses: $${totalExpenses.toFixed(2)}`);
    doc.text(`Total Payroll: $${totalPayroll.toFixed(2)}`);
    doc.moveDown();
    doc.fontSize(16)
      .fillColor(netProfit >= 0 ? "green" : "red")
      .text(`Net Profit: $${netProfit.toFixed(2)}`);
    doc.end();
  } catch (err) {
    console.error("exportReportPDF error:", err);
    res.status(500).json({ message: "Failed to generate PDF" });
  }
};
