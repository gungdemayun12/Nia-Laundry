import { useState, useRef, useMemo } from 'react';
import { Search, Printer, Edit3, Trash2, Download, X, ChevronRight } from 'lucide-react';
import Swal from 'sweetalert2';
import { StatusBadge } from '../components/UI';
import Modal from '../components/Modal';
import PrintReceipt, { ReceiptPreview } from '../components/PrintReceipt';
import { formatRupiah, formatDateTime, formatDate, exportCSV } from '../utils/helpers';
import { STATUS_OPTIONS } from '../utils/constants';

export default function RiwayatTransaksi({ transactions, setTransactions, services, settings }) {
  const [search,        setSearch]        = useState('');
  const [filterStatus,  setFilterStatus]  = useState('');
  const [filterDate,    setFilterDate]    = useState('');
  const [selectedTx,    setSelectedTx]    = useState(null);
  const [showReceipt,   setShowReceipt]   = useState(false);
  const [editTx,        setEditTx]        = useState(null);
  const [editStatus,    setEditStatus]    = useState('');

  const filtered = useMemo(() => {
    return transactions
      .filter((t) => {
        if (filterStatus && t.status !== filterStatus) return false;
        if (filterDate && new Date(t.tanggal).toISOString().split('T')[0] !== filterDate) return false;
        if (search) {
          const q = search.toLowerCase();
          return (
            t.id.toLowerCase().includes(q) ||
            t.pelanggan?.nama?.toLowerCase().includes(q) ||
            t.items?.some((i) => i.layanan?.toLowerCase().includes(q))
          );
        }
        return true;
      })
      .sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
  }, [transactions, search, filterStatus, filterDate]);

  const handleStatusUpdate = (id, newStatus) => {
    setTransactions((prev) => prev.map((t) => t.id === id ? { ...t, status: newStatus } : t));
  };

  const handleDelete = (id) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  };

  const handleDeleteClick = (id) => {
    Swal.fire({
      title: 'Hapus Transaksi?',
      text: `Transaksi ${id} akan dihapus secara permanen. Data yang sudah dihapus tidak bisa dikembalikan.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Ya, Hapus!',
      cancelButtonText: 'Batal',
      showCloseButton: true
    }).then((result) => {
      if (result.isConfirmed) {
        handleDelete(id);
        Swal.fire({ title: 'Terhapus!', text: 'Transaksi berhasil dihapus.', icon: 'success', confirmButtonColor: '#16a34a', showCloseButton: true });
      }
    });
  };

  const handlePrintReceipt = (tx) => {
    setSelectedTx(tx);
    setShowReceipt(true);
  };

  const handleDoPrint = () => {
    setTimeout(() => window.print(), 150);
  };

  const handleExportCSV = () => {
    const data = filtered.map((t) => ({
      'No. Invoice': t.id,
      Tanggal: formatDateTime(t.tanggal),
      Pelanggan: t.pelanggan?.nama || '-',
      'No HP': t.pelanggan?.noHp || '-',
      Layanan: t.items?.map((i) => `${i.layanan} (${i.berat}kg)`).join('; ') || '-',
      'Total Berat (kg)': t.totalBerat,
      Diskon: t.diskon,
      'Total Bayar': t.totalBayar,
      Status: t.status,
      'Estimasi Selesai': formatDate(t.estimasiSelesai),
      Catatan: t.catatan || '-',
    }));
    exportCSV(data, `transaksi-laundry-${new Date().toISOString().split('T')[0]}.csv`);
  };

  const handleEditSave = () => {
    if (!editTx) return;
    setTransactions((prev) => prev.map((t) => t.id === editTx.id ? { ...t, status: editStatus } : t));
    setEditTx(null);
  };

  const getNextStatus = (current) => {
    const idx = STATUS_OPTIONS.indexOf(current);
    return idx < STATUS_OPTIONS.length - 1 ? STATUS_OPTIONS[idx + 1] : current;
  };

  /* ── Action button ── */
  const ActionBtn = ({ onClick, title, color, hoverBg, children }) => (
    <button onClick={onClick} title={title} style={{
      width: 30, height: 30, borderRadius: 7, border: 'none', cursor: 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'transparent', color,
    }}
      onMouseEnter={(e) => e.currentTarget.style.background = hoverBg}
      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
    >
      {children}
    </button>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* ── Toolbar ── */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: '1 1 220px', minWidth: 0 }}>
          <Search size={14} style={{
            position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)',
            color: 'var(--text-3)', pointerEvents: 'none',
          }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari invoice atau nama pelanggan..."
            className="field-input"
            style={{ paddingLeft: 34 }}
          />
        </div>

        {/* Date filter */}
        <input
          type="date"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          className="field-input"
          style={{ width: 160, flexShrink: 0 }}
        />

        {/* Status filter */}
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="field-input"
          style={{
            width: 148, flexShrink: 0, appearance: 'none',
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center',
            paddingRight: 32,
          }}
        >
          <option value="">Semua Status</option>
          {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>

        {/* Export */}
        <button className="btn btn-secondary" onClick={handleExportCSV} style={{ flexShrink: 0 }}>
          <Download size={14} /> Export CSV
        </button>
      </div>

      {/* ── Table Card ── */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--border)' }}>
                {['No. Invoice','Tanggal','Pelanggan','Layanan','Berat','Total','Status','Aksi'].map((h) => (
                  <th key={h} style={{
                    padding: '11px 16px', textAlign: 'left',
                    fontSize: 11, fontWeight: 600, textTransform: 'uppercase',
                    letterSpacing: '0.05em', color: 'var(--text-3)',
                    whiteSpace: 'nowrap',
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: '48px 16px', textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
                    {transactions.length === 0 ? 'Belum ada transaksi' : 'Tidak ada transaksi yang sesuai filter'}
                  </td>
                </tr>
              ) : (
                filtered.map((t, idx) => (
                  <tr key={t.id} style={{
                    borderBottom: idx < filtered.length - 1 ? '1px solid var(--border)' : 'none',
                    background: 'var(--surface)',
                  }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-2)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'var(--surface)'}
                  >
                    <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: 12, fontWeight: 600, color: 'var(--blue)', whiteSpace: 'nowrap' }}>
                      {t.id}
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-2)', whiteSpace: 'nowrap', fontSize: 12 }}>
                      {formatDateTime(t.tanggal)}
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text)' }}>
                      <div>{t.pelanggan?.nama || '-'}</div>
                      {t.pelanggan?.noHp && (
                        <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 1 }}>{t.pelanggan.noHp}</div>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-2)', maxWidth: 160 }}>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {t.items?.map((i) => i.layanan).join(', ') || '-'}
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--text)', whiteSpace: 'nowrap', fontWeight: 500 }}>
                      {t.totalBerat} kg
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--text)', whiteSpace: 'nowrap' }}>
                      {formatRupiah(t.totalBayar)}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <button
                        onClick={() => { const next = getNextStatus(t.status); if (next !== t.status) handleStatusUpdate(t.id, next); }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                        title="Klik untuk ubah status"
                      >
                        <StatusBadge status={t.status} />
                      </button>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <ActionBtn onClick={() => handlePrintReceipt(t)} title="Cetak Struk" color="var(--text-2)" hoverBg="var(--surface-2)">
                          <Printer size={14} />
                        </ActionBtn>
                        <ActionBtn onClick={() => { setEditTx(t); setEditStatus(t.status); }} title="Edit Status" color="var(--blue)" hoverBg="var(--blue-bg)">
                          <Edit3 size={14} />
                        </ActionBtn>
                        <ActionBtn onClick={() => handleDeleteClick(t.id)} title="Hapus" color="var(--red)" hoverBg="var(--red-bg)">
                          <Trash2 size={14} />
                        </ActionBtn>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div style={{
          padding: '10px 16px', borderTop: '1px solid var(--border)',
          background: 'var(--surface-2)',
          fontSize: 11, color: 'var(--text-3)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span>Menampilkan <strong style={{ color: 'var(--text-2)' }}>{filtered.length}</strong> dari <strong style={{ color: 'var(--text-2)' }}>{transactions.length}</strong> transaksi</span>
          <span>Klik badge status untuk mengubah status</span>
        </div>
      </div>

      {/* ── Print Portal ── */}
      {showReceipt && selectedTx && (
        <PrintReceipt transaction={selectedTx} settings={settings} />
      )}

      {/* ── Receipt Modal ── */}
      <Modal
        isOpen={showReceipt && !!selectedTx}
        onClose={() => setShowReceipt(false)}
        title={selectedTx ? `Struk ${selectedTx.id} - ${selectedTx.pelanggan?.nama || ''}` : 'Struk'}
        maxWidth="420px"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn btn-primary" onClick={handleDoPrint} style={{ padding: '7px 14px', fontSize: 12 }}>
              <Printer size={14} /> Cetak
            </button>
          </div>
          <div style={{ padding: 20, background: 'var(--surface-2)', display: 'flex', justifyContent: 'center', borderRadius: 8 }}>
            <div style={{ background: '#fff', borderRadius: 8, padding: 8, boxShadow: '0 2px 12px rgba(0,0,0,0.1)' }}>
              {selectedTx && <ReceiptPreview transaction={selectedTx} settings={settings} />}
            </div>
          </div>
        </div>
      </Modal>

      {/* ── Edit Modal ── */}
      <Modal isOpen={!!editTx} onClose={() => setEditTx(null)} title={`Edit Status — ${editTx?.id}`} maxWidth="360px">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label className="field-label">Status Baru</label>
            <select
              value={editStatus}
              onChange={(e) => setEditStatus(e.target.value)}
              className="field-input"
              style={{
                appearance: 'none',
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center', paddingRight: 32,
              }}
            >
              {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button className="btn btn-secondary" onClick={() => setEditTx(null)} style={{ padding: '8px 18px' }}>Batal</button>
            <button className="btn btn-primary" onClick={handleEditSave} style={{ padding: '8px 18px' }}>Simpan</button>
          </div>
        </div>
      </Modal>

    </div>
  );
}
