import { useState } from 'react';
import { Save, Store, Database, AlertTriangle, Trash2 } from 'lucide-react';
import { Input } from '../components/UI';
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

export default function Pengaturan({ settings, setSettings, onBackup, fileInputRef }) {
  const [storeForm, setStoreForm] = useState({ ...settings });
  const [saved, setSaved] = useState(false);

  const handleSaveStore = () => {
    setSettings(storeForm);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
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
        @media (max-width: 560px) { .store-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </div>
  );
}