const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    amount: {
        type: Number,
        required: true,
        min: 0.01,
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'failed'],
        default: 'completed',
    },
    type: {
        type: String,
        enum: ['debit', 'credit'],
        required: true,
    },
    description: {
        type: String,
        default: 'Money Transfer',
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
    },
});

// Indexes for fast querying
transactionSchema.index({ sender: 1 });
transactionSchema.index({ recipient: 1 });
transactionSchema.index({ createdAt: -1 });

// Update updatedAt timestamp before saving
transactionSchema.pre('save', function (next) {
    this.updatedAt = new Date();
    if (typeof next === 'function') next();
});

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction;
module.exports.Transaction = Transaction;
