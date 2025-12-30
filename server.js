import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/database.js';
import User from './models/User.js';

// Import Routes
import authRoutes from './routes/auth.js';
import foodRoutes from './routes/food.js';
import cartRoutes from './routes/cart.js';
import orderRoutes from './routes/order.js';
import paymentRoutes from './routes/payment.js';
import adminRoutes from './routes/admin.js';
import settingsRoutes from './routes/settings.js';

// Load environment variables
dotenv.config();

// Connect to MongoDB and create admin user
const initializeServer = async () => {
    await connectDB();

    // Auto-create admin user if doesn't exist
    try {
        const existingAdmin = await User.findOne({ email: 'admin@currycrave.com' });
        if (!existingAdmin) {
            const adminUser = new User({
                name: 'Admin',
                email: 'admin@currycrave.com',
                password: 'admin123',
                phone: '9999999999',
                role: 'admin'
            });
            await adminUser.save();
            console.log('✅ Admin user created automatically!');
            console.log('📧 Email: admin@currycrave.com');
            console.log('🔑 Password: admin123');
        } else {
            console.log('✅ Admin user already exists');
        }
    } catch (error) {
        console.log('⚠️ Could not auto-create admin:', error.message);
    }
};

initializeServer();

// Initialize Express app
const app = express();

// Configure allowed origins for CORS
const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:5500',
    'http://localhost:8081',
    'http://127.0.0.1:5500',
    // Add your production domains here:
    process.env.FRONTEND_URL,
    process.env.CORS_ORIGINS?.split(',') || []
].flat().filter(Boolean);

// Middleware
app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (mobile apps, curl, etc.)
        if (!origin) return callback(null, true);

        if (process.env.NODE_ENV !== 'production') {
            // Allow all origins in development
            return callback(null, true);
        }

        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }

        callback(new Error('Not allowed by CORS'));
    },
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/food', foodRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/order', orderRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/settings', settingsRoutes);

// Test Route
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Curry Crave API is running!',
        version: '1.0.0'
    });
});

// Error Handler Middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || 'Server Error'
    });
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
});

