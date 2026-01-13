import express from 'express';
import {
    getCurrentPricing,
    getPricingHistory,
    updatePricing,
    deletePricing,
} from '../controllers/pricingController.js';
import { protectRoute } from '../middleware/authMiddleware.js';

const router = express.Router();

// All pricing routes are protected
router.use(protectRoute);

// @route   GET /api/pricing/current
router.get('/current', getCurrentPricing);

// @route   GET /api/pricing/history
router.get('/history', getPricingHistory);

// @route   POST /api/pricing
router.post('/', updatePricing);

// @route   DELETE /api/pricing/:id
router.delete('/:id', deletePricing);

export default router;
