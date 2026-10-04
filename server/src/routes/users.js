import { Router } from 'express';
import User from '../models/User.js';
import Message from '../models/Message.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// All users except me, with unread count and last message preview
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const users = await User.find({ _id: { $ne: req.userId } }).sort({ username: 1 }).lean();

    const result = await Promise.all(
      users.map(async (u) => {
        const [unread, lastMessage] = await Promise.all([
          Message.countDocuments({ sender: u._id, receiver: req.userId, read: false }),
          Message.findOne({
            $or: [
              { sender: u._id, receiver: req.userId },
              { sender: req.userId, receiver: u._id },
            ],
          })
            .sort({ createdAt: -1 })
            .lean(),
        ]);
        return { _id: u._id, username: u.username, lastSeen: u.lastSeen, unread, lastMessage };
      })
    );

    res.json({ users: result });
  } catch (err) {
    next(err);
  }
});

export default router;
