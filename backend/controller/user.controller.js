import { User } from "../models/user.model.js";
import bcrypt from "bcryptjs";
import createTokenAndSaveCookies from "../jwt/AuthToken.js";

export const register = async (req, res) => {
  try {
    const { email, name, password, role, permissions } = req.body;

    if (!email || !name || !password || !role) {
      return res.status(400).json({ message: "Please fill all required fields" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists with this email" });
    }

    // No need to hash manually, pre('save') will handle it
    const newUser = new User({
      email,
      name,
      password,
      role,
      // Only apply permissions if provided (primarily for committee members/admins). Defaults handled by schema
      ...(Array.isArray(permissions) ? { permissions } : {}),
    });
    await newUser.save();

    // Generate token
    createTokenAndSaveCookies(newUser, res);

    const { password: _, ...userData } = newUser.toObject();
    return res.status(201).json({ message: "User registered successfully", user: userData });

  } catch (error) {
    console.error("Register error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};


// Login user
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Please provide email and password" });
    }

    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    await createTokenAndSaveCookies(user, res);

    const { password: _, ...userData } = user.toObject();
    res.status(200).json({ message: "Login successful", user: userData });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Logout user
export const logout = async (req, res) => {
  try {
    // Ensure we clear the same cookie that we set in AuthToken.js (name: "token")
    res.cookie("token", "", { maxAge: 0 });
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Update user's permissions (e.g., by Admin)
export const updatePermissions = async (req, res) => {
  try {
    const { email, permissions } = req.body;
    if (!email || !Array.isArray(permissions)) {
      return res.status(400).json({ message: "Email and permissions array are required" });
    }

    const user = await User.findOneAndUpdate(
      { email },
      { $set: { permissions } },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const { password: _, ...userData } = user.toObject();
    return res.status(200).json({ message: "Permissions updated", user: userData });
  } catch (error) {
    console.error("Update permissions error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};
