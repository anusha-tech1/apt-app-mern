import { User } from "../models/user.model.js";

// Admin: Create a user (without auto-login)
export const adminCreateUser = async (req, res) => {
  try {
    const { email, name, password, role, permissions } = req.body;

    if (!email || !name || !password || !role) {
      return res.status(400).json({ message: "Please fill all required fields" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists with this email" });
    }

    const newUser = new User({
      email,
      name,
      password,
      role,
      ...(Array.isArray(permissions) ? { permissions } : {}),
    });
    await newUser.save();

    const { password: _pw, ...userData } = newUser.toObject();
    return res.status(201).json({ message: "User created", user: userData });
  } catch (error) {
    console.error("Admin create user error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Admin: List users
export const listUsers = async (req, res) => {
  try {
    const { role } = req.query;
    const filter = {};
    if (role) filter.role = role;
    const users = await User.find(filter).select("-password").sort({ createdAt: -1 });
    return res.status(200).json({ users });
  } catch (error) {
    console.error("List users error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Admin: Get user by id
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    return res.status(200).json({ user });
  } catch (error) {
    console.error("Get user error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Admin: Update user (name, role, permissions)
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, role, permissions } = req.body;

    const updates = {};
    if (typeof name === "string") updates.name = name;
    if (typeof role === "string") updates.role = role;
    if (Array.isArray(permissions)) updates.permissions = permissions;

    const user = await User.findByIdAndUpdate(id, { $set: updates }, { new: true }).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    return res.status(200).json({ message: "User updated", user });
  } catch (error) {
    console.error("Update user error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Admin: Toggle active status
export const toggleActive = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });
    user.isActive = !user.isActive;
    await user.save();
    const { password: _pw, ...userData } = user.toObject();
    return res.status(200).json({ message: user.isActive ? "User enabled" : "User disabled", user: userData });
  } catch (error) {
    console.error("Toggle active error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Admin: Delete user
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByIdAndDelete(id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    return res.status(200).json({ message: "User deleted" });
  } catch (error) {
    console.error("Delete user error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};
