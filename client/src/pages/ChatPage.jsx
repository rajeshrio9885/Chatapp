import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../api.js';
import Sidebar from '../components/Sidebar.jsx';
import ChatWindow from '../components/ChatWindow.jsx';

export default function ChatPage() {
  const { user, socket } = useAuth();
  const [users, setUsers] = useState([]);
  const [onlineIds, setOnlineIds] = useState(new Set());
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [typingFrom, setTypingFrom] = useState(new Set());

  // Keep the latest selection in a ref so socket handlers never see a stale value
  const selectedRef = useRef(null);
  selectedRef.current = selected;

  useEffect(() => {
    api('/users').then(({ users }) => setUsers(users)).catch(console.error);
  }, []);

  useEffect(() => {
    if (!socket) return;

    const onOnlineList = (ids) => setOnlineIds(new Set(ids));
    const onOnline = (id) => setOnlineIds((prev) => new Set(prev).add(id));
    const onOffline = ({ userId, lastSeen }) => {
      setOnlineIds((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
      setUsers((prev) => prev.map((u) => (u._id === userId ? { ...u, lastSeen } : u)));
    };

    const onNewMessage = (msg) => {
      const current = selectedRef.current;
      const otherId = msg.sender === user._id ? msg.receiver : msg.sender;
      const isOpen = current && current._id === otherId;

      if (isOpen) {
        setMessages((prev) => (prev.some((m) => m._id === msg._id) ? prev : [...prev, msg]));
        if (msg.sender !== user._id) socket.emit('messages:read', { from: otherId });
      }

      setUsers((prev) => {
        const exists = prev.some((u) => u._id === otherId);
        // A brand-new user messaged us: refresh the list
        if (!exists) {
          api('/users').then(({ users }) => setUsers(users));
          return prev;
        }
        return prev.map((u) =>
          u._id === otherId
            ? { ...u, lastMessage: msg, unread: !isOpen && msg.sender !== user._id ? u.unread + 1 : u.unread }
            : u
        );
      });
    };

    const onRead = ({ by }) => {
      if (selectedRef.current?._id === by) {
        setMessages((prev) => prev.map((m) => (m.sender === user._id ? { ...m, read: true } : m)));
      }
    };

    const onTypingStart = ({ from }) => setTypingFrom((prev) => new Set(prev).add(from));
    const onTypingStop = ({ from }) =>
      setTypingFrom((prev) => {
        const next = new Set(prev);
        next.delete(from);
        return next;
      });

    socket.on('users:online', onOnlineList);
    socket.on('user:online', onOnline);
    socket.on('user:offline', onOffline);
    socket.on('message:new', onNewMessage);
    socket.on('messages:read', onRead);
    socket.on('typing:start', onTypingStart);
    socket.on('typing:stop', onTypingStop);

    return () => {
      socket.off('users:online', onOnlineList);
      socket.off('user:online', onOnline);
      socket.off('user:offline', onOffline);
      socket.off('message:new', onNewMessage);
      socket.off('messages:read', onRead);
      socket.off('typing:start', onTypingStart);
      socket.off('typing:stop', onTypingStop);
    };
  }, [socket, user._id]);

  const selectUser = async (u) => {
    setSelected(u);
    setMessages([]);
    setUsers((prev) => prev.map((x) => (x._id === u._id ? { ...x, unread: 0 } : x)));
    try {
      const { messages } = await api(`/messages/${u._id}`);
      if (selectedRef.current?._id === u._id) setMessages(messages);
    } catch (err) {
      console.error(err);
    }
  };

  const sendMessage = (text) =>
    new Promise((resolve, reject) => {
      if (!socket || !selected) return reject(new Error('Not connected'));
      socket.emit('message:send', { to: selected._id, text }, (res) =>
        res?.ok ? resolve(res.message) : reject(new Error(res?.error || 'Failed to send'))
      );
    });

  return (
    <div className="chat-layout">
      <Sidebar
        users={users}
        onlineIds={onlineIds}
        typingFrom={typingFrom}
        selectedId={selected?._id}
        onSelect={selectUser}
      />
      {selected ? (
        <ChatWindow
          key={selected._id}
          partner={users.find((u) => u._id === selected._id) || selected}
          online={onlineIds.has(selected._id)}
          typing={typingFrom.has(selected._id)}
          messages={messages}
          onSend={sendMessage}
        />
      ) : (
        <main className="chat-empty">
          <p className="muted">Select a conversation to start chatting</p>
        </main>
      )}
    </div>
  );
}
