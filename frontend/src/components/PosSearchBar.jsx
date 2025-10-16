import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { getToken } from "../utils/auth";

export default function PosSearchBar({ onAdd }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      fetchResults();
    }, 300);

    return () => clearTimeout(debounceRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const fetchResults = async () => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      return;
    }
    try {
      setLoading(true);
      const token = getToken();
      const { data } = await axios.get(
        `http://localhost:5000/api/pos/search?q=${encodeURIComponent(trimmed)}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setResults(data);
    } catch (err) {
      console.error("Search failed", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mb-4">
      <div className="input-group">
        <input
          type="text"
          className="form-control"
          placeholder="Search product by name or category..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {loading && (
          <span className="input-group-text">
            <div className="spinner-border spinner-border-sm text-primary"></div>
          </span>
        )}
      </div>

      {results.length > 0 && (
        <div className="mt-3 table-responsive">
          <table className="table table-sm table-bordered align-middle">
            <thead className="table-light">
              <tr>
                <th>Name</th>
                <th>Category</th>
                <th>Price</th>
                <th>Available Qty</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {results.map((prod) => (
                <tr key={prod._id}>
                  <td>{prod.name}</td>
                  <td>{prod.category}</td>
                  <td>${prod.price.toFixed(2)}</td>
                  <td>{prod.totalSellableQty}</td>
                  <td>
                    <button
                      className="btn btn-success btn-sm"
                      onClick={() => onAdd(prod)}
                      disabled={prod.totalSellableQty <= 0}
                    >
                      ➕ Add
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
