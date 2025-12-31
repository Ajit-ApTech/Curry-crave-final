import mongoose from 'mongoose';
import User from './models/User.js';
import dotenv from 'dotenv';

dotenv.config();

const createAdminUser = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // Check if admin already exists
        const existingAdmin = await User.findOne({ email: 'admin@currycrave.com' });

        if (existingAdmin) {
            if (existingAdmin.role !== 'admin') {
                // Update existing user to admin
                existingAdmin.role = 'admin';
                await existingAdmin.save();
                console.log('✅ Updated existing user to admin');
                console.log('📧 Email: admin@currycrave.com');
            } else {
                console.log('ℹ️  Admin user already exists');
                console.log('📧 Email: admin@currycrave.com');
            }
        } else {
            // Create new admin user
            const adminUser = new User({
                name: 'Admin',
                email: 'admin@currycrave.com',
                password: 'admin123', // Will be hashed by the User model
                phone: '9999999999',
                role: 'admin'
            });

            await adminUser.save();
            console.log('✅ Admin user created successfully!');
            console.log('📧 Email: admin@currycrave.com');
            console.log('🔑 Password: admin123');
        }

        console.log('\n🎉 Admin setup complete!');
        console.log('You can now login to the admin dashboard with:');
        console.log('   Email: admin@currycrave.com');
        console.log('   Password: admin123');

    } catch (error) {
        console.error('❌ Error creating admin user:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('\n📊 Disconnected from MongoDB');
        process.exit(0);
    }
};

createAdminUser();
