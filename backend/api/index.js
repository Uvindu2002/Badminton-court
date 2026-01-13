const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const app = express();

// ============================================
// DATABASE CONNECTION
// ============================================
let isConnected = false;

const connectDB = async () => {
    if (isConnected) {
        return;
    }

    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        isConnected = true;
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error('MongoDB connection error:', error.message);
    }
};

// Connect to DB on cold start
connectDB();

// ============================================
// MIDDLEWARE
// ============================================

// CORS Configuration
app.use(cors({
    origin: process.env.FRONTEND_URL || '*',
    credentials: true,
}));

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============================================
// MODELS
// ============================================

// Booking Schema
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
            enum: ['06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00'],
        },
        endTime: {
            type: String,
            required: [true, 'End time is required'],
        },
        courtId: {
            type: String,
            required: [true, 'Court ID is required'],
            enum: ['Court 1', 'Court 2'],
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
            match: [/^[0-9]{10}$/, 'Mobile number must be 10 digits'],
        },
        status: {
            type: String,
            enum: ['Booked', 'Cancelled', 'Completed', 'No-Show'],
            default: 'Booked',
        },
        price: {
            type: Number,
            required: true,
            default: 1500,
        },
        groupId: {
            type: String,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

bookingSchema.index({ date: 1, startTime: 1, courtId: 1 }, { unique: true });
bookingSchema.index({ date: 1 });

const Booking = mongoose.models.Booking || mongoose.model('Booking', bookingSchema);

// Court Status Schema
const courtStatusSchema = new mongoose.Schema(
    {
        date: {
            type: String,
            required: true,
            match: [/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'],
        },
        startTime: {
            type: String,
            required: true,
        },
        courtId: {
            type: String,
            required: true,
            enum: ['Court 1', 'Court 2', 'Both'],
        },
        status: {
            type: String,
            enum: ['Closed', 'Maintenance'],
            default: 'Closed',
        },
        reason: {
            type: String,
            default: '',
        },
    },
    {
        timestamps: true,
    }
);

courtStatusSchema.index({ date: 1, startTime: 1, courtId: 1 }, { unique: true });

const CourtStatus = mongoose.models.CourtStatus || mongoose.model('CourtStatus', courtStatusSchema);

// Pricing Schema
const pricingSchema = new mongoose.Schema(
    {
        pricePerCourtPerHour: {
            type: Number,
            required: true,
            default: 1500,
        },
        effectiveDate: {
            type: String,
            required: true,
        },
        reason: {
            type: String,
            default: '',
        },
    },
    {
        timestamps: true,
    }
);

const Pricing = mongoose.models.Pricing || mongoose.model('Pricing', pricingSchema);

// ============================================
// AUTH MIDDLEWARE
// ============================================

const protectRoute = (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.admin = decoded;
            next();
        } catch (error) {
            res.status(401).json({ success: false, message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        res.status(401).json({ success: false, message: 'Not authorized, no token' });
    }
};

// ============================================
// HELPER FUNCTIONS
// ============================================

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

const timeSlots = ['06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00'];
const courts = ['Court 1', 'Court 2'];

// ============================================
// ROUTES
// ============================================

// Root route
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Badminton Court Booking API',
        version: '1.0.0',
        endpoints: {
            health: '/api/health',
            admin: '/api/admin/login',
            bookings: '/api/bookings',
            courtStatus: '/api/court-status',
            pricing: '/api/pricing',
        },
    });
});

// Health Check
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'Badminton Court Booking API is running on Vercel',
        timestamp: new Date().toISOString(),
    });
});

// ---- ADMIN ROUTES ----

// Login
app.post('/api/admin/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ success: false, message: 'Please provide username and password' });
    }

    if (username === process.env.ADMIN_USER && password === process.env.ADMIN_PASS) {
        res.json({
            success: true,
            message: 'Login successful',
            token: generateToken(username),
            admin: { username },
        });
    } else {
        res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
});

// Verify Token
app.get('/api/admin/verify', protectRoute, (req, res) => {
    res.json({ success: true, message: 'Token is valid', admin: req.admin });
});

// ---- BOOKING ROUTES ----

