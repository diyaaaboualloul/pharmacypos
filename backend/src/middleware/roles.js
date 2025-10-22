// backend/src/middleware/roles.js
export const requireAdminOrFinance = (req, res, next) => {
  if (!req.user || !["admin", "finance"].includes(req.user.role)) {
    return res.status(403).json({ message: "Admin or Finance access required" });
  }
  next();
};
