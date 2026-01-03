import Feedback from '../models/Feedback.js';

// @desc    Submit new feedback (public)
// @route   POST /api/feedback
// @access  Public
export const submitFeedback = async (req, res) => {
    try {
        const { name, email, phone, message } = req.body;

        // Validate required fields
        if (!name || !email || !phone || !message) {
            return res.status(400).json({
                success: false,
                message: 'Please provide name, email, phone, and message'
            });
        }

        const feedback = await Feedback.create({
            name,
            email,
            phone,
            message
        });

        res.status(201).json({
            success: true,
            message: 'Thank you for your feedback! We will get back to you soon.',
            data: feedback
        });
    } catch (error) {
        console.error('Error submitting feedback:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to submit feedback',
            error: error.message
        });
    }
};

// @desc    Get all feedback (admin only)
// @route   GET /api/feedback/admin/all
// @access  Private/Admin
export const getAllFeedback = async (req, res) => {
    try {
        const { status, page = 1, limit = 20 } = req.query;

        // Build query
        const query = {};
        if (status && status !== 'all') {
            query.status = status;
        }

        // Get total count
        const total = await Feedback.countDocuments(query);

        // Get feedback with pagination
        const feedback = await Feedback.find(query)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        // Get counts by status
        const statusCounts = await Feedback.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        const counts = {
            all: total,
            new: 0,
            read: 0,
            replied: 0,
            resolved: 0
        };

        statusCounts.forEach(item => {
            counts[item._id] = item.count;
        });

        res.status(200).json({
            success: true,
            count: feedback.length,
            total,
            counts,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / limit)
            },
            data: feedback
        });
    } catch (error) {
        console.error('Error getting feedback:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get feedback',
            error: error.message
        });
    }
};

// @desc    Get single feedback (admin only)
// @route   GET /api/feedback/admin/:id
// @access  Private/Admin
export const getSingleFeedback = async (req, res) => {
    try {
        const feedback = await Feedback.findById(req.params.id);

        if (!feedback) {
            return res.status(404).json({
                success: false,
                message: 'Feedback not found'
            });
        }

        // Mark as read if new
        if (feedback.status === 'new') {
            feedback.status = 'read';
            feedback.isRead = true;
            await feedback.save();
        }

        res.status(200).json({
            success: true,
            data: feedback
        });
    } catch (error) {
        console.error('Error getting feedback:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get feedback',
            error: error.message
        });
    }
};

// @desc    Update feedback status (admin only)
// @route   PUT /api/feedback/admin/:id/status
// @access  Private/Admin
export const updateFeedbackStatus = async (req, res) => {
    try {
        const { status } = req.body;

        const feedback = await Feedback.findByIdAndUpdate(
            req.params.id,
            { status, isRead: true },
            { new: true, runValidators: true }
        );

        if (!feedback) {
            return res.status(404).json({
                success: false,
                message: 'Feedback not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Status updated successfully',
            data: feedback
        });
    } catch (error) {
        console.error('Error updating feedback status:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update status',
            error: error.message
        });
    }
};

// @desc    Reply to feedback (admin only)
// @route   PUT /api/feedback/admin/:id/reply
// @access  Private/Admin
export const replyToFeedback = async (req, res) => {
    try {
        const { reply } = req.body;

        if (!reply) {
            return res.status(400).json({
                success: false,
                message: 'Reply message is required'
            });
        }

        const feedback = await Feedback.findByIdAndUpdate(
            req.params.id,
            {
                adminReply: reply,
                status: 'replied',
                repliedAt: new Date(),
                isRead: true
            },
            { new: true, runValidators: true }
        );

        if (!feedback) {
            return res.status(404).json({
                success: false,
                message: 'Feedback not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Reply saved successfully',
            data: feedback
        });
    } catch (error) {
        console.error('Error replying to feedback:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to save reply',
            error: error.message
        });
    }
};

// @desc    Delete feedback (admin only)
// @route   DELETE /api/feedback/admin/:id
// @access  Private/Admin
export const deleteFeedback = async (req, res) => {
    try {
        const feedback = await Feedback.findByIdAndDelete(req.params.id);

        if (!feedback) {
            return res.status(404).json({
                success: false,
                message: 'Feedback not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Feedback deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting feedback:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete feedback',
            error: error.message
        });
    }
};

// @desc    Get new feedback count (admin only)
// @route   GET /api/feedback/admin/count/new
// @access  Private/Admin
export const getNewFeedbackCount = async (req, res) => {
    try {
        const count = await Feedback.countDocuments({ status: 'new' });

        res.status(200).json({
            success: true,
            count
        });
    } catch (error) {
        console.error('Error getting new feedback count:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get count',
            error: error.message
        });
    }
};
