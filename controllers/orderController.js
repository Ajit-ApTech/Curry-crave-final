import Order from '../models/Order.js';
import Cart from '../models/Cart.js';

// Generate unique order ID
const generateOrderId = async () => {
    // Get the count of all orders to generate sequential ID
    const count = await Order.countDocuments();
    return `ORD${count + 1}`;
};

// @desc    Create new order
// @route   POST /api/order
// @access  Private
export const createOrder = async (req, res) => {
    try {
        const { deliveryAddress, paymentMethod, items: requestItems, totalAmount: requestTotal, guestCustomer } = req.body;
        let orderItems;
        let totalAmount;

        // Check if items are provided in request body (from localStorage cart)
        if (requestItems && requestItems.length > 0) {
            // Use items from request - don't include food ObjectId since cart items use numeric IDs
            orderItems = requestItems.map(item => ({
                name: item.name,
                quantity: item.quantity,
                price: item.price
            }));
            totalAmount = requestTotal || requestItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        } else {
            // Fall back to cart from database
            const cart = await Cart.findOne({ user: req.user.id }).populate('items.food');

            if (!cart || cart.items.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Cart is empty. Please provide items in the request.'
                });
            }

            // Create order items from cart
            orderItems = cart.items.map(item => ({
                food: item.food._id,
                name: item.food.name,
                quantity: item.quantity,
                price: item.price
            }));
            totalAmount = cart.totalAmount;

            // Clear cart after order
            cart.items = [];
            cart.totalAmount = 0;
            await cart.save();
        }

        // Create order
        const order = await Order.create({
            user: req.user.id,
            orderId: await generateOrderId(),
            items: orderItems,
            totalAmount,
            deliveryAddress,
            paymentMethod: paymentMethod || 'cash_on_delivery',
            guestCustomer: guestCustomer || null,
            estimatedDeliveryTime: new Date(Date.now() + 45 * 60000) // 45 minutes
        });

        res.status(201).json({
            success: true,
            message: 'Order created successfully',
            order
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get user orders
// @route   GET /api/order/my-orders
// @access  Private
export const getMyOrders = async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user.id })
            .populate('items.food')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: orders.length,
            orders
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get order by ID
// @route   GET /api/order/:id
// @access  Private
export const getOrderById = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id).populate('items.food');

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        // Check if order belongs to user
        if (order.user.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to view this order'
            });
        }

        res.status(200).json({
            success: true,
            order
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Update order status (Admin only)
// @route   PUT /api/order/:id/status
// @access  Private/Admin
export const updateOrderStatus = async (req, res) => {
    try {
        const { orderStatus } = req.body;

        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        order.orderStatus = orderStatus;

        if (orderStatus === 'delivered') {
            order.deliveredAt = Date.now();
        }

        await order.save();

        res.status(200).json({
            success: true,
            message: 'Order status updated',
            order
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get all orders (Admin only)
// @route   GET /api/order/admin/all
// @access  Private/Admin
export const getAllOrders = async (req, res) => {
    try {
        const orders = await Order.find({})
            .populate('user', 'name email phone')
            .populate('items.food')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: orders.length,
            orders
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Create guest order (no authentication required)
// @route   POST /api/orders
// @access  Public
export const createGuestOrder = async (req, res) => {
    try {
        const { user, items, totalAmount } = req.body;

        // Validate required fields
        if (!user || !user.name || !user.email || !user.phone || !user.address) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all customer details: name, email, phone, and address'
            });
        }

        if (!items || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Order must contain at least one item'
            });
        }

        if (!totalAmount || totalAmount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid order total amount'
            });
        }

        // Generate unique order ID
        const orderId = await generateOrderId();

        // Create order with guest user info
        const order = await Order.create({
            orderId: orderId,
            guestCustomer: {
                name: user.name,
                email: user.email,
                phone: user.phone
            },
            items: items.map(item => ({
                name: item.name,
                quantity: item.quantity,
                price: item.price
            })),
            totalAmount: totalAmount,
            deliveryAddress: user.address,
            paymentMethod: 'cash_on_delivery', // Default for guest orders
            orderStatus: 'pending',
            estimatedDeliveryTime: new Date(Date.now() + 45 * 60000) // 45 minutes
        });

        res.status(201).json({
            success: true,
            message: 'Order placed successfully',
            data: {
                orderId: order.orderId,
                totalAmount: order.totalAmount,
                estimatedDeliveryTime: order.estimatedDeliveryTime
            }
        });
    } catch (error) {
        console.error('Guest order error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create order. Please try again.'
        });
    }
};
