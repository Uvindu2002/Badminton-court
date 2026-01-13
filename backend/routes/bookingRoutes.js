import express from 'express';
import {
    getBookingsByDate,
    createBooking,
    deleteBooking,
    getBookingById,
    updateBooking,
    bulkDeleteBookings,
} from '../controllers/bookingController.js';
import { protectRoute } from '../middleware/authMiddleware.js';

const router = express.Router();

// PUBLIC ROUTE - Allow viewing availability without authentication
// @route   GET /api/bookings?date=YYYY-MM-DD
router.get('/', getBookingsByDate);

// PROTECTED ROUTES - Require admin authentication
// @route   POST /api/bookings
router.post('/', protectRoute, createBooking);

// @route   POST /api/bookings/bulk-delete
router.post('/bulk-delete', protectRoute, bulkDeleteBookings);

// @route   GET /api/bookings/:id
router.get('/:id', protectRoute, getBookingById);

// @route   PUT /api/bookings/:id
router.put('/:id', protectRoute, updateBooking);

// @route   DELETE /api/bookings/:id
router.delete('/:id', protectRoute, deleteBooking);

export default router;
