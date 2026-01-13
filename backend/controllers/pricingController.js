import CourtPricing from '../models/CourtPricing.js';

/**
 * @desc    Get current active pricing
 * @route   GET /api/pricing/current
 * @access  Private
 */
const getCurrentPricing = async (req, res) => {
    const today = new Date().toISOString().split('T')[0];
    
    // Find the most recent pricing that's effective on or before today
    const pricing = await CourtPricing.findOne({
        effectiveDate: { $lte: today }
    }).sort({ effectiveDate: -1, createdAt: -1 });

    if (!pricing) {
        // If no pricing found, return default
        res.json({
            success: true,
            data: {
                pricePerCourtPerHour: 1500,
                effectiveDate: today,
                isDefault: true,
            },
        });
        return;
    }

    res.json({
        success: true,
        data: pricing,
    });
};

/**
 * @desc    Get pricing history
 * @route   GET /api/pricing/history
 * @access  Private
 */
const getPricingHistory = async (req, res) => {
    const limit = parseInt(req.query.limit) || 10;
    
    const pricingHistory = await CourtPricing.find()
        .sort({ effectiveDate: -1, createdAt: -1 })
        .limit(limit);

    res.json({
        success: true,
        count: pricingHistory.length,
        data: pricingHistory,
    });
};

/**
 * @desc    Create/Update pricing
 * @route   POST /api/pricing
 * @access  Private
 */
const updatePricing = async (req, res) => {
    const { pricePerCourtPerHour, effectiveDate, reason } = req.body;

    if (!pricePerCourtPerHour || !effectiveDate) {
        res.status(400);
        throw new Error('Price and effective date are required');
    }

    // Validate price
    if (pricePerCourtPerHour < 0) {
        res.status(400);
        throw new Error('Price cannot be negative');
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(effectiveDate)) {
        res.status(400);
        throw new Error('Invalid date format. Use YYYY-MM-DD');
    }

    // Check if pricing already exists for this date
    const existingPricing = await CourtPricing.findOne({ effectiveDate });

    if (existingPricing) {
        // Update existing pricing
        existingPricing.pricePerCourtPerHour = pricePerCourtPerHour;
        existingPricing.reason = reason;
        existingPricing.changedBy = 'admin';
        
        await existingPricing.save();

        res.json({
            success: true,
            message: 'Pricing updated successfully',
            data: existingPricing,
        });
    } else {
        // Create new pricing
        const pricing = await CourtPricing.create({
            pricePerCourtPerHour,
            effectiveDate,
            reason,
            changedBy: 'admin',
        });

        res.status(201).json({
            success: true,
            message: 'Pricing created successfully',
            data: pricing,
        });
    }
};

/**
 * @desc    Delete pricing entry
 * @route   DELETE /api/pricing/:id
 * @access  Private
 */
const deletePricing = async (req, res) => {
    const { id } = req.params;

    const pricing = await CourtPricing.findById(id);

    if (!pricing) {
        res.status(404);
        throw new Error('Pricing not found');
    }

    await pricing.deleteOne();

    res.json({
        success: true,
        message: 'Pricing deleted successfully',
    });
};

export {
    getCurrentPricing,
    getPricingHistory,
    updatePricing,
    deletePricing,
};
