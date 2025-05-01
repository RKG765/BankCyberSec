const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const SecurityLog = require('../models/SecurityLog');
const mongoose = require('mongoose');

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Access denied' });
    }

    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Invalid token' });
        }
        req.user = user;
        next();
    });
};

// Get security logs for a user
router.get('/logs', authenticateToken, async (req, res) => {
    const userId = req.user.userId;

    try {
        const logs = await SecurityLog.find({ userId })
            .sort({ timestamp: -1 });

        res.json(logs);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching security logs' });
    }
});

// Get suspicious activity summary
router.get('/summary', authenticateToken, async (req, res) => {
    const userId = req.user.userId;

    try {
        const summary = await SecurityLog.aggregate([
            { $match: { userId: mongoose.Types.ObjectId(userId) } },
            {
                $group: {
                    _id: null,
                    total_logs: { $sum: 1 },
                    suspicious_transactions: {
                        $sum: {
                            $cond: [{ $eq: ["$eventType", "suspicious_transaction"] }, 1, 0]
                        }
                    },
                    last_alert: { $max: "$timestamp" }
                }
            }
        ]);

        res.json(summary[0] || {
            total_logs: 0,
            suspicious_transactions: 0,
            last_alert: null
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching security summary' });
    }
});

module.exports = router; 