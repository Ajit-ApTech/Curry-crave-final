import mongoose from 'mongoose';
import User from './models/User.js';
import Food from './models/Food.js';
import Order from './models/Order.js';
import dotenv from 'dotenv';

dotenv.config();

const createSampleOrders = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // Get all users (excluding admin)
        const users = await User.find({ role: 'user' }).limit(4);
        console.log(`📊 Found ${users.length} users`);

        // Get all food items
        const foods = await Food.find();
        console.log(`🍛 Found ${foods.length} food items`);

        if (users.length === 0) {
            console.log('❌ No users found. Please create some users first.');
            process.exit(1);
        }

        if (foods.length === 0) {
            console.log('❌ No food items found. Please run seed-database.js first.');
            process.exit(1);
        }

        // Clear existing orders
        await Order.deleteMany({});
        console.log('🗑️  Cleared existing orders');

        const sampleOrders = [];
        const statuses = ['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'];
        const now = new Date();

        // Create 30 orders with varying dates
        for (let i = 0; i < 30; i++) {
            // Random user
            const user = users[Math.floor(Math.random() * users.length)];

            // Random number of items (1-4)
            const itemCount = Math.floor(Math.random() * 4) + 1;
            const orderItems = [];
            let totalAmount = 0;

            for (let j = 0; j < itemCount; j++) {
                const food = foods[Math.floor(Math.random() * foods.length)];
                const quantity = Math.floor(Math.random() * 3) + 1;
                const price = food.price;

                orderItems.push({
                    food: food._id,
                    name: food.name,
                    quantity: quantity,
                    price: price
                });

                totalAmount += price * quantity;
            }

            // Random status (more likely to be delivered for testing analytics)
            const statusWeights = [0.1, 0.1, 0.1, 0.05, 0.6, 0.05]; // Favor 'delivered'
            let random = Math.random();
            let orderStatus = 'delivered';
            let cumulative = 0;
            for (let k = 0; k < statusWeights.length; k++) {
                cumulative += statusWeights[k];
                if (random < cumulative) {
                    orderStatus = statuses[k];
                    break;
                }
            }

            // Random date in the last 60 days
            const daysAgo = Math.floor(Math.random() * 60);
            const orderDate = new Date(now);
            orderDate.setDate(orderDate.getDate() - daysAgo);

            // Payment details
            const paymentMethod = ['razorpay', 'cod'][Math.floor(Math.random() * 2)];
            const paymentStatus = orderStatus === 'cancelled' ? 'failed' :
                (orderStatus === 'delivered' ? 'completed' : 'pending');

            // Generate unique order ID
            const orderId = `CC${Date.now()}${String(i).padStart(3, '0')}`;

            sampleOrders.push({
                user: user._id,
                orderId: orderId,
                items: orderItems,
                totalAmount: totalAmount,
                orderStatus: orderStatus,
                deliveryAddress: {
                    street: `${Math.floor(Math.random() * 500)} Main Street`,
                    city: 'Mumbai',
                    state: 'Maharashtra',
                    zipCode: '400001'
                },
                paymentMethod: paymentMethod,
                paymentStatus: paymentStatus,
                deliveredAt: orderStatus === 'delivered' ? orderDate : null,
                createdAt: orderDate
            });

            // Small delay to ensure unique timestamps
            await new Promise(resolve => setTimeout(resolve, 2));
        }

        // Insert all orders
        const createdOrders = await Order.insertMany(sampleOrders);
        console.log(`✅ Created ${createdOrders.length} sample orders`);

        // Show statistics
        const totalOrders = await Order.countDocuments();
        const deliveredOrders = await Order.countDocuments({ orderStatus: 'delivered' });
        const revenue = await Order.aggregate([
            { $match: { orderStatus: { $ne: 'cancelled' } } },
            { $group: { _id: null, total: { $sum: '$totalAmount' } } }
        ]);

        console.log('\n📊 Order Statistics:');
        console.log(`   Total Orders: ${totalOrders}`);
        console.log(`   Delivered Orders: ${deliveredOrders}`);
        console.log(`   Total Revenue: ₹${revenue.length > 0 ? revenue[0].total.toLocaleString('en-IN') : 0}`);

        // Show top selling items
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
            { $limit: 5 },
            {
                $lookup: {
                    from: 'foods',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'foodDetails'
                }
            },
            { $unwind: '$foodDetails' }
        ]);

        console.log('\n🏆 Top 5 Selling Items:');
        topItems.forEach((item, index) => {
            console.log(`   ${index + 1}. ${item.foodDetails.name} - ${item.totalQuantity} orders - ₹${item.totalRevenue.toLocaleString('en-IN')}`);
        });

        // Show orders by status
        const ordersByStatus = await Order.aggregate([
            {
                $group: {
                    _id: '$orderStatus',
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } }
        ]);

        console.log('\n📋 Orders by Status:');
        ordersByStatus.forEach(item => {
            console.log(`   ${item._id}: ${item.count}`);
        });

        console.log('\n🎉 Sample orders created successfully!');
        console.log('🔍 You can now view the analytics in the admin dashboard.');

    } catch (error) {
        console.error('❌ Error creating sample orders:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('\n📊 Disconnected from MongoDB');
        process.exit(0);
    }
};

createSampleOrders();
