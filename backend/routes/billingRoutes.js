import express from 'express';
import {
  getInvoices,
  getInvoiceById,
  createInvoice,
  updateInvoice,
  markInvoiceAsPaid,
  deleteInvoice,
  getExpenses,
  getExpenseById,
  createExpense,
  updateExpense,
  deleteExpense,
  getBillingStats
} from '../controller/billingController.js';

import { protect, authorize } from '../middleware/auth.js'; // Fixed imports

const router = express.Router();

// Invoice routes
router.route('/invoices')
  .get(protect, getInvoices) // Protect all invoice routes
  .post(protect, authorize('admin', 'committee_member'), createInvoice);

router.route('/invoices/stats')
  .get(protect, getBillingStats);

router.route('/invoices/:id')
  .get(protect, getInvoiceById)
  .patch(protect, authorize('admin', 'committee_member'), updateInvoice)
  .delete(protect, authorize('admin'), deleteInvoice);

router.route('/invoices/:id/mark-paid')
  .patch(protect, authorize('admin', 'committee_member'), markInvoiceAsPaid);

// Expense routes
router.route('/expenses')
  .get(protect, getExpenses)
  .post(protect, authorize('admin', 'committee_member'), createExpense);

router.route('/expenses/:id')
  .get(protect, getExpenseById)
  .patch(protect, authorize('admin', 'committee_member'), updateExpense)
  .delete(protect, authorize('admin'), deleteExpense);

export default router;
