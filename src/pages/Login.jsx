import { useState } from 'react';
import Swal from 'sweetalert2';
import { LogIn, User, Lock } from 'lucide-react';
import LogoImage from '../assets/nia laundry.png';

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      if (username === 'admin' && password === 'admin123') {
        onLogin();
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Login Gagal',
          text: 'Username atau password yang Anda masukkan salah.',
          confirmButtonColor: 'var(--text)',
        });
      }
      setLoading(false);
    }, 800); // Simulate network delay for a nicer feel
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
      <div className="card animate-fade-in" style={{
        width: '100%',
        maxWidth: 420,
        padding: '40px 32px',
        textAlign: 'center',
        background: 'var(--surface)',
      }}>
        {/* Logo Section */}
        <div style={{ marginBottom: 30 }}>
          <img 
            src={LogoImage} 
            alt="Nia Laundry Logo" 
            style={{ width: 120, height: 'auto', marginBottom: 16, borderRadius: 12 }} 
          />
          <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em', marginBottom: 6 }}>
            Selamat Datang
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-3)' }}>
            Silakan login untuk mengakses sistem POS
          </p>
        </div>

        {/* Form Section */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ textAlign: 'left' }}>
            <label className="field-label">Username</label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }}>
                <User size={18} />
              </div>
              <input
                type="text"
                className="field-input"
                placeholder="Masukkan username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                style={{ paddingLeft: 42 }}
              />
            </div>
          </div>

          <div style={{ textAlign: 'left' }}>
            <label className="field-label">Password</label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }}>
                <Lock size={18} />
              </div>
              <input
                type="password"
                className="field-input"
                placeholder="Masukkan password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ paddingLeft: 42 }}
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', padding: 14, marginTop: 10, fontSize: 15 }}
            disabled={loading}
          >
            {loading ? (
              <span className="animate-pulse-soft">Memeriksa...</span>
            ) : (
              <>
                <LogIn size={18} />
                Masuk
              </>
            )}
          </button>
        </form>

        <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 30 }}>
          &copy; {new Date().getFullYear()} Nia Laundry POS. All rights reserved.
        </p>
      </div>
    </div>
  );
}
