import mongoose from "mongoose";

const analyticsDailySummarySchema = new mongoose.Schema({
  date: { type: Date, unique: true, required: true },
  total_visitors: { type: Number, default: 0 },
  total_cabs: { type: Number, default: 0 },
  total_deliveries: { type: Number, default: 0 },
}, { timestamps: { createdAt: 'created_at', updatedAt: false } });

export const AnalyticsDailySummary = mongoose.model('AnalyticsDailySummary', analyticsDailySummarySchema);
