import express from 'express';
import { loginAdmin, verifyAdmin } from '../controllers/adminController.js';
import { protectRoute } from '../middleware/authMiddleware.js';

const router = express.Router();

// @route   POST /api/admin/login
router.post('/login', loginAdmin);

// @route   GET /api/admin/verify
router.get('/verify', protectRoute, verifyAdmin);

export default router;
