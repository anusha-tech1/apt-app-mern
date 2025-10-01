import Invoice from '../models/Invoice.js';
import Expense from '../models/Expense.js';
import { User } from '../models/user.model.js';

// Get all invoices
export const getInvoices = async (req, res) => {
  try {
    const { status, startDate, endDate } = req.query;
    
    let query = {};
    
    if (status) {
      query.status = status;
    }
    
    if (startDate || endDate) {
      query.dueDate = {};
      if (startDate) query.dueDate.$gte = new Date(startDate);
      if (endDate) query.dueDate.$lte = new Date(endDate);
    }
    
    const invoices = await Invoice.find(query)
      .populate('userId', 'name email')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: invoices.length,
      invoices
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch invoices',
      error: error.message
    });
  }
};

// Get single invoice
export const getInvoiceById = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('userId', 'name email')
      .populate('createdBy', 'name email');
    
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }
    
    res.status(200).json({
      success: true,
      invoice
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch invoice',
      error: error.message
    });
  }
};

// Create invoice
export const createInvoice = async (req, res) => {
  try {
    const { 
      userId, 
      unit, 
      maintenanceCharge, 
      parkingCharge, 
      waterCharge, 
      commonAreaCharge, 
      gst, 
      dueDate,
      notes 
    } = req.body;
    
    // Validate user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Create invoice
    const invoice = new Invoice({
      userId,
      residentName: user.name,
      residentEmail: user.email,
      unit,
      charges: {
        maintenanceCharge: Number(maintenanceCharge) || 0,
        parkingCharge: Number(parkingCharge) || 0,
        waterCharge: Number(waterCharge) || 0,
        commonAreaCharge: Number(commonAreaCharge) || 0,
        gst: Number(gst) || 0
      },
      dueDate: new Date(dueDate),
      notes: notes || '',
      createdBy: req.user._id,
      subtotal: 0,
      gstAmount: 0,
      totalAmount: 0
    });
    
    // Calculate totals
    invoice.calculateTotals();
    
    await invoice.save();
    
    res.status(201).json({
      success: true,
      message: 'Invoice created successfully',
      invoice
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create invoice',
      error: error.message
    });
  }
};

// Update invoice
export const updateInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }
    
    const { 
      maintenanceCharge, 
      parkingCharge, 
      waterCharge, 
      commonAreaCharge, 
      gst, 
      dueDate,
      notes,
      status
    } = req.body;
    
    // Update charges if provided
    if (maintenanceCharge !== undefined) invoice.charges.maintenanceCharge = Number(maintenanceCharge);
    if (parkingCharge !== undefined) invoice.charges.parkingCharge = Number(parkingCharge);
    if (waterCharge !== undefined) invoice.charges.waterCharge = Number(waterCharge);
    if (commonAreaCharge !== undefined) invoice.charges.commonAreaCharge = Number(commonAreaCharge);
    if (gst !== undefined) invoice.charges.gst = Number(gst);
    
    // Recalculate totals
    invoice.calculateTotals();
    
    if (dueDate) invoice.dueDate = new Date(dueDate);
    if (notes !== undefined) invoice.notes = notes;
    if (status) invoice.status = status;
    
    await invoice.save();
    
    res.status(200).json({
      success: true,
      message: 'Invoice updated successfully',
      invoice
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update invoice',
      error: error.message
    });
  }
};

// Mark invoice as paid
export const markInvoiceAsPaid = async (req, res) => {
  try {
    const { paymentMethod } = req.body;
    
    const invoice = await Invoice.findById(req.params.id);
    
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }
    
    if (invoice.status === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Invoice is already paid'
      });
    }
    
    invoice.status = 'paid';
    invoice.paidDate = new Date();
    invoice.paymentMethod = paymentMethod || 'other';
    
    await invoice.save();
    
    res.status(200).json({
      success: true,
      message: 'Invoice marked as paid',
      invoice
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to mark invoice as paid',
      error: error.message
    });
  }
};

