import express from 'express';
import { protect, admin } from '../middleware/auth.js';
import {
    validatePincode,
    getPincodeInfo,
    getDeliverySettings,
    addServicablePincode,
    removeServicablePincode,
    updateDeliveryAreaSettings,
    getPincodesInRadius,
    scanNearbyPincodes,
    addRestaurantLocation,
    removeRestaurantLocation,
    toggleRestaurantLocation
} from '../controllers/deliveryController.js';

const router = express.Router();

// Public routes
router.post('/validate-pincode', validatePincode);
router.get('/pincode/:pincode', getPincodeInfo);
router.get('/settings', getDeliverySettings);

// Admin routes - Servicable Pincodes
router.post('/servicable-pincode', protect, admin, addServicablePincode);
router.delete('/servicable-pincode/:pincode', protect, admin, removeServicablePincode);

// Admin routes - Delivery Area Settings
router.put('/area-settings', protect, admin, updateDeliveryAreaSettings);
router.get('/pincodes-in-radius', protect, admin, getPincodesInRadius);
router.get('/scan-nearby-pincodes', protect, admin, scanNearbyPincodes);

// Admin routes - Restaurant Locations (Multiple)
router.post('/restaurant-location', protect, admin, addRestaurantLocation);
router.delete('/restaurant-location/:pincode', protect, admin, removeRestaurantLocation);
router.patch('/restaurant-location/:pincode/toggle', protect, admin, toggleRestaurantLocation);

export default router;
