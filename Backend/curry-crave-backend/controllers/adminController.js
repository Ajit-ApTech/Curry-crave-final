import User from '../models/User.js';
import Order from '../models/Order.js';
import Food from '../models/Food.js';

// @desc    Get dashboard statistics
// @route   GET /api/admin/stats
// @access  Private/Admin
export const getDashboardStats = async (req, res) => {
    try {
        // Get total counts
        const totalUsers = await User.countDocuments({ role: 'user' });
        const totalOrders = await Order.countDocuments();
        const totalMenuItems = await Food.countDocuments();

        // Calculate total revenue
        const revenueData = await Order.aggregate([
            { $match: { orderStatus: { $ne: 'cancelled' } } },
            { $group: { _id: null, total: { $sum: '$totalAmount' } } }
        ]);
        const totalRevenue = revenueData.length > 0 ? revenueData[0].total : 0;

        // Get recent orders (last 10)
        const recentOrders = await Order.find()
            .populate('user', 'name email')
            .populate('items.food', 'name')
            .sort({ createdAt: -1 })
            .limit(10);

        // Get order statistics by status
        const ordersByStatus = await Order.aggregate([
            {
                $group: {
                    _id: '$orderStatus',
                    count: { $sum: 1 }
                }
            }
        ]);

        // Calculate growth percentages (comparing last 30 days to previous 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const sixtyDaysAgo = new Date();
        sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

        const recentOrdersCount = await Order.countDocuments({
            createdAt: { $gte: thirtyDaysAgo }
        });

        const previousOrdersCount = await Order.countDocuments({
            createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo }
        });

        const ordersGrowth = previousOrdersCount > 0
            ? ((recentOrdersCount - previousOrdersCount) / previousOrdersCount * 100).toFixed(1)
            : 0;

        // Get recent revenue
        const recentRevenueData = await Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: thirtyDaysAgo },
                    orderStatus: { $ne: 'cancelled' }
                }
            },
            { $group: { _id: null, total: { $sum: '$totalAmount' } } }
        ]);
        const recentRevenue = recentRevenueData.length > 0 ? recentRevenueData[0].total : 0;

        const previousRevenueData = await Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo },
                    orderStatus: { $ne: 'cancelled' }
                }
            },
            { $group: { _id: null, total: { $sum: '$totalAmount' } } }
        ]);
        const previousRevenue = previousRevenueData.length > 0 ? previousRevenueData[0].total : 0;

        const revenueGrowth = previousRevenue > 0
            ? ((recentRevenue - previousRevenue) / previousRevenue * 100).toFixed(1)
            : 0;

        // Get user growth
        const recentUsersCount = await User.countDocuments({
            createdAt: { $gte: thirtyDaysAgo },
            role: 'user'
        });

        const previousUsersCount = await User.countDocuments({
            createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo },
            role: 'user'
        });

        const usersGrowth = previousUsersCount > 0
            ? ((recentUsersCount - previousUsersCount) / previousUsersCount * 100).toFixed(1)
            : 0;

        // Get daily sales for last 7 days (for Sales Overview chart)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const dailySales = await Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: sevenDaysAgo },
                    orderStatus: { $ne: 'cancelled' }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    revenue: { $sum: "$totalAmount" },
                    orders: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        res.json({
            success: true,
            data: {
                totalOrders,
                totalRevenue,
                totalUsers,
                totalMenuItems,
                ordersGrowth,
                revenueGrowth,
                usersGrowth,
                recentOrders,
                ordersByStatus,
                dailySales
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching dashboard statistics',
            error: error.message
        });
    }
};

// @desc    Get all registered users with pagination
// @route   GET /api/admin/users
// @access  Private/Admin
export const getAllUsers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const users = await User.find({ role: 'user' })
            .select('-password')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const totalUsers = await User.countDocuments({ role: 'user' });

        // Get order counts and total spent for each user
        const usersWithStats = await Promise.all(
            users.map(async (user) => {
                const orderCount = await Order.countDocuments({ user: user._id });
                const totalSpent = await Order.aggregate([
                    { $match: { user: user._id, orderStatus: { $ne: 'cancelled' } } },
                    { $group: { _id: null, total: { $sum: '$totalAmount' } } }
                ]);

                // Get last delivery address from most recent order
                const lastOrder = await Order.findOne({ user: user._id })
                    .sort({ createdAt: -1 })
                    .select('deliveryAddress');

                const lastAddress = lastOrder?.deliveryAddress || null;

                return {
                    ...user.toObject(),
                    orderCount,
                    totalSpent: totalSpent.length > 0 ? totalSpent[0].total : 0,
                    lastDeliveryAddress: lastAddress,
                    userType: 'registered'
                };
            })
        );

        res.json({
            success: true,
            data: usersWithStats,
            pagination: {
                page,
                limit,
                total: totalUsers,
                pages: Math.ceil(totalUsers / limit)
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching users',
            error: error.message
        });
    }
};

