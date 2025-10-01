import mongoose from 'mongoose';

const expenseSchema = new mongoose.Schema({
  expenseNumber: {
    type: String,
    required: true,
    unique: true
  },
  category: {
    type: String,
    required: true,
    enum: ['Maintenance', 'Utilities', 'Security', 'Housekeeping', 'Repairs', 'Salaries', 'Other']
  },
  description: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  vendor: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  paymentMethod: {
    type: String,
    enum: ['bank_transfer', 'cash', 'cheque', 'upi', 'card', 'other'],
    required: true
  },
  transactionId: {
    type: String,
    default: ''
  },
  receipt: {
    type: String,
    default: ''
  },
  notes: {
    type: String,
    default: ''
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'approved'
  }
}, {
  timestamps: true
});

// Auto-generate expense number
expenseSchema.pre('save', async function(next) {
  if (!this.expenseNumber) {
    const count = await mongoose.model('Expense').countDocuments();
    this.expenseNumber = `EXP-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

export default mongoose.model('Expense', expenseSchema);