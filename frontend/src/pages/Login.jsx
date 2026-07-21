import React, { useState } from 'react';
import { Layers, Lock, User } from 'lucide-react';
import api from '../services/api';

const Login = () => {
  const [username, setUsername] = useState('superadmin');
  const [password, setPassword] = useState('password');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGoogleLogin = () => {
    window.location.href = api.googleLoginUrl();
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const res = await api.login({ username, password });
      localStorage.setItem('wms_token', res.token);
      localStorage.setItem('wms_user', JSON.stringify(res.user));
      window.location.href = '/';
    } catch (err) {
      setError(err.data?.message || 'Login gagal. Periksa username dan password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--bg-base)', color: 'var(--text-primary)', alignItems: 'center', justifyContent: 'center' }}>
      <div className="glass-panel" style={{ width: '400px', padding: '2.5rem', borderRadius: '16px', textAlign: 'center', boxShadow: 'var(--shadow-lg)' }}>
        <div style={{ marginBottom: '2rem' }}>
          <Layers size={56} color="var(--primary)" style={{ marginBottom: '1rem', dropShadow: '0 4px 6px rgba(99, 102, 241, 0.3)' }} />
          <h2 style={{ margin: 0, fontSize: '1.8rem' }}>Aero<span style={{ color: 'var(--primary)' }}>WMS</span></h2>
          <p className="text-muted" style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Enterprise Login</p>
        </div>
        
        {error && <div style={{ background: 'var(--danger-transparent)', color: 'var(--danger)', padding: '0.8rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.9rem', fontWeight: '500' }}>{error}</div>}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.8rem 1rem', transition: 'var(--transition)' }}>
            <User size={20} style={{ color: 'var(--text-muted)', marginRight: '0.8rem' }} />
            <input 
              type="text" 
              placeholder="Username" 
              value={username}
              onChange={e => setUsername(e.target.value)}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', width: '100%', outline: 'none', fontSize: '1rem' }}
              required 
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.8rem 1rem', transition: 'var(--transition)' }}>
            <Lock size={20} style={{ color: 'var(--text-muted)', marginRight: '0.8rem' }} />
            <input 
              type="password" 
              placeholder="Password" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', width: '100%', outline: 'none', fontSize: '1rem' }}
              required 
            />
          </div>

          <button type="submit" style={{ marginTop: '1rem', padding: '1rem', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: '600', cursor: 'pointer', transition: 'var(--transition)', boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)' }} disabled={loading}>
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '1.5rem 0' }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
          <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>atau</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
        </div>

        <button
          type="button"
          onClick={handleGoogleLogin}
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', padding: '0.9rem', background: '#fff', color: '#1f2937', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '0.95rem', fontWeight: '600', cursor: 'pointer', transition: 'var(--transition)' }}
        >
          <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
          </svg>
          Sign in with Google
        </button>

        <div style={{ marginTop: '2.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          <p style={{ marginBottom: '1rem', fontWeight: '500' }}>Quick Access Demo Accounts:</p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem' }}>
            <span style={{cursor: 'pointer', color: 'var(--primary)', fontWeight: '600', padding: '0.3rem 0.6rem', background: 'var(--primary-transparent)', borderRadius: '4px'}} onClick={() => setUsername('superadmin')}>SuperAdmin</span>
            <span style={{cursor: 'pointer', color: 'var(--primary)', fontWeight: '600', padding: '0.3rem 0.6rem', background: 'var(--primary-transparent)', borderRadius: '4px'}} onClick={() => setUsername('manager')}>Manager</span>
            <span style={{cursor: 'pointer', color: 'var(--primary)', fontWeight: '600', padding: '0.3rem 0.6rem', background: 'var(--primary-transparent)', borderRadius: '4px'}} onClick={() => setUsername('operator')}>Operator</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
