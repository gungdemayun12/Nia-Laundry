import { useState, useMemo } from 'react';
import { Search, Trash2, Eye, ChevronDown } from 'lucide-react';
import Swal from 'sweetalert2';
import { StatusBadge } from '../components/UI';
import Modal from '../components/Modal';
import { formatRupiah, formatDateTime, formatDate } from '../utils/helpers';
import { STATUS_OPTIONS } from '../utils/constants';

export default function Pesanan({ transactions, setTransactions }) {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [detailTx, setDetailTx] = useState(null);
  const [statusDropdown, setStatusDropdown] = useState(null);

  const filtered = useMemo(() => {
    return transactions
      .filter((t) => {
        if (t.status === 'Diambil') return false;
        if (filterStatus && t.status !== filterStatus) return false;
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
  }, [transactions, search, filterStatus]);

  const allChecked = filtered.length > 0 && selectedIds.length === filtered.length;
  const someChecked = selectedIds.length > 0 && !allChecked;

  const handleSelectAll = () => {
    if (allChecked) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filtered.map(t => t.id));
    }
  };

  const handleSelect = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return;
    Swal.fire({
      title: 'Hapus Pesanan?',
      text: `${selectedIds.length} pesanan akan dihapus secara permanen.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: 'var(--red)',
      cancelButtonColor: 'var(--border-2)',
      confirmButtonText: 'Ya, Hapus!',
      cancelButtonText: 'Batal',
      showCloseButton: true,
      background: 'var(--surface)',
      color: 'var(--text)',
    }).then((result) => {
      if (result.isConfirmed) {
        setTransactions((prev) => prev.filter(t => !selectedIds.includes(t.id)));
        setSelectedIds([]);
        Swal.fire({ title: 'Terhapus!', text: 'Pesanan berhasil dihapus.', icon: 'success', confirmButtonColor: 'var(--text)', showCloseButton: true, background: 'var(--surface)', color: 'var(--text)' });
      }
    });
  };

  const handleDelete = (id) => {
    Swal.fire({
      title: 'Hapus Pesanan?',
      text: `Pesanan ${id} akan dihapus secara permanen.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: 'var(--red)',
      cancelButtonColor: 'var(--border-2)',
      confirmButtonText: 'Ya, Hapus!',
      cancelButtonText: 'Batal',
      showCloseButton: true,
      background: 'var(--surface)',
      color: 'var(--text)',
    }).then((result) => {
      if (result.isConfirmed) {
        setTransactions((prev) => prev.filter(t => t.id !== id));
        Swal.fire({ title: 'Terhapus!', text: 'Pesanan berhasil dihapus.', icon: 'success', confirmButtonColor: 'var(--text)', showCloseButton: true, background: 'var(--surface)', color: 'var(--text)' });
      }
    });
  };

  const handleStatusChange = (id, newStatus) => {
    setTransactions((prev) => prev.map((t) => t.id === id ? { ...t, status: newStatus } : t));
    setStatusDropdown(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Toolbar */}
      <div className="card" style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', padding: '14px 18px' }}>
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

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="field-input"
          style={{
            width: 150, flexShrink: 0, appearance: 'none',
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236c757d' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center',
            paddingRight: 32,
          }}
        >
          <option value="">Semua Status</option>
          {STATUS_OPTIONS.filter(s => s !== 'Diambil').map((s) => <option key={s} value={s}>{s}</option>)}
        </select>

        {selectedIds.length > 0 && (
          <button className="btn btn-danger" onClick={handleBulkDelete} style={{ padding: '8px 16px', fontSize: 12, flexShrink: 0 }}>
            <Trash2 size={14} /> Hapus ({selectedIds.length})
          </button>
        )}
      </div>

      {/* Table Card */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '11px 12px', width: 40, textAlign: 'center' }}>
                  <input
                    type="checkbox"
                    checked={allChecked}
                    ref={el => { if (el) el.indeterminate = someChecked; }}
                    onChange={handleSelectAll}
                    style={{ cursor: 'pointer', accentColor: 'var(--text)' }}
                  />
                </th>
                {['No. Invoice','Tanggal','Pelanggan','Layanan','Berat','Total','Status','Aksi'].map((h) => (
                  <th key={h} style={{
                    padding: '11px 16px', textAlign: 'left',
                    fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
                    letterSpacing: '0.06em', color: 'var(--text-3)',
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
                  <td colSpan={9} style={{ padding: '48px 16px', textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
                    {transactions.filter(t => t.status !== 'Diambil').length === 0 ? 'Tidak ada pesanan aktif' : 'Tidak ada pesanan yang sesuai filter'}
                  </td>
                </tr>
              ) : (
                filtered.map((t, idx) => (
                  <tr key={t.id} style={{
                    borderBottom: idx < filtered.length - 1 ? '1px solid var(--border)' : 'none',
                    background: selectedIds.includes(t.id) ? 'var(--accent-bg)' : 'var(--surface)',
                    transition: 'background 0.12s',
                  }}
                    onMouseEnter={(e) => { if (!selectedIds.includes(t.id)) e.currentTarget.style.background = 'var(--surface-2)'; }}
                    onMouseLeave={(e) => { if (!selectedIds.includes(t.id)) e.currentTarget.style.background = 'var(--surface)'; }}
                  >
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(t.id)}
                        onChange={() => handleSelect(t.id)}
                        style={{ cursor: 'pointer', accentColor: 'var(--text)' }}
                      />
                    </td>
                    <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: 12, fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap' }}>
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
                    <td style={{ padding: '12px 16px' }}>
                      <StatusBadge status={t.status} />
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {/* Detail Button */}
                        <button
                          onClick={() => setDetailTx(t)}
                          style={{
                            width: 30, height: 30, borderRadius: 8, border: '1.5px solid transparent',
                            background: 'transparent', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'var(--text)',
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = 'var(--accent-bg)'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                          title="Lihat Detail"
                        >
                          <Eye size={14} />
                        </button>

                        {/* Status Dropdown */}
                        <div style={{ position: 'relative' }}>
                          <button
                            onClick={() => setStatusDropdown(statusDropdown === t.id ? null : t.id)}
                            style={{
                              width: 30, height: 30, borderRadius: 8, border: '1.5px solid transparent',
                              background: 'transparent', cursor: 'pointer',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              color: 'var(--green)',
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--green-bg)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                            title="Ubah Status"
                          >
                            <ChevronDown size={14} />
                          </button>
                          {statusDropdown === t.id && (
                            <div style={{
                              position: 'absolute', top: 'calc(100% + 4px)', right: 0,
                              zIndex: 100,
                              background: 'var(--surface)',
                              border: '1px solid var(--border)',
                              borderRadius: 10,
                              boxShadow: 'var(--shadow-lg)',
                              overflow: 'hidden',
                              minWidth: 140,
                            }}>
                              {STATUS_OPTIONS.map((s) => (
                                <button
                                  key={s}
                                  onClick={() => handleStatusChange(t.id, s)}
                                  style={{
                                    display: 'flex', alignItems: 'center', gap: 8,
                                    width: '100%', padding: '10px 14px',
                                    background: t.status === s ? 'var(--accent-bg)' : 'transparent',
                                    border: 'none', cursor: 'pointer',
                                    fontSize: 13, color: 'var(--text)', textAlign: 'left',
                                    borderBottom: '1px solid var(--border)',
                                  }}
                                  onMouseEnter={(e) => { if (t.status !== s) e.currentTarget.style.background = 'var(--surface-2)'; }}
                                  onMouseLeave={(e) => { if (t.status !== s) e.currentTarget.style.background = 'transparent'; }}
                                >
                                  <StatusBadge status={s} />
                                  {t.status === s && <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-3)' }}>✓</span>}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Delete Button */}
                        <button
                          onClick={() => handleDelete(t.id)}
                          style={{
                            width: 30, height: 30, borderRadius: 8, border: '1.5px solid transparent',
                            background: 'transparent', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'var(--red)',
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = 'var(--red-bg)'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                          title="Hapus"
                        >
                          <Trash2 size={14} />
                        </button>
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
          <span>Menampilkan <strong style={{ color: 'var(--text)' }}>{filtered.length}</strong> pesanan aktif</span>
          <span>Klik ikon untuk melihat detail atau mengubah status</span>
        </div>
      </div>

      {/* Detail Modal */}
      <Modal isOpen={!!detailTx} onClose={() => setDetailTx(null)} title={`Detail Pesanan — ${detailTx?.id}`} maxWidth="480px">
        {detailTx && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: 'var(--text-2)' }}>Status</span>
              <StatusBadge status={detailTx.status} />
            </div>

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, color: 'var(--text-2)' }}>Pelanggan</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{detailTx.pelanggan?.nama || '-'}</span>
              </div>
              {detailTx.pelanggan?.noHp && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 13, color: 'var(--text-2)' }}>No. HP</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{detailTx.pelanggan.noHp}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, color: 'var(--text-2)' }}>Tanggal</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{formatDateTime(detailTx.tanggal)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, color: 'var(--text-2)' }}>Total Berat</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{detailTx.totalBerat} kg</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, color: 'var(--text-2)' }}>Total Bayar</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{formatRupiah(detailTx.totalBayar)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, color: 'var(--text-2)' }}>Estimasi Selesai</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{formatDate(detailTx.estimasiSelesai)}</span>
              </div>
              {detailTx.catatan && (
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 10, marginTop: 4 }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', marginBottom: 4 }}>Catatan</p>
                  <p style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.5 }}>{detailTx.catatan}</p>
                </div>
              )}
            </div>

            {/* Items */}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
              <p style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-3)', marginBottom: 10 }}>Detail Layanan</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {detailTx.items?.map((item, i) => (
                  <div key={i} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '10px 12px', borderRadius: 8,
                    background: 'var(--surface-2)', border: '1px solid var(--border)',
                  }}>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{item.layanan}</p>
                      <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>{item.berat} kg x {formatRupiah(item.hargaPerKg)}</p>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{formatRupiah(item.subtotal)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Click outside to close dropdown */}
      {statusDropdown && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 50 }}
          onClick={() => setStatusDropdown(null)}
        />
      )}
    </div>
  );
}