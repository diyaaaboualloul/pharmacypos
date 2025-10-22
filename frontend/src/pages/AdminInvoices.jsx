import React, { useEffect, useState } from "react";
import axios from "axios";
import { getToken } from "../utils/auth";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";

export default function AdminInvoices() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterCashier, setFilterCashier] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const navigate = useNavigate();

  // Fetch all sales
  const fetchSales = async () => {
    try {
      setLoading(true);
      const token = getToken();
      const { data } = await axios.get("http://localhost:5000/api/sales/all", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSales(data);
    } catch (err) {
      console.error(err);
      setError("Failed to load invoices");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, []);

  // 🔎 Apply filters
  const filteredSales = sales.filter((sale) => {
    const matchesCashier = sale.cashier?.name
      ?.toLowerCase()
      .includes(filterCashier.toLowerCase());

    const matchesDate = filterDate
      ? new Date(sale.createdAt).toLocaleDateString() ===
        new Date(filterDate).toLocaleDateString()
      : true;

    return matchesCashier && matchesDate;
  });

  // 📄 Pagination logic
  const totalPages = Math.ceil(filteredSales.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentSales = filteredSales.slice(startIndex, startIndex + itemsPerPage);

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  if (loading) return <p className="text-center mt-5">Loading invoices...</p>;
  if (error) return <p className="text-danger text-center mt-5">{error}</p>;

  return (
    <Layout>
      <div className="container mt-4">
        <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
          <h3 className="mb-0">📄 Invoices (All Cashiers)</h3>

          {/* 🧍 Filter by cashier name */}
          <input
            type="text"
            className="form-control"
            placeholder="Search by cashier name..."
            style={{ maxWidth: "250px" }}
            value={filterCashier}
            onChange={(e) => {
              setFilterCashier(e.target.value);
              setCurrentPage(1);
            }}
          />

          {/* 📅 Filter by date */}
          <input
            type="date"
            className="form-control"
            style={{ maxWidth: "200px" }}
            value={filterDate}
            onChange={(e) => {
              setFilterDate(e.target.value);
              setCurrentPage(1);
            }}
          />

          {/* 🧹 Clear filters */}
          <button
            className="btn btn-outline-secondary btn-sm"
            onClick={() => {
              setFilterCashier("");
              setFilterDate("");
              setCurrentPage(1);
            }}
          >
            Clear Filters
          </button>
        </div>

        {currentSales.length === 0 ? (
          <p className="text-center text-muted">No invoices found.</p>
        ) : (
          <>
            <div className="table-responsive">
              <table className="table table-bordered table-striped align-middle">
                <thead className="table-warning">
                  <tr>
                    <th>Invoice #</th>
                    <th>Date</th>
                    <th>Cashier</th>
                    <th>Payment Type</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {currentSales.map((sale) => (
                    <tr key={sale._id}>
                      <td>{sale.invoiceNumber}</td>
                      <td>{new Date(sale.createdAt).toLocaleString()}</td>
                      <td>{sale.cashier?.name || "Unknown"}</td>
                      <td>{sale.payment?.type}</td>
                      <td>${sale.total.toFixed(2)}</td>
                      <td
                        className={
                          sale.total < 0 ? "text-danger" : "text-success"
                        }
                      >
                        {sale.total < 0 ? "Refunded" : "Original"}
                      </td>
                      <td className="d-flex gap-2">
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() =>
                            navigate(`/admin/invoices/${sale._id}`)
                          }
                        >
                          View
                        </button>
                        <button
                          className="btn btn-warning btn-sm"
                          onClick={() =>
                            navigate(`/admin/invoices/${sale._id}/edit`)
                          }
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 📄 Pagination controls */}
            <div className="d-flex justify-content-between align-items-center mt-3">
              <span>
                Page {currentPage} of {totalPages}
              </span>

              <div>
                <button
                  className="btn btn-outline-primary btn-sm me-2"
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  ← Previous
                </button>
                <button
                  className="btn btn-outline-primary btn-sm"
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next →
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
