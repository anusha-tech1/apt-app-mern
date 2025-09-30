import express from "express";
import { register, login, logout, updatePermissions } from '../controller/user.controller.js';
import { verifyToken, requireRole } from "../middleware/auth.js";
import {
  adminCreateUser,
  listUsers,
  getUserById,
  updateUser,
  toggleActive,
  deleteUser,
} from "../controller/admin.user.controller.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login); // Add login route
router.post("/logout", logout);
router.patch("/permissions", verifyToken, requireRole("admin"), updatePermissions); // Update permissions by email

// Admin-only user management
router.get("/", verifyToken, requireRole("admin"), listUsers);
router.get("/:id", verifyToken, requireRole("admin"), getUserById);
router.post("/", verifyToken, requireRole("admin"), adminCreateUser);
router.patch("/:id", verifyToken, requireRole("admin"), updateUser);
router.patch("/:id/toggle-active", verifyToken, requireRole("admin"), toggleActive);
router.delete("/:id", verifyToken, requireRole("admin"), deleteUser);

export default router;
