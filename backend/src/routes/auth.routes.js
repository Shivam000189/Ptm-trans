const express = require('express');
const router = express.Router();
const User = require('../models/schema');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const zod = require('zod');
require('dotenv').config();


const registerSchema = zod.object({
    firstName: zod.string().min(1, 'First name is required'),
    lastName: zod.string().min(1, 'Last name is required'),
    email: zod.string().email('Invalid email address'),
    password: zod.string().min(6, 'Password must be at least 6 characters long'),
});



router.post('/register', async (req, res) => {
    try{
        const { firstName, lastName, email, password } = registerSchema.parse(req.body);
        if(!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        if(!firstName || !lastName) {
            return res.status(400).json({ message: 'First name and last name are required' });
        }

        let user = await User.findOne({ email });
        if(user) {
            return res.status(411).json({ message: 'User already exists' });
        }


        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser =await User.create({
            email,
            firstName,
            lastName,
            password: hashedPassword
        });
        res.status(201).json({ message: 'User registered successfully', newUser });
    }catch (error) {
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
        if(!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        const user = await User.findOne({ email });
        if(!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if(!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.status(200).json({ token });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});


const updateSchema = zod.object({
    firstName: zod.string().min(1, 'First name is required'),
    lastName: zod.string().min(1, 'Last name is required'),
    password: zod.string().min(6, 'Password must be at least 6 characters long')
});

router.put('/update', async (req, res) => {
    try {
        const { updated } = updateSchema.parse(req.body);
        const { id } = req.user;

        const updatedUser = await User.findByIdAndUpdate(id, req.body, { new: true });
        if(!updatedUser) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json({ message: 'User updated successfully', updatedUser });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});



router.get('/user/bulk', async (req, res) => {
    try {
        const fillter = req.query.fillter|| '';
        const user = await User.find({ $or: [{ 'firstName': { $regex: fillter, $options: 'i' } }, { 'lastName': { $regex: fillter, $options: 'i' } }] });
        if(!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json({ user });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;