// Get bookings by date
app.get('/api/bookings', async (req, res) => {
    try {
        await connectDB();
        const { date } = req.query;

        if (!date) {
            return res.status(400).json({ success: false, message: 'Date is required' });
        }

        const bookings = await Booking.find({ date }).sort({ startTime: 1 });
        const closedSlots = await CourtStatus.find({ date });

        // Get current pricing
        const pricing = await Pricing.findOne().sort({ createdAt: -1 });
        const currentPrice = pricing ? pricing.pricePerCourtPerHour : 1500;

        // Generate all slots with availability status
        const slots = [];
        for (const time of timeSlots) {
            for (const court of courts) {
                const booking = bookings.find(b => b.startTime === time && b.courtId === court);
                const closed = closedSlots.find(c => c.startTime === time && (c.courtId === court || c.courtId === 'Both'));

                slots.push({
                    date,
                    startTime: time,
                    endTime: `${parseInt(time.split(':')[0]) + 1}:00`.padStart(5, '0'),
                    courtId: court,
                    isAvailable: !booking && !closed,
                    isClosed: !!closed,
                    booking: booking || null,
                    price: currentPrice,
                });
            }
        }

        res.json({ success: true, data: slots });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Create booking
app.post('/api/bookings', protectRoute, async (req, res) => {
    try {
        await connectDB();
        const { date, startTime, endTime, courtId, customerName, mobileNumber } = req.body;

        // Get current pricing
        const pricing = await Pricing.findOne().sort({ createdAt: -1 });
        const pricePerHour = pricing ? pricing.pricePerCourtPerHour : 1500;

        // Calculate duration
        const startHour = parseInt(startTime.split(':')[0]);
        const endHour = parseInt(endTime.split(':')[0]);
        const duration = endHour - startHour;

        const groupId = courtId === 'Both' || duration > 1 ? uuidv4() : null;

        const bookingsToCreate = [];
        const courtsToBook = courtId === 'Both' ? ['Court 1', 'Court 2'] : [courtId];

        for (const court of courtsToBook) {
            for (let i = 0; i < duration; i++) {
                const hour = startHour + i;
                const slotStartTime = `${hour.toString().padStart(2, '0')}:00`;
                const slotEndTime = `${(hour + 1).toString().padStart(2, '0')}:00`;

                bookingsToCreate.push({
                    date,
                    startTime: slotStartTime,
                    endTime: slotEndTime,
                    courtId: court,
                    customerName,
                    mobileNumber,
                    price: pricePerHour,
                    groupId,
                    status: 'Booked',
                });
            }
        }

        const createdBookings = await Booking.insertMany(bookingsToCreate);

        res.status(201).json({
            success: true,
            message: 'Booking created successfully',
            data: createdBookings,
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: 'One or more slots are already booked' });
        }
        res.status(500).json({ success: false, message: error.message });
    }
});

// Update booking
app.put('/api/bookings/:id', protectRoute, async (req, res) => {
    try {
        await connectDB();
        const booking = await Booking.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });

        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }

        // If booking has groupId, update all related bookings
        if (booking.groupId && req.body.status) {
            await Booking.updateMany({ groupId: booking.groupId }, { status: req.body.status });
        }

        res.json({ success: true, data: booking });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Delete booking
app.delete('/api/bookings/:id', protectRoute, async (req, res) => {
    try {
        await connectDB();
        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }

        // If booking has groupId, delete all related bookings
        if (booking.groupId) {
            await Booking.deleteMany({ groupId: booking.groupId });
        } else {
            await Booking.findByIdAndDelete(req.params.id);
        }

        res.json({ success: true, message: 'Booking deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ---- COURT STATUS ROUTES ----

// Get closed slots by date
app.get('/api/court-status', async (req, res) => {
    try {
        await connectDB();
        const { date } = req.query;

        if (!date) {
            return res.status(400).json({ success: false, message: 'Date is required' });
        }

        const closedSlots = await CourtStatus.find({ date });
        res.json({ success: true, data: closedSlots });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Close slots
app.post('/api/court-status/close', protectRoute, async (req, res) => {
    try {
        await connectDB();
        const { date, startTime, courtId, reason, closeFullDay } = req.body;

        const slotsToClose = [];
        const courtsToClose = courtId === 'Both' ? ['Court 1', 'Court 2'] : [courtId];
        const timesToClose = closeFullDay ? timeSlots : [startTime];

        for (const court of courtsToClose) {
            for (const time of timesToClose) {
                slotsToClose.push({
                    date,
                    startTime: time,
                    courtId: court,
                    status: 'Closed',
                    reason: reason || '',
                });
            }
        }

        // Use upsert to avoid duplicates
        for (const slot of slotsToClose) {
            await CourtStatus.findOneAndUpdate(
                { date: slot.date, startTime: slot.startTime, courtId: slot.courtId },
                slot,
                { upsert: true, new: true }
            );
        }

        res.json({ success: true, message: 'Slots closed successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Reopen slots
app.post('/api/court-status/reopen', protectRoute, async (req, res) => {
    try {
        await connectDB();
        const { date, startTime, courtId, reopenFullDay } = req.body;

        const query = { date };

        if (!reopenFullDay && startTime) {
            query.startTime = startTime;
        }

        if (courtId && courtId !== 'Both') {
            query.courtId = courtId;
        }

        await CourtStatus.deleteMany(query);

        res.json({ success: true, message: 'Slots reopened successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ---- PRICING ROUTES ----

// Get current pricing
app.get('/api/pricing', async (req, res) => {
    try {
        await connectDB();
        const pricing = await Pricing.findOne().sort({ createdAt: -1 });

        if (!pricing) {
            return res.json({
                success: true,
                data: { pricePerCourtPerHour: 1500, effectiveDate: new Date().toISOString().split('T')[0] },
            });
        }

        res.json({ success: true, data: pricing });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get pricing history
app.get('/api/pricing/history', protectRoute, async (req, res) => {
    try {
        await connectDB();
        const history = await Pricing.find().sort({ createdAt: -1 }).limit(10);
        res.json({ success: true, data: history });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Update pricing
app.post('/api/pricing', protectRoute, async (req, res) => {
    try {
        await connectDB();
        const { pricePerCourtPerHour, effectiveDate, reason } = req.body;

        const newPricing = await Pricing.create({
            pricePerCourtPerHour,
            effectiveDate,
            reason: reason || '',
        });

        res.status(201).json({ success: true, data: newPricing });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Delete pricing record
app.delete('/api/pricing/:id', protectRoute, async (req, res) => {
    try {
        await connectDB();
        await Pricing.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Pricing record deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ============================================
// ERROR HANDLING
// ============================================

// 404 handler
app.use((req, res) => {
    res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ success: false, message: err.message || 'Server Error' });
});

// Export for Vercel
module.exports = app;
