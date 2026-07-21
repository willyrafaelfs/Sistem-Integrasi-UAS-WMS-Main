import React, { useEffect, useState } from 'react';
import { Layers } from 'lucide-react';
import api from '../services/api';

const ERRORS = {
  google_failed: 'Login Google gagal. Silakan coba lagi.',
  inactive: 'Akun Anda tidak aktif. Silakan hubungi admin.',
};

const AuthCallback = () => {
  const [error, setError] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const err = params.get('error');

    if (err) {
      setError(ERRORS[err] || 'Login gagal.');
      setTimeout(() => { window.location.href = '/login'; }, 2500);
      return;
    }

    if (!token) {
      window.location.href = '/login';
      return;
    }

    localStorage.setItem('wms_token', token);
    api.getUser()
      .then((user) => {
        localStorage.setItem('wms_user', JSON.stringify(user));
        window.location.href = '/';
      })
      .catch(() => {
        localStorage.removeItem('wms_token');
        setError('Gagal memuat data pengguna.');
        setTimeout(() => { window.location.href = '/login'; }, 2500);
      });
  }, []);

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--bg-base)', color: 'var(--text-primary)', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1.5rem' }}>
      <Layers size={56} color="var(--primary)" />
      <p style={{ color: 'var(--text-secondary)' }}>
        {error || 'Menyelesaikan login...'}
      </p>
    </div>
  );
};

export default AuthCallback;
