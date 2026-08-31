const mongoose = require('mongoose');
const Transaction = require('./transaction');
const Notification = require('./notification');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
    },
    firstName: {
        type: String,
        required: true,
    },
    lastName: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
    }
});


const bankSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    balance: {
        type: Number,
        default: 0,
    }
});




const User = mongoose.model('User', userSchema);
const Bank = mongoose.model('Bank', bankSchema);

module.exports = {
	User,
    Bank,
    Transaction,
    Notification
};