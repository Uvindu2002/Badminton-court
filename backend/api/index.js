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
    if (isConnected) return;
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        isConnected = true;
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error('MongoDB connection error:', error.message);
    }
};

connectDB();

// ============================================
// MIDDLEWARE
// ============================================
app.use(cors({
    origin: process.env.FRONTEND_URL || '*',
    credentials: true,
}));

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
            enum: {
                values: ['06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00'],
                message: 'Invalid time slot. Operating hours are 6:00 AM to 11:00 PM.',
            },
        },
        endTime: {
            type: String,
        },
        courtId: {
            type: String,
            required: [true, 'Court ID is required'],
            enum: { values: ['Court 1', 'Court 2'], message: 'Court must be either "Court 1" or "Court 2"' },
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
                message: 'Invalid status',
            },
            default: 'Booked',
        },
        price: {
            type: Number,
            required: [true, 'Price is required'],
            min: [0, 'Price cannot be negative'],
        },
        groupId: {
            type: String,
            default: null,
        },
    },
    { timestamps: true }
);

bookingSchema.index({ date: 1, startTime: 1, courtId: 1 }, { unique: true });
bookingSchema.index({ date: 1 });

const Booking = mongoose.models.Booking || mongoose.model('Booking', bookingSchema);

// CourtStatus Schema
const courtStatusSchema = new mongoose.Schema(
    {
        date: {
            type: String,
            required: [true, 'Date is required'],
            match: [/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'],
        },
        startTime: {
            type: String,
            required: [true, 'Start time is required'],
        },
        courtId: {
            type: String,
            required: [true, 'Court ID is required'],
            enum: { values: ['Court 1', 'Court 2'], message: 'Court must be either "Court 1" or "Court 2"' },
        },
        status: {
            type: String,
            enum: ['Closed', 'Maintenance'],
            default: 'Closed',
        },
        reason: {
            type: String,
            maxlength: 200,
            default: 'Court closed by admin',
        },
        closedBy: {
            type: String,
            default: 'admin',
        },
    },
    { timestamps: true }
);

courtStatusSchema.index({ date: 1, startTime: 1, courtId: 1 }, { unique: true });

const CourtStatus = mongoose.models.CourtStatus || mongoose.model('CourtStatus', courtStatusSchema);

// CourtPricing Schema
const courtPricingSchema = new mongoose.Schema(
    {
        pricePerCourtPerHour: {
            type: Number,
            required: [true, 'Price per court per hour is required'],
            min: [0, 'Price cannot be negative'],
        },
        effectiveDate: {
            type: String,
            required: [true, 'Effective date is required'],
            match: [/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'],
        },
        changedBy: {
            type: String,
            default: 'admin',
        },
        reason: {
            type: String,
            maxlength: 500,
        },
    },
    { timestamps: true }
);

courtPricingSchema.index({ effectiveDate: -1 });

const CourtPricing = mongoose.models.CourtPricing || mongoose.model('CourtPricing', courtPricingSchema);

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
            return next();
        } catch (error) {
            return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
        }
    }
    if (!token) {
        return res.status(401).json({ success: false, message: 'Not authorized, no token' });
    }
};

// ============================================
// HELPER FUNCTIONS
// ============================================
const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });

const TIME_SLOTS = [
    '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
    '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
    '18:00', '19:00', '20:00', '21:00', '22:00',
];
const COURTS = ['Court 1', 'Court 2'];

const getEndTime = (startTime) => {
    const hour = parseInt(startTime.split(':')[0], 10);
    return `${(hour + 1).toString().padStart(2, '0')}:00`;
};

const getCurrentPrice = async () => {
    const today = new Date().toISOString().split('T')[0];
    const pricing = await CourtPricing.findOne({ effectiveDate: { $lte: today } })
        .sort({ effectiveDate: -1, createdAt: -1 });
    return pricing ? pricing.pricePerCourtPerHour : 1500;
};

