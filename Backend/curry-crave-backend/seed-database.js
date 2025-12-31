#!/usr/bin/env node
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

// Load environment variables
dotenv.config();

// Import models
import User from './models/User.js';
import Food from './models/Food.js';

console.log('🌱 Starting database seeding...\n');

const seedDatabase = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB\n');

        // Ask for confirmation before clearing
        console.log('⚠️  This will clear existing data and add sample data.');
        console.log('   Press Ctrl+C to cancel, or wait 3 seconds to continue...\n');

        await new Promise(resolve => setTimeout(resolve, 3000));

        // Clear existing data
        console.log('🗑️  Clearing existing data...');
        await User.deleteMany({});
        await Food.deleteMany({});
        console.log('✅ Data cleared\n');

        // Create admin user
        console.log('👤 Creating admin user...');
        const admin = await User.create({
            name: 'Admin',
            email: 'admin@currycrave.com',
            password: 'admin123',
            phone: '9876543210',
            role: 'admin',
            address: {
                street: 'Admin Street',
                city: 'Admin City',
                state: 'State',
                zipCode: '123456',
                hostel: 'Admin Office'
            }
        });
        console.log('✅ Admin user created');
        console.log(`   Email: admin@currycrave.com`);
        console.log(`   Password: admin123\n`);

        // Create sample user
        console.log('👤 Creating sample user...');
        const user = await User.create({
            name: 'John Doe',
            email: 'user@example.com',
            password: 'user123',
            phone: '9876543211',
            role: 'user',
            address: {
                street: 'Room 101',
                city: 'Campus',
                state: 'State',
                zipCode: '123456',
                hostel: 'Hostel A'
            }
        });
        console.log('✅ Sample user created');
        console.log(`   Email: user@example.com`);
        console.log(`   Password: user123\n`);

        // Create sample menu items
        console.log('🍽️  Creating sample menu items...');
        const foods = [
            {
                name: 'Butter Chicken',
                description: 'Creamy tomato-based curry with tender chicken pieces',
                category: 'curry',
                price: 180,
                image: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=400',
                isAvailable: true,
                preparationTime: 25,
                badge: 'Popular',
                rating: 4.8
            },
            {
                name: 'Paneer Tikka Masala',
                description: 'Grilled cottage cheese in rich spiced gravy',
                category: 'curry',
                price: 150,
                image: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=400',
                isAvailable: true,
                preparationTime: 20,
                badge: 'Veg',
                rating: 4.6
            },
            {
                name: 'Biryani',
                description: 'Fragrant basmati rice with aromatic spices and meat',
                category: 'rice',
                price: 200,
                image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400',
                isAvailable: true,
                preparationTime: 30,
                badge: 'Bestseller',
                rating: 4.9
            },
            {
                name: 'Dal Makhani',
                description: 'Black lentils slow-cooked with butter and cream',
                category: 'curry',
                price: 120,
                image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400',
                isAvailable: true,
                preparationTime: 15,
                badge: 'Veg',
                rating: 4.5
            },
            {
                name: 'Tandoori Roti',
                description: 'Whole wheat bread baked in tandoor',
                category: 'bread',
                price: 20,
                image: 'https://images.unsplash.com/photo-1619881727039-68ad4242c464?w=400',
                isAvailable: true,
                preparationTime: 5,
                rating: 4.3
            },
            {
                name: 'Garlic Naan',
                description: 'Soft leavened bread with garlic and butter',
                category: 'bread',
                price: 30,
                image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400',
                isAvailable: true,
                preparationTime: 10,
                badge: 'Popular',
                rating: 4.7
            },
            {
                name: 'Vegetable Pulao',
                description: 'Fragrant basmati rice cooked with seasonal vegetables and spices',
                category: 'rice',
                price: 140,
                image: 'https://images.unsplash.com/photo-1596560548464-f010549b84d7?w=400',
                isAvailable: true,
                preparationTime: 20,
                badge: 'Veg',
                rating: 4.4
            },
            {
                name: 'Gulab Jamun',
                description: 'Sweet milk dumplings in sugar syrup',
                category: 'desserts',
                price: 50,
                image: 'https://images.unsplash.com/photo-1589119908995-c6e8d25dffc0?w=400',
                isAvailable: true,
                preparationTime: 5,
                badge: 'Sweet',
                rating: 4.8
            },
            {
                name: 'Masala Chai',
                description: 'Traditional Indian spiced tea',
                category: 'drinks',
                price: 25,
                image: 'https://images.unsplash.com/photo-1571934811356-5cc061b6821f?w=400',
                isAvailable: true,
                preparationTime: 5,
                rating: 4.5
            },
            {
                name: 'Mango Lassi',
                description: 'Sweet yogurt drink with mango',
                category: 'drinks',
                price: 60,
                image: 'https://images.unsplash.com/photo-1609501676725-7186f017a4b7?w=400',
                isAvailable: true,
                preparationTime: 5,
                badge: 'Popular',
                rating: 4.7
            }
        ];

        const createdFoods = await Food.insertMany(foods);
        console.log(`✅ Created ${createdFoods.length} menu items\n`);

        console.log('✨ Database seeding completed successfully!\n');
        console.log('📊 Summary:');
        console.log(`   - Users: ${await User.countDocuments()}`);
        console.log(`   - Food Items: ${await Food.countDocuments()}\n`);
        console.log('🎉 Your database is ready to use!\n');

        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Seeding failed!');
        console.error(`Error: ${error.message}\n`);
        process.exit(1);
    }
};

seedDatabase();
