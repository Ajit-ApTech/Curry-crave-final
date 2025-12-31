import express from 'express';
import {
    getAllFoods,
    getFoodById,
    createFood,
    updateFood,
    deleteFood,
    getSpecialFoods,
    uploadFoodImage
} from '../controllers/foodController.js';
import { protect, admin } from '../middleware/auth.js';
import upload from '../middleware/upload.js';

const router = express.Router();

// Public routes
router.get('/', getAllFoods);
router.get('/special', getSpecialFoods);
router.get('/:id', getFoodById);

// Admin routes
router.post('/', protect, admin, createFood);
router.put('/:id', protect, admin, updateFood);
router.delete('/:id', protect, admin, deleteFood);

// Image upload route
router.post('/upload-image', protect, admin, upload.single('image'), uploadFoodImage);

export default router;
