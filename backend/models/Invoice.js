import mongoose from 'mongoose';

const invoiceSchema = new mongoose.Schema({
  invoiceNumber: {
    type: String,
    required: true,
    unique: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  residentName: {
    type: String,
    required: true
  },
  residentEmail: {
    type: String,
    required: true
  },
  unit: {
    type: String,
    required: true
  },
  charges: {
    maintenanceCharge: {
      type: Number,
      default: 0
    },
    parkingCharge: {
      type: Number,
      default: 0
    },
    waterCharge: {
      type: Number,
      default: 0
    },
    commonAreaCharge: {
      type: Number,
      default: 0
    },
    gst: {
      type: Number,
      default: 0
    }
  },
  subtotal: {
    type: Number,
    required: true
  },
  gstAmount: {
    type: Number,
    default: 0
  },
  totalAmount: {
    type: Number,
    required: true
  },
  dueDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'paid', 'overdue', 'cancelled'],
    default: 'pending'
  },
  paidDate: {
    type: Date,
    default: null
  },
  paymentMethod: {
    type: String,
    enum: ['bank_transfer', 'cash', 'cheque', 'upi', 'card', 'other'],
    default: null
  },
  notes: {
    type: String,
    default: ''
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Auto-generate invoice number
invoiceSchema.pre('save', async function(next) {
  if (!this.invoiceNumber) {
    const count = await mongoose.model('Invoice').countDocuments();
    this.invoiceNumber = `INV-${String(count + 1).padStart(5, '0')}`;
  }
  
  // Auto-update status based on due date
  if (this.status === 'pending' && new Date() > this.dueDate) {
    this.status = 'overdue';
  }
  
  next();
});

// Calculate totals
invoiceSchema.methods.calculateTotals = function() {
  const { maintenanceCharge, parkingCharge, waterCharge, commonAreaCharge, gst } = this.charges;
  this.subtotal = maintenanceCharge + parkingCharge + waterCharge + commonAreaCharge;
  this.gstAmount = (this.subtotal * gst) / 100;
  this.totalAmount = this.subtotal + this.gstAmount;
};

export default mongoose.model('Invoice', invoiceSchema);