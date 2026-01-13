import Booking from '../models/Booking.js';
import { v4 as uuidv4 } from 'uuid';
import {
    calculatePrice,
    calculateDuration,
    getTimeSlotsForDuration,
    checkSlotAvailability,
    checkBothCourtsAvailability,
    createBothCourtsBooking,
    getDaySlots,
    deleteBookingsByGroupId,
} from '../services/bookingService.js';

/**
 * @desc    Get all bookings/slots for a specific date
 * @route   GET /api/bookings?date=YYYY-MM-DD
 * @access  Private
 */
const getBookingsByDate = async (req, res) => {
    const { date } = req.query;

    if (!date) {
        res.status(400);
        throw new Error('Date parameter is required (format: YYYY-MM-DD)');
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
        res.status(400);
        throw new Error('Invalid date format. Use YYYY-MM-DD');
    }

    const slots = await getDaySlots(date);

    res.json({
        success: true,
        count: slots.length,
        data: slots,
    });
};

/**
 * @desc    Create a new booking
 * @route   POST /api/bookings
 * @access  Private
 */
const createBooking = async (req, res) => {
    const { date, startTime, endTime, courtId, customerName, mobileNumber, status = 'Booked' } = req.body;

    // Validate required fields
    if (!date || !startTime || !endTime || !courtId || !customerName || !mobileNumber) {
        res.status(400);
        throw new Error('Please provide all required fields: date, startTime, endTime, courtId, customerName, mobileNumber');
    }

    // Calculate duration
    const duration = calculateDuration(startTime, endTime);
    const timeSlots = getTimeSlotsForDuration(startTime, duration);

    // Handle "Both" courts selection
    if (courtId === 'Both') {
        // Check if both courts are available for all time slots
        for (const slot of timeSlots) {
            const bothAvailable = await checkBothCourtsAvailability(date, slot.start);
            
            if (!bothAvailable) {
                res.status(400);
                throw new Error(`One or both courts are already booked at ${slot.start}`);
            }
        }

        const bookings = await createBothCourtsBooking({
            date,
            startTime,
            endTime,
            customerName,
            mobileNumber,
            status,
        });

        // Calculate total price for both courts and duration
        const totalPrice = await calculatePrice(2, duration);

        res.status(201).json({
            success: true,
            message: 'Both courts booked successfully',
            totalPrice,
            data: bookings,
        });
    } else {
        // Single court booking - check all slots are available
        for (const slot of timeSlots) {
            const isAvailable = await checkSlotAvailability(date, slot.start, courtId);
            
            if (!isAvailable) {
                res.status(400);
                throw new Error(`${courtId} is already booked at ${slot.start}`);
            }
        }

        // Generate a group ID for multi-slot bookings
        const groupId = duration > 1 ? uuidv4() : null;
        
        // Calculate total price
        const totalPrice = await calculatePrice(1, duration);
        const pricePerHour = await calculatePrice(1, 1);
        
        const bookings = [];
        
        // Create booking for each time slot
        for (const slot of timeSlots) {
            const booking = await Booking.create({
                date,
                startTime: slot.start,
                endTime: slot.end,
                courtId,
                customerName,
                mobileNumber,
                status,
                price: pricePerHour, // Price per hour
                groupId,
            });
            
            bookings.push(booking);
        }

        res.status(201).json({
            success: true,
            message: 'Booking created successfully',
            totalPrice,
            data: duration > 1 ? bookings : bookings[0],
        });
    }
};

/**
 * @desc    Delete a booking by ID
 * @route   DELETE /api/bookings/:id
 * @access  Private
 */
const deleteBooking = async (req, res) => {
    const { id } = req.params;

    const booking = await Booking.findById(id);

    if (!booking) {
        res.status(404);
        throw new Error('Booking not found');
    }

    // If this booking is part of a group (Both courts), delete all related bookings
    if (booking.groupId) {
        const deletedCount = await deleteBookingsByGroupId(booking.groupId);
        res.json({
            success: true,
            message: `Deleted ${deletedCount} related bookings`,
        });
    } else {
        await Booking.findByIdAndDelete(id);
        res.json({
            success: true,
            message: 'Booking deleted successfully',
        });
    }
};

/**
 * @desc    Get a single booking by ID
 * @route   GET /api/bookings/:id
 * @access  Private
 */
const getBookingById = async (req, res) => {
    const { id } = req.params;

    const booking = await Booking.findById(id);

    if (!booking) {
        res.status(404);
        throw new Error('Booking not found');
    }

    res.json({
        success: true,
        data: booking,
    });
};

/**
 * @desc    Update a booking
 * @route   PUT /api/bookings/:id
 * @access  Private
 */
const updateBooking = async (req, res) => {
    const { id } = req.params;
    const { customerName, mobileNumber, status } = req.body;

    const booking = await Booking.findById(id);

    if (!booking) {
        res.status(404);
        throw new Error('Booking not found');
    }

    // Only allow updating certain fields
    if (customerName) booking.customerName = customerName;
    if (mobileNumber) booking.mobileNumber = mobileNumber;
    if (status) booking.status = status;

    const updatedBooking = await booking.save();

    res.json({
        success: true,
        message: 'Booking updated successfully',
        data: updatedBooking,
    });
};

/**
 * @desc    Bulk delete bookings
 * @route   POST /api/bookings/bulk-delete
 * @access  Private
 */
const bulkDeleteBookings = async (req, res) => {
    const { bookingIds } = req.body;

    if (!bookingIds || !Array.isArray(bookingIds) || bookingIds.length === 0) {
        res.status(400);
        throw new Error('Please provide an array of booking IDs to delete');
    }

    const result = await Booking.deleteMany({ _id: { $in: bookingIds } });

    res.json({
        success: true,
        message: `${result.deletedCount} booking(s) deleted successfully`,
        deletedCount: result.deletedCount,
    });
};

export {
    getBookingsByDate,
    createBooking,
    deleteBooking,
    getBookingById,
    updateBooking,
    bulkDeleteBookings,
};
