import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Booking from './models/Booking.js';

dotenv.config();

const checkClosedBookings = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected...');

        // Find all bookings with CLOSED status or customerName
        const closedByStatus = await Booking.find({ status: 'Closed' });
        const closedByName = await Booking.find({ customerName: 'CLOSED' });
        
        console.log('\n📊 Database Check:');
        console.log(`   Bookings with status='Closed': ${closedByStatus.length}`);
        console.log(`   Bookings with customerName='CLOSED': ${closedByName.length}`);
        
        if (closedByStatus.length > 0) {
            console.log('\n🔍 Sample closed bookings:');
            closedByStatus.slice(0, 3).forEach(b => {
                console.log(`   - ${b.date} ${b.startTime} ${b.courtId}: ${b.customerName} (${b.status})`);
            });
        }
        
        // Delete them
        const result = await Booking.deleteMany({ 
            $or: [
                { status: 'Closed' },
                { customerName: 'CLOSED' }
            ]
        });

        console.log(`\n✅ Deleted ${result.deletedCount} fake CLOSED bookings from database\n`);
        
        process.exit(0);
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
};

checkClosedBookings();
