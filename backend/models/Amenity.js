import mongoose from 'mongoose';

const amenitySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['Indoor', 'Outdoor', 'Sports', 'Recreation', 'Meeting'],
    required: true
  },
  capacity: {
    type: Number,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  amenities: [{
    type: String
  }],
  images: [{
    type: String
  }],
  timings: {
    openTime: {
      type: String,
      required: true
    },
    closeTime: {
      type: String,
      required: true
    }
  },
  bookingRules: {
    maxDuration: {
      type: Number,
      default: 2
    },
    advanceBookingDays: {
      type: Number,
      default: 7
    },
    minBookingDuration: {
      type: Number,
      default: 1
    },
    slotInterval: {
      type: Number,
      default: 1
    }
  },
  pricing: {
    perHour: {
      type: Number,
      default: 0
    },
    perDay: {
      type: Number,
      default: 0
    },
    securityDeposit: {
      type: Number,
      default: 0
    }
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'maintenance'],
    default: 'active'
  },
  maintenanceSchedule: [{
    startDate: Date,
    endDate: Date,
    reason: String
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true });

const bookingSchema = new mongoose.Schema({
  amenityId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Amenity',
    required: true
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
  unit: {
    type: String,
    required: true
  },
  bookingDate: {
    type: Date,
    required: true
  },
  startTime: {
    type: String,
    required: true
  },
  endTime: {
    type: String,
    required: true
  },
  duration: {
    type: Number,
    required: true
  },
  purpose: {
    type: String,
    required: true
  },
  numberOfGuests: {
    type: Number,
    default: 1
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'cancelled', 'completed'],
    default: 'pending'
  },
  totalAmount: {
    type: Number,
    default: 0
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'refunded'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'online', 'upi', 'card']
  },
  transactionId: String,
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  rejectionReason: String,
  notes: String,
  specialRequests: String
}, { timestamps: true });

bookingSchema.index({ amenityId: 1, bookingDate: 1, startTime: 1 });

export const Amenity = mongoose.model('Amenity', amenitySchema);
export const Booking = mongoose.model('Booking', bookingSchema);