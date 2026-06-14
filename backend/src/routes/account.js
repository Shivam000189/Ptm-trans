const express = require('express');
const router = express.Router();
const User = require('../models/schema');
const Bank = require('../models/schema');
const Mongoose = require('mongoose');
const authMiddleware = require('../middleware/authMiddleware');
const bcrypt = require('bcryptjs');
const zod = require('zod');



router.get('/balance', authMiddleware, async (req, res) => {
    try {
        const bank = await Bank.findOne({ user: req.user });
        if(!bank) {
            return res.status(404).json({ message: 'Bank account not found' });
        }
        res.status(200).json({ balance: bank.balance });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});


router.post('/transfer', authMiddleware, async (req, res) => {
    const transferSchema = zod.object({
        recipientEmail: zod.string().email('Invalid email address'),
        amount: zod.number().positive('Amount must be a positive number'),
    });

    const { error, value } = transferSchema.safeParse(req.body);
    if (error) {
        return res.status(400).json({ message: error.errors[0].message });
    }

    try {
        const session = await Mongoose.startSession();
        
        
        session.startTransaction();

        const { recipientEmail, amount } = value;

        // Find the recipient user
        const recipient = await User.findOne({ email: recipientEmail });
        if (!recipient) {
            return res.status(404).json({ message: 'Recipient not found' });
        }

        // Find the sender's bank account
        const senderBank = await Bank.findOne({ user: req.user });
        if (!senderBank) {
            return res.status(404).json({ message: 'Sender bank account not found' });
        }

        // Check if sender has sufficient balance
        if (senderBank.balance < amount) {
            return res.status(400).json({ message: 'Insufficient balance' });
        }

        // Perform the transfer
        senderBank.balance -= amount;
        const recipientBank = await Bank.findOne({ user: recipient._id });
        if (!recipientBank) {
            return res.status(404).json({ message: 'Recipient bank account not found' });
        }
        recipientBank.balance += amount;

        // Save the updated balances
        await senderBank.save();
        await recipientBank.save();

        await session.commitTransaction();
        session.endSession();

        res.status(200).json({ message: 'Transfer successful' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;