import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { api, getToken, setToken } from '../api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);

  // Restore session from a stored token
  useEffect(() => {
    if (!getToken()) return setLoading(false);
    api('/auth/me')
      .then(({ user }) => setUser(user))
      .catch(() => setToken(null))
      .finally(() => setLoading(false));
  }, []);

  // Open one socket connection per logged-in session
  useEffect(() => {
    if (!user) return;
    const s = io({ auth: { token: getToken() } });
    setSocket(s);
    return () => {
      s.disconnect();
      setSocket(null);
    };
  }, [user]);

  const authenticate = async (path, body) => {
    const { token, user } = await api(path, { method: 'POST', body });
    setToken(token);
    setUser(user);
  };

  const value = {
    user,
    socket,
    loading,
    login: (email, password) => authenticate('/auth/login', { email, password }),
    register: (username, email, password) => authenticate('/auth/register', { username, email, password }),
    logout: () => {
      setToken(null);
      setUser(null);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
