import mongoose from 'mongoose';
import { verifyToken } from './middleware/auth.js';
import User from './models/User.js';
import Message from './models/Message.js';

// userId -> number of open sockets (a user may have several tabs open)
const online = new Map();

export function registerSocketHandlers(io) {
  // Authenticate every socket with the JWT passed in the handshake
  io.use((socket, next) => {
    try {
      const { token } = socket.handshake.auth || {};
      socket.userId = verifyToken(token).id;
      next();
    } catch {
      next(new Error('Unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.userId;

    // Each user joins a room named after their id, so we can target all their tabs
    socket.join(userId);
    online.set(userId, (online.get(userId) || 0) + 1);
    if (online.get(userId) === 1) socket.broadcast.emit('user:online', userId);
    socket.emit('users:online', [...online.keys()]);

    socket.on('message:send', async ({ to, text } = {}, ack) => {
      try {
        if (!mongoose.isValidObjectId(to) || !text?.trim()) throw new Error('Invalid message');
        const message = await Message.create({ sender: userId, receiver: to, text: text.trim() });
        const payload = message.toObject();
        io.to(to).to(userId).emit('message:new', payload);
        ack?.({ ok: true, message: payload });
      } catch (err) {
        ack?.({ ok: false, error: err.message });
      }
    });

    socket.on('messages:read', async ({ from } = {}) => {
      if (!mongoose.isValidObjectId(from)) return;
      const { modifiedCount } = await Message.updateMany(
        { sender: from, receiver: userId, read: false },
        { $set: { read: true } }
      );
      if (modifiedCount > 0) io.to(from).emit('messages:read', { by: userId });
    });

    socket.on('typing:start', ({ to } = {}) => to && socket.to(to).emit('typing:start', { from: userId }));
    socket.on('typing:stop', ({ to } = {}) => to && socket.to(to).emit('typing:stop', { from: userId }));

    socket.on('disconnect', async () => {
      const count = (online.get(userId) || 1) - 1;
      if (count > 0) {
        online.set(userId, count);
        return;
      }
      online.delete(userId);
      const lastSeen = new Date();
      await User.findByIdAndUpdate(userId, { lastSeen }).catch(() => {});
      io.emit('user:offline', { userId, lastSeen });
    });
  });
}
