import express from 'express';
import { verifyToken, requireRole } from "../middleware/auth.js";
import {
  getDaily,
  getDetails,
  getOverviewSummary,
  recordVisitor,
  recordCab,
  recordDelivery,
  exportData,
} from "../controller/analytics.controller.js";

const router = express.Router();

// Read endpoints (admin only)
router.get('/daily', verifyToken, requireRole('admin'), getDaily);
router.get('/summary/overview', verifyToken, requireRole('admin'), getOverviewSummary);
router.get('/export', verifyToken, requireRole('admin'), exportData);
router.get('/:type', verifyToken, requireRole('admin'), getDetails);

// Write endpoints (allow admin and committee members by default)
router.post('/record-visitor', verifyToken, requireRole('admin', 'committee_member'), recordVisitor);
router.post('/record-cab', verifyToken, requireRole('admin', 'committee_member'), recordCab);
router.post('/record-delivery', verifyToken, requireRole('admin', 'committee_member'), recordDelivery);

export default router;
