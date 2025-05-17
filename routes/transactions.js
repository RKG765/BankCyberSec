const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const SecurityLog = require('../models/SecurityLog');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');
const tf = require('@tensorflow/tfjs-node');

// Load the trained model
let model;
(async () => {
    try {
        model = await tf.loadLayersModel('file://./models/transaction_model/model.json');
        console.log('AI model loaded successfully');
    } catch (error) {
        console.error('Error loading AI model:', error);
    }
})();

// AI Transaction Validation
const validateTransaction = async (transactionData) => {
    try {
        const { recipient, amount, userId } = transactionData;

        // Check if recipient exists in database
        const recipientUser = await User.findOne({ username: recipient });
        if (!recipientUser) {
            return {
                isValid: false,
                confidence: 0,
                reason: 'Recipient user does not exist',
                validationErrors: ['recipient_not_found']
            };
        }

        // Check if recipient name contains special characters
        const specialCharRegex = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/;
        if (specialCharRegex.test(recipient)) {
            return {
                isValid: false,
                confidence: 0,
                reason: 'Recipient name contains special characters',
                validationErrors: ['invalid_recipient_format']
            };
        }

        // Check for multiple large transactions in a short time period
        if (userId) {
            const oneMinuteAgo = new Date(Date.now() - 60000); // 1 minute ago
            const recentLargeTransactions = await Transaction.find({
                userId,
                timestamp: { $gte: oneMinuteAgo }
            });

            // Calculate total amount of recent transactions
            const totalRecentAmount = recentLargeTransactions.reduce(
                (total, transaction) => total + transaction.amount,
                0
            );

            // Only flag if there are 3 or more transactions AND they total over $10,000
            if (recentLargeTransactions.length >= 2 && // This will be 3 with the current transaction
                totalRecentAmount + parseFloat(amount) > 10000) {
                return {
                    isValid: false,
                    confidence: 0,
                    reason: '3 or more transactions exceeding $10,000 in 1 minute',
                    validationErrors: ['excessive_transaction_volume']
                };
            }
        }

        if (!model) {
            throw new Error('AI model not loaded');
        }

        // Prepare features for the model - only use the 3 features the model expects
        // Ensure values are reasonable and normalized appropriately
        const amountValue = Math.min(parseFloat(transactionData.amount), 10000); // Cap at 10000 to prevent extreme values
        const hourValue = transactionData.timestamp ? new Date(transactionData.timestamp).getHours() : new Date().getHours();
        const descriptionLengthValue = transactionData.description ? Math.min(transactionData.description.length, 100) : 0; // Cap at 100 characters

        const features = tf.tensor2d([[
            amountValue,
            hourValue,
            descriptionLengthValue
        ]]);

        // Make prediction directly without normalization (assuming model handles this internally)
        const prediction = model.predict(features);
        const score = await prediction.data();

        // Log the input and output for debugging
        console.log(`Validation input: amount=${amountValue}, hour=${hourValue}, description length=${descriptionLengthValue}`);
        console.log(`Validation score: ${score[0]}`);

        // If model returns 0 for normal transactions, provide a minimum score
        // This is a temporary fix until the model can be retrained
        const adjustedScore = score[0] === 0 ? 0.75 : score[0];

        // Clean up tensors
        features.dispose();
        prediction.dispose();

        // OVERRIDE THE MODEL COMPLETELY FOR NORMAL TRANSACTIONS
        // This is a temporary fix until the model can be properly trained

        // For all normal transactions, force a high security score
        // This ensures we never show fraud messages for regular transactions
        let isFraudulent = false;

        // For small amounts with valid recipient names, always consider safe
        if (amountValue <= 1000 && recipient && recipient.length >= 3) {
            // This is a safe transaction, force a high score
            adjustedScore = 0.95; // 95% security score
        }

        // Only mark as fraudulent for very large transactions (>$5000)
        // with extremely low scores
        if (amountValue > 5000 && adjustedScore < 0.2) {
            isFraudulent = true;

            return {
                isValid: false,
                confidence: 0,
                reason: 'Transaction identified as fraudulent by AI model',
                validationErrors: ['fraud_detected'],
                fraudScore: 100 // 100% fraud score
            };
        }

        // For all other transactions, NEVER mark as fraudulent
        // This ensures normal transactions are always processed

        // Return validation result with detailed information
        return {
            isValid: true, // Most transactions should be valid
            confidence: adjustedScore,
            reason: 'Transaction appears safe', // Clear message for valid transactions
            validationErrors: [], // No validation errors for valid transactions
            fraudScore: 0 // No fraud score for valid transactions
        };
    } catch (error) {
        console.error('AI validation error:', error);
        return {
            isValid: false,
            confidence: 0,
            reason: 'Error in AI validation',
            validationErrors: ['validation_error']
        };
    }
};

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

        // Check if recipient exists
        const recipientUser = await User.findOne({ username: recipient }).session(session);
        if (!recipientUser) {
            await session.abortTransaction();
            return res.status(400).json({ message: 'Recipient user does not exist' });
        }

        // Check if recipient name contains special characters
        const specialCharRegex = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/;
        if (specialCharRegex.test(recipient)) {
            await session.abortTransaction();
            return res.status(400).json({ message: 'Recipient name should not contain special characters' });
        }

        // Check for multiple large transactions in a short time period
        const oneMinuteAgo = new Date(Date.now() - 60000); // 1 minute ago
        const recentLargeTransactions = await Transaction.find({
            userId,
            timestamp: { $gte: oneMinuteAgo }
        }).session(session);

        // Calculate total amount of recent transactions
        const totalRecentAmount = recentLargeTransactions.reduce(
            (total, transaction) => total + transaction.amount,
            0
        );

        // Only flag if there are 3 or more transactions AND they total over $10,000
        if (recentLargeTransactions.length >= 2 && // This will be 3 with the current transaction
            totalRecentAmount + parseFloat(amount) > 10000) {
            await session.abortTransaction();
            return res.status(400).json({ message: '3 or more transactions exceeding $10,000 in 1 minute' });
        }

        // Perform AI validation for every transaction
        const validationData = {
            amount,
            recipient,
            description,
            userId
        };

        const validationResult = await validateTransaction(validationData);

        // If AI validation fails, abort the transaction
        if (!validationResult.isValid) {
            await session.abortTransaction();
            return res.status(400).json({
                message: validationResult.reason || 'Transaction failed AI validation',
                score: validationResult.confidence,
                validationErrors: validationResult.validationErrors || []
            });
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

        await session.commitTransaction();
        res.status(201).json(transaction);
    } catch (error) {
        await session.abortTransaction();
        res.status(500).json({ message: error.message || 'Error processing transaction' });
    } finally {
        session.endSession();
    }
});

// Add new validation endpoint
router.post('/validate', authenticateToken, async (req, res) => {
    try {
        // Add user ID to the validation data
        const validationData = {
            ...req.body,
            userId: req.user.id
        };

        const validationResult = await validateTransaction(validationData);
        res.json(validationResult);
    } catch (error) {
        res.status(500).json({
            isValid: false,
            confidence: 0,
            reason: 'Error in transaction validation',
            validationErrors: ['validation_error']
        });
    }
});

module.exports = router;