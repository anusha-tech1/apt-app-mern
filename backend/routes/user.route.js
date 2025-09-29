import express from "express";
import { register, login, logout, updatePermissions } from '../controller/user.controller.js';

const router = express.Router();

router.post("/register", register);
router.post("/login", login); // Add login route
router.post("/logout", logout);
router.patch("/permissions", updatePermissions); // Update permissions by email

export default router;
