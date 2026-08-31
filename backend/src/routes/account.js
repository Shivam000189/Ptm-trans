const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { User, Bank, Transaction, Notification } = require('../models/schema');
const authMiddleware = require('../middleware/authMiddleware');
const zod = require('zod');

router.get('/balance', authMiddleware, async (req, res) => {
    try {
        const bank = await Bank.findOne({ user: req.user });

        if (!bank) {
            return res.status(404).json({ message: 'Bank account not found' });
        }

        res.status(200).json({ balance: bank.balance });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

const transferSchema = zod.object({
    recipientEmail: zod.string().email('Invalid email address'),
    amount: zod.number().positive('Amount must be a positive number'),
});

// Fallback execution for standalone local MongoDB instances (without replica set)
async function executeStandaloneTransfer({ senderId, recipientEmail, amount }) {
    const sender = await User.findById(senderId);
    if (!sender) {
        const err = new Error('Sender user not found');
        err.statusCode = 404;
        throw err;
    }

    const senderBank = await Bank.findOne({ user: senderId });
    if (!senderBank) {
        const err = new Error('Sender bank account not found');
        err.statusCode = 404;
        throw err;
    }

    if (senderBank.balance < amount) {
        const err = new Error('Insufficient balance');
        err.statusCode = 400;
        throw err;
    }

    const recipient = await User.findOne({ email: recipientEmail });
    if (!recipient) {
        const err = new Error('Recipient not found');
        err.statusCode = 404;
        throw err;
    }

    if (recipient._id.toString() === senderId.toString()) {
        const err = new Error('Cannot transfer money to yourself');
        err.statusCode = 400;
        throw err;
    }

    const recipientBank = await Bank.findOne({ user: recipient._id });
    if (!recipientBank) {
        const err = new Error('Recipient bank account not found');
        err.statusCode = 404;
        throw err;
    }

    const updatedSender = await Bank.findOneAndUpdate(
        { user: senderId, balance: { $gte: amount } },
        { $inc: { balance: -amount } },
        { new: true }
    );

    if (!updatedSender) {
        const err = new Error('Insufficient balance');
        err.statusCode = 400;
        throw err;
    }

    await Bank.findOneAndUpdate(
        { user: recipient._id },
        { $inc: { balance: amount } }
    );

    // Create debit & credit transaction records
    const debitTx = await Transaction.create({
        sender: senderId,
        recipient: recipient._id,
        amount,
        type: 'debit',
        status: 'completed',
        description: 'Money Transfer',
    });

    const creditTx = await Transaction.create({
        sender: senderId,
        recipient: recipient._id,
        amount,
        type: 'credit',
        status: 'completed',
        description: 'Money Transfer',
    });

    const senderName = `${sender.firstName} ${sender.lastName}`.trim() || 'Someone';
    const recipientName = `${recipient.firstName} ${recipient.lastName}`.trim() || recipient.email;

    // Create notifications
    await Notification.create({
        user: recipient._id,
        type: 'money_received',
        title: 'Money Received',
        message: `You received Rs. ${amount} from ${senderName}`,
        relatedTransaction: creditTx._id,
    });

    await Notification.create({
        user: senderId,
        type: 'money_sent',
        title: 'Money Sent',
        message: `You sent Rs. ${amount} to ${recipientName}`,
        relatedTransaction: debitTx._id,
    });

    return {
        debitTransactionId: debitTx._id,
        creditTransactionId: creditTx._id,
        senderName,
        senderEmail: sender.email,
        recipientId: recipient._id.toString(),
        amount,
    };
}

router.post('/transfer', authMiddleware, async (req, res) => {
    // Validate input with Zod before starting session
    let validatedData;
    try {
        validatedData = transferSchema.parse(req.body);
    } catch (error) {
        if (error instanceof zod.ZodError) {
            return res.status(400).json({ message: error.issues[0]?.message || 'Invalid data' });
        }
        return res.status(400).json({ message: 'Invalid data' });
    }

    const { recipientEmail, amount } = validatedData;
    let session = null;
    let transferResult = null;

    try {
        session = await mongoose.startSession();
        await session.withTransaction(async () => {
            // Find sender user
            const sender = await User.findById(req.user).session(session);
            if (!sender) {
                const err = new Error('Sender user not found');
                err.statusCode = 404;
                throw err;
            }

            // (1) Find sender's bank account and check balance
            const senderBank = await Bank.findOne({ user: req.user }).session(session);
            if (!senderBank) {
                const err = new Error('Sender bank account not found');
                err.statusCode = 404;
                throw err;
            }

            if (senderBank.balance < amount) {
                const err = new Error('Insufficient balance');
                err.statusCode = 400;
                throw err;
            }

            // (2) Find recipient user and recipient's bank account
            const recipient = await User.findOne({ email: recipientEmail }).session(session);
            if (!recipient) {
                const err = new Error('Recipient not found');
                err.statusCode = 404;
                throw err;
            }

            if (recipient._id.toString() === req.user.toString()) {
                const err = new Error('Cannot transfer money to yourself');
                err.statusCode = 400;
                throw err;
            }

            const recipientBank = await Bank.findOne({ user: recipient._id }).session(session);
            if (!recipientBank) {
                const err = new Error('Recipient bank account not found');
                err.statusCode = 404;
                throw err;
            }

            // (3) Deduct amount from sender and add to recipient using Bank.findOneAndUpdate with session
            await Bank.findOneAndUpdate(
                { user: req.user },
                { $inc: { balance: -amount } },
                { session }
            );

            await Bank.findOneAndUpdate(
                { user: recipient._id },
                { $inc: { balance: amount } },
                { session }
            );

            // (4) Create debit transaction record for sender and credit transaction record for recipient
            const [debitTx] = await Transaction.create([
                {
                    sender: req.user,
                    recipient: recipient._id,
                    amount,
                    type: 'debit',
                    status: 'completed',
                    description: 'Money Transfer',
                }
            ], { session });

            const [creditTx] = await Transaction.create([
                {
                    sender: req.user,
                    recipient: recipient._id,
                    amount,
                    type: 'credit',
                    status: 'completed',
                    description: 'Money Transfer',
                }
            ], { session });

            const senderName = `${sender.firstName} ${sender.lastName}`.trim() || 'Someone';
            const recipientName = `${recipient.firstName} ${recipient.lastName}`.trim() || recipient.email;

            // (1) Create Notification for recipient (money_received) inside session
            await Notification.create([
                {
                    user: recipient._id,
                    type: 'money_received',
                    title: 'Money Received',
                    message: `You received Rs. ${amount} from ${senderName}`,
                    relatedTransaction: creditTx._id,
                }
            ], { session });

            // (2) Create Notification for sender (money_sent) inside session
            await Notification.create([
                {
                    user: req.user,
                    type: 'money_sent',
                    title: 'Money Sent',
                    message: `You sent Rs. ${amount} to ${recipientName}`,
                    relatedTransaction: debitTx._id,
                }
            ], { session });

            transferResult = {
                debitTransactionId: debitTx._id,
                creditTransactionId: creditTx._id,
                senderName,
                senderEmail: sender.email,
                recipientId: recipient._id.toString(),
                amount,
            };
        });

        // (3) Emit Socket.io event after transaction commit
        const io = req.app.get('io');
        if (io && transferResult?.recipientId) {
            io.to(transferResult.recipientId).emit('money:received', {
                amount: transferResult.amount,
                senderName: transferResult.senderName,
                senderEmail: transferResult.senderEmail,
                transactionId: transferResult.creditTransactionId,
                timestamp: new Date(),
            });
        }

        return res.status(200).json({
            message: 'Transfer successful',
            transactionId: transferResult.debitTransactionId,
        });
    } catch (error) {
        // Fallback for standalone MongoDB
        const isStandaloneError =
            error.code === 20 ||
            error.codeName === 'IllegalOperation' ||
            error.message?.includes('replica set') ||
            error.message?.includes('Transaction numbers are only allowed');

        if (isStandaloneError) {
            try {
                const fallbackResult = await executeStandaloneTransfer({
                    senderId: req.user,
                    recipientEmail,
                    amount,
                });

                // Emit Socket.io event for standalone fallback
                const io = req.app.get('io');
                if (io && fallbackResult?.recipientId) {
                    io.to(fallbackResult.recipientId).emit('money:received', {
                        amount: fallbackResult.amount,
                        senderName: fallbackResult.senderName,
                        senderEmail: fallbackResult.senderEmail,
                        transactionId: fallbackResult.creditTransactionId,
                        timestamp: new Date(),
                    });
                }

                return res.status(200).json({
                    message: 'Transfer successful',
                    transactionId: fallbackResult.debitTransactionId,
                });
            } catch (fallbackError) {
                console.error('Standalone transfer error:', fallbackError);
                if (fallbackError.statusCode) {
                    return res.status(fallbackError.statusCode).json({ message: fallbackError.message });
                }
                return res.status(500).json({ message: 'Server error' });
            }
        }

        console.error(error);
        if (error.statusCode) {
            return res.status(error.statusCode).json({ message: error.message });
        }
        res.status(500).json({ message: 'Server error' });
    } finally {
        if (session) {
            try {
                await session.endSession();
            } catch (_e) {
                // Session cleanup
            }
        }
    }
});

router.get('/history', authMiddleware, async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page, 10) || 1);
        const parsedLimit = parseInt(req.query.limit, 10);
        const limit = Math.min(50, Math.max(1, isNaN(parsedLimit) || parsedLimit <= 0 ? 10 : parsedLimit));
        const skip = (page - 1) * limit;

        const type = req.query.type ? req.query.type.toString().trim().toLowerCase() : undefined;

        let query = {};
        if (type === 'debit') {
            query = {
                $or: [
                    { sender: req.user, type: 'debit' },
                    { recipient: req.user, type: 'debit' }
                ]
            };
        } else if (type === 'credit') {
            query = {
                $or: [
                    { sender: req.user, type: 'credit' },
                    { recipient: req.user, type: 'credit' }
                ]
            };
        } else if (type && type !== 'all') {
            query = {
                $or: [{ sender: req.user }, { recipient: req.user }],
                type: type
            };
        } else {
            // 'all' or no filter specified
            query = {
                $or: [
                    { sender: req.user, type: 'debit' },
                    { recipient: req.user, type: 'credit' },
                    { sender: req.user, type: { $nin: ['debit', 'credit'] } },
                    { recipient: req.user, type: { $nin: ['debit', 'credit'] } }
                ]
            };
        }

        const totalCount = await Transaction.countDocuments(query);
        const totalPages = Math.ceil(totalCount / limit);
        const hasNextPage = page < totalPages;

        const transactions = await Transaction.find(query)
            .populate('sender', 'firstName lastName email')
            .populate('recipient', 'firstName lastName email')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        res.status(200).json({
            transactions,
            totalCount,
            currentPage: page,
            totalPages,
            hasNextPage,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;