import Razorpay from 'razorpay';
import crypto from 'crypto';
import Order from '../models/Order.js';

// Lazy initialization of Razorpay (initialize on first use, not at module load)
let razorpay = null;

function getRazorpay() {
    if (!razorpay && process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
        razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET
        });
        console.log('✅ Razorpay initialized successfully');
    }
    return razorpay;
}


// @desc    Create Razorpay order
// @route   POST /api/payment/create-order
// @access  Private
export const createRazorpayOrder = async (req, res) => {
    try {
        const { amount, orderId } = req.body;

        // Get Razorpay instance (lazy initialization)
        const razorpayInstance = getRazorpay();

        // Check if Razorpay is configured
        if (!razorpayInstance) {
            return res.status(503).json({
                success: false,
                message: 'Razorpay is not configured. Please add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to your .env file.',
                notConfigured: true
            });
        }

        // Validate input
        if (!amount || !orderId) {
            return res.status(400).json({
                success: false,
                message: 'Please provide amount and order ID'
            });
        }

        // Create Razorpay order
        const options = {
            amount: amount * 100, // Razorpay expects amount in paise
            currency: 'INR',
            receipt: orderId,
            notes: {
                orderId: orderId,
                userId: req.user.id
            }
        };

        const razorpayOrder = await razorpayInstance.orders.create(options);

        // Update order with Razorpay order ID
        await Order.findOneAndUpdate(
            { orderId: orderId },
            { razorpayOrderId: razorpayOrder.id }
        );

        res.status(200).json({
            success: true,
            data: {
                orderId: razorpayOrder.id,
                amount: razorpayOrder.amount,
                currency: razorpayOrder.currency,
                key: process.env.RAZORPAY_KEY_ID
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Verify Razorpay payment
// @route   POST /api/payment/verify
// @access  Private
export const verifyPayment = async (req, res) => {
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            orderId
        } = req.body;

        // Create signature
        const sign = razorpay_order_id + '|' + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(sign.toString())
            .digest('hex');

        // Verify signature
        if (razorpay_signature === expectedSignature) {
            // Payment is successful
            const order = await Order.findOneAndUpdate(
                { orderId: orderId },
                {
                    paymentStatus: 'completed',
                    razorpayPaymentId: razorpay_payment_id,
                    razorpaySignature: razorpay_signature,
                    orderStatus: 'confirmed'
                },
                { new: true }
            );

            res.status(200).json({
                success: true,
                message: 'Payment verified successfully',
                data: order
            });
        } else {
            // Payment verification failed
            await Order.findOneAndUpdate(
                { orderId: orderId },
                { paymentStatus: 'failed' }
            );

            res.status(400).json({
                success: false,
                message: 'Payment verification failed'
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Handle payment failure
// @route   POST /api/payment/failed
// @access  Private
export const paymentFailed = async (req, res) => {
    try {
        const { orderId, error } = req.body;

        await Order.findOneAndUpdate(
            { orderId: orderId },
            {
                paymentStatus: 'failed',
                orderStatus: 'cancelled'
            }
        );

        res.status(200).json({
            success: false,
            message: 'Payment failed',
            error: error
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get payment details
// @route   GET /api/payment/:paymentId
// @access  Private
export const getPaymentDetails = async (req, res) => {
    try {
        const razorpayInstance = getRazorpay();
        const payment = await razorpayInstance.payments.fetch(req.params.paymentId);

        res.status(200).json({
            success: true,
            data: payment
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Refund payment (Admin only)
// @route   POST /api/payment/refund
// @access  Private/Admin
export const refundPayment = async (req, res) => {
    try {
        const { paymentId, amount } = req.body;
        const razorpayInstance = getRazorpay();

        const refund = await razorpayInstance.payments.refund(paymentId, {
            amount: amount * 100, // Amount in paise
            speed: 'normal'
        });

        // Update order
        await Order.findOneAndUpdate(
            { razorpayPaymentId: paymentId },
            { paymentStatus: 'refunded' }
        );

        res.status(200).json({
            success: true,
            message: 'Refund processed successfully',
            data: refund
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
