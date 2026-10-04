import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';

export default function AuthPage() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      if (mode === 'login') await login(form.email, form.password);
      else await register(form.username, form.email, form.password);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="center">
      <form className="auth-card" onSubmit={onSubmit}>
        <h1>💬 ChatApp</h1>
        <p className="muted">{mode === 'login' ? 'Sign in to continue' : 'Create your account'}</p>

        {mode === 'register' && (
          <input name="username" placeholder="Username" value={form.username} onChange={onChange} required minLength={3} />
        )}
        <input name="email" type="email" placeholder="Email" value={form.email} onChange={onChange} required />
        <input
          name="password"
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={onChange}
          required
          minLength={6}
        />

        {error && <div className="error">{error}</div>}

        <button type="submit" disabled={busy}>
          {busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Sign up'}
        </button>

        <p className="muted switch">
          {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
          <a href="#" onClick={(e) => (e.preventDefault(), setError(''), setMode(mode === 'login' ? 'register' : 'login'))}>
            {mode === 'login' ? 'Sign up' : 'Sign in'}
          </a>
        </p>
      </form>
    </div>
  );
}
