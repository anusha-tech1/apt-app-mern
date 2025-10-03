import express from 'express';
import {
  createAmenity,
  getAllAmenities,
  getAmenityById,
  updateAmenity,
  deleteAmenity,
  getAmenityStats,
  createBooking,
  getAllBookings,
  getBookingById,
  updateBookingStatus,
  cancelBooking,
  markPaymentPaid,
  getAvailableSlots
} from '../controller/amenityController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Amenity routes
router.post('/amenities', protect, authorize('admin', 'committee_member'), createAmenity);
router.get('/amenities', protect, getAllAmenities);
router.get('/amenities/stats', protect, authorize('admin', 'committee_member'), getAmenityStats);
router.get('/amenities/:id', protect, getAmenityById);
router.patch('/amenities/:id', protect, authorize('admin', 'committee_member'), updateAmenity);
router.delete('/amenities/:id', protect, authorize('admin'), deleteAmenity);

// Booking routes
router.post('/bookings', protect, createBooking);
router.get('/bookings', protect, getAllBookings);
router.get('/bookings/available-slots', protect, getAvailableSlots);
router.get('/bookings/:id', protect, getBookingById);
router.patch('/bookings/:id/status', protect, authorize('admin', 'committee_member'), updateBookingStatus);
router.patch('/bookings/:id/cancel', protect, cancelBooking);
router.patch('/bookings/:id/payment', protect, authorize('admin', 'committee_member'), markPaymentPaid);

export default router;