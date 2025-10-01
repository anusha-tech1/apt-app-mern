import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";

import userRoute from "./routes/user.route.js";
import analyticsRoute from "./routes/analytics.route.js";
import billingRoute from "./routes/billingRoutes.js"; // ✅ Add billing routes

dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(cookieParser());

// Connect to MongoDB
const MONGO_URL = process.env.MONGO_URI;
const PORT = process.env.PORT || 5000;

mongoose
  .connect(MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  });

// API routes
app.use("/api/users", userRoute);
app.use("/api/analytics", analyticsRoute);
app.use("/api/billing", billingRoute); // ✅ Billing API

// Health check route
app.get("/", (req, res) => {
  res.send("API is running...");
});

// Global error handler (optional but recommended)
app.use((err, req, res, next) => {
  console.error("🔥 Error:", err.stack);
  res.status(500).json({ success: false, message: "Internal Server Error" });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
