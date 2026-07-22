import { useState } from 'react';
import { PlusCircle, Edit3, Trash2, Save } from 'lucide-react';
import Swal from 'sweetalert2';
import Modal from '../components/Modal';
import { formatRupiah, generateId } from '../utils/helpers';

export default function Layanan({ services, setServices }) {
  const [editService, setEditService] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [serviceName, setServiceName] = useState('');
  const [servicePrice, setServicePrice] = useState('');

  const handleSaveService = () => {
    if (!serviceName.trim() || !servicePrice) return;
    if (editService) {
      setServices((p) => p.map((s) => s.id === editService.id
        ? { ...s, nama: serviceName.trim(), hargaPerKg: parseInt(servicePrice) } : s));
    } else {
      setServices((p) => [...p, { id: generateId('srv', p), nama: serviceName.trim(), hargaPerKg: parseInt(servicePrice) }]);
    }
    setShowModal(false);
    setEditService(null);
    setServiceName('');
    setServicePrice('');
  };

  const openEdit = (s) => {
    setEditService(s);
    setServiceName(s.nama);
    setServicePrice(String(s.hargaPerKg));
    setShowModal(true);
  };

  const openNew = () => {
    setEditService(null);
    setServiceName('');
    setServicePrice('');
    setShowModal(true);
  };

  const handleDelete = (id) => {
    setServices((p) => p.filter((s) => s.id !== id));
  };

  const handleDeleteClick = (id) => {
    Swal.fire({
      title: 'Hapus Layanan?',
      text: 'Layanan ini akan dihapus permanen. Riwayat transaksi yang sudah ada tidak terpengaruh.',
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
        handleDelete(id);
        Swal.fire({ title: 'Terhapus!', text: 'Layanan berhasil dihapus.', icon: 'success', confirmButtonColor: 'var(--text)', showCloseButton: true, background: 'var(--surface)', color: 'var(--text)' });
      }
    });
  };

  const IconBtn = ({ onClick, color, hoverBg, children, title }) => (
    <button
      onClick={onClick}
      title={title}
      style={{
        width: 32, height: 32, borderRadius: 8, border: '1.5px solid transparent',
        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'transparent', color, transition: 'all 0.12s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = hoverBg;
        e.currentTarget.style.borderColor = 'var(--accent-border)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent';
        e.currentTarget.style.borderColor = 'transparent';
      }}
    >
      {children}
    </button>
  );

  return (
    <div style={{ maxWidth: 720, display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Header */}
      <div className="card" style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>Manajemen Layanan</h2>
          <p style={{ fontSize: 12, color: 'var(--text-3)' }}>
            Kelola daftar layanan dan tarif per kilogram
          </p>
        </div>
        <button className="btn btn-primary" onClick={openNew} style={{ padding: '8px 16px', fontSize: 13 }}>
          <PlusCircle size={15} /> Tambah Layanan
        </button>
      </div>

      {/* Services List */}
      <div className="card" style={{ overflow: 'hidden' }}>
        {services.length === 0 ? (
          <div style={{ padding: '48px 24px', textAlign: 'center' }}>
            <p style={{ fontSize: 13, color: 'var(--text-3)' }}>Belum ada layanan. Klik "Tambah Layanan" untuk menambahkan.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 160px 80px',
              padding: '10px 16px', borderRadius: 8,
              background: 'var(--surface-2)', border: '1px solid var(--border)',
              marginBottom: 8,
            }}>
              {['Nama Layanan', 'Harga / kg', ''].map((h, i) => (
                <span key={i} style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-3)' }}>{h}</span>
              ))}
            </div>

            {/* List */}
            {services.map((s, idx) => (
              <div key={s.id} style={{
                display: 'grid', gridTemplateColumns: '1fr 160px 80px',
                alignItems: 'center', padding: '12px 16px', borderRadius: 10,
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                marginBottom: idx < services.length - 1 ? 8 : 0,
                transition: 'all 0.15s',
              }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--surface-2)';
                  e.currentTarget.style.borderColor = 'var(--accent-border)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'var(--surface)';
                  e.currentTarget.style.borderColor = 'var(--border)';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                    background: 'var(--accent-bg)', border: '1.5px solid var(--accent-border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 700, color: 'var(--text)',
                  }}>
                    {s.nama.charAt(0).toUpperCase()}
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{s.nama}</span>
                </div>
                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>
                  {formatRupiah(s.hargaPerKg)}
                  <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--text-3)', marginLeft: 4 }}>/ kg</span>
                </span>
                <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                  <IconBtn onClick={() => openEdit(s)} color="var(--text)" hoverBg="var(--accent-bg)" title="Edit">
                    <Edit3 size={15} />
                  </IconBtn>
                  <IconBtn onClick={() => handleDeleteClick(s.id)} color="var(--red)" hoverBg="var(--red-bg)" title="Hapus">
                    <Trash2 size={15} />
                  </IconBtn>
                </div>
              </div>
            ))}
        </div>
        )}
      </div>

      {/* Service Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setEditService(null); }}
        title={editService ? 'Edit Layanan' : 'Tambah Layanan Baru'}
        maxWidth="420px"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label className="field-label">Nama Layanan</label>
            <input
              type="text"
              value={serviceName}
              onChange={(e) => setServiceName(e.target.value)}
              placeholder="Contoh: Cuci Reguler"
              className="field-input"
              autoFocus
            />
          </div>
          <div>
            <label className="field-label">Harga per Kg (Rp)</label>
            <input
              type="number"
              min="0"
              value={servicePrice}
              onChange={(e) => setServicePrice(e.target.value)}
              placeholder="6000"
              className="field-input"
            />
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 4 }}>
            <button className="btn btn-secondary" onClick={() => { setShowModal(false); setEditService(null); }} style={{ padding: '8px 18px' }}>
              Batal
            </button>
            <button className="btn btn-primary" onClick={handleSaveService} style={{ padding: '8px 18px' }}>
              <Save size={14} /> {editService ? 'Simpan Perubahan' : 'Tambah'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}