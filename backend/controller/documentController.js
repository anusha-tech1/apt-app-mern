import Document from '../models/Document.js';
import { User } from "../models/user.model.js";
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/documents';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /pdf|doc|docx|xls|xlsx|ppt|pptx|txt|jpg|jpeg|png/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('Only documents and images are allowed!'));
  }
};

export const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: fileFilter
});

// Upload document
export const uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const { title, description, category, accessLevel, tags, expiryDate } = req.body;

    const document = new Document({
      title,
      description,
      category,
      fileUrl: `/uploads/documents/${req.file.filename}`,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      fileType: req.file.mimetype,
      uploadedBy: req.user._id,
      uploaderName: req.user.name,
      accessLevel: accessLevel || 'residents_only',
      tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
      expiryDate: expiryDate || null
    });

    await document.save();

    res.status(201).json({
      message: 'Document uploaded successfully',
      document
    });
  } catch (error) {
    // Delete uploaded file if database save fails
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ message: error.message });
  }
};

// Get all documents with filters
export const getAllDocuments = async (req, res) => {
  try {
    const { category, accessLevel, search, isActive } = req.query;
    
    let query = {};

    // Filter by category
    if (category && category !== 'all') {
      query.category = category;
    }

    // Filter by access level
    if (accessLevel && accessLevel !== 'all') {
      query.accessLevel = accessLevel;
    }

    // Filter by active status
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    // Search functionality
    if (search) {
      query.$text = { $search: search };
    }

    // Check user permissions for access level filtering
    if (req.user.role === 'resident') {
      query.accessLevel = { $in: ['public', 'residents_only'] };
    } else if (req.user.role === 'committee_member') {
      query.accessLevel = { $in: ['public', 'residents_only', 'committee_only'] };
    }

    const documents = await Document.find(query)
      .populate('uploadedBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({ documents });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single document
export const getDocument = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id)
      .populate('uploadedBy', 'name email role');

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Check access permissions
    const hasAccess = checkDocumentAccess(document, req.user);
    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.status(200).json({ document });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update document
export const updateDocument = async (req, res) => {
  try {
    const { title, description, category, accessLevel, tags, expiryDate, isActive } = req.body;

    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Check if user has permission to update
    if (req.user.role !== 'admin' && req.user.role !== 'committee_member') {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Update fields
    if (title) document.title = title;
    if (description !== undefined) document.description = description;
    if (category) document.category = category;
    if (accessLevel) document.accessLevel = accessLevel;
    if (tags) document.tags = tags.split(',').map(tag => tag.trim());
    if (expiryDate !== undefined) document.expiryDate = expiryDate;
    if (isActive !== undefined) document.isActive = isActive;

    await document.save();

    res.status(200).json({
      message: 'Document updated successfully',
      document
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete document
export const deleteDocument = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Check if user has permission to delete
    if (req.user.role !== 'admin' && req.user.role !== 'committee_member') {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Delete file from filesystem
    const filePath = path.join(process.cwd(), document.fileUrl);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await Document.findByIdAndDelete(req.params.id);

    res.status(200).json({ message: 'Document deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Download document
export const downloadDocument = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Check access permissions
    const hasAccess = checkDocumentAccess(document, req.user);
    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Increment download count
    document.downloadCount += 1;
    await document.save();

    const filePath = path.join(process.cwd(), document.fileUrl);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found' });
    }

    res.download(filePath, document.fileName);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get document statistics
export const getDocumentStats = async (req, res) => {
  try {
    const totalDocuments = await Document.countDocuments({ isActive: true });
    const documentsByCategory = await Document.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);
    
    const totalDownloads = await Document.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: null, total: { $sum: '$downloadCount' } } }
    ]);

    const recentUploads = await Document.find({ isActive: true })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('title category createdAt uploaderName');

    res.status(200).json({
      stats: {
        totalDocuments,
        documentsByCategory,
        totalDownloads: totalDownloads[0]?.total || 0,
        recentUploads
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Helper function to check document access
const checkDocumentAccess = (document, user) => {
  if (user.role === 'admin') return true;
  
  if (document.accessLevel === 'public') return true;
  if (document.accessLevel === 'residents_only' && ['resident', 'committee_member'].includes(user.role)) return true;
  if (document.accessLevel === 'committee_only' && user.role === 'committee_member') return true;
  if (document.accessLevel === 'admin_only' && user.role === 'admin') return true;
  
  return false;
};