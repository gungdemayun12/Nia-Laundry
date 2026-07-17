import { useState, useMemo } from 'react';
import { Search, Award, Phone, ShoppingCart, Wallet, UserCircle2 } from 'lucide-react';
import { StatusBadge } from '../components/UI';
import { formatRupiah, formatDateTime } from '../utils/helpers';

/* warna avatar berdasarkan huruf pertama */
const AVATAR_COLORS = [
  { bg: '#dbeafe', color: '#2563eb' },
  { bg: '#ede9fe', color: '#7c3aed' },
  { bg: '#d1fae5', color: '#16a34a' },
  { bg: '#fef3c7', color: '#d97706' },
  { bg: '#fce7f3', color: '#db2777' },
  { bg: '#ecfeff', color: '#0891b2' },
];
function avatarColor(name = '') {
  const idx = (name.charCodeAt(0) || 0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
}

export default function DataPelanggan({ customers, transactions }) {
  const [search, setSearch] = useState('');

  const enriched = useMemo(() => {
    return customers
      .map((c) => {
        const custTx = transactions
          .filter((t) => t.pelanggan?.nama?.toLowerCase() === c.nama.toLowerCase())
          .sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
        return { ...c, lastTx: custTx[0] || null, isLoyal: c.totalTransaksi >= 10 };
      })
      .filter((c) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return c.nama.toLowerCase().includes(q) || c.noHp?.toLowerCase().includes(q);
      })
      .sort((a, b) => b.totalBelanja - a.totalBelanja);
  }, [customers, transactions, search]);

  const loyalCount = enriched.filter((c) => c.isLoyal).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* ── Toolbar ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1 1 240px', maxWidth: 400 }}>
          <Search size={14} style={{
            position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)',
            color: 'var(--text-3)', pointerEvents: 'none',
          }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama atau no HP pelanggan..."
            className="field-input"
            style={{ paddingLeft: 34 }}
          />
        </div>
        <div style={{ display: 'flex', gap: 16, fontSize: 13, color: 'var(--text-2)' }}>
          <span>
            <strong style={{ color: 'var(--text)' }}>{enriched.length}</strong> pelanggan
          </span>
          {loyalCount > 0 && (
            <span style={{ color: 'var(--amber)' }}>
              ⭐ {loyalCount} pelanggan setia
            </span>
          )}
        </div>
      </div>

      {/* ── Empty state ── */}
      {enriched.length === 0 && (
        <div className="card" style={{ padding: 48, textAlign: 'center' }}>
          <UserCircle2 size={40} style={{ color: 'var(--text-3)', margin: '0 auto 12px' }} />
          <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-2)' }}>
            {customers.length === 0 ? 'Belum ada data pelanggan' : 'Tidak ada pelanggan yang sesuai'}
          </p>
          <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>
            {customers.length === 0 && 'Data pelanggan tersimpan otomatis saat transaksi baru dibuat'}
          </p>
        </div>
      )}

      {/* ── Customer Grid ── */}
      {enriched.length > 0 && (
        <div className="cust-grid" style={{ display: 'grid', gap: 14 }}>
          {enriched.map((c) => {
            const av = avatarColor(c.nama);
            return (
              <div key={c.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                {/* Card header */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '16px 18px', borderBottom: '1px solid var(--border)',
                }}>
                  {/* Avatar */}
                  <div style={{
                    width: 42, height: 42, borderRadius: '50%', flexShrink: 0,
                    background: av.bg, color: av.color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 16, fontWeight: 800,
                  }}>
                    {c.nama.charAt(0).toUpperCase()}
                  </div>

                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{c.nama}</p>
                      {c.isLoyal && (
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 3,
                          padding: '2px 8px', borderRadius: 99,
                          fontSize: 10, fontWeight: 700,
                          background: 'var(--amber-bg)', color: 'var(--amber)',
                          border: '1px solid var(--amber-border)',
                        }}>
                          <Award size={10} /> Setia
                        </span>
                      )}
                    </div>
                    {c.noHp && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 3 }}>
                        <Phone size={11} style={{ color: 'var(--text-3)' }} />
                        <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{c.noHp}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Stats row */}
                <div style={{
                  display: 'grid', gridTemplateColumns: '1fr 1fr',
                  borderBottom: '1px solid var(--border)',
                }}>
                  <div style={{
                    padding: '12px 18px',
                    borderRight: '1px solid var(--border)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                      <ShoppingCart size={13} style={{ color: 'var(--text-3)' }} />
                      <span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Transaksi</span>
                    </div>
                    <p style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)', lineHeight: 1 }}>
                      {c.totalTransaksi}<span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-3)' }}> kali</span>
                    </p>
                  </div>
                  <div style={{ padding: '12px 18px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                      <Wallet size={13} style={{ color: 'var(--text-3)' }} />
                      <span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Total Belanja</span>
                    </div>
                    <p style={{ fontSize: 15, fontWeight: 800, color: 'var(--blue)', lineHeight: 1 }}>
                      {formatRupiah(c.totalBelanja)}
                    </p>
                  </div>
                </div>

                {/* Last transaction */}
                {c.lastTx ? (
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 18px', gap: 8,
                  }}>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: 11, color: 'var(--text-3)' }}>Terakhir: {formatDateTime(c.lastTx.tanggal)}</p>
                      <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', marginTop: 1 }}>
                        {c.lastTx.id} · {formatRupiah(c.lastTx.totalBayar)}
                      </p>
                    </div>
                    <StatusBadge status={c.lastTx.status} />
                  </div>
                ) : (
                  <div style={{ padding: '10px 18px' }}>
                    <p style={{ fontSize: 11, color: 'var(--text-3)' }}>Belum ada riwayat transaksi</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <style>{`
        .cust-grid { grid-template-columns: repeat(3, 1fr); }
        @media (max-width: 1024px) { .cust-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 600px)  { .cust-grid { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  );
}
