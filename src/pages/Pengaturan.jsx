import { useState } from 'react';
import { Save, Store, Database, AlertTriangle, Trash2, Lock, Bluetooth, BluetoothSearching, BluetoothConnected, BluetoothOff, Printer, RefreshCw, Unplug, Loader2 } from 'lucide-react';
import { Input } from '../components/UI';
import { useBluetoothPrinter } from '../hooks/useBluetoothPrinter';
import bluetoothPrinter, { buildReceiptBytes } from '../utils/bluetoothPrinter';
import Swal from 'sweetalert2';

function Section({ icon: Icon, iconBg = 'var(--accent-bg)', title, description, action, children }) {
  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 20px', borderBottom: '1px solid var(--border)',
        background: 'var(--surface-2)', gap: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 9,
            background: iconBg, color: 'var(--text)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            border: '1.5px solid var(--accent-border)',
          }}>
            <Icon size={16} />
          </div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{title}</p>
            {description && <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 1 }}>{description}</p>}
          </div>
        </div>
        {action && <div style={{ flexShrink: 0 }}>{action}</div>}
      </div>
      <div style={{ padding: '20px' }}>{children}</div>
    </div>
  );
}

/* ── Bluetooth Printer Status Badge ── */
function PrinterStatusBadge({ isConnected, deviceName }) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 8,
      padding: '6px 14px', borderRadius: 20,
      background: isConnected ? 'var(--green-bg)' : 'var(--surface-2)',
      border: `1.5px solid ${isConnected ? 'var(--green-border)' : 'var(--border)'}`,
      transition: 'all 0.3s ease',
    }}>
      <div style={{
        width: 8, height: 8, borderRadius: '50%',
        background: isConnected ? 'var(--green)' : 'var(--text-3)',
        boxShadow: isConnected ? '0 0 8px var(--green)' : 'none',
        animation: isConnected ? 'pulse-dot 2s ease-in-out infinite' : 'none',
      }} />
      <span style={{
        fontSize: 12, fontWeight: 600,
        color: isConnected ? 'var(--green)' : 'var(--text-3)',
      }}>
        {isConnected ? `Terhubung: ${deviceName}` : 'Tidak Terhubung'}
      </span>
    </div>
  );
}

