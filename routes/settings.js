import express from 'express';
import { getSettings, updateSettings, resetSettings } from '../controllers/settingsController.js';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

// Public route - anyone can get settings (for displaying on website)
router.get('/', getSettings);

// Admin only routes
router.put('/', protect, admin, updateSettings);
router.post('/reset', protect, admin, resetSettings);

export default router;
