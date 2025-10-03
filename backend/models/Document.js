import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: ['Bylaws', 'Circulars', 'Agreements', 'Meeting Minutes', 'Financial Reports', 'Notice', 'Other']
  },
  fileUrl: {
    type: String,
    required: true
  },
  fileName: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  fileType: {
    type: String,
    required: true
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  uploaderName: {
    type: String,
    required: true
  },
  accessLevel: {
    type: String,
    enum: ['public', 'residents_only', 'committee_only', 'admin_only'],
    default: 'residents_only'
  },
  tags: [{
    type: String,
    trim: true
  }],
  version: {
    type: Number,
    default: 1
  },
  isActive: {
    type: Boolean,
    default: true
  },
  expiryDate: {
    type: Date
  },
  downloadCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for faster searches
documentSchema.index({ title: 'text', description: 'text', tags: 'text' });
documentSchema.index({ category: 1, isActive: 1 });
documentSchema.index({ uploadedBy: 1 });

const Document = mongoose.model('Document', documentSchema);

export default Document;