import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Printer, Download, ArrowLeft } from 'lucide-react';
import { formatRupiah, formatDateTime, formatDate } from '../utils/helpers';
import html2canvas from 'html2canvas';
import Swal from 'sweetalert2';

function getReceiptData(id) {
  try {
    const txData = localStorage.getItem('pos_receipt_current');
    if (txData) {
      const parsed = JSON.parse(txData);
      if (parsed.id === id) return parsed;
    }
    const allTx = JSON.parse(localStorage.getItem('pos_transactions') || '[]');
    return allTx.find(t => t.id === id) || null;
  } catch (e) {
    console.error('Failed to load receipt:', e);
    return null;
  }
}

export default function ReceiptPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [transaction] = useState(() => getReceiptData(id));
  const [settings, setSettings] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const receiptRef = useRef(null);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    try {
      const settingsData = localStorage.getItem('pos_settings');
      if (settingsData) {
        setSettings(JSON.parse(settingsData));
      }
    } catch (e) {
      console.error('Failed to load settings:', e);
    }
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = async () => {
    if (!receiptRef.current) return;
    setIsDownloading(true);
    try {
      await new Promise(r => setTimeout(r, 100));
      const canvas = await html2canvas(receiptRef.current, {
        scale: 3,
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: true,
      });
      const link = document.createElement('a');
      link.download = `struk-${transaction.id}-${new Date().toISOString().split('T')[0]}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      Swal.fire({
        icon: 'success',
        title: 'Berhasil!',
        text: 'Struk berhasil diunduh',
        timer: 1500,
        showConfirmButton: false,
        toast: true,
        position: 'top-end',
      });
    } catch (error) {
      console.error('Download failed:', error);
      Swal.fire({
        icon: 'error',
        title: 'Gagal',
        text: 'Gagal mengunduh struk. Silakan coba lagi.',
        toast: true,
        position: 'top-end',
      });
    } finally {
      setIsDownloading(false);
    }
  };

  if (!transaction) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'var(--bg)',
      }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 16, color: 'var(--text-2)', marginBottom: 16 }}>Memuat struk...</p>
          <button className="btn btn-secondary" onClick={() => navigate('/')}>
            <ArrowLeft size={16} /> Kembali ke Dashboard
          </button>
        </div>
      </div>
    );
  }

  const w = settings?.lebarKertas === '80mm' ? '76mm' : '54mm';

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'var(--bg)',
      padding: '24px',
    }}>
      {/* Top Actions */}
      <div style={{ 
        maxWidth: 600, 
        margin: '0 auto 20px',
        display: 'flex',
        gap: 10,
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <button className="btn btn-secondary" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} /> Kembali
        </button>
        <div style={{ display: 'flex', gap: 8 }}>
          <button 
            className="btn btn-secondary" 
            onClick={handleDownload}
            disabled={isDownloading}
            style={{ padding: '9px 16px' }}
          >
            <Download size={16} /> {isDownloading ? 'Mengunduh...' : 'Download PNG'}
          </button>
          <button 
            className="btn btn-primary" 
            onClick={handlePrint}
            style={{ padding: '9px 16px' }}
          >
            <Printer size={16} /> Cetak Struk
          </button>
        </div>
      </div>

      {/* Receipt Preview */}
      <div style={{ 
        maxWidth: 600, 
        margin: '0 auto',
        display: 'flex',
        justifyContent: 'center',
      }}>
        <div
          ref={receiptRef}
          id="receipt-capture"
          style={{
            fontFamily: "'Source Code Pro', 'Courier New', monospace",
            fontSize: '11px',
            lineHeight: '1.5',
            color: '#000',
            background: '#fff',
            width: w,
            padding: '4mm 3mm',
            boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
            borderRadius: 4,
          }}
        >
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 6, paddingBottom: 6, borderBottom: '2px solid #000' }}>
            <div style={{ fontWeight: 700, fontSize: '14px', letterSpacing: '0.03em', marginBottom: 2 }}>
              {settings?.namaToko || 'LAUNDRY'}
            </div>
            {settings?.alamat && <div style={{ fontSize: '10px', marginBottom: 1 }}>{settings.alamat}</div>}
            {settings?.telp && <div style={{ fontSize: '10px' }}>{settings.telp}</div>}
          </div>

          {/* Invoice info */}
          <div style={{ fontSize: '10px', marginBottom: 5, paddingBottom: 5, borderBottom: '1px dashed #000' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
              <span style={{ fontWeight: 600 }}>No. Struk</span>
              <span style={{ fontWeight: 600 }}>{transaction.id}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
              <span>Tanggal</span>
              <span>{formatDateTime(transaction.tanggal)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
              <span>Kasir</span>
              <span>Admin</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Pelanggan</span>
              <span style={{ fontWeight: 600 }}>{transaction.pelanggan?.nama || '-'}</span>
            </div>
            {transaction.pelanggan?.noHp && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
                <span>No. HP</span>
                <span>{transaction.pelanggan.noHp}</span>
              </div>
            )}
          </div>

          {/* Items */}
          <div style={{ fontSize: '10px', marginBottom: 5, paddingBottom: 5, borderBottom: '1px dashed #000' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', borderBottom: '1px solid #000', marginBottom: 4, fontWeight: 700, fontSize: '9px', letterSpacing: '0.05em' }}>
              <span style={{ flex: 2 }}>LAYANAN</span>
              <span style={{ flex: 1, textAlign: 'center' }}>KG</span>
              <span style={{ flex: 1, textAlign: 'right' }}>HARGA</span>
              <span style={{ flex: 1, textAlign: 'right' }}>SUBTOTAL</span>
            </div>
            {transaction.items?.map((item, i) => (
              <div key={i} style={{ padding: '4px 0', borderBottom: '1px dashed #ccc' }}>
                <div style={{ fontWeight: 600, marginBottom: 2, fontSize: '10px' }}>{item.layanan}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#444' }}>
                  <span style={{ flex: 2 }}>{item.berat} kg</span>
                  <span style={{ flex: 1, textAlign: 'center' }}>{formatRupiah(item.hargaPerKg)}</span>
                  <span style={{ flex: 1, textAlign: 'right' }}></span>
                  <span style={{ flex: 1, textAlign: 'right', fontWeight: 600, color: '#000' }}>{formatRupiah(item.subtotal)}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div style={{ fontSize: '10px', marginBottom: 5, paddingBottom: 5, borderBottom: '1px dashed #000' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
              <span>Total Berat</span>
              <span style={{ fontWeight: 600 }}>{transaction.totalBerat} kg</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
              <span>Subtotal</span>
              <span>{formatRupiah(transaction.totalBayar + transaction.diskon)}</span>
            </div>
            {transaction.diskon > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                <span>Diskon</span>
                <span>-{formatRupiah(transaction.diskon)}</span>
              </div>
            )}
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              fontWeight: 700, fontSize: '13px', marginTop: 4, paddingTop: 4,
              borderTop: '2px solid #000',
            }}>
              <span>TOTAL</span>
              <span>{formatRupiah(transaction.totalBayar)}</span>
            </div>
          </div>

          {/* Status & Estimation */}
          <div style={{ fontSize: '10px', marginBottom: 5, paddingBottom: 5, borderBottom: '1px dashed #000' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
              <span>Status</span>
              <span style={{ fontWeight: 700 }}>{transaction.status}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
              <span>Estimasi Selesai</span>
              <span style={{ fontWeight: 700 }}>{formatDate(transaction.estimasiSelesai)}</span>
            </div>
            {transaction.catatan && (
              <div style={{ marginTop: 3, paddingTop: 3, borderTop: '1px dashed #ccc', fontSize: '9px' }}>
                <strong>Catatan:</strong> {transaction.catatan}
              </div>
            )}
          </div>

          {/* Footer */}
          <div style={{ textAlign: 'center', marginTop: 6, paddingTop: 6, borderTop: '2px solid #000', fontSize: '9px' }}>
            {(settings?.footerStruk || 'Terima kasih telah mempercayakan laundry Anda pada kami!').split('\n').map((line, i) => (
              <div key={i} style={{ marginBottom: 1 }}>{line}</div>
            ))}
            <div style={{ marginTop: 5, fontWeight: 700, fontSize: '10px', letterSpacing: '0.05em' }}>
              *** SIMPAN STRUK INI ***
            </div>
          </div>
        </div>
      </div>

      {/* Print-only actions (hidden on screen, shown when printing) */}
      <div className="print-actions" style={{ display: 'none' }}>
        <p>Struk {transaction.id} - {transaction.pelanggan?.nama}</p>
      </div>

      <style>{`
        @media print {
          body > * { display: none !important; }
          #receipt-capture {
            display: block !important;
            position: absolute !important;
            left: 50% !important;
            top: 0 !important;
            transform: translateX(-50%) !important;
            box-shadow: none !important;
            border-radius: 0 !important;
          }
          @page { margin: 0; size: auto; }
        }
        @media screen {
          .print-actions { display: none !important; }
        }
      `}</style>
    </div>
  );
}