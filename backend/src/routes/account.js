const express = require('express');
const router = express.Router();
const { User, Bank } = require('../models/schema');
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

router.post('/transfer', authMiddleware, async (req, res) => {
    const transferSchema = zod.object({
        recipientEmail: zod.string().email('Invalid email address'),
        amount: zod.number().positive('Amount must be a positive number'),
    });

    try {
        const { recipientEmail, amount } = transferSchema.parse(req.body);
        const recipient = await User.findOne({ email: recipientEmail });
        if (!recipient) {
            return res.status(404).json({ message: 'Recipient not found' });
        }

        const senderBank = await Bank.findOne({ user: req.user });
        if (!senderBank) {
            return res.status(404).json({ message: 'Sender bank account not found' });
        }

        if (senderBank.balance < amount) {
            return res.status(400).json({ message: 'Insufficient balance' });
        }

        const recipientBank = await Bank.findOne({ user: recipient._id });
        if (!recipientBank) {
            return res.status(404).json({ message: 'Recipient bank account not found' });
        }

        senderBank.balance -= amount;
        recipientBank.balance += amount;

        await senderBank.save();
        await recipientBank.save();

        res.status(200).json({ message: 'Transfer successful' });
    } catch (error) {
        if (error instanceof zod.ZodError) {
            return res.status(400).json({ message: error.issues[0]?.message || 'Invalid data' });
        }

        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
    