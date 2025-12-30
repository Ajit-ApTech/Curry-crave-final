import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Food from './models/Food.js';

dotenv.config();

const menuItems = [
    {
        name: 'Butter Chicken Curry',
        description: 'Rich and creamy tomato-based curry with tender chicken pieces',
        price: 299,
        category: 'curry',
        image: 'assets/images/butter-chicken.jpg',
        rating: 4.8,
        badge: 'Popular',
        isAvailable: true
    },
    {
        name: 'Paneer Tikka Masala',
        description: 'Grilled cottage cheese in aromatic spiced gravy',
        price: 249,
        category: 'curry',
        image: 'assets/images/paneer-tikka.jpg',
        rating: 4.7,
        badge: 'Veg',
        isAvailable: true
    },
    {
        name: 'Garlic Naan',
        description: 'Freshly baked soft bread topped with garlic and butter',
        price: 49,
        category: 'bread',
        image: 'assets/images/garlic-naan.jpg',
        rating: 4.9,
        badge: 'Bestseller',
        isAvailable: true
    },
    {
        name: 'Butter Naan',
        description: 'Classic Indian flatbread brushed with butter',
        price: 39,
        category: 'bread',
        image: 'assets/images/butter-naan.jpg',
        rating: 4.8,
        badge: null,
        isAvailable: true
    },
    {
        name: 'Biryani Bowl',
        description: 'Fragrant basmati rice cooked with aromatic spices and meat',
        price: 349,
        category: 'rice',
        image: 'assets/images/biryani.jpg',
        rating: 4.9,
        badge: 'Chef Special',
        isAvailable: true
    },
    {
        name: 'Veg Pulao',
        description: 'Mixed vegetable rice with mild spices and herbs',
        price: 199,
        category: 'rice',
        image: 'assets/images/veg-pulao.jpg',
        rating: 4.5,
        badge: 'Veg',
        isAvailable: true
    },
    {
        name: 'Mango Lassi',
        description: 'Refreshing yogurt drink blended with sweet mango',
        price: 79,
        category: 'drinks',
        image: 'assets/images/mango-lassi.jpg',
        rating: 4.7,
        badge: null,
        isAvailable: true
    },
    {
        name: 'Masala Chai',
        description: 'Traditional Indian spiced tea with aromatic flavors',
        price: 39,
        category: 'drinks',
        image: 'assets/images/masala-chai.jpg',
        rating: 4.6,
        badge: null,
        isAvailable: true
    },
    {
        name: 'Gulab Jamun',
        description: 'Sweet milk dumplings soaked in rose-flavored syrup',
        price: 89,
        category: 'desserts',
        image: 'assets/images/gulab-jamun.jpg',
        rating: 4.8,
        badge: 'Sweet',
        isAvailable: true
    },
    {
        name: 'Rasmalai',
        description: 'Soft paneer balls in creamy sweetened milk',
        price: 99,
        category: 'desserts',
        image: 'assets/images/rasmalai.jpg',
        rating: 4.7,
        badge: 'Sweet',
        isAvailable: true
    },
    {
        name: 'Chicken Tikka Curry',
        description: 'Marinated grilled chicken in spicy tomato gravy',
        price: 279,
        category: 'curry',
        image: 'assets/images/chicken-tikka-curry.jpg',
        rating: 4.7,
        badge: 'Spicy',
        isAvailable: true
    },
    {
        name: 'Dal Makhani',
        description: 'Creamy black lentils slow-cooked with butter and cream',
        price: 199,
        category: 'curry',
        image: 'assets/images/dal-makhani.jpg',
        rating: 4.6,
        badge: 'Veg',
        isAvailable: true
    }
];

async function seedMenu() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI);
        console.log('📡 Connected to MongoDB');

        // Clear existing food items
        await Food.deleteMany({});
        console.log('🗑️  Cleared existing menu items');

        // Insert menu items
        const inserted = await Food.insertMany(menuItems);
        console.log(`✅ Successfully added ${inserted.length} menu items to database`);

        // Display inserted items
        inserted.forEach((item, index) => {
            console.log(`${index + 1}. ${item.name} - ₹${item.price} (${item.category})`);
        });

        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding menu:', error);
        process.exit(1);
    }
}

seedMenu();
