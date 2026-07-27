import { useState } from 'react';
import { Lock, User, Plus } from 'lucide-react';
import Swal from 'sweetalert2';

export default function LoginPage({ onLogin }) {
  const savedUsername = localStorage.getItem('pos_auth_username');
  const savedPassword = localStorage.getItem('pos_auth_password');
  const hasAccount = !!(savedUsername && savedPassword);

  const [mode, setMode] = useState(hasAccount ? 'login' : 'register');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');

    const actualUname = localStorage.getItem('pos_auth_username');
    const actualPwd = localStorage.getItem('pos_auth_password');

    if (!actualUname || !actualPwd) {
      setMode('register');
      setError('Belum ada akun. Silakan buat akun baru terlebih dahulu.');
      return;
    }

    if (username === actualUname && password === actualPwd) {
      localStorage.setItem('pos_auth_logged_in', 'true');
      if (onLogin) onLogin();
    } else {
      setError('Username atau password salah');
      Swal.fire({
        icon: 'error',
        title: 'Gagal Login',
        text: 'Username atau password salah!',
        showCloseButton: true,
        background: 'var(--surface)',
        color: 'var(--text)',
      });
    }
  };

  const handleRegister = (e) => {
    e.preventDefault();
    setError('');

    if (!username.trim()) {
      setError('Username tidak boleh kosong');
      return;
    }
    if (password.length < 4) {
      setError('Password minimal 4 karakter');
      return;
    }
    if (password !== confirmPassword) {
      setError('Password dan konfirmasi password tidak sama');
      return;
    }

    localStorage.setItem('pos_auth_username', username.trim());
    localStorage.setItem('pos_auth_password', password);
    localStorage.setItem('pos_auth_logged_in', 'true');

    Swal.fire({
      icon: 'success',
      title: 'Akun Berhasil Dibuat!',
      text: `Selamat datang ${username.trim()}. Anda sudah otomatis masuk.`,
      timer: 2000,
      showConfirmButton: false,
      background: 'var(--surface)',
      color: 'var(--text)',
    });

    if (onLogin) onLogin();
  };

  const handleReset = () => {
    Swal.fire({
      title: 'Reset Username & Password?',
      text: 'Data username & password lama akan dihapus, lalu Anda buat akun baru. Data laundry TIDAK akan terhapus.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: 'var(--red)',
      cancelButtonColor: 'var(--border-2)',
      confirmButtonText: 'Ya, Reset Akun',
      cancelButtonText: 'Batal',
      showCloseButton: true,
      background: 'var(--surface)',
      color: 'var(--text)',
    }).then((result) => {
      if (result.isConfirmed) {
        localStorage.removeItem('pos_auth_username');
        localStorage.removeItem('pos_auth_password');
        localStorage.removeItem('pos_auth_logged_in');
        setMode('register');
        setUsername('');
        setPassword('');
        setConfirmPassword('');
        setError('');
        Swal.fire({
          icon: 'success',
          title: 'Akun Direset!',
          text: 'Silakan buat akun baru.',
          timer: 1500,
          showConfirmButton: false,
          background: 'var(--surface)',
          color: 'var(--text)',
        });
      }
    });
  };

  const switchMode = (e) => {
    e.preventDefault();
    setMode(mode === 'login' ? 'register' : 'login');
    setUsername('');
    setPassword('');
    setConfirmPassword('');
    setError('');
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
            {mode === 'login' ? (
              <Lock size={26} style={{ color: 'var(--text)' }} />
            ) : (
              <Plus size={26} style={{ color: 'var(--text)' }} />
            )}
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', marginBottom: 4, letterSpacing: '-0.02em' }}>
            {mode === 'login' ? 'Login POS Laundry' : 'Buat Akun Baru'}
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-3)' }}>
            {mode === 'login'
              ? 'Masukkan username dan password untuk melanjutkan'
              : 'Buat akun admin untuk mengakses POS Laundry'}
          </p>
        </div>

        <form
          onSubmit={mode === 'login' ? handleLogin : handleRegister}
          style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
        >
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

          {mode === 'register' && (
            <div>
              <label className="field-label">Konfirmasi Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{
                  position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                  color: 'var(--text-3)', pointerEvents: 'none',
                }} />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ketik ulang password"
                  className="field-input"
                  style={{ paddingLeft: 38 }}
                  required
                />
              </div>
            </div>
          )}

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
            {mode === 'login' ? 'Masuk' : 'Buat Akun & Masuk'}
          </button>
        </form>

        <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {mode === 'login' ? (
            <>
              <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-3)', margin: 0 }}>
                Lupa akun? <button
                  onClick={handleReset}
                  style={{
                    background: 'none', border: 'none', padding: 0,
                    color: 'var(--text)', fontWeight: 700, cursor: 'pointer',
                    textDecoration: 'underline',
                  }}
                >
                  Reset akun disini
                </button>
              </p>
              {!hasAccount && (
                <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-3)', margin: 0 }}>
                  Belum punya akun? <button
                    onClick={switchMode}
                    style={{
                      background: 'none', border: 'none', padding: 0,
                      color: 'var(--accent)', fontWeight: 700, cursor: 'pointer',
                    }}
                  >
                    Buat akun baru
                  </button>
                </p>
              )}
            </>
          ) : (
            <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-3)', margin: 0 }}>
              Sudah punya akun? <button
                onClick={switchMode}
                style={{
                  background: 'none', border: 'none', padding: 0,
                  color: 'var(--accent)', fontWeight: 700, cursor: 'pointer',
                }}
              >
                Login disini
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
