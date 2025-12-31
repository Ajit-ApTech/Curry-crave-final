import express from 'express';
import {
    getDashboardStats,
    getAllUsers,
    getUserById,
    getTopItems,
    getAllOrdersForAdmin,
    getAnalytics
} from '../controllers/adminController.js';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication and admin role
router.use(protect, admin);

// Dashboard statistics
router.get('/stats', getDashboardStats);

// Users management
router.get('/users', getAllUsers);
router.get('/users/:id', getUserById);

// Analytics
router.get('/top-items', getTopItems);

// Orders management
router.get('/orders', getAllOrdersForAdmin);
router.get('/analytics', getAnalytics);

export default router;
