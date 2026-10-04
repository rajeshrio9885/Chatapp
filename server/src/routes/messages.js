import { Router } from 'express';
import mongoose from 'mongoose';
import Message from '../models/Message.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// Conversation history with another user
router.get('/:userId', requireAuth, async (req, res, next) => {
  try {
    const { userId } = req.params;
    if (!mongoose.isValidObjectId(userId)) return res.status(400).json({ message: 'Invalid user id' });

    const messages = await Message.find({
      $or: [
        { sender: req.userId, receiver: userId },
        { sender: userId, receiver: req.userId },
      ],
    })
      .sort({ createdAt: 1 })
      .limit(500)
      .lean();

    // Mark incoming messages as read and notify the sender
    const { modifiedCount } = await Message.updateMany(
      { sender: userId, receiver: req.userId, read: false },
      { $set: { read: true } }
    );
    if (modifiedCount > 0) {
      req.app.get('io').to(userId).emit('messages:read', { by: req.userId });
    }

    res.json({ messages });
  } catch (err) {
    next(err);
  }
});

export default router;
