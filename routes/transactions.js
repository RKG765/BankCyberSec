const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const SecurityLog = require('../models/SecurityLog');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');

// IDS/IPS function to detect suspicious transactions
const detectSuspiciousActivity = async (userId, amount, recipient) => {
    try {
        // Get user's recent transactions
        const oneHourAgo = new Date(Date.now() - 3600000);
        const recentTransactions = await Transaction.find({
            userId,
            timestamp: { $gte: oneHourAgo }
        }).sort({ timestamp: -1 });

        // Check for unusual patterns
        const suspiciousPatterns = {
            largeAmount: amount > 10000, // Flag large transactions
            frequentTransactions: recentTransactions.length >= 5, // 5+ transactions in 1 hour
            unusualRecipient: !recipient.match(/^[a-zA-Z0-9]+$/) // Basic pattern check
        };

        return Object.values(suspiciousPatterns).some(pattern => pattern);
    } catch (error) {
        console.error('Error in IDS/IPS:', error);
        return false;
    }
};

// Get user balance
router.get('/balance', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json({ balance: user.balance });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching balance' });
    }
});

// Get recent transactions
router.get('/recent', authenticateToken, async (req, res) => {
    try {
        const transactions = await Transaction.find({ userId: req.user.id })
            .sort({ timestamp: -1 })
            .limit(5);
        res.json(transactions);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching transactions' });
    }
});

// Get transaction history with filters
router.get('/history', authenticateToken, async (req, res) => {
    try {
        const { period } = req.query;
        let startDate = new Date(0); // Default to all time

        switch (period) {
            case 'today':
                startDate = new Date();
                startDate.setHours(0, 0, 0, 0);
                break;
            case 'week':
                startDate = new Date();
                startDate.setDate(startDate.getDate() - 7);
                break;
            case 'month':
                startDate = new Date();
                startDate.setMonth(startDate.getMonth() - 1);
                break;
        }

        const transactions = await Transaction.find({
            userId: req.user.id,
            timestamp: { $gte: startDate }
        }).sort({ timestamp: -1 });

        res.json(transactions);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching transaction history' });
    }
});

// Create new transaction
router.post('/', authenticateToken, async (req, res) => {
    const session = await Transaction.startSession();
    session.startTransaction();

    try {
        const { amount, recipient, description } = req.body;
        const userId = req.user.id;

        // Get user and check balance
        const user = await User.findById(userId).session(session);
        if (!user) {
            await session.abortTransaction();
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if user has sufficient balance
        if (user.balance < amount) {
            await session.abortTransaction();
            return res.status(400).json({ message: 'Insufficient funds' });
        }

        // Update user balance
        const newBalance = await user.updateBalance(amount, 'debit');

        // Create transaction record
        const transaction = new Transaction({
            userId,
            type: 'debit',
            amount,
            recipient,
            description,
            balanceAfter: newBalance
        });

        await transaction.save({ session });

        // Create credit transaction for recipient
        const recipientUser = await User.findOne({ username: recipient }).session(session);
        if (recipientUser) {
            const recipientBalance = await recipientUser.updateBalance(amount, 'credit');
            
            const recipientTransaction = new Transaction({
                userId: recipientUser._id,
                type: 'credit',
                amount,
                recipient: user.username,
                description,
                balanceAfter: recipientBalance
            });

            await recipientTransaction.save({ session });
        }

        await session.commitTransaction();
        res.status(201).json(transaction);
    } catch (error) {
        await session.abortTransaction();
        res.status(500).json({ message: error.message || 'Error processing transaction' });
    } finally {
        session.endSession();
    }
});

module.exports = router; 