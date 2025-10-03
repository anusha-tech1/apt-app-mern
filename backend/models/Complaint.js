import mongoose from "mongoose";

const complaintSchema = new mongoose.Schema(
  {
    resident: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    category: { type: String, required: true },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    status: {
      type: String,
      enum: ["pending", "in_progress", "resolved", "closed"],
      default: "pending",
    },
    assignedStaff: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    resolutionNotes: { type: String, default: "" },
  },
  { timestamps: true }
);

export const Complaint = mongoose.model("Complaint", complaintSchema);
