import express from "express";
import { Complaint } from "../models/Complaint.js";
import { ComplaintComment } from "../models/ComplaintComment.js";
import { User } from "../models/user.model.js";
import { verifyToken, requireRole } from "../middleware/auth.js";

const router = express.Router();

// Get all complaints with filters
router.get("/", verifyToken, requireRole("admin"), async (req, res) => {
  try {
    const { status, priority, category, page = 1, limit = 20 } = req.query;

    const query = {};
    if (status && status !== "all") query.status = status;
    if (priority && priority !== "all") query.priority = priority;
    if (category && category !== "all") query.category = category;

    const skip = (Number(page) - 1) * Number(limit);

    const [complaints, total] = await Promise.all([
      Complaint.find(query)
      .populate("resident", "name email unit")
      .populate("assignedStaff", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
      Complaint.countDocuments(query),
    ]);

    const shaped = complaints.map((c) => ({
      _id: c._id,
      title: c.title,
      description: c.description,
      category: c.category,
      priority: c.priority,
      status: c.status,
      resolution_notes: c.resolutionNotes || "",
      created_at: c.createdAt,
      updated_at: c.updatedAt,
      assigned_staff_id: c.assignedStaff ? c.assignedStaff._id : null,
      resident_id: c.resident ? c.resident._id : null,
      resident_name: c.resident ? c.resident.name : "",
      resident_email: c.resident ? c.resident.email : "",
      unit_number: c.resident && c.resident.unit ? c.resident.unit : "-",
    }));

    res.json({ complaints: shaped, page: Number(page), limit: Number(limit), total });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Resident: create a complaint
router.post("/", verifyToken, requireRole("resident"), async (req, res) => {
  try {
    const { title, description, category, priority = "medium" } = req.body;
    if (!title || !description || !category) {
      return res.status(400).json({ error: "title, description and category are required" });
    }
    const doc = await Complaint.create({
      resident: req.user.id,
      title,
      description,
      category,
      priority,
    });
    const c = await Complaint.findById(doc._id)
      .populate("resident", "name email unit")
      .populate("assignedStaff", "name email");
    const complaint = {
      _id: c._id,
      title: c.title,
      description: c.description,
      category: c.category,
      priority: c.priority,
      status: c.status,
      resolution_notes: c.resolutionNotes || "",
      created_at: c.createdAt,
      updated_at: c.updatedAt,
      assigned_staff_id: c.assignedStaff ? c.assignedStaff._id : null,
      resident_id: c.resident ? c.resident._id : null,
      resident_name: c.resident ? c.resident.name : "",
      resident_email: c.resident ? c.resident.email : "",
      unit_number: c.resident && c.resident.unit ? c.resident.unit : "-",
    };
    res.status(201).json({ complaint });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Resident: list own complaints
router.get("/my", verifyToken, requireRole("resident"), async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const query = { resident: req.user.id };
    const [rows, total] = await Promise.all([
      Complaint.find(query)
        .populate("resident", "name email unit")
        .populate("assignedStaff", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Complaint.countDocuments(query),
    ]);
    const complaints = rows.map((c) => ({
      _id: c._id,
      title: c.title,
      description: c.description,
      category: c.category,
      priority: c.priority,
      status: c.status,
      resolution_notes: c.resolutionNotes || "",
      created_at: c.createdAt,
      updated_at: c.updatedAt,
      assigned_staff_id: c.assignedStaff ? c.assignedStaff._id : null,
      resident_id: c.resident ? c.resident._id : null,
      resident_name: c.resident ? c.resident.name : "",
      resident_email: c.resident ? c.resident.email : "",
      unit_number: c.resident && c.resident.unit ? c.resident.unit : "-",
    }));
    res.json({ complaints, page: Number(page), limit: Number(limit), total });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Staff: list assigned complaints
router.get("/assigned", verifyToken, requireRole("staff"), async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const query = { assignedStaff: req.user.id };
    if (status && status !== "all") query.status = status;
    const [rows, total] = await Promise.all([
      Complaint.find(query)
        .populate("resident", "name email unit")
        .populate("assignedStaff", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Complaint.countDocuments(query),
    ]);
    const complaints = rows.map((c) => ({
      _id: c._id,
      title: c.title,
      description: c.description,
      category: c.category,
      priority: c.priority,
      status: c.status,
      resolution_notes: c.resolutionNotes || "",
      created_at: c.createdAt,
      updated_at: c.updatedAt,
      assigned_staff_id: c.assignedStaff ? c.assignedStaff._id : null,
      resident_id: c.resident ? c.resident._id : null,
      resident_name: c.resident ? c.resident.name : "",
      resident_email: c.resident ? c.resident.email : "",
      unit_number: c.resident && c.resident.unit ? c.resident.unit : "-",
    }));
    res.json({ complaints, page: Number(page), limit: Number(limit), total });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get complaint by ID
router.get("/:id", verifyToken, requireRole("admin"), async (req, res) => {
  try {
    const { id } = req.params;
    const c = await Complaint.findById(id)
      .populate("resident", "name email unit")
      .populate("assignedStaff", "name email");

    if (!c) return res.status(404).json({ error: "Complaint not found" });

    const complaint = {
      _id: c._id,
      title: c.title,
      description: c.description,
      category: c.category,
      priority: c.priority,
      status: c.status,
      resolution_notes: c.resolutionNotes || "",
      created_at: c.createdAt,
      updated_at: c.updatedAt,
      assigned_staff_id: c.assignedStaff ? c.assignedStaff._id : null,
      staff_name: c.assignedStaff ? c.assignedStaff.name : "",
      staff_email: c.assignedStaff ? c.assignedStaff.email : "",
      resident_id: c.resident ? c.resident._id : null,
      resident_name: c.resident ? c.resident.name : "",
      resident_email: c.resident ? c.resident.email : "",
      unit_number: c.resident && c.resident.unit ? c.resident.unit : "-",
    };

    res.json({ complaint });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update complaint status
router.patch("/:id/status", verifyToken, requireRole("admin"), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, resolution_notes } = req.body;

    const updated = await Complaint.findByIdAndUpdate(
      id,
      { $set: { status, resolutionNotes: resolution_notes, updatedAt: new Date() } },
      { new: true }
    )
      .populate("resident", "name email unit")
      .populate("assignedStaff", "name email");

    if (!updated) return res.status(404).json({ error: "Complaint not found" });

    const complaint = {
      _id: updated._id,
      title: updated.title,
      description: updated.description,
      category: updated.category,
      priority: updated.priority,
      status: updated.status,
      resolution_notes: updated.resolutionNotes || "",
      created_at: updated.createdAt,
      updated_at: updated.updatedAt,
      assigned_staff_id: updated.assignedStaff ? updated.assignedStaff._id : null,
      staff_name: updated.assignedStaff ? updated.assignedStaff.name : "",
      staff_email: updated.assignedStaff ? updated.assignedStaff.email : "",
      resident_id: updated.resident ? updated.resident._id : null,
      resident_name: updated.resident ? updated.resident.name : "",
      resident_email: updated.resident ? updated.resident.email : "",
      unit_number: updated.resident && updated.resident.unit ? updated.resident.unit : "-",
    };

    res.json({ complaint });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Assign complaint to staff
router.patch("/:id/assign", verifyToken, requireRole("admin"), async (req, res) => {
  try {
    const { id } = req.params;
    const { staff_id } = req.body;

    const staff = await User.findById(staff_id);
    if (!staff || staff.role !== "staff") {
      return res.status(400).json({ error: "Invalid staff member" });
    }

    const updated = await Complaint.findByIdAndUpdate(
      id,
      { $set: { assignedStaff: staff_id, status: "in_progress", updatedAt: new Date() } },
      { new: true }
    )
      .populate("resident", "name email unit")
      .populate("assignedStaff", "name email");

    if (!updated) return res.status(404).json({ error: "Complaint not found" });

    const complaint = {
      _id: updated._id,
      title: updated.title,
      description: updated.description,
      category: updated.category,
      priority: updated.priority,
      status: updated.status,
      resolution_notes: updated.resolutionNotes || "",
      created_at: updated.createdAt,
      updated_at: updated.updatedAt,
      assigned_staff_id: updated.assignedStaff ? updated.assignedStaff._id : null,
      staff_name: updated.assignedStaff ? updated.assignedStaff.name : "",
      staff_email: updated.assignedStaff ? updated.assignedStaff.email : "",
      resident_id: updated.resident ? updated.resident._id : null,
      resident_name: updated.resident ? updated.resident.name : "",
      resident_email: updated.resident ? updated.resident.email : "",
      unit_number: updated.resident && updated.resident.unit ? updated.resident.unit : "-",
    };

    res.json({ complaint });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add comment to complaint
router.post("/:id/comments", verifyToken, requireRole("admin"), async (req, res) => {
  try {
    const { id } = req.params;
    const { comment, commented_by } = req.body;

    const c = await Complaint.findById(id);
    if (!c) return res.status(404).json({ error: "Complaint not found" });

    const userId = commented_by || req.user?.id; // fallback to token user

    const newComment = await ComplaintComment.create({
      complaint: id,
      comment,
      commentedBy: userId,
    });

    const populated = await newComment.populate({ path: "commentedBy", select: "name" });

    res.json({
      comment: {
        _id: populated._id,
        complaint_id: id,
        comment: populated.comment,
        commenter_name: populated.commentedBy?.name || "",
        created_at: populated.createdAt,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get complaint comments
router.get("/:id/comments", verifyToken, requireRole("admin"), async (req, res) => {
  try {
    const { id } = req.params;

    const rows = await ComplaintComment.find({ complaint: id })
      .populate("commentedBy", "name")
      .sort({ createdAt: 1 });

    const comments = rows.map((r) => ({
      _id: r._id,
      complaint_id: id,
      comment: r.comment,
      commenter_name: r.commentedBy?.name || "",
      created_at: r.createdAt,
    }));

    res.json({ comments });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
