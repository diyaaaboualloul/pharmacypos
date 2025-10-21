// backend/src/middleware/auth.js
import jwt from "jsonwebtoken";

/**
 * Middleware: Require valid JWT
 * Attaches req.user = { id, email, role, ... } if valid.
 */
export function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";
    const [, token] = authHeader.split(" "); // Expect "Bearer <token>"

    if (!token) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET);

    req.user = {
      id: payload.id,
      email: payload.email,
      role: payload.role,
      ...payload,
    };

    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

/**
 * Factory for role-based access control.
 * Example: requireRole("admin", "finance")
 */
export const requireRole =
  (...roles) =>
  (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    if (roles.includes(req.user.role)) {
      return next();
    }

    return res
      .status(403)
      .json({ message: `Access denied. Allowed roles: ${roles.join(", ")}` });
  };

/**
 * Predefined guards for convenience.
 */
export const requireAdmin = requireRole("admin");
export const requireFinanceOrAdmin = requireRole("finance", "admin");
