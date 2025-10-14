import { useNavigate } from "react-router-dom";
import { getUser } from "../utils/auth";

export default function UnauthorizedPage() {
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
        break;
    }
  };

  return (
    <div className="d-flex flex-column justify-content-center align-items-center vh-100 text-center">
      <h1 className="display-4 text-danger mb-3">🚫 Unauthorized</h1>
      <p className="lead mb-4">
        You don't have permission to view this page.
      </p>
      <button className="btn btn-primary" onClick={goToDashboard}>
        Go to My Dashboard
      </button>
    </div>
  );
}
