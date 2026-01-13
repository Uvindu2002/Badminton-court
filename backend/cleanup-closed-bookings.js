import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Booking from './models/Booking.js';

dotenv.config();

const cleanupClosedBookings = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected...');

        // Delete all fake "CLOSED" bookings
        const result = await Booking.deleteMany({ 
            customerName: 'CLOSED' 
        });

        console.log(`✅ Deleted ${result.deletedCount} fake CLOSED bookings from database`);
        
        process.exit(0);
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
};

cleanupClosedBookings();
