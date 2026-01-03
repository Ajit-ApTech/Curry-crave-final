import express from 'express';
import {
    submitFeedback,
    getAllFeedback,
    getSingleFeedback,
    updateFeedbackStatus,
    replyToFeedback,
    deleteFeedback,
    getNewFeedbackCount
} from '../controllers/feedbackController.js';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

// Public route - submit feedback
router.post('/', submitFeedback);

// Admin routes - protected
router.get('/admin/all', protect, admin, getAllFeedback);
router.get('/admin/count/new', protect, admin, getNewFeedbackCount);
router.get('/admin/:id', protect, admin, getSingleFeedback);
router.put('/admin/:id/status', protect, admin, updateFeedbackStatus);
router.put('/admin/:id/reply', protect, admin, replyToFeedback);
router.delete('/admin/:id', protect, admin, deleteFeedback);

export default router;