// Delete invoice
export const deleteInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }
    
    await invoice.deleteOne();
    
    res.status(200).json({
      success: true,
      message: 'Invoice deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete invoice',
      error: error.message
    });
  }
};

// Get all expenses
export const getExpenses = async (req, res) => {
  try {
    const { category, startDate, endDate, status } = req.query;
    
    let query = {};
    
    if (category) {
      query.category = category;
    }
    
    if (status) {
      query.status = status;
    }
    
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }
    
    const expenses = await Expense.find(query)
      .populate('createdBy', 'name email')
      .populate('approvedBy', 'name email')
      .sort({ date: -1 });
    
    res.status(200).json({
      success: true,
      count: expenses.length,
      expenses
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch expenses',
      error: error.message
    });
  }
};

// Get single expense
export const getExpenseById = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('approvedBy', 'name email');
    
    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }
    
    res.status(200).json({
      success: true,
      expense
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch expense',
      error: error.message
    });
  }
};

// Create expense
export const createExpense = async (req, res) => {
  try {
    const { 
      category, 
      description, 
      amount, 
      vendor, 
      date, 
      paymentMethod,
      transactionId,
      notes 
    } = req.body;
    
    const expense = new Expense({
      category,
      description,
      amount: Number(amount),
      vendor,
      date: new Date(date),
      paymentMethod,
      transactionId: transactionId || '',
      notes: notes || '',
      createdBy: req.user._id,
      approvedBy: req.user._id,
      status: 'approved'
    });
    
    await expense.save();
    
    res.status(201).json({
      success: true,
      message: 'Expense recorded successfully',
      expense
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create expense',
      error: error.message
    });
  }
};

// Update expense
export const updateExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    
    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }
    
    const allowedUpdates = [
      'category', 
      'description', 
      'amount', 
      'vendor', 
      'date', 
      'paymentMethod',
      'transactionId',
      'notes',
      'status'
    ];
    
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        if (field === 'amount') {
          expense[field] = Number(req.body[field]);
        } else if (field === 'date') {
          expense[field] = new Date(req.body[field]);
        } else {
          expense[field] = req.body[field];
        }
      }
    });
    
    await expense.save();
    
    res.status(200).json({
      success: true,
      message: 'Expense updated successfully',
      expense
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update expense',
      error: error.message
    });
  }
};

// Delete expense
export const deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    
    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }
    
    await expense.deleteOne();
    
    res.status(200).json({
      success: true,
      message: 'Expense deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete expense',
      error: error.message
    });
  }
};

// Get billing statistics
export const getBillingStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let dateQuery = {};
    if (startDate || endDate) {
      if (startDate) dateQuery.$gte = new Date(startDate);
      if (endDate) dateQuery.$lte = new Date(endDate);
    }
    
    // Get invoice stats
    const paidInvoices = await Invoice.find({ 
      status: 'paid',
      ...(Object.keys(dateQuery).length && { paidDate: dateQuery })
    });
    
    const pendingInvoices = await Invoice.find({ 
      status: { $in: ['pending', 'overdue'] }
    });
    
    const totalRevenue = paidInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
    const totalPending = pendingInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
    
    // Get expense stats
    const expenses = await Expense.find({
      status: 'approved',
      ...(Object.keys(dateQuery).length && { date: dateQuery })
    });
    
    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    
    // Calculate net balance
    const netBalance = totalRevenue - totalExpenses;
    
    // Collection rate
    const totalDue = totalRevenue + totalPending;
    const collectionRate = totalDue > 0 ? ((totalRevenue / totalDue) * 100).toFixed(2) : 0;
    
    res.status(200).json({
      success: true,
      stats: {
        totalRevenue,
        totalPending,
        totalExpenses,
        netBalance,
        collectionRate: parseFloat(collectionRate),
        paidInvoiceCount: paidInvoices.length,
        pendingInvoiceCount: pendingInvoices.length,
        expenseCount: expenses.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch billing statistics',
      error: error.message
    });
  }
};