/* ── Bluetooth Printer Settings Section ── */
function BluetoothPrinterSection() {
  const {
    isConnected, deviceName, isSupported,
    isScanning, error,
    scan, disconnect, forget, reconnect,
    savedPrinter,
  } = useBluetoothPrinter();

  const [isPrinting, setIsPrinting] = useState(false);

  const handleScan = async () => {
    try {
      await scan();
      Swal.fire({
        icon: 'success',
        title: 'Terhubung!',
        text: `Printer berhasil disambungkan.`,
        timer: 2000,
        showConfirmButton: false,
        toast: true,
        position: 'top-end',
        background: 'var(--surface)',
        color: 'var(--text)',
      });
    } catch (err) {
      if (!err.message?.includes('Tidak ada perangkat')) {
        Swal.fire({
          icon: 'error',
          title: 'Gagal',
          text: err.message,
          showCloseButton: true,
          background: 'var(--surface)',
          color: 'var(--text)',
        });
      }
    }
  };

  const handleDisconnect = () => {
    disconnect();
    Swal.fire({
      icon: 'info',
      title: 'Terputus',
      text: 'Printer telah diputuskan.',
      timer: 1500,
      showConfirmButton: false,
      toast: true,
      position: 'top-end',
      background: 'var(--surface)',
      color: 'var(--text)',
    });
  };

  const handleForget = () => {
    Swal.fire({
      title: 'Lupakan Printer?',
      text: 'Printer akan diputus dan data koneksi akan dihapus.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ya, Lupakan',
      cancelButtonText: 'Batal',
      showCloseButton: true,
      background: 'var(--surface)',
      color: 'var(--text)',
    }).then((result) => {
      if (result.isConfirmed) {
        forget();
      }
    });
  };

  const handleTestPrint = async () => {
    setIsPrinting(true);
    try {
      const testTransaction = {
        id: 'TEST-001',
        tanggal: new Date().toISOString(),
        pelanggan: { nama: 'Test Pelanggan', noHp: '08123456789' },
        items: [{ layanan: 'Cuci Kering', berat: 3, hargaPerKg: 7000, subtotal: 21000 }],
        totalBerat: 3,
        totalBayar: 21000,
        diskon: 0,
        status: 'Proses',
        estimasiSelesai: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0],
        catatan: 'Test print dari pengaturan',
      };
      const currentSettings = JSON.parse(localStorage.getItem('pos_settings') || '{}');
      const bytes = buildReceiptBytes(testTransaction, currentSettings);
      await bluetoothPrinter.sendBytes(bytes);

      Swal.fire({
        icon: 'success',
        title: 'Berhasil!',
        text: 'Test print berhasil dikirim ke printer.',
        timer: 2000,
        showConfirmButton: false,
        toast: true,
        position: 'top-end',
        background: 'var(--surface)',
        color: 'var(--text)',
      });
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Gagal Print',
        text: err.message,
        showCloseButton: true,
        background: 'var(--surface)',
        color: 'var(--text)',
      });
    } finally {
      setIsPrinting(false);
    }
  };

  if (!isSupported) {
    return (
      <div style={{
        padding: '16px 20px', borderRadius: 12,
        background: 'var(--amber-bg)', border: '1.5px solid var(--amber-border)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <BluetoothOff size={18} style={{ color: 'var(--amber)' }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--amber)' }}>
            Bluetooth Tidak Didukung
          </span>
        </div>
        <p style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.6 }}>
          Browser ini tidak mendukung Web Bluetooth API. Gunakan <strong>Google Chrome</strong> atau <strong>Microsoft Edge</strong> versi terbaru untuk menggunakan fitur ini.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Status */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 12,
      }}>
        <PrinterStatusBadge isConnected={isConnected} deviceName={deviceName} />
        {savedPrinter && !isConnected && (
          <span style={{ fontSize: 11, color: 'var(--text-3)' }}>
            Terakhir: {savedPrinter.name}
          </span>
        )}
      </div>

      {/* Connected printer info */}
      {isConnected && (
        <div style={{
          padding: '14px 18px', borderRadius: 12,
          background: 'var(--green-bg)', border: '1.5px solid var(--green-border)',
          display: 'flex', alignItems: 'center', gap: 14,
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: 'var(--surface)', border: '1.5px solid var(--green-border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <BluetoothConnected size={22} style={{ color: 'var(--green)' }} />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 2 }}>
              {deviceName}
            </p>
            <p style={{ fontSize: 11, color: 'var(--green)', fontWeight: 600 }}>
              ● Tersambung & siap mencetak
            </p>
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div style={{
          padding: '12px 16px', borderRadius: 10,
          background: 'var(--red-bg)', border: '1.5px solid var(--red-border)',
          fontSize: 12, color: 'var(--red)', lineHeight: 1.5,
        }}>
          ⚠ {error}
        </div>
      )}

      {/* Info text */}
      <p style={{ fontSize: 12, color: 'var(--text-3)', lineHeight: 1.7 }}>
        Sambungkan printer thermal Bluetooth (BLE) untuk mencetak struk langsung tanpa pop-up print dialog.
        Setelah tersambung, semua cetak struk akan otomatis dikirim ke printer ini.
      </p>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {!isConnected ? (
          <button
            className="btn btn-primary"
            onClick={handleScan}
            disabled={isScanning}
            style={{
              padding: '10px 22px',
              background: isScanning ? 'var(--text-2)' : undefined,
            }}
          >
            {isScanning ? (
              <>
                <Loader2 size={14} className="animate-spin-slow" />
                Mencari Printer...
              </>
            ) : (
              <>
                <BluetoothSearching size={14} />
                Scan & Sambungkan Printer
              </>
            )}
          </button>
        ) : (
          <>
            <button
              className="btn btn-success"
              onClick={handleTestPrint}
              disabled={isPrinting}
              style={{ padding: '10px 18px' }}
            >
              {isPrinting ? (
                <>
                  <Loader2 size={14} className="animate-spin-slow" />
                  Mencetak...
                </>
              ) : (
                <>
                  <Printer size={14} />
                  Test Print
                </>
              )}
            </button>
            <button
              className="btn btn-secondary"
              onClick={handleDisconnect}
              style={{ padding: '10px 18px' }}
            >
              <Unplug size={14} />
              Putuskan
            </button>
            <button
              className="btn btn-danger"
              onClick={handleForget}
              style={{ padding: '10px 18px' }}
            >
              <Trash2 size={14} />
              Lupakan Printer
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function Pengaturan({ settings, setSettings, onBackup, fileInputRef }) {
  const [storeForm, setStoreForm] = useState({ ...settings });
  const [saved, setSaved] = useState(false);
  const [authUsername, setAuthUsername] = useState(() => localStorage.getItem('pos_auth_username') || '');
  const [authPassword, setAuthPassword] = useState(() => localStorage.getItem('pos_auth_password') || '');
  const [authSaved, setAuthSaved] = useState(false);

  const handleSaveStore = () => {
    setSettings(storeForm);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleSaveAuth = () => {
    if (authUsername.trim() && authPassword.trim()) {
      localStorage.setItem('pos_auth_username', authUsername.trim());
      localStorage.setItem('pos_auth_password', authPassword.trim());
      setAuthSaved(true);
      setTimeout(() => setAuthSaved(false), 2000);
    }
  };

  const handleRemoveAuth = () => {
    localStorage.removeItem('pos_auth_username');
    localStorage.removeItem('pos_auth_password');
    localStorage.removeItem('pos_auth_logged_in');
    setAuthUsername('');
    setAuthPassword('');
    Swal.fire({
      icon: 'success',
      title: 'Berhasil',
      text: 'Password berhasil dihapus. Login tidak diperlukan lagi.',
      showCloseButton: true,
      background: 'var(--surface)',
      color: 'var(--text)',
    });
  };

  return (
    <div style={{ maxWidth: 720, display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Info Toko */}
      <Section
        icon={Store}
        iconBg="var(--green-bg)"
        title="Info Toko"
        description="Informasi yang tampil di struk cetak"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }} className="store-grid">
            <Input
              label="Nama Toko"
              value={storeForm.namaToko}
              onChange={(e) => setStoreForm({ ...storeForm, namaToko: e.target.value })}
              placeholder="Nama toko Anda"
            />
            <Input
              label="No. Telp"
              value={storeForm.telp}
              onChange={(e) => setStoreForm({ ...storeForm, telp: e.target.value })}
              placeholder="08xxxxxxxxxx"
            />
          </div>

          <Input
            label="Alamat"
            value={storeForm.alamat}
            onChange={(e) => setStoreForm({ ...storeForm, alamat: e.target.value })}
            placeholder="Alamat lengkap toko"
          />

          <Input
            label="Catatan Kaki Struk"
            value={storeForm.footerStruk}
            onChange={(e) => setStoreForm({ ...storeForm, footerStruk: e.target.value })}
            placeholder="Pesan di bagian bawah struk"
          />

          {/* Lebar kertas */}
          <div>
            <label className="field-label">Lebar Kertas Struk</label>
            <div style={{ display: 'flex', gap: 10 }}>
              {['58mm', '80mm'].map((w) => (
                <label key={w} style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '9px 16px', borderRadius: 10, cursor: 'pointer',
                  border: `1.5px solid ${storeForm.lebarKertas === w ? 'var(--text)' : 'var(--border)'}`,
                  background: storeForm.lebarKertas === w ? 'var(--accent-bg)' : 'var(--surface)',
                  transition: 'all 0.12s',
                }}>
                  <input
                    type="radio" name="lebarKertas" value={w}
                    checked={storeForm.lebarKertas === w}
                    onChange={(e) => setStoreForm({ ...storeForm, lebarKertas: e.target.value })}
                    style={{ accentColor: 'var(--text)' }}
                  />
                  <span style={{ fontSize: 13, fontWeight: 600, color: storeForm.lebarKertas === w ? 'var(--text)' : 'var(--text-2)' }}>
                    {w}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <button
              className="btn btn-primary"
              onClick={handleSaveStore}
              style={{ padding: '9px 20px' }}
            >
              <Save size={14} />
              {saved ? '✓ Tersimpan!' : 'Simpan Pengaturan'}
            </button>
          </div>
        </div>
      </Section>

      {/* Auth / Password */}
      <Section
        icon={Lock}
        iconBg="var(--accent-bg)"
        title="Keamanan"
        description="Set username dan password untuk melindungi akses POS"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }} className="auth-grid">
            <div>
              <label className="field-label">Username</label>
              <input
                type="text"
                value={authUsername}
                onChange={(e) => setAuthUsername(e.target.value)}
                placeholder="Masukkan username"
                className="field-input"
              />
            </div>
            <div>
              <label className="field-label">Password</label>
              <input
                type="text"
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                placeholder="Masukkan password"
                className="field-input"
              />
            </div>
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-3)', lineHeight: 1.5 }}>
            Username dan password akan digunakan untuk login ke aplikasi. Kosongkan kedua field untuk menonaktifkan login.
          </p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onClick={handleSaveAuth} style={{ padding: '9px 20px' }}>
              <Save size={14} />
              {authSaved ? '✓ Tersimpan!' : 'Simpan Akun'}
            </button>
            {(authUsername || authPassword) && (
              <button className="btn btn-danger" onClick={handleRemoveAuth} style={{ padding: '9px 20px' }}>
                Hapus Password
              </button>
            )}
          </div>
        </div>
      </Section>

      {/* Bluetooth Printer */}
      <Section
        icon={Bluetooth}
        iconBg="var(--accent-bg)"
        title="Printer Bluetooth"
        description="Sambungkan printer thermal Bluetooth untuk cetak struk langsung"
      >
        <BluetoothPrinterSection />
      </Section>

      {/* Backup & Restore */}
      <Section
        icon={Database}
        iconBg="var(--accent-bg)"
        title="Backup & Restore"
        description="Ekspor atau impor semua data POS"
      >
        <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 16, lineHeight: 1.6 }}>
          Simpan semua data (transaksi, pelanggan, layanan, pengaturan) ke file JSON, atau pulihkan dari file backup sebelumnya.
        </p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button className="btn btn-secondary" onClick={onBackup} style={{ padding: '9px 18px' }}>
            ⬇ Backup Data (.json)
          </button>
          <button className="btn btn-secondary" onClick={() => fileInputRef.current?.click()} style={{ padding: '9px 18px' }}>
            ⬆ Restore Data (.json)
          </button>
        </div>
      </Section>

      {/* Reset Data */}
      <Section
        icon={AlertTriangle}
        iconBg="var(--red-bg)"
        title="Reset Semua Data"
        description="Hapus semua data dan mulai dari awal"
      >
        <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 16, lineHeight: 1.6 }}>
          Tindakan ini akan menghapus <strong>semua transaksi, pelanggan, layanan, dan pengaturan</strong> secara permanen. Pastikan Anda sudah melakukan backup sebelum melanjutkan.
        </p>
        <button
          className="btn btn-danger"
          onClick={() => {
            Swal.fire({
              title: 'Reset Semua Data?',
              text: 'Semua data akan dihapus permanen dan tidak bisa dikembalikan!',
              icon: 'warning',
              showCancelButton: true,
              confirmButtonColor: 'var(--red)',
              cancelButtonColor: 'var(--border-2)',
              confirmButtonText: 'Ya, Reset Semua!',
              cancelButtonText: 'Batal',
              showCloseButton: true,
              background: 'var(--surface)',
              color: 'var(--text)',
            }).then((result) => {
              if (result.isConfirmed) {
                localStorage.clear();
                window.location.reload();
              }
            });
          }}
          style={{ padding: '9px 18px' }}
        >
          <Trash2 size={14} /> Reset Semua Data
        </button>
      </Section>

      <style>{`
        @media (max-width: 560px) {
          .store-grid { grid-template-columns: 1fr !important; }
          .auth-grid { grid-template-columns: 1fr !important; }
        }
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; box-shadow: 0 0 8px var(--green); }
          50% { opacity: 0.5; box-shadow: 0 0 16px var(--green); }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow { animation: spin-slow 1s linear infinite; }
      `}</style>
    </div>
  );
}