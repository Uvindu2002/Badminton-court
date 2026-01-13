import express from 'express';
import {
    getCourtStatusByDate,
    closeCourtSlot,
    closeCourtDay,
    reopenCourtSlot,
    checkSlotStatus,
} from '../controllers/courtStatusController.js';
import { protectRoute } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes are protected
router.use(protectRoute);

router.get('/', getCourtStatusByDate);
router.get('/check', checkSlotStatus);
router.post('/close', closeCourtSlot);
router.post('/close-day', closeCourtDay);
router.delete('/:id', reopenCourtSlot);

export default router;
