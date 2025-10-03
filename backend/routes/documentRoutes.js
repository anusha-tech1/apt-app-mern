import express from 'express';
import {
  uploadDocument,
  getAllDocuments,
  getDocument,
  updateDocument,
  deleteDocument,
  downloadDocument,
  getDocumentStats,
  upload
} from '../controller/documentController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Public routes (with authentication)
router.get('/', protect, getAllDocuments);
router.get('/stats', protect, authorize('admin', 'committee_member'), getDocumentStats);
router.get('/:id', protect, getDocument);
router.get('/:id/download', protect, downloadDocument);

// Protected routes (admin and committee only)
router.post('/', protect, authorize('admin', 'committee_member'), upload.single('file'), uploadDocument);
router.patch('/:id', protect, authorize('admin', 'committee_member'), updateDocument);
router.delete('/:id', protect, authorize('admin', 'committee_member'), deleteDocument);

export default router;