// @desc    Get single user by ID
// @route   GET /api/admin/users/:id
// @access  Private/Admin
export const getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Get order stats for user
        const orderCount = await Order.countDocuments({ user: user._id });
        const totalSpentData = await Order.aggregate([
            { $match: { user: user._id, orderStatus: { $ne: 'cancelled' } } },
            { $group: { _id: null, total: { $sum: '$totalAmount' } } }
        ]);

        res.json({
            success: true,
            user: {
                ...user.toObject(),
                orderCount,
                totalSpent: totalSpentData.length > 0 ? totalSpentData[0].total : 0
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching user',
            error: error.message
        });
    }
};

// @route   GET /api/admin/top-items
// @access  Private/Admin
export const getTopItems = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 5;

        const topItems = await Order.aggregate([
            { $match: { orderStatus: { $ne: 'cancelled' } } },
            { $unwind: '$items' },
            {
                $group: {
                    _id: '$items.food',
                    totalOrders: { $sum: 1 },
                    totalQuantity: { $sum: '$items.quantity' },
                    totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
                }
            },
            { $sort: { totalRevenue: -1 } },
            { $limit: limit },
            {
                $lookup: {
                    from: 'foods',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'foodDetails'
                }
            },
            { $unwind: '$foodDetails' },
            {
                $project: {
                    name: '$foodDetails.name',
                    totalOrders: 1,
                    totalQuantity: 1,
                    totalRevenue: 1,
                    image: '$foodDetails.image'
                }
            }
        ]);

        res.json({
            success: true,
            data: topItems
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching top items',
            error: error.message
        });
    }
};

// @desc    Get all orders with filtering and pagination
// @route   GET /api/admin/orders
// @access  Private/Admin
export const getAllOrdersForAdmin = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;
        const status = req.query.status;

        // Build query
        const query = {};
        if (status && status !== 'all') {
            query.orderStatus = status;
        }

        // Get orders with user details
        const orders = await Order.find(query)
            .populate('user', 'name email phone')
            .populate('items.food', 'name')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const totalOrders = await Order.countDocuments(query);

        res.json({
            success: true,
            data: orders,
            pagination: {
                page,
                limit,
                total: totalOrders,
                pages: Math.ceil(totalOrders / limit)
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching orders',
            error: error.message
        });
    }
};
// @desc    Get analytics data (daily revenue & orders)
// @route   GET /api/admin/analytics
// @access  Private/Admin
export const getAnalytics = async (req, res) => {
    try {
        const period = req.query.period || '30d'; // Default to 30 days
        const endDate = new Date();
        const startDate = new Date();

        if (period === '7d') {
            startDate.setDate(endDate.getDate() - 7);
        } else if (period === '30d') {
            startDate.setDate(endDate.getDate() - 30);
        } else {
            startDate.setDate(endDate.getDate() - 30);
        }

        // Group orders by date
        const dailyStats = await Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate, $lte: endDate },
                    orderStatus: { $ne: 'cancelled' }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    revenue: { $sum: "$totalAmount" },
                    orders: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Fill in missing dates with 0-values
        const dates = [];
        let currentDate = new Date(startDate);
        while (currentDate <= endDate) {
            dates.push(currentDate.toISOString().split('T')[0]);
            currentDate.setDate(currentDate.getDate() + 1);
        }

        const filledStats = dates.map(date => {
            const stat = dailyStats.find(s => s._id === date);
            return {
                date,
                revenue: stat ? stat.revenue : 0,
                orders: stat ? stat.orders : 0
            };
        });

        res.json({
            success: true,
            data: filledStats
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching analytics',
            error: error.message
        });
    }
};
