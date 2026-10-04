# ChatApp (MERN + Socket.IO)

Real-time one-to-one chat: JWT auth, live messaging, online/last-seen status, typing indicators, unread counts and read receipts.

## Run

Requires Node 18+ and MongoDB (local or Atlas).

```bash
npm run install:all          # installs root, server and client deps
cp server/.env.example server/.env   # then set MONGO_URI and JWT_SECRET
npm run dev                  # server on :5000, client on :5173
```

Open http://localhost:5173 in two browsers (or one normal + one private window), register two users and chat.

## Structure

```
server/src
  index.js            Express + Socket.IO bootstrap
  socket.js           socket auth, presence, message:send, typing, read receipts
  models/             User, Message (Mongoose)
  routes/             /api/auth, /api/users, /api/messages
  middleware/auth.js  JWT helpers
client/src
  context/AuthContext.jsx   session + socket connection
  pages/                    AuthPage, ChatPage
  components/               Sidebar, ChatWindow, Avatar
```

## Socket events

| Event | Direction | Payload |
|---|---|---|
| `message:send` | client → server (with ack) | `{ to, text }` |
| `message:new` | server → both users | message document |
| `typing:start` / `typing:stop` | both ways | `{ to }` / `{ from }` |
| `messages:read` | both ways | `{ from }` / `{ by }` |
| `users:online`, `user:online`, `user:offline` | server → client | presence updates |
