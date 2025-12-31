import Food from '../models/Food.js';

// @desc    Get all food items
// @route   GET /api/food
// @access  Public
export const getAllFoods = async (req, res) => {
    try {
        const { category, search } = req.query;

        // Build query
        let query = {};
        if (req.query.all !== 'true') {
            query.isAvailable = true;
        }

        if (category && category !== 'all') {
            query.category = category;
        }

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        const foods = await Food.find(query).sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: foods.length,
            foods
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get single food item
// @route   GET /api/food/:id
// @access  Public
export const getFoodById = async (req, res) => {
    try {
        const food = await Food.findById(req.params.id);

        if (!food) {
            return res.status(404).json({
                success: false,
                message: 'Food item not found'
            });
        }

        res.status(200).json({
            success: true,
            food
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Create new food item (Admin only)
// @route   POST /api/food
// @access  Private/Admin
export const createFood = async (req, res) => {
    try {
        const food = await Food.create(req.body);

        res.status(201).json({
            success: true,
            message: 'Food item created successfully',
            food
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Update food item (Admin only)
// @route   PUT /api/food/:id
// @access  Private/Admin
export const updateFood = async (req, res) => {
    try {
        const food = await Food.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!food) {
            return res.status(404).json({
                success: false,
                message: 'Food item not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Food item updated successfully',
            food
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Delete food item (Admin only)
// @route   DELETE /api/food/:id
// @access  Private/Admin
export const deleteFood = async (req, res) => {
    try {
        const food = await Food.findByIdAndDelete(req.params.id);

        if (!food) {
            return res.status(404).json({
                success: false,
                message: 'Food item not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Food item deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get special/featured foods
// @route   GET /api/food/special
// @access  Public
export const getSpecialFoods = async (req, res) => {
    try {
        const foods = await Food.find({
            isAvailable: true,
            badge: { $in: ['Popular', 'Bestseller', 'Chef Special', 'Special'] }
        }).limit(6);

        res.status(200).json({
            success: true,
            count: foods.length,
            foods
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Upload food item image
// @route   POST /api/food/upload-image
// @access  Private/Admin
export const uploadFoodImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Please upload an image file'
            });
        }

        // When using Cloudinary storage, the file object contains the Cloudinary URL
        const imageUrl = req.file.path || req.file.secure_url || req.file.url;

        if (!imageUrl) {
            return res.status(500).json({
                success: false,
                message: 'Failed to upload image. Please check Cloudinary configuration.'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Image uploaded successfully',
            imageUrl: imageUrl,
            publicId: req.file.filename || req.file.public_id
        });
    } catch (error) {
        console.error('Image upload error:', error);
        res.status(500).json({
            success: false,
            message: 'Error uploading image: ' + error.message
        });
    }
};
