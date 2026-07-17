import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, PlusCircle, ClipboardList,
  Users, Settings, BarChart3, Menu, X, Shirt, Moon, Sun,
} from 'lucide-react';

const navItems = [
  { to: '/',              label: 'Dashboard',        icon: LayoutDashboard },
  { to: '/transaksi-baru',label: 'Transaksi Baru',   icon: PlusCircle },
  { to: '/riwayat',       label: 'Riwayat Transaksi',icon: ClipboardList },
  { to: '/pelanggan',     label: 'Data Pelanggan',   icon: Users },
  { to: '/pengaturan',    label: 'Pengaturan',        icon: Settings },
  { to: '/laporan',       label: 'Laporan',           icon: BarChart3 },
];

export default function Layout({ children, darkMode, setDarkMode }) {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  const currentPage = navItems.find(
    (n) => n.to === location.pathname ||
      (n.to !== '/' && location.pathname.startsWith(n.to))
  );

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg)' }}>

      {/* ── Mobile overlay ── */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 40,
            background: 'rgba(0,0,0,0.45)',
            backdropFilter: 'blur(2px)',
          }}
        />
      )}

      {/* ── Sidebar ── */}
      <aside style={{
        position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 50,
        width: 220,
        background: 'var(--surface)',
        borderRight: '1px solid var(--border)',
        boxShadow: 'var(--shadow-md)',
        display: 'flex', flexDirection: 'column',
        transform: open ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.28s cubic-bezier(0.4,0,0.2,1)',
      }}
        className="lg-sidebar"
      >
        {/* Logo */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '16px 16px 14px',
          borderBottom: '1px solid var(--border)',
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10, flexShrink: 0,
            background: 'linear-gradient(135deg,#2563eb,#1d4ed8)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(37,99,235,0.3)',
          }}>
            <Shirt size={18} color="#fff" />
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', lineHeight: 1.2 }}>POS Laundry</p>
            <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>Point of Sale</p>
          </div>
          <button
            onClick={() => setOpen(false)}
            style={{ marginLeft: 'auto', padding: 4, color: 'var(--text-3)', background: 'none', border: 'none', cursor: 'pointer' }}
            className="lg-hide"
          >
            <X size={16} />
          </button>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '10px 10px', overflowY: 'auto' }}>
          {navItems.map(({ to, label, icon: Icon }) => {
            const active = location.pathname === to ||
              (to !== '/' && location.pathname.startsWith(to));
            return (
              <NavLink
                key={to}
                to={to}
                onClick={() => setOpen(false)}
                style={({ isActive }) => ({
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '9px 12px', borderRadius: 8, marginBottom: 2,
                  fontSize: 13, fontWeight: active ? 600 : 500,
                  textDecoration: 'none',
                  background: active ? 'var(--blue-bg)' : 'transparent',
                  color: active ? 'var(--blue)' : 'var(--text-2)',
                  transition: 'all 0.12s',
                })}
                onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = 'var(--surface-2)'; }}
                onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'transparent'; }}
              >
                <Icon size={16} />
                <span>{label}</span>
                {active && (
                  <span style={{
                    marginLeft: 'auto', width: 6, height: 6,
                    borderRadius: '50%', background: 'var(--blue)',
                  }} />
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Dark toggle */}
        <div style={{ padding: '10px 10px', borderTop: '1px solid var(--border)' }}>
          <button
            onClick={() => setDarkMode(!darkMode)}
            style={{
              display: 'flex', alignItems: 'center', gap: 10, width: '100%',
              padding: '9px 12px', borderRadius: 8, background: 'none', border: 'none',
              fontSize: 13, fontWeight: 500, color: 'var(--text-2)', cursor: 'pointer',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-2)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          >
            {darkMode ? <Sun size={16} /> : <Moon size={16} />}
            {darkMode ? 'Mode Terang' : 'Mode Gelap'}
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, marginLeft: 220 }} className="main-content">

        {/* Topbar */}
        <header style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '0 24px', height: 56,
          background: 'var(--surface)',
          borderBottom: '1px solid var(--border)',
          boxShadow: 'var(--shadow-xs)',
          flexShrink: 0,
        }}>
          <button
            onClick={() => setOpen(true)}
            style={{
              display: 'none', padding: 6, borderRadius: 8,
              background: 'var(--surface-2)', border: 'none',
              color: 'var(--text)', cursor: 'pointer',
            }}
            className="menu-btn"
          >
            <Menu size={18} />
          </button>

          {currentPage && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 28, height: 28, borderRadius: 7,
                background: 'var(--blue-bg)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <currentPage.icon size={14} style={{ color: 'var(--blue)' }} />
              </div>
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>
                {currentPage.label}
              </span>
            </div>
          )}

          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              fontSize: 11, fontWeight: 600,
              padding: '3px 10px', borderRadius: 99,
              background: 'var(--green-bg)', color: 'var(--green)',
              border: '1px solid var(--green-border)',
            }}>
              ● Aktif
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
      `}</style>
    </div>
  );
}
