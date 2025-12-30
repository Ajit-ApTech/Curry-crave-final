import Cart from '../models/Cart.js';
import Food from '../models/Food.js';

// @desc    Get user's cart
// @route   GET /api/cart
// @access  Private
export const getCart = async (req, res) => {
    try {
        let cart = await Cart.findOne({ user: req.user.id }).populate('items.food');

        if (!cart) {
            cart = await Cart.create({ user: req.user.id, items: [] });
        }

        res.status(200).json({
            success: true,
             cart
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Add item to cart
// @route   POST /api/cart/add
// @access  Private
export const addToCart = async (req, res) => {
    try {
        const { foodId, quantity } = req.body;

        // Validate input
        if (!foodId || !quantity) {
            return res.status(400).json({
                success: false,
                message: 'Please provide food ID and quantity'
            });
        }

        // Check if food exists
        const food = await Food.findById(foodId);
        if (!food) {
            return res.status(404).json({
                success: false,
                message: 'Food item not found'
            });
        }

        // Get or create cart
        let cart = await Cart.findOne({ user: req.user.id });
        
        if (!cart) {
            cart = await Cart.create({
                user: req.user.id,
                items: []
            });
        }

        // Check if item already exists in cart
        const itemIndex = cart.items.findIndex(
            item => item.food.toString() === foodId
        );

        if (itemIndex > -1) {
            // Update quantity
            cart.items[itemIndex].quantity += quantity;
        } else {
            // Add new item
            cart.items.push({
                food: foodId,
                quantity,
                price: food.price
            });
        }

        await cart.save();
        await cart.populate('items.food');

        res.status(200).json({
            success: true,
            message: 'Item added to cart',
             cart
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Update cart item quantity
// @route   PUT /api/cart/update
// @access  Private
export const updateCartItem = async (req, res) => {
    try {
        const { foodId, quantity } = req.body;

        const cart = await Cart.findOne({ user: req.user.id });

        if (!cart) {
            return res.status(404).json({
                success: false,
                message: 'Cart not found'
            });
        }

        const itemIndex = cart.items.findIndex(
            item => item.food.toString() === foodId
        );

        if (itemIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Item not found in cart'
            });
        }

        if (quantity <= 0) {
            cart.items.splice(itemIndex, 1);
        } else {
            cart.items[itemIndex].quantity = quantity;
        }

        await cart.save();
        await cart.populate('items.food');

        res.status(200).json({
            success: true,
            message: 'Cart updated successfully',
             cart
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Remove item from cart
// @route   DELETE /api/cart/remove/:foodId
// @access  Private
export const removeFromCart = async (req, res) => {
    try {
        const cart = await Cart.findOne({ user: req.user.id });

        if (!cart) {
            return res.status(404).json({
                success: false,
                message: 'Cart not found'
            });
        }

        cart.items = cart.items.filter(
            item => item.food.toString() !== req.params.foodId
        );

        await cart.save();
        await cart.populate('items.food');

        res.status(200).json({
            success: true,
            message: 'Item removed from cart',
             cart
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Clear cart
// @route   DELETE /api/cart/clear
// @access  Private
export const clearCart = async (req, res) => {
    try {
        const cart = await Cart.findOne({ user: req.user.id });

        if (!cart) {
            return res.status(404).json({
                success: false,
                message: 'Cart not found'
            });
        }

        cart.items = [];
        cart.totalAmount = 0;
        await cart.save();

        res.status(200).json({
            success: true,
            message: 'Cart cleared successfully',
             cart
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
