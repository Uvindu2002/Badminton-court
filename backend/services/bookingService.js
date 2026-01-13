import Booking from '../models/Booking.js';
import CourtStatus from '../models/CourtStatus.js';
import CourtPricing from '../models/CourtPricing.js';
import { v4 as uuidv4 } from 'uuid';

// All available time slots
const TIME_SLOTS = [
    '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
    '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
    '18:00', '19:00', '20:00', '21:00', '22:00',
];

const COURTS = ['Court 1', 'Court 2'];

/**
 * Get current pricing from database
 * @returns {Promise<number>} Price per court per hour
 */
const getCurrentPrice = async () => {
    const today = new Date().toISOString().split('T')[0];
    
    const pricing = await CourtPricing.findOne({
        effectiveDate: { $lte: today }
    }).sort({ effectiveDate: -1, createdAt: -1 });

    if (!pricing) {
        return 1500; // Default price if none set
    }

    return pricing.pricePerCourtPerHour;
};

/**
 * Calculate price for booking using current database pricing
 * @param {number} courtCount - Number of courts (1 or 2)
 * @param {number} hours - Number of hours (default 1)
 * @returns {Promise<number>} Total price in LKR
 */
const calculatePrice = async (courtCount = 1, hours = 1) => {
    const pricePerCourtPerHour = await getCurrentPrice();
    return courtCount * hours * pricePerCourtPerHour;
};

/**
 * Check if a specific slot is available for a court
 */
const checkSlotAvailability = async (date, startTime, courtId) => {
    // Check for existing booking
    const existingBooking = await Booking.findOne({
        date,
        startTime,
        courtId,
    });

    // Check if slot is closed
    const closedStatus = await CourtStatus.findOne({
        date,
        startTime,
        courtId,
    });

    return !existingBooking && !closedStatus;
};

/**
 * Check if both courts are available for a specific slot
 */
const checkBothCourtsAvailability = async (date, startTime) => {
    // Check for existing bookings
    const existingBookings = await Booking.find({
        date,
        startTime,
        courtId: { $in: ['Court 1', 'Court 2'] },
    });

    // Check if any court is closed
    const closedStatuses = await CourtStatus.find({
        date,
        startTime,
        courtId: { $in: ['Court 1', 'Court 2'] },
    });

    return existingBookings.length === 0 && closedStatuses.length === 0;
};

/**
 * Create booking for both courts (used when "Both" is selected)
 */
const createBothCourtsBooking = async (bookingData) => {
    const { date, startTime, endTime, customerName, mobileNumber, status } = bookingData;

    // Generate a group ID to link related bookings
    const groupId = uuidv4();

    // Calculate duration in hours
    const duration = calculateDuration(startTime, endTime);
    
    // Calculate price per court per hour
    const pricePerHour = await calculatePrice(1, 1);

    // Get all time slots to book based on duration
    const timeSlots = getTimeSlotsForDuration(startTime, duration);
    
    const bookings = [];
    
    // Create bookings for each time slot
    for (const slot of timeSlots) {
        const slotBookings = await Promise.all([
            Booking.create({
                date,
                startTime: slot.start,
                endTime: slot.end,
                courtId: 'Court 1',
                customerName,
                mobileNumber,
                status,
                price: pricePerHour,
                groupId,
            }),
            Booking.create({
                date,
                startTime: slot.start,
                endTime: slot.end,
                courtId: 'Court 2',
                customerName,
                mobileNumber,
                status,
                price: pricePerHour,
                groupId,
            }),
        ]);
        
        bookings.push(...slotBookings);
    }

    return bookings;
};

/**
 * Calculate duration in hours from start and end time
 */
const calculateDuration = (startTime, endTime) => {
    const startHour = parseInt(startTime.split(':')[0]);
    const endHour = parseInt(endTime.split(':')[0]);
    return endHour - startHour;
};

/**
 * Get all time slots needed for a booking duration
 */
const getTimeSlotsForDuration = (startTime, duration) => {
    const slots = [];
    const startHour = parseInt(startTime.split(':')[0]);
    
    for (let i = 0; i < duration; i++) {
        const hour = startHour + i;
        slots.push({
            start: `${hour.toString().padStart(2, '0')}:00`,
            end: `${(hour + 1).toString().padStart(2, '0')}:00`
        });
    }
    
    return slots;
};

/**
 * Get all slots for a specific date with their booking status
 */
const getDaySlots = async (date) => {
    // Fetch all bookings for the date
    const bookings = await Booking.find({ date }).lean();
    
    // Fetch all closed slots for the date
    const closedSlots = await CourtStatus.find({ date }).lean();

    // Create a map for quick lookup
    const bookingMap = new Map();
    bookings.forEach((booking) => {
        const key = `${booking.startTime}-${booking.courtId}`;
        bookingMap.set(key, booking);
    });
    
    // Create a map for closed slots
    const closedMap = new Map();
    closedSlots.forEach((status) => {
        const key = `${status.startTime}-${status.courtId}`;
        closedMap.set(key, status);
    });

    // Generate all slots with their status
    const slots = [];
    for (const time of TIME_SLOTS) {
        for (const court of COURTS) {
            const key = `${time}-${court}`;
            const booking = bookingMap.get(key);
            const closedStatus = closedMap.get(key);

            slots.push({
                date,
                startTime: time,
                endTime: getEndTime(time),
                courtId: court,
                isAvailable: !booking && !closedStatus,
                isClosed: !!closedStatus,
                booking: booking || null,
                closedReason: closedStatus ? closedStatus.reason : null,
            });
        }
    }

    return slots;
};

/**
 * Get the end time for a slot (1 hour after start)
 */
const getEndTime = (startTime) => {
    const hour = parseInt(startTime.split(':')[0], 10);
    const endHour = hour + 1;
    return `${endHour.toString().padStart(2, '0')}:00`;
};

/**
 * Delete bookings by group ID (for "Both" court bookings)
 */
const deleteBookingsByGroupId = async (groupId) => {
    const result = await Booking.deleteMany({ groupId });
    return result.deletedCount;
};

export {
    TIME_SLOTS,
    COURTS,
    getCurrentPrice,
    calculatePrice,
    calculateDuration,
    getTimeSlotsForDuration,
    checkSlotAvailability,
    checkBothCourtsAvailability,
    createBothCourtsBooking,
    getDaySlots,
    getEndTime,
    deleteBookingsByGroupId,
};
