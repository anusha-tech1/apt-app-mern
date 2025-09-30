import mongoose from "mongoose";

const analyticsCabSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  cab_number: String,
  driver_name: String,
  passenger_name: String,
  trip_type: String, // 'arrival', 'departure', 'local'
  time: Date,
  destination: String,
  fare: { type: Number, default: 0 },
}, { timestamps: { createdAt: 'created_at', updatedAt: false } });

export const AnalyticsCab = mongoose.model('AnalyticsCab', analyticsCabSchema);
