import { useNavigate } from "react-router-dom";
import { getUser } from "../utils/auth";

export default function NotFoundPage() {
  const navigate = useNavigate();
  const user = getUser();

  const goToDashboard = () => {
    if (!user) {
      navigate("/login");
      return;
    }

    switch (user.role) {
      case "admin":
        navigate("/dashboard");
        break;
      case "cashier":
        navigate("/cashier-dashboard");
        break;
      case "finance":
        navigate("/finance-dashboard");
        break;
      default:
        navigate("/login");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <div className="container d-flex flex-column justify-content-center align-items-center vh-100 text-center">
      {/* 🔸 Top bar with Logout if logged in */}
      {user && (
        <div className="position-absolute top-0 end-0 p-3">
          <button className="btn btn-danger btn-sm" onClick={handleLogout}>
            Logout
          </button>
        </div>
      )}

      <h1 className="display-4 text-warning mb-3">404 - Page Not Found 🧐</h1>
      <p className="lead mb-4">
        The page you’re looking for doesn’t exist or has been moved.
      </p>

      <button className="btn btn-primary" onClick={goToDashboard}>
        Go to My Dashboard
      </button>
    </div>
  );
}
