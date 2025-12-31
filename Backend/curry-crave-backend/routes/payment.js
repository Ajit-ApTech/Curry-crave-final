import express from 'express';
import {
    createRazorpayOrder,
    verifyPayment,
    paymentFailed,
    getPaymentDetails,
    refundPayment
} from '../controllers/paymentController.js';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

// Protected routes
router.post('/create-order', protect, createRazorpayOrder);
router.post('/verify', protect, verifyPayment);
router.post('/failed', protect, paymentFailed);
router.get('/:paymentId', protect, getPaymentDetails);

// Admin routes
router.post('/refund', protect, admin, refundPayment);

export default router;
