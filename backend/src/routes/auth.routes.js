const express = require('express');
const router = express.Router();
const { User, Bank } = require('../models/schema');
const authMiddleware = require('../middleware/authMiddleware');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const zod = require('zod');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'paytm-dev-secret';

const registerSchema = zod.object({
    firstName: zod.string().min(1, 'First name is required'),
    lastName: zod.string().min(1, 'Last name is required'),
    email: zod.string().email('Invalid email address'),
    password: zod.string().min(6, 'Password must be at least 6 characters long'),
});

router.post('/register', async (req, res) => {
    try {
        const { firstName, lastName, email, password } = registerSchema.parse(req.body);

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ message: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await User.create({
            email,
            firstName,
            lastName,
            password: hashedPassword,
        });

        await Bank.create({
            user: newUser._id,
            balance: Math.floor(1 + Math.random() * 1000),
        });

        const token = jwt.sign({ id: newUser._id }, JWT_SECRET, { expiresIn: '1h' });

        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: {
                id: newUser._id,
                firstName: newUser.firstName,
                lastName: newUser.lastName,
                email: newUser.email,
            },
        });
    } catch (error) {
        if (error instanceof zod.ZodError) {
            return res.status(400).json({ message: error.issues[0]?.message || 'Invalid data' });
        }

        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

const loginSchema = zod.object({
    email: zod.string().email('Invalid email address'),
    password: zod.string().min(6, 'Password must be at least 6 characters long'),
});

router.post('/login', async (req, res) => {
    try {
        const { email, password } = loginSchema.parse(req.body);
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '1h' });

        res.status(200).json({
            token,
            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
            },
        });
    } catch (error) {
        if (error instanceof zod.ZodError) {
            return res.status(400).json({ message: error.issues[0]?.message || 'Invalid data' });
        }

        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

const updateSchema = zod.object({
    firstName: zod.string().min(1, 'First name is required').optional(),
    lastName: zod.string().min(1, 'Last name is required').optional(),
    password: zod.string().min(6, 'Password must be at least 6 characters long').optional(),
}).refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field is required',
});

router.put('/update', authMiddleware, async (req, res) => {
    try {
        const updates = updateSchema.parse(req.body);

        if (updates.password) {
            updates.password = await bcrypt.hash(updates.password, 10);
        }

        const updatedUser = await User.findByIdAndUpdate(req.user, updates, {
            new: true,
            runValidators: true,
        }).select('-password');

        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({
            message: 'User updated successfully',
            user: updatedUser,
        });
    } catch (error) {
        if (error instanceof zod.ZodError) {
            return res.status(400).json({ message: error.issues[0]?.message || 'Invalid data' });
        }

        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.get('/me', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user).select('-password');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({ user });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.get('/user/bulk', authMiddleware, async (req, res) => {
    try {
        const filter = req.query.filter || req.query.fillter || '';
        const users = await User.find({
            _id: { $ne: req.user },
            $or: [
                { firstName: { $regex: filter, $options: 'i' } },
                { lastName: { $regex: filter, $options: 'i' } },
                { email: { $regex: filter, $options: 'i' } },
            ],
        }).select('firstName lastName email');

        res.status(200).json({ users });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
