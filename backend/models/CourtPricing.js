import mongoose from 'mongoose';

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
    {
        timestamps: true, // This adds createdAt and updatedAt
    }
);

// Index for efficient querying
courtPricingSchema.index({ effectiveDate: -1 });

const CourtPricing = mongoose.model('CourtPricing', courtPricingSchema);

export default CourtPricing;
