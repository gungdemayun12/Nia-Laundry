import { useState } from 'react';
import { formatRupiah, getStartOfDay, formatDateTime } from '../utils/helpers';
import Swal from 'sweetalert2';
import { Calculator, Save, CheckCircle, AlertCircle } from 'lucide-react';

export default function TutupKasir({ transactions, dailyClosings, setDailyClosings }) {
  const [cashInDrawer, setCashInDrawer] = useState('');

  // Hitung Omzet Hari Ini
  const today = getStartOfDay(new Date());
  const todayTx = transactions.filter(
    (t) => getStartOfDay(new Date(t.tanggal)).getTime() === today.getTime()
  );
  
  const expectedCash = todayTx.reduce((sum, t) => sum + t.totalBayar, 0);
  const actualCash = parseInt(cashInDrawer) || 0;
  const difference = actualCash - expectedCash;

  const handleSave = () => {
    if (!cashInDrawer) {
      Swal.fire({ icon: 'warning', title: 'Oops', text: 'Masukkan jumlah uang di laci terlebih dahulu!' });
      return;
    }

    // Check if already closed today
    const alreadyClosed = dailyClosings.some(
      (c) => getStartOfDay(new Date(c.tanggal)).getTime() === today.getTime()
    );

    if (alreadyClosed) {
      Swal.fire({
        icon: 'warning',
        title: 'Sudah Tutup Kasir',
        text: 'Anda sudah melakukan tutup kasir untuk hari ini. Apakah Anda ingin menimpanya?',
        showCancelButton: true,
        confirmButtonText: 'Ya, Timpa Data',
        cancelButtonText: 'Batal'
      }).then((result) => {
        if (result.isConfirmed) {
          saveData();
        }
      });
      return;
    }

    saveData();
  };

  const saveData = () => {
    const newClosing = {
      id: `CLS-${Date.now()}`,
      tanggal: new Date().toISOString(),
      expectedCash,
      actualCash,
      difference,
      totalTransactions: todayTx.length,
    };

    // Filter out today's previous closing if overwriting
    const filteredClosings = dailyClosings.filter(
      (c) => getStartOfDay(new Date(c.tanggal)).getTime() !== today.getTime()
    );

    setDailyClosings([newClosing, ...filteredClosings]);
    Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Data Tutup Kasir berhasil disimpan!', timer: 1500 });
    setCashInDrawer('');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em' }}>Tutup Kasir</h1>
        <p style={{ color: 'var(--text-2)' }}>Rekap dan cocokkan pendapatan harian dengan uang fisik di laci.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        {/* Form Tutup Kasir */}
        <div className="card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div style={{ padding: 10, background: 'var(--accent-bg)', borderRadius: 12, color: 'var(--accent)' }}>
              <Calculator size={24} />
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 700 }}>Rekap Hari Ini</h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ background: 'var(--surface-2)', padding: 16, borderRadius: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-2)', fontWeight: 500 }}>Pendapatan Sistem:</span>
              <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)' }}>{formatRupiah(expectedCash)}</span>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: 'var(--text)' }}>
                Uang Fisik di Laci (Rp)
              </label>
              <input
                type="number"
                className="input"
                placeholder="Masukkan jumlah uang aktual..."
                value={cashInDrawer}
                onChange={(e) => setCashInDrawer(e.target.value)}
                style={{ fontSize: 18, fontWeight: 700 }}
              />
            </div>

            {cashInDrawer !== '' && (
              <div style={{ 
                background: difference === 0 ? 'var(--green-bg)' : difference > 0 ? 'rgba(59, 130, 246, 0.1)' : 'var(--red-bg)', 
                padding: 16, borderRadius: 12, border: `1px solid ${difference === 0 ? 'var(--green-border)' : difference > 0 ? 'rgba(59, 130, 246, 0.2)' : 'var(--red-border)'}`,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}>
                <span style={{ 
                  color: difference === 0 ? 'var(--green)' : difference > 0 ? '#3b82f6' : 'var(--red)', 
                  fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 
                }}>
                  {difference === 0 ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                  Selisih:
                </span>
                <span style={{ 
                  fontSize: 20, fontWeight: 800, 
                  color: difference === 0 ? 'var(--green)' : difference > 0 ? '#3b82f6' : 'var(--red)'
                }}>
                  {difference > 0 ? '+' : ''}{formatRupiah(difference)}
                </span>
              </div>
            )}

            <button 
              className="btn btn-primary" 
              style={{ width: '100%', marginTop: 8, padding: 14, fontSize: 16 }}
              onClick={handleSave}
            >
              <Save size={20} /> Simpan Tutup Kasir
            </button>
          </div>
        </div>

        {/* Info & Stats */}
        <div className="card" style={{ padding: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Informasi</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <p style={{ color: 'var(--text-2)', lineHeight: 1.6 }}>
              Fitur Tutup Kasir membantu Anda melacak kesesuaian antara uang yang tercatat di aplikasi dengan uang nyata yang ada di laci kasir setiap penghujung hari.
            </p>
            <ul style={{ color: 'var(--text-2)', lineHeight: 1.6, paddingLeft: 20, listStyleType: 'disc' }}>
              <li><strong>Pendapatan Sistem</strong> dihitung dari total pembayaran semua pesanan yang dibuat pada hari ini (berdasarkan tanggal).</li>
              <li>Jika selisih bernilai <strong>Minus (-)</strong>, berarti uang fisik kurang.</li>
              <li>Jika selisih bernilai <strong>Plus (+)</strong>, berarti uang fisik lebih.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Tabel Riwayat */}
      <div className="card">
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>Riwayat Tutup Kasir</h2>
        </div>
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Waktu Tutup</th>
                <th>Jml Transaksi</th>
                <th>Sistem</th>
                <th>Aktual Laci</th>
                <th>Selisih</th>
              </tr>
            </thead>
            <tbody>
              {dailyClosings.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-3)' }}>
                    Belum ada riwayat tutup kasir
                  </td>
                </tr>
              ) : (
                dailyClosings.map((c) => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 500 }}>{formatDateTime(c.tanggal)}</td>
                    <td>{c.totalTransactions} pesanan</td>
                    <td style={{ fontWeight: 600 }}>{formatRupiah(c.expectedCash)}</td>
                    <td style={{ fontWeight: 600 }}>{formatRupiah(c.actualCash)}</td>
                    <td>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: 99,
                        fontSize: 12,
                        fontWeight: 700,
                        background: c.difference === 0 ? 'var(--green-bg)' : c.difference > 0 ? 'rgba(59, 130, 246, 0.1)' : 'var(--red-bg)',
                        color: c.difference === 0 ? 'var(--green)' : c.difference > 0 ? '#3b82f6' : 'var(--red)',
                      }}>
                        {c.difference > 0 ? '+' : ''}{formatRupiah(c.difference)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
