import mongoose from "mongoose";

const analyticsDeliverySchema = new mongoose.Schema({
  date: { type: Date, required: true },
  delivery_company: String,
  tracking_number: String,
  recipient_name: String,
  delivery_time: Date,
  package_type: String,
  status: String, // 'delivered', 'pending', 'returned'
}, { timestamps: { createdAt: 'created_at', updatedAt: false } });

export const AnalyticsDelivery = mongoose.model('AnalyticsDelivery', analyticsDeliverySchema);
