import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, PlusCircle, ClipboardList,
  Users, Settings, BarChart3, Menu, X, Shirt, Moon, Sun, Clock, Tag, Archive,
} from 'lucide-react';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/transaksi-baru', label: 'Transaksi Baru', icon: PlusCircle },
  { to: '/pesanan', label: 'Pesanan', icon: ClipboardList },
  { to: '/riwayat-pesanan', label: 'Riwayat Pesanan', icon: Archive },
  { to: '/pelanggan', label: 'Pelanggan', icon: Users },
  { to: '/layanan', label: 'Layanan', icon: Tag },
  { to: '/pengaturan', label: 'Pengaturan', icon: Settings },
  { to: '/laporan', label: 'Laporan', icon: BarChart3 },
];

export default function Layout({ children, darkMode, setDarkMode }) {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const currentPage = navItems.find(
    (n) => n.to === location.pathname ||
      (n.to !== '/' && location.pathname.startsWith(n.to))
  );

  const formatTime = (d) =>
    d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const formatDate = (d) =>
    d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg)' }}>

      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 40,
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(3px)',
          }}
        />
      )}

      {/* Sidebar */}
      <aside style={{
        position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 50,
        width: 240,
        background: 'var(--surface)',
        borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column',
        transform: open ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)',
        boxShadow: 'var(--shadow-lg)',
      }}
        className="lg-sidebar"
      >
        {/* Logo */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '18px 18px 16px',
          borderBottom: '1px solid var(--border)',
        }}>
          <div style={{
            width: 38, height: 38, borderRadius: 11, flexShrink: 0,
            background: 'var(--text)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          }}>
            <Shirt size={19} color="#fff" />
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)', lineHeight: 1.2, letterSpacing: '-0.02em' }}>POS Laundry</p>
            <p style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-3)', marginTop: 2 }}>Point of Sale</p>
          </div>
          <button
            onClick={() => setOpen(false)}
            style={{ marginLeft: 'auto', padding: 6, color: 'var(--text-3)', background: 'none', border: 'none', cursor: 'pointer', borderRadius: 6 }}
            className="lg-hide"
          >
            <X size={16} />
          </button>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 10px', overflowY: 'auto' }}>
          <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-3)', padding: '4px 12px 8px' }}>Menu</p>
          {navItems.map(({ to, label, icon: Icon }) => {
            const active = location.pathname === to ||
              (to !== '/' && location.pathname.startsWith(to));
            return (
              <NavLink
                key={to}
                to={to}
                onClick={() => setOpen(false)}
                style={() => ({
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 14px', borderRadius: 10, marginBottom: 3,
                  fontSize: 13, fontWeight: active ? 700 : 500,
                  textDecoration: 'none',
                  background: active ? 'var(--accent-bg)' : 'transparent',
                  color: active ? 'var(--text)' : 'var(--text-2)',
                  border: active ? '1.5px solid var(--accent-border)' : '1.5px solid transparent',
                  transition: 'all 0.15s',
                })}
                onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = 'var(--surface-2)'; }}
                onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'transparent'; }}
              >
                <Icon size={16} style={{ color: active ? 'var(--text)' : 'var(--text-3)', flexShrink: 0 }} />
                <span style={{ flex: 1 }}>{label}</span>
                {active && (
                  <span style={{
                    width: 6, height: 6,
                    borderRadius: '50%', background: 'var(--text)',
                  }} />
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Clock + Dark toggle */}
        <div style={{ padding: '12px 10px', borderTop: '1px solid var(--border)' }}>
          <div style={{
            display: 'flex', flexDirection: 'column', gap: 6,
            padding: '10px 14px', borderRadius: 10,
            background: 'var(--surface-2)', marginBottom: 8,
            border: '1px solid var(--border)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Clock size={13} style={{ color: 'var(--text-3)', flexShrink: 0 }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', fontFamily: 'monospace' }}>
                {formatTime(time)}
              </span>
            </div>
            <span style={{ fontSize: 11, color: 'var(--text-3)', paddingLeft: 21 }}>
              {formatDate(time)}
            </span>
          </div>
          <button
            onClick={() => setDarkMode(!darkMode)}
            style={{
              display: 'flex', alignItems: 'center', gap: 10, width: '100%',
              padding: '10px 14px', borderRadius: 10, background: 'none', border: 'none',
              fontSize: 13, fontWeight: 500, color: 'var(--text-2)', cursor: 'pointer',
              transition: 'background 0.12s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-2)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            {darkMode ? <Sun size={16} /> : <Moon size={16} />}
            {darkMode ? 'Mode Terang' : 'Mode Gelap'}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, marginLeft: 240 }} className="main-content">

        {/* Topbar */}
        <header style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '0 24px', height: 60,
          background: 'var(--surface)',
          borderBottom: '1px solid var(--border)',
          boxShadow: 'var(--shadow-xs)',
          flexShrink: 0,
        }}>
          <button
            onClick={() => setOpen(true)}
            style={{
              display: 'none', padding: 8, borderRadius: 8,
              background: 'var(--surface-2)', border: '1px solid var(--border)',
              color: 'var(--text)', cursor: 'pointer',
            }}
            className="menu-btn"
          >
            <Menu size={18} />
          </button>

          {currentPage && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 9,
                background: 'var(--accent-bg)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '1.5px solid var(--accent-border)',
              }}>
                <currentPage.icon size={16} style={{ color: 'var(--text)' }} />
              </div>
              <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.01em' }}>
                {currentPage.label}
              </span>
            </div>
          )}

          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{
              fontSize: 11, fontWeight: 700,
              padding: '4px 12px', borderRadius: 99,
              background: 'var(--green-bg)', color: 'var(--green)',
              border: '1.5px solid var(--green-border)',
              display: 'flex', alignItems: 'center', gap: 5,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)' }} />
              Aktif
            </span>
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', fontFamily: 'monospace' }} className="hide-mobile">
              {formatTime(time)}
            </span>
          </div>
        </header>

        {/* Content */}
        <main style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          <div className="animate-fade-in">{children}</div>
        </main>
      </div>

      {/* Responsive CSS */}
      <style>{`
        @media (min-width: 1024px) {
          .lg-sidebar { transform: translateX(0) !important; position: relative !important; }
          .lg-hide    { display: none !important; }
          .menu-btn   { display: none !important; }
          .main-content { margin-left: 0 !important; }
        }
        @media (max-width: 1023px) {
          .main-content { margin-left: 0 !important; }
          .menu-btn     { display: flex !important; }
        }
        @media (max-width: 600px) {
          .hide-mobile  { display: none !important; }
        }
      `}</style>
    </div>
  );
}