const calculateDuration = (startTime, endTime) => {
    return parseInt(endTime.split(':')[0]) - parseInt(startTime.split(':')[0]);
};

const getTimeSlotsForDuration = (startTime, duration) => {
    const slots = [];
    const startHour = parseInt(startTime.split(':')[0]);
    for (let i = 0; i < duration; i++) {
        const hour = startHour + i;
        slots.push({
            start: `${hour.toString().padStart(2, '0')}:00`,
            end: `${(hour + 1).toString().padStart(2, '0')}:00`,
        });
    }
    return slots;
};

// ============================================
// ROUTES
// ============================================

// Root
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
            pricing: '/api/pricing/current',
        },
    });
});

// Health Check
app.get('/api/health', (req, res) => {
    res.json({ success: true, message: 'Badminton Court Booking API is running', timestamp: new Date().toISOString() });
});

// ---- ADMIN ROUTES ----

app.post('/api/admin/login', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ success: false, message: 'Please provide username and password' });
    }
    if (username === process.env.ADMIN_USER && password === process.env.ADMIN_PASS) {
        return res.json({
            success: true,
            message: 'Login successful',
            token: generateToken(username),
            admin: { username },
        });
    }
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
});

app.get('/api/admin/verify', protectRoute, (req, res) => {
    res.json({ success: true, message: 'Token is valid', admin: req.admin });
});

// ---- BOOKING ROUTES ----

