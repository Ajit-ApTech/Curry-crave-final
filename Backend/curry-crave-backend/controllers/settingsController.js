import Settings from '../models/Settings.js';

// @desc    Get current settings
// @route   GET /api/settings
// @access  Public
export const getSettings = async (req, res) => {
    try {
        const settings = await Settings.getSettings();

        res.status(200).json({
            success: true,
            settings
        });
    } catch (error) {
        console.error('Error fetching settings:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Update settings
// @route   PUT /api/settings
// @access  Private/Admin
export const updateSettings = async (req, res) => {
    try {
        let settings = await Settings.findOne();

        if (!settings) {
            settings = new Settings(req.body);
        } else {
            // Update all fields from request body
            Object.keys(req.body).forEach(key => {
                if (typeof req.body[key] === 'object' && !Array.isArray(req.body[key])) {
                    // Handle nested objects (like address, socialMedia, etc.)
                    Object.keys(req.body[key]).forEach(nestedKey => {
                        settings[key][nestedKey] = req.body[key][nestedKey];
                    });
                } else {
                    settings[key] = req.body[key];
                }
            });
        }

        settings.updatedAt = Date.now();
        await settings.save();

        res.status(200).json({
            success: true,
            message: 'Settings updated successfully',
            settings
        });
    } catch (error) {
        console.error('Error updating settings:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Reset settings to default
// @route   POST /api/settings/reset
// @access  Private/Admin
export const resetSettings = async (req, res) => {
    try {
        await Settings.deleteMany({});
        const settings = await Settings.create({});

        res.status(200).json({
            success: true,
            message: 'Settings reset to default successfully',
            settings
        });
    } catch (error) {
        console.error('Error resetting settings:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
