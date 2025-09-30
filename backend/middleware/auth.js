import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

export const verifyToken = async (req, res, next) => {
  try {
    const token = req.cookies?.token || req.header("Authorization")?.replace("Bearer ", "");
    if (!token) return res.status(401).json({ message: "Authentication required" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    req.user = decoded; // { id, role }

    // Optionally ensure user still exists and is active
    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) {
      return res.status(401).json({ message: "User not active or not found" });
    }

    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

export const requireRole = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ message: "Forbidden: insufficient role" });
  }
  next();
};
