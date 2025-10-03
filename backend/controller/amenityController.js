import { Amenity, Booking } from '../models/Amenity.js';
import { User } from "../models/user.model.js";
import mongoose from 'mongoose';

// Amenity Controllers
export const createAmenity = async (req, res) => {
  try {
    const amenity = new Amenity({
      ...req.body,
      createdBy: req.user._id
    });
    await amenity.save();
    res.status(201).json({ message: 'Amenity created successfully', amenity });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const getAllAmenities = async (req, res) => {
  try {
    const { status, category } = req.query;
    const filter = {};
    
    if (status) filter.status = status;
    if (category) filter.category = category;
    
    const amenities = await Amenity.find(filter)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });
    
    res.json({ amenities });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAmenityById = async (req, res) => {
  try {
    const amenity = await Amenity.findById(req.params.id)
      .populate('createdBy', 'name email');
    
    if (!amenity) {
      return res.status(404).json({ message: 'Amenity not found' });
    }
    
    res.json({ amenity });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateAmenity = async (req, res) => {
  try {
    const amenity = await Amenity.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!amenity) {
      return res.status(404).json({ message: 'Amenity not found' });
    }
    
    res.json({ message: 'Amenity updated successfully', amenity });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteAmenity = async (req, res) => {
  try {
    const amenity = await Amenity.findByIdAndDelete(req.params.id);
    
    if (!amenity) {
      return res.status(404).json({ message: 'Amenity not found' });
    }
    
    await Booking.deleteMany({ amenityId: req.params.id });
    
    res.json({ message: 'Amenity deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAmenityStats = async (req, res) => {
  try {
    const totalAmenities = await Amenity.countDocuments();
    const activeAmenities = await Amenity.countDocuments({ status: 'active' });
    const totalBookings = await Booking.countDocuments();
    const pendingBookings = await Booking.countDocuments({ status: 'pending' });
    const approvedBookings = await Booking.countDocuments({ status: 'approved' });
    
    const totalRevenue = await Booking.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);
    
    const categoryBreakdown = await Amenity.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);
    
    res.json({
      stats: {
        totalAmenities,
        activeAmenities,
        totalBookings,
        pendingBookings,
        approvedBookings,
        totalRevenue: totalRevenue[0]?.total || 0,
        categoryBreakdown
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Booking Controllers
export const createBooking = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { amenityId, bookingDate, startTime, endTime } = req.body;
    
    const amenity = await Amenity.findById(amenityId);
    if (!amenity) {
      return res.status(404).json({ message: 'Amenity not found' });
    }
    
    if (amenity.status !== 'active') {
      return res.status(400).json({ message: 'Amenity is not available for booking' });
    }
    
    const existingBooking = await Booking.findOne({
      amenityId,
      bookingDate: new Date(bookingDate),
      status: { $in: ['pending', 'approved'] },
      $or: [
        { startTime: { $lt: endTime }, endTime: { $gt: startTime } }
      ]
    });
    
    if (existingBooking) {
      return res.status(400).json({ message: 'Time slot already booked' });
    }
    
    const startHour = parseInt(startTime.split(':')[0]);
    const endHour = parseInt(endTime.split(':')[0]);
    const duration = endHour - startHour;
    
    const totalAmount = duration * amenity.pricing.perHour + amenity.pricing.securityDeposit;
    
    // Fetch user info
    const user = await User.findById(req.user._id).select('name unit');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const booking = new Booking({
      ...req.body,
      userId: req.user._id,
      residentName: user.name,
      unit: user.unit || 'N/A', // Assume unit field exists in User; adjust if needed
      duration,
      totalAmount
    });
    
    await booking.save();
    
    const populatedBooking = await Booking.findById(booking._id)
      .populate('amenityId', 'name category location')
      .populate('userId', 'name email');
    
    res.status(201).json({ message: 'Booking created successfully', booking: populatedBooking });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const getAllBookings = async (req, res) => {
  try {
    const { status, amenityId, userId, startDate, endDate } = req.query;
    const filter = {};
    
    if (status) filter.status = status;
    if (amenityId) {
      if (mongoose.Types.ObjectId.isValid(amenityId)) {
        filter.amenityId = new mongoose.Types.ObjectId(amenityId);
      } else {
        return res.status(400).json({ message: 'Invalid amenity ID' });
      }
    }
    if (userId) {
      if (mongoose.Types.ObjectId.isValid(userId)) {
        filter.userId = new mongoose.Types.ObjectId(userId);
      } else {
        return res.status(400).json({ message: 'Invalid user ID' });
      }
    }
    if (startDate && endDate) {
      filter.bookingDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    const bookings = await Booking.find(filter)
      .populate('amenityId', 'name category location')
      .populate('userId', 'name email')
      .populate('approvedBy', 'name')
      .sort({ bookingDate: -1, startTime: -1 });
    
    res.json({ bookings });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('amenityId')
      .populate('userId', 'name email')
      .populate('approvedBy', 'name');
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    res.json({ booking });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateBookingStatus = async (req, res) => {
  try {
    const { status, rejectionReason } = req.body;
    
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    if (booking.status === 'cancelled' || booking.status === 'completed') {
      return res.status(400).json({ message: 'Cannot update completed or cancelled booking' });
    }
    
    booking.status = status;
    
    if (status === 'approved') {
      booking.approvedBy = req.user._id;
    }
    
    if (status === 'rejected' && rejectionReason) {
      booking.rejectionReason = rejectionReason;
    }
    
    await booking.save();
    
    const updatedBooking = await Booking.findById(booking._id)
      .populate('amenityId', 'name category location')
      .populate('userId', 'name email')
      .populate('approvedBy', 'name');
    
    res.json({ message: `Booking ${status} successfully`, booking: updatedBooking });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    if (booking.status === 'completed') {
      return res.status(400).json({ message: 'Cannot cancel completed booking' });
    }
    
    booking.status = 'cancelled';
    await booking.save();
    
    res.json({ message: 'Booking cancelled successfully', booking });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const markPaymentPaid = async (req, res) => {
  try {
    const { paymentMethod, transactionId } = req.body;
    
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    booking.paymentStatus = 'paid';
    booking.paymentMethod = paymentMethod;
    if (transactionId) booking.transactionId = transactionId;
    
    await booking.save();
    
    res.json({ message: 'Payment marked as paid', booking });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAvailableSlots = async (req, res) => {
  try {
    const { amenityId, date } = req.query;
    
    if (!amenityId || !date) {
      return res.status(400).json({ message: 'Amenity ID and date are required' });
    }
    
    // Cast amenityId to ObjectId (fixes query mismatch)
    if (!mongoose.Types.ObjectId.isValid(amenityId)) {
      return res.status(400).json({ message: 'Invalid amenity ID' });
    }
    const castAmenityId = new mongoose.Types.ObjectId(amenityId);
    
    const amenity = await Amenity.findById(castAmenityId);
    if (!amenity) {
      return res.status(404).json({ message: 'Amenity not found' });
    }
    
    // Full-day range for bookingDate to handle timezones (e.g., 00:00 to 23:59)
    const startOfDay = new Date(date + 'T00:00:00.000Z');
    const endOfDay = new Date(date + 'T23:59:59.999Z');
    
    const bookings = await Booking.find({
      amenityId: castAmenityId,
      bookingDate: { $gte: startOfDay, $lt: endOfDay },
      status: { $in: ['pending', 'approved'] }
    }).select('startTime endTime');
    
    const openHour = parseInt(amenity.timings.openTime.split(':')[0]);
    const closeHour = parseInt(amenity.timings.closeTime.split(':')[0]);
    const slotInterval = amenity.bookingRules.slotInterval;
    
    const availableSlots = [];
    
    for (let hour = openHour; hour < closeHour; hour += slotInterval) {
      const slotStart = `${hour.toString().padStart(2, '0')}:00`;
      const slotEnd = `${(hour + slotInterval).toString().padStart(2, '0')}:00`;
      
      const isBooked = bookings.some(booking => {
        return booking.startTime < slotEnd && booking.endTime > slotStart;
      });
      
      if (!isBooked) {
        availableSlots.push({ startTime: slotStart, endTime: slotEnd });
      }
    }
    
    res.json({ availableSlots });
  } catch (error) {
    console.error('Available Slots Error:', error);  // Log for debugging
    res.status(500).json({ message: error.message });
  }
};