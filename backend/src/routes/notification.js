const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { Notification } = require('../models/schema');
const authMiddleware = require('../middleware/authMiddleware');

// (2) GET /unread-count - returns unread count for req.user
router.get('/unread-count', authMiddleware, async (req, res) => {
    try {
        const count = await Notification.countDocuments({
            user: req.user,
            isRead: false,
        });

        res.status(200).json({ count });
    } catch (error) {
        console.error('Error fetching unread notification count:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// (4) PUT /read-all - marks all unread notifications for req.user as read
router.put('/read-all', authMiddleware, async (req, res) => {
    try {
        const result = await Notification.updateMany(
            { user: req.user, isRead: false },
            { $set: { isRead: true } }
        );

        res.status(200).json({
            message: 'All notifications marked as read',
            modifiedCount: result.modifiedCount,
        });
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// (1) GET / - returns paginated notifications for req.user, sorted by createdAt descending
router.get('/', authMiddleware, async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page, 10) || 1);
        const parsedLimit = parseInt(req.query.limit, 10);
        const limit = Math.min(50, Math.max(1, isNaN(parsedLimit) || parsedLimit <= 0 ? 10 : parsedLimit));
        const skip = (page - 1) * limit;

        const query = { user: req.user };

        const totalCount = await Notification.countDocuments(query);
        const totalPages = Math.ceil(totalCount / limit);
        const hasNextPage = page < totalPages;

        const notifications = await Notification.find(query)
            .populate('relatedTransaction', 'amount type status createdAt')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        res.status(200).json({
            notifications,
            totalCount,
            currentPage: page,
            totalPages,
            hasNextPage,
        });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// (3) PUT /:id/read - marks single notification as read if it belongs to req.user
router.put('/:id/read', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        const notification = await Notification.findOneAndUpdate(
            { _id: id, user: req.user },
            { $set: { isRead: true } },
            { new: true }
        ).populate('relatedTransaction', 'amount type status createdAt');

        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        res.status(200).json({
            message: 'Notification marked as read',
            notification,
        });
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
