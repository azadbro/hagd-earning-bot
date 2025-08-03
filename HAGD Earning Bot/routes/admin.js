const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

// Middleware to verify admin token
const verifyAdmin = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (!decoded.isAdmin) {
      return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
    }

    next();
  } catch (error) {
    res.status(400).json({ error: 'Invalid admin token' });
  }
};

// Get all withdrawal requests
router.get('/withdrawals', verifyAdmin, async (req, res) => {
  try {
    const users = await User.find();
    const withdrawals = [];

    users.forEach(user => {
      if (user.withdrawals && user.withdrawals.length > 0) {
        user.withdrawals.forEach((withdrawal, index) => {
          withdrawals.push({
            _id: withdrawal._id || `${user.id}_${index}`,
            userId: user.id,
            telegramId: user.telegramId,
            username: user.username,
            amount: withdrawal.amount,
            binanceUid: withdrawal.binanceUid,
            status: withdrawal.status,
            requestedAt: withdrawal.requestedAt,
            processedAt: withdrawal.processedAt,
            adminNote: withdrawal.adminNote
          });
        });
      }
    });

    // Sort by request date (newest first)
    withdrawals.sort((a, b) => new Date(b.requestedAt) - new Date(a.requestedAt));

    res.json(withdrawals);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch withdrawal requests' });
  }
});

// Update withdrawal status
router.put('/withdrawals/:withdrawalId', verifyAdmin, async (req, res) => {
  try {
    const { withdrawalId } = req.params;
    const { status, adminNote } = req.body;

    if (!['pending', 'completed', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    // Find user with the withdrawal
    const users = await User.find();
    let targetUser = null;
    let withdrawalIndex = -1;

    for (const user of users) {
      if (user.withdrawals && user.withdrawals.length > 0) {
        const index = user.withdrawals.findIndex(w => 
          (w._id && w._id.toString() === withdrawalId) || 
          `${user.id}_${user.withdrawals.indexOf(w)}` === withdrawalId
        );
        if (index !== -1) {
          targetUser = user;
          withdrawalIndex = index;
          break;
        }
      }
    }

    if (!targetUser || withdrawalIndex === -1) {
      return res.status(404).json({ error: 'Withdrawal request not found' });
    }

    // Update withdrawal
    const withdrawal = targetUser.withdrawals[withdrawalIndex];
    withdrawal.status = status;
    withdrawal.processedAt = new Date();
    if (adminNote) withdrawal.adminNote = adminNote;

    // If rejected, refund the amount
    if (status === 'rejected') {
      targetUser.hagdBalance += withdrawal.amount;
    }

    await targetUser.save();

    res.json({
      success: true,
      message: `Withdrawal ${status} successfully`
    });
  } catch (error) {
    console.error('Error updating withdrawal:', error);
    res.status(500).json({ error: 'Failed to update withdrawal status' });
  }
});

// Get all users
router.get('/users', verifyAdmin, async (req, res) => {
  try {
    const users = await User.find();
    
    // Filter and sort users
    const filteredUsers = users.map(user => ({
      id: user.id,
      telegramId: user.telegramId,
      username: user.username,
      firstName: user.firstName,
      hagdBalance: user.hagdBalance,
      referralCode: user.referralCode,
      totalReferralEarnings: user.totalReferralEarnings,
      createdAt: user.createdAt
    })).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json(filteredUsers);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Update user balance
router.put('/users/:telegramId/balance', verifyAdmin, async (req, res) => {
  try {
    const { telegramId } = req.params;
    const { amount, operation } = req.body; // operation: 'add' or 'set'

    const user = await User.findOne({ telegramId });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (operation === 'add') {
      user.hagdBalance += amount;
    } else if (operation === 'set') {
      user.hagdBalance = amount;
    } else {
      return res.status(400).json({ error: 'Invalid operation. Use "add" or "set"' });
    }

    // Ensure balance doesn't go negative
    if (user.hagdBalance < 0) {
      user.hagdBalance = 0;
    }

    await user.save();

    res.json({
      success: true,
      message: 'User balance updated successfully',
      newBalance: user.hagdBalance
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user balance' });
  }
});

// Get admin dashboard stats
router.get('/stats', verifyAdmin, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalHagdInCirculation = await User.aggregate([
      { $group: { _id: null, total: { $sum: '$hagdBalance' } } }
    ]);
    
    const pendingWithdrawals = await User.aggregate([
      { $unwind: '$withdrawals' },
      { $match: { 'withdrawals.status': 'pending' } },
      { $group: { _id: null, count: { $sum: 1 }, totalAmount: { $sum: '$withdrawals.amount' } } }
    ]);

    const completedWithdrawals = await User.aggregate([
      { $unwind: '$withdrawals' },
      { $match: { 'withdrawals.status': 'completed' } },
      { $group: { _id: null, count: { $sum: 1 }, totalAmount: { $sum: '$withdrawals.amount' } } }
    ]);

    res.json({
      totalUsers,
      totalHagdInCirculation: totalHagdInCirculation[0]?.total || 0,
      pendingWithdrawals: {
        count: pendingWithdrawals[0]?.count || 0,
        totalAmount: pendingWithdrawals[0]?.totalAmount || 0
      },
      completedWithdrawals: {
        count: completedWithdrawals[0]?.count || 0,
        totalAmount: completedWithdrawals[0]?.totalAmount || 0
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch admin stats' });
  }
});

module.exports = router;
