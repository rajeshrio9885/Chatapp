import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import Avatar from './Avatar.jsx';

const formatTime = (d) => new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const formatLastSeen = (d) => {
  if (!d) return 'offline';
  const date = new Date(d);
  const sameDay = date.toDateString() === new Date().toDateString();
  return `last seen ${sameDay ? 'today' : date.toLocaleDateString()} at ${formatTime(date)}`;
};

export default function ChatWindow({ partner, online, typing, messages, onSend }) {
  const { user, socket } = useAuth();
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const bottomRef = useRef(null);
  const typingTimeout = useRef(null);
  const isTyping = useRef(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  const stopTyping = () => {
    clearTimeout(typingTimeout.current);
    if (isTyping.current) {
      isTyping.current = false;
      socket?.emit('typing:stop', { to: partner._id });
    }
  };

  // Stop the typing indicator if we switch conversations or unmount
  useEffect(() => stopTyping, []); // eslint-disable-line react-hooks/exhaustive-deps

  const onChange = (e) => {
    setText(e.target.value);
    if (!isTyping.current) {
      isTyping.current = true;
      socket?.emit('typing:start', { to: partner._id });
    }
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(stopTyping, 1500);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    stopTyping();
    setText('');
    setError('');
    try {
      await onSend(trimmed);
    } catch (err) {
      setError(err.message);
      setText(trimmed);
    }
  };

  return (
    <main className="chat-window">
      <header className="chat-header">
        <Avatar name={partner.username} online={online} />
        <div>
          <strong>{partner.username}</strong>
          <div className="muted small">{typing ? 'typing…' : online ? 'online' : formatLastSeen(partner.lastSeen)}</div>
        </div>
      </header>

      <div className="messages">
        {messages.length === 0 && <p className="muted center-text">Say hi to {partner.username} 👋</p>}
        {messages.map((m) => {
          const mine = m.sender === user._id;
          return (
            <div key={m._id} className={`bubble ${mine ? 'mine' : 'theirs'}`}>
              <span className="text">{m.text}</span>
              <span className="meta">
                {formatTime(m.createdAt)}
                {mine && <span className={`ticks ${m.read ? 'read' : ''}`}>{m.read ? '✓✓' : '✓'}</span>}
              </span>
            </div>
          );
        })}
        {typing && (
          <div className="bubble theirs typing-bubble">
            <span />
            <span />
            <span />
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {error && <div className="error send-error">{error}</div>}

      <form className="composer" onSubmit={onSubmit}>
        <input placeholder="Type a message…" value={text} onChange={onChange} onBlur={stopTyping} maxLength={2000} autoFocus />
        <button type="submit" disabled={!text.trim()}>
          Send
        </button>
      </form>
    </main>
  );
}
