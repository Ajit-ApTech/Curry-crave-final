import mongoose from 'mongoose';

const foodSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide food name'],
        trim: true
    },
    description: {
        type: String,
        required: [true, 'Please provide description']
    },
    price: {
        type: Number,
        required: [true, 'Please provide price'],
        min: 0
    },
    category: {
        type: String,
        required: true,
        enum: ['curry', 'bread', 'rice', 'drinks', 'desserts']
    },
    image: {
        type: String,
        default: 'placeholder.jpg'
    },
    rating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
    },
    badge: {
        type: String,
        enum: ['Popular', 'Bestseller', 'Chef Special', 'Special', 'Veg', 'Spicy', 'Sweet', null],
        default: null
    },
    isAvailable: {
        type: Boolean,
        default: true
    },
    preparationTime: {
        type: Number,
        default: 30 // in minutes
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.model('Food', foodSchema);
