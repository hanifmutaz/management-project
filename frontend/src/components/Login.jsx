import { useState } from 'react';
import Icon from './Icon.jsx';
import { api, setAuth } from '../lib/api.js';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('hanif.mutaz@hirose-gl.com');
  const [password, setPassword] = useState('password123');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setErr('');
    try {
      const { token, user } = await api.login(email, password);
      setAuth(token, user);
      onLogin(user);
    } catch (e2) { setErr(e2.message); }
    setBusy(false);
  };

  return (
    <div className="login-wrap">
      <form className="login-card" onSubmit={submit}>
        <div className="lc-logo"><Icon name="layers" /></div>
        <h2>ProjectHub</h2>
        <p>Project Management, Monitoring &amp; Reporting</p>
        <div className="field"><label>Email</label><input value={email} onChange={(e) => setEmail(e.target.value)} type="email" autoFocus /></div>
        <div className="field"><label>Password</label><input value={password} onChange={(e) => setPassword(e.target.value)} type="password" /></div>
        {err && <div style={{ color: 'var(--red)', fontSize: 12, marginBottom: 12 }}>{err}</div>}
        <button className="btn" style={{ width: '100%', justifyContent: 'center' }} disabled={busy}>
          {busy ? 'Masuk...' : 'Login'}
        </button>
        <div className="hint">Demo login (dari seed):<br />hanif.mutaz@hirose-gl.com / password123</div>
      </form>
    </div>
  );
}
