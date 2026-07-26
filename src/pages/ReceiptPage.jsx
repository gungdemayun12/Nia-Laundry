import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Printer, Download, ArrowLeft, Bluetooth, BluetoothConnected, Loader2, Smartphone, Wifi } from 'lucide-react';
import html2canvas from 'html2canvas';
import Swal from 'sweetalert2';
import Receipt from '../components/Receipt';
import bluetoothPrinter, { buildReceiptBytes } from '../utils/bluetoothPrinter';
import { isIOS, airPrintReceipt, triggerNativePrint } from '../utils/iosPrintFallback';

function getReceiptData(id) {
  try {
    const params = new URLSearchParams(window.location.hash.split('?')[1] || '');
    const txParam = params.get('tx');
    const setParam = params.get('s');
    const autoPrint = params.get('print');
    if (txParam) {
      try {
        const tx = JSON.parse(decodeURIComponent(txParam));
        if (tx?.id) {
          if (setParam) {
            try {
              const s = JSON.parse(decodeURIComponent(setParam));
              localStorage.setItem('pos_settings_tmp', JSON.stringify(s));
            } catch {}
          }
          localStorage.setItem('pos_receipt_current', JSON.stringify(tx));
          if (autoPrint) {
            localStorage.setItem('pos_receipt_autoprint', '1');
          }
          return tx;
        }
      } catch {}
    }
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
  const location = useLocation();
  const [transaction] = useState(() => getReceiptData(id));
  const [settings, setSettings] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isBtPrinting, setIsBtPrinting] = useState(false);
  const [btConnected, setBtConnected] = useState(() => bluetoothPrinter.isConnected);
  const [onIOS] = useState(() => isIOS());
  const receiptRef = useRef(null);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    try {
      const tmpSet = localStorage.getItem('pos_settings_tmp');
      if (tmpSet) {
        setSettings(JSON.parse(tmpSet));
      } else {
        const settingsData = localStorage.getItem('pos_settings');
        if (settingsData) {
          setSettings(JSON.parse(settingsData));
        }
      }
    } catch (e) {
      console.error('Failed to load settings:', e);
    }
  }, []);

  // Subscribe to Bluetooth printer state changes
  useEffect(() => {
    const unsub = bluetoothPrinter.subscribe((state) => {
      setBtConnected(state.isConnected);
    });
    return unsub;
  }, []);

  // Auto-print: via BT if connected, else native print (AirPrint on iOS)
  useEffect(() => {
    if (!transaction || !settings) return;
    const shouldAutoPrint = localStorage.getItem('pos_receipt_autoprint') === '1';
    const params = new URLSearchParams(window.location.hash.split('?')[1] || '');
    const printParam = params.get('print');

    if (shouldAutoPrint || printParam === '1') {
      localStorage.removeItem('pos_receipt_autoprint');
      setTimeout(() => {
        if (btConnected && !onIOS) {
          handleBluetoothPrint();
        } else {
          triggerNativePrint();
        }
      }, 600);
    } else if (bluetoothPrinter.isConnected && !onIOS) {
      handleBluetoothPrint();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings]);

  const handleBluetoothPrint = async () => {
    if (!transaction || !settings) return;
    setIsBtPrinting(true);
    try {
      const bytes = buildReceiptBytes(transaction, settings);
      await bluetoothPrinter.sendBytes(bytes);
      Swal.fire({
        icon: 'success',
        title: 'Struk Tercetak!',
        text: 'Struk berhasil dikirim ke printer Bluetooth.',
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
        title: 'Gagal Cetak BT',
        text: err.message + '\n\nMenggunakan cetak AirPrint / WiFi sebagai ganti.',
        showCloseButton: true,
        background: 'var(--surface)',
        color: 'var(--text)',
      });
      setTimeout(() => triggerNativePrint(), 400);
    } finally {
      setIsBtPrinting(false);
    }
  };

  const handlePrint = () => {
    if (btConnected && !onIOS) {
      handleBluetoothPrint();
    } else {
      triggerNativePrint();
    }
  };

  const handleAirPrintPopup = () => {
    if (!transaction || !settings) return;
    const ok = airPrintReceipt(transaction, settings);
    if (!ok) {
      triggerNativePrint();
    }
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

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'var(--bg)',
      padding: '24px',
    }}>
      {/* iOS notice banner */}
      {onIOS && (
        <div style={{
          maxWidth: 600, margin: '0 auto 18px',
          padding: '14px 18px', borderRadius: 14,
          background: 'var(--amber-bg)', border: '1.5px solid var(--amber-border)',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 10, flexShrink: 0,
              background: '#fff', border: '1.5px solid var(--amber-border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Smartphone size={15} style={{ color: 'var(--amber)' }} />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 12, fontWeight: 800, color: 'var(--amber)', marginBottom: 3 }}>
                📱 Pengguna iPhone: Gunakan AirPrint
              </p>
              <p style={{ fontSize: 11, color: 'var(--text-2)', lineHeight: 1.5 }}>
                Apple memblokir Bluetooth langsung di browser. Tap tombol
                <strong style={{ color: 'var(--text)' }}> "Cetak via AirPrint" </strong>
                di bawah → pilih printer WiFi Anda.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Top Actions */}
      <div style={{ 
        maxWidth: 600, 
        margin: '0 auto 20px',
        display: 'flex',
        gap: 10,
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
      }}>
        <button className="btn btn-secondary" onClick={() => {
          if (window.history.length <= 2) {
            window.close();
            setTimeout(() => navigate('/'), 100);
          } else {
            navigate(-1);
          }
        }}>
          <ArrowLeft size={16} /> Tutup / Kembali
        </button>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {btConnected && (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '6px 12px', borderRadius: 20,
              background: 'var(--green-bg)', border: '1px solid var(--green-border)',
              fontSize: 11, fontWeight: 600, color: 'var(--green)',
            }}>
              <BluetoothConnected size={12} />
              BT
            </div>
          )}
          <button 
            className="btn btn-secondary" 
            onClick={handleDownload}
            disabled={isDownloading}
            style={{ padding: '9px 16px' }}
          >
            <Download size={16} /> {isDownloading ? 'Mengunduh...' : 'PNG'}
          </button>
          {onIOS && (
            <button
              className="btn btn-success"
              onClick={handleAirPrintPopup}
              style={{ padding: '9px 16px' }}
            >
              <Wifi size={16} /> AirPrint
            </button>
          )}
          <button 
            className="btn btn-primary" 
            onClick={handlePrint}
            disabled={isBtPrinting}
            style={{ padding: '9px 16px' }}
          >
            {isBtPrinting ? (
              <>
                <Loader2 size={16} className="animate-spin-slow" />
                Mencetak...
              </>
            ) : btConnected && !onIOS ? (
              <>
                <Bluetooth size={16} /> Cetak via BT
              </>
            ) : (
              <>
                <Printer size={16} /> Cetak Struk
              </>
            )}
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
        <div style={{
          boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
          borderRadius: 4,
          overflow: 'hidden',
        }}>
          <Receipt ref={receiptRef} transaction={transaction} settings={settings} id="receipt-capture" />
        </div>
      </div>

      {/* Print-only actions (hidden on screen, shown when printing) */}
      <div className="print-actions" style={{ display: 'none' }}>
        <p>Struk {transaction.id} - {transaction.pelanggan?.nama}</p>
      </div>

      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #receipt-capture, #receipt-capture * {
            visibility: visible;
          }
          #receipt-capture {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            margin: 0 !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            transform: none !important;
          }
          @page { margin: 0; size: ${settings?.lebarKertas === '80mm' ? '80mm' : '58mm'} auto; }
        }
        @media screen {
          .print-actions { display: none !important; }
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