// GET all slots for a date (public)
app.get('/api/bookings', async (req, res) => {
    try {
        await connectDB();
        const { date } = req.query;
        if (!date) return res.status(400).json({ success: false, message: 'Date is required' });

        const [bookings, closedSlots] = await Promise.all([
            Booking.find({ date }).sort({ startTime: 1 }).lean(),
            CourtStatus.find({ date }).lean(),
        ]);

        const bookingMap = new Map(bookings.map(b => [`${b.startTime}-${b.courtId}`, b]));
        const closedMap = new Map(closedSlots.map(s => [`${s.startTime}-${s.courtId}`, s]));

        const slots = [];
        for (const time of TIME_SLOTS) {
            for (const court of COURTS) {
                const key = `${time}-${court}`;
                const booking = bookingMap.get(key);
                const closed = closedMap.get(key);
                slots.push({
                    date,
                    startTime: time,
                    endTime: getEndTime(time),
                    courtId: court,
                    isAvailable: !booking && !closed,
                    isClosed: !!closed,
                    booking: booking || null,
                    closedReason: closed ? closed.reason : null,
                });
            }
        }

        res.json({ success: true, count: slots.length, data: slots });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// POST bulk delete bookings (must be before /:id)
app.post('/api/bookings/bulk-delete', protectRoute, async (req, res) => {
    try {
        await connectDB();
        const { bookingIds } = req.body;
        if (!bookingIds || !Array.isArray(bookingIds) || bookingIds.length === 0) {
            return res.status(400).json({ success: false, message: 'Please provide an array of booking IDs' });
        }
        const result = await Booking.deleteMany({ _id: { $in: bookingIds } });
        res.json({
            success: true,
            message: `${result.deletedCount} booking(s) deleted successfully`,
            deletedCount: result.deletedCount,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// POST create booking
app.post('/api/bookings', protectRoute, async (req, res) => {
    try {
        await connectDB();
        const { date, startTime, endTime, courtId, customerName, mobileNumber, status = 'Booked' } = req.body;

        if (!date || !startTime || !endTime || !courtId || !customerName || !mobileNumber) {
            return res.status(400).json({ success: false, message: 'Please provide all required fields: date, startTime, endTime, courtId, customerName, mobileNumber' });
        }

        const duration = calculateDuration(startTime, endTime);
        const timeSlots = getTimeSlotsForDuration(startTime, duration);
        const pricePerHour = await getCurrentPrice();
        const totalPrice = pricePerHour * duration * (courtId === 'Both' ? 2 : 1);
        const groupId = (courtId === 'Both' || duration > 1) ? uuidv4() : null;
        const courtsToBook = courtId === 'Both' ? COURTS : [courtId];

        // Check availability for all slots before creating
        for (const slot of timeSlots) {
            for (const court of courtsToBook) {
                const existingBooking = await Booking.findOne({ date, startTime: slot.start, courtId: court });
                const closedStatus = await CourtStatus.findOne({ date, startTime: slot.start, courtId: court });
                if (existingBooking || closedStatus) {
                    return res.status(400).json({ success: false, message: `${court} is not available at ${slot.start}` });
                }
            }
        }

        const bookings = [];
        for (const court of courtsToBook) {
            for (const slot of timeSlots) {
                const booking = await Booking.create({
                    date,
                    startTime: slot.start,
                    endTime: slot.end,
                    courtId: court,
                    customerName,
                    mobileNumber,
                    status,
                    price: pricePerHour,
                    groupId,
                });
                bookings.push(booking);
            }
        }

        res.status(201).json({
            success: true,
            message: courtId === 'Both' ? 'Both courts booked successfully' : 'Booking created successfully',
            totalPrice,
            data: duration > 1 || courtId === 'Both' ? bookings : bookings[0],
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: 'One or more slots are already booked' });
        }
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET single booking by ID
app.get('/api/bookings/:id', protectRoute, async (req, res) => {
    try {
        await connectDB();
        const booking = await Booking.findById(req.params.id);
        if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
        res.json({ success: true, data: booking });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// PUT update booking
app.put('/api/bookings/:id', protectRoute, async (req, res) => {
    try {
        await connectDB();
        const booking = await Booking.findById(req.params.id);
        if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

        const { customerName, mobileNumber, status } = req.body;
        if (customerName) booking.customerName = customerName;
        if (mobileNumber) booking.mobileNumber = mobileNumber;
        if (status) {
            booking.status = status;
            if (booking.groupId) {
                await Booking.updateMany({ groupId: booking.groupId }, { status });
            }
        }

        const updated = await booking.save();
        res.json({ success: true, message: 'Booking updated successfully', data: updated });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// DELETE booking
app.delete('/api/bookings/:id', protectRoute, async (req, res) => {
    try {
        await connectDB();
        const booking = await Booking.findById(req.params.id);
        if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

        if (booking.groupId) {
            const result = await Booking.deleteMany({ groupId: booking.groupId });
            return res.json({ success: true, message: `Deleted ${result.deletedCount} related bookings` });
        }

        await Booking.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Booking deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ---- COURT STATUS ROUTES ----

// GET court status by date (public)
app.get('/api/court-status', async (req, res) => {
    try {
        await connectDB();
        const { date } = req.query;
        if (!date) return res.status(400).json({ success: false, message: 'Date is required' });
        const statuses = await CourtStatus.find({ date }).sort({ startTime: 1 });
        res.json({ success: true, count: statuses.length, data: statuses });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET check if a slot is closed (must be before /:id)
app.get('/api/court-status/check', async (req, res) => {
    try {
        await connectDB();
        const { date, startTime, courtId } = req.query;
        if (!date || !startTime || !courtId) {
            return res.status(400).json({ success: false, message: 'Please provide date, startTime, and courtId' });
        }
        const status = await CourtStatus.findOne({ date, startTime, courtId });
        res.json({ success: true, isClosed: !!status, data: status });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// POST close a slot
app.post('/api/court-status/close', protectRoute, async (req, res) => {
    try {
        await connectDB();
        const { date, startTime, courtId, status = 'Closed', reason } = req.body;
        if (!date || !startTime || !courtId) {
            return res.status(400).json({ success: false, message: 'Please provide date, startTime, and courtId' });
        }

        const courts = courtId === 'Both' ? COURTS : [courtId];
        const results = [];

        for (const court of courts) {
            const existing = await CourtStatus.findOne({ date, startTime, courtId: court });
            if (existing) continue;
            const created = await CourtStatus.create({
                date, startTime, courtId: court, status,
                reason: reason || 'Court closed by admin',
            });
            results.push(created);
        }

        res.status(201).json({ success: true, message: 'Slot(s) closed successfully', data: results });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// POST close entire day
app.post('/api/court-status/close-day', protectRoute, async (req, res) => {
    try {
        await connectDB();
        const { date, courtId, status = 'Closed', reason } = req.body;
        if (!date || !courtId) {
            return res.status(400).json({ success: false, message: 'Please provide date and courtId' });
        }

        const courts = courtId === 'Both' ? COURTS : [courtId];
        const closures = [];

        for (const court of courts) {
            for (const time of TIME_SLOTS) {
                const existing = await CourtStatus.findOne({ date, startTime: time, courtId: court });
                if (!existing) {
                    const created = await CourtStatus.create({
                        date, startTime: time, courtId: court, status,
                        reason: reason || 'Court closed for the day',
                    });
                    closures.push(created);
                }
            }
        }

        res.status(201).json({
            success: true,
            message: `${courtId === 'Both' ? 'Both courts' : courtId} closed for entire day`,
            count: closures.length,
            data: closures,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// DELETE reopen slot by ID
app.delete('/api/court-status/:id', protectRoute, async (req, res) => {
    try {
        await connectDB();
        const courtStatus = await CourtStatus.findById(req.params.id);
        if (!courtStatus) return res.status(404).json({ success: false, message: 'Court status not found' });
        await courtStatus.deleteOne();
        res.json({ success: true, message: `${courtStatus.courtId} reopened successfully`, data: {} });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ---- PRICING ROUTES ----

// GET current pricing (public)
app.get('/api/pricing/current', async (req, res) => {
    try {
        await connectDB();
        const today = new Date().toISOString().split('T')[0];
        const pricing = await CourtPricing.findOne({ effectiveDate: { $lte: today } })
            .sort({ effectiveDate: -1, createdAt: -1 });

        if (!pricing) {
            return res.json({
                success: true,
                data: { pricePerCourtPerHour: 1500, effectiveDate: today, isDefault: true },
            });
        }

        res.json({ success: true, data: pricing });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET pricing history
app.get('/api/pricing/history', protectRoute, async (req, res) => {
    try {
        await connectDB();
        const limit = parseInt(req.query.limit) || 10;
        const history = await CourtPricing.find()
            .sort({ effectiveDate: -1, createdAt: -1 })
            .limit(limit);
        res.json({ success: true, count: history.length, data: history });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// POST create/update pricing
app.post('/api/pricing', protectRoute, async (req, res) => {
    try {
        await connectDB();
        const { pricePerCourtPerHour, effectiveDate, reason } = req.body;
        if (!pricePerCourtPerHour || !effectiveDate) {
            return res.status(400).json({ success: false, message: 'Price and effective date are required' });
        }

        const existing = await CourtPricing.findOne({ effectiveDate });
        if (existing) {
            existing.pricePerCourtPerHour = pricePerCourtPerHour;
            existing.reason = reason;
            existing.changedBy = 'admin';
            await existing.save();
            return res.json({ success: true, message: 'Pricing updated successfully', data: existing });
        }

        const pricing = await CourtPricing.create({
            pricePerCourtPerHour, effectiveDate,
            reason: reason || '', changedBy: 'admin',
        });
        res.status(201).json({ success: true, message: 'Pricing created successfully', data: pricing });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// DELETE pricing record
app.delete('/api/pricing/:id', protectRoute, async (req, res) => {
    try {
        await connectDB();
        const pricing = await CourtPricing.findById(req.params.id);
        if (!pricing) return res.status(404).json({ success: false, message: 'Pricing not found' });
        await pricing.deleteOne();
        res.json({ success: true, message: 'Pricing deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ============================================
// ERROR HANDLING
// ============================================
app.use((req, res) => {
    res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ success: false, message: err.message || 'Server Error' });
});

// Export for Vercel
module.exports = app;
