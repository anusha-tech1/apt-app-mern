import mongoose from "mongoose";

const analyticsVisitorSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  visitor_name: String,
  visitor_type: String, // 'guest', 'contractor', 'family', etc.
  entry_time: Date,
  exit_time: Date,
  host_name: String,
  purpose: String,
}, { timestamps: { createdAt: 'created_at', updatedAt: false } });

export const AnalyticsVisitor = mongoose.model('AnalyticsVisitor', analyticsVisitorSchema);
