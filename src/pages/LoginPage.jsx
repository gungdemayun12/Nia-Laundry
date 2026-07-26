import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User } from 'lucide-react';
import Swal from 'sweetalert2';

export default function LoginPage({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const savedUsername = localStorage.getItem('pos_auth_username');
    if (!savedUsername) {
      navigate('/pengaturan');
    }
  }, [navigate]);

  const handleLogin = (e) => {
    e.preventDefault();
    const savedUsername = localStorage.getItem('pos_auth_username');
    const savedPassword = localStorage.getItem('pos_auth_password');

    if (!savedUsername || !savedPassword) {
      navigate('/pengaturan');
      return;
    }

    if (username === savedUsername && password === savedPassword) {
      localStorage.setItem('pos_auth_logged_in', 'true');
      if (onLogin) onLogin();
      navigate('/');
    } else {
      setError('Username atau password salah');
      Swal.fire({
        icon: 'error',
        title: 'Gagal',
        text: 'Username atau password salah!',
        showCloseButton: true,
        background: 'var(--surface)',
        color: 'var(--text)',
      });
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg)',
      padding: 20,
    }}>
      <div style={{
        width: '100%',
        maxWidth: 400,
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        boxShadow: 'var(--shadow-lg)',
        padding: '32px 28px',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16,
            background: 'var(--accent-bg)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
            border: '2px solid var(--accent-border)',
          }}>
            <Lock size={26} style={{ color: 'var(--text)' }} />
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', marginBottom: 4, letterSpacing: '-0.02em' }}>
            Login POS Laundry
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-3)' }}>
            Masukkan username dan password untuk melanjutkan
          </p>
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label className="field-label">Username</label>
            <div style={{ position: 'relative' }}>
              <User size={16} style={{
                position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                color: 'var(--text-3)', pointerEvents: 'none',
              }} />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Masukkan username"
                className="field-input"
                style={{ paddingLeft: 38 }}
                autoFocus
                required
              />
            </div>
          </div>

          <div>
            <label className="field-label">Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{
                position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                color: 'var(--text-3)', pointerEvents: 'none',
              }} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password"
                className="field-input"
                style={{ paddingLeft: 38 }}
                required
              />
            </div>
          </div>

          {error && (
            <div style={{
              padding: '10px 14px',
              borderRadius: 10,
              background: 'var(--red-bg)',
              border: '1px solid var(--red-border)',
              color: 'var(--red)',
              fontSize: 13,
              fontWeight: 600,
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            style={{
              width: '100%',
              padding: '12px 20px',
              fontSize: 14,
              fontWeight: 700,
              marginTop: 4,
            }}
          >
            Masuk
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: 'var(--text-3)' }}>
          Belum punya akun? Buka <strong style={{ color: 'var(--text)' }}>Pengaturan</strong> untuk membuat username dan password.
        </p>
      </div>
    </div>
  );
}