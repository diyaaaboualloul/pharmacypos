import { useEffect, useState } from "react";
import { useLocation, Link } from "react-router-dom";
import axios from "axios";
import { getToken } from "../utils/auth";
import Layout from "../components/Layout";

export default function SearchResultsPage() {
  const location = useLocation();
  const query = new URLSearchParams(location.search).get("q") || "";
  const [results, setResults] = useState([]);

  useEffect(() => {
    const fetchResults = async () => {
      const token = getToken();
      if (!token || !query) return;
      try {
        const { data } = await axios.get(
          `http://localhost:5000/api/admin/products/search?q=${encodeURIComponent(query)}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setResults(data);
      } catch (err) {
        console.error("Search failed", err);
      }
    };
    fetchResults();
  }, [query]);

  return (
    <Layout>
      <h3>
        Search Results for: <em>{query}</em>
      </h3>
      {results.length === 0 ? (
        <p>No products found.</p>
      ) : (
        <table className="table table-bordered">
          <thead className="table-dark">
            <tr>
              <th>Name</th>
              <th>Category</th>
              <th>Price</th>
              <th>Manage</th>
            </tr>
          </thead>
          <tbody>
            {results.map((p) => (
              <tr key={p._id}>
                <td>{p.name}</td>
                <td>{p.category}</td>
                <td>{p.price}</td>
                <td>
                  <Link to={`/admin/products/${p._id}/batches`} className="btn btn-primary btn-sm">
                    Manage Batches
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Layout>
  );
}
