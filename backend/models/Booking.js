import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema(
    {
        date: {
            type: String,
            required: [true, 'Date is required'],
            match: [/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'],
        },
        startTime: {
            type: String,
            required: [true, 'Start time is required'],
            enum: {
                values: [
                    '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
                    '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
                    '18:00', '19:00', '20:00', '21:00', '22:00',
                ],
                message: 'Invalid time slot. Operating hours are 6:00 AM to 11:00 PM.',
            },
        },
        courtId: {
            type: String,
            required: [true, 'Court ID is required'],
            enum: {
                values: ['Court 1', 'Court 2'],
                message: 'Court must be either "Court 1" or "Court 2"',
            },
        },
        customerName: {
            type: String,
            required: [true, 'Customer name is required'],
            trim: true,
            maxlength: [100, 'Customer name cannot exceed 100 characters'],
        },
        mobileNumber: {
            type: String,
            required: [true, 'Mobile number is required'],
            trim: true,
            match: [/^[0-9]{10}$/, 'Mobile number must be 10 digits'],
        },
        status: {
            type: String,
            enum: {
                values: ['Pending', 'Booked', 'Completed', 'Cancelled', 'Closed', 'Maintenance'],
                message: 'Status must be "Pending", "Booked", "Completed", "Cancelled", "Closed", or "Maintenance"',
            },
            default: 'Pending',
        },
        // Price in LKR (calculated based on court count and hours)
        price: {
            type: Number,
            required: [true, 'Price is required'],
            min: [0, 'Price cannot be negative'],
        },
        // Reference ID for "Both Courts" bookings (links related entries)
        groupId: {
            type: String,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

// Compound index to prevent double bookings
bookingSchema.index({ date: 1, startTime: 1, courtId: 1 }, { unique: true });

// Index for efficient date queries
bookingSchema.index({ date: 1 });

const Booking = mongoose.model('Booking', bookingSchema);

export default Booking;
