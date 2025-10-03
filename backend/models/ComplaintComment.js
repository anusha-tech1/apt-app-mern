import mongoose from "mongoose";

const complaintCommentSchema = new mongoose.Schema(
  {
    complaint: { type: mongoose.Schema.Types.ObjectId, ref: "Complaint", required: true },
    comment: { type: String, required: true },
    commentedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

export const ComplaintComment = mongoose.model("ComplaintComment", complaintCommentSchema);
