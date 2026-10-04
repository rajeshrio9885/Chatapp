import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import Avatar from './Avatar.jsx';

export default function Sidebar({ users, onlineIds, typingFrom, selectedId, onSelect }) {
  const { user, logout } = useAuth();
  const [query, setQuery] = useState('');

  const filtered = users.filter((u) => u.username.toLowerCase().includes(query.toLowerCase()));

  return (
    <aside className="sidebar">
      <header className="sidebar-header">
        <div className="me">
          <Avatar name={user.username} online />
          <strong>{user.username}</strong>
        </div>
        <button className="link" onClick={logout}>
          Log out
        </button>
      </header>

      <input className="search" placeholder="Search users…" value={query} onChange={(e) => setQuery(e.target.value)} />

      <ul className="user-list">
        {filtered.length === 0 && <li className="muted empty">No users found</li>}
        {filtered.map((u) => (
          <li key={u._id} className={u._id === selectedId ? 'active' : ''} onClick={() => onSelect(u)}>
            <Avatar name={u.username} online={onlineIds.has(u._id)} />
            <div className="user-info">
              <div className="row">
                <span className="name">{u.username}</span>
                {u.unread > 0 && <span className="badge">{u.unread}</span>}
              </div>
              <div className="preview muted">
                {typingFrom.has(u._id) ? (
                  <em className="typing">typing…</em>
                ) : u.lastMessage ? (
                  (u.lastMessage.sender === user._id ? 'You: ' : '') + u.lastMessage.text
                ) : (
                  'No messages yet'
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </aside>
  );
}
