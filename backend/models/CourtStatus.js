import mongoose from 'mongoose';

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
            enum: ['Court 1', 'Court 2'],
        },
        status: {
            type: String,
            required: true,
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
    {
        timestamps: true,
    }
);

// Compound index to prevent duplicate entries
courtStatusSchema.index({ date: 1, startTime: 1, courtId: 1 }, { unique: true });

const CourtStatus = mongoose.model('CourtStatus', courtStatusSchema);

export default CourtStatus;
