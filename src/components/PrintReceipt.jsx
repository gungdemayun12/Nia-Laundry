import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { formatRupiah, formatDateTime, formatDate } from '../utils/helpers';

function ReceiptContent({ transaction, settings, receiptId }) {
  if (!transaction) return null;

  const w = settings?.lebarKertas === '80mm' ? '76mm' : '54mm';
  const is58mm = settings?.lebarKertas !== '80mm';
  const id = receiptId || 'receipt-capture';

  return (
    <div
      id={id}
      style={{
        fontFamily: "'Source Code Pro', 'Courier New', monospace",
        fontSize: is58mm ? '10px' : '11px',
        lineHeight: '1.6',
        color: '#000',
        background: '#fff',
        width: w,
        padding: is58mm ? '3mm 2mm' : '4mm 3mm',
      }}
    >
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 8, paddingBottom: 8, borderBottom: '2px solid #000' }}>
        <div style={{ fontWeight: 700, fontSize: is58mm ? '13px' : '14px', letterSpacing: '0.05em', marginBottom: 3 }}>
          {settings?.namaToko || 'LAUNDRY'}
        </div>
        {settings?.alamat && (
          <div style={{ fontSize: '9px', marginBottom: 2, lineHeight: 1.4 }}>{settings.alamat}</div>
        )}
        {settings?.telp && (
          <div style={{ fontSize: '9px' }}>{settings.telp}</div>
        )}
      </div>

      {/* Invoice info */}
      <div style={{ fontSize: '9px', marginBottom: 6, paddingBottom: 6, borderBottom: '1px dashed #000' }}>
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
      <div style={{ fontSize: '9px', marginBottom: 6, paddingBottom: 6, borderBottom: '1px dashed #000' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          padding: '3px 0', 
          borderBottom: '1px solid #000', 
          marginBottom: 4, 
          fontWeight: 700, 
          fontSize: '8px', 
          letterSpacing: '0.08em',
          color: '#000',
        }}>
          <span style={{ flex: 2 }}>LAYANAN</span>
          <span style={{ flex: 1, textAlign: 'center' }}>KG</span>
          <span style={{ flex: 1, textAlign: 'right' }}>HARGA</span>
          <span style={{ flex: 1, textAlign: 'right' }}>JML</span>
        </div>
        {transaction.items?.map((item, i) => (
          <div key={i} style={{ padding: '4px 0', borderBottom: '1px dashed #ccc' }}>
            <div style={{ fontWeight: 600, marginBottom: 2, fontSize: '9px', lineHeight: 1.3 }}>{item.layanan}</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '8px', color: '#333' }}>
              <span style={{ flex: 2 }}>{item.berat} kg</span>
              <span style={{ flex: 1, textAlign: 'center' }}>{formatRupiah(item.hargaPerKg)}</span>
              <span style={{ flex: 1, textAlign: 'right' }}></span>
              <span style={{ flex: 1, textAlign: 'right', fontWeight: 600, color: '#000' }}>{formatRupiah(item.subtotal)}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div style={{ fontSize: '9px', marginBottom: 6, paddingBottom: 6, borderBottom: '1px dashed #000' }}>
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
          fontWeight: 700, fontSize: '12px', marginTop: 4, paddingTop: 4,
          borderTop: '2px solid #000',
          letterSpacing: '0.02em',
        }}>
          <span>TOTAL</span>
          <span>{formatRupiah(transaction.totalBayar)}</span>
        </div>
      </div>

      {/* Status & Estimation */}
      <div style={{ fontSize: '9px', marginBottom: 6, paddingBottom: 6, borderBottom: '1px dashed #000' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
          <span>Status</span>
          <span style={{ fontWeight: 700 }}>{transaction.status}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
          <span>Estimasi</span>
          <span style={{ fontWeight: 700 }}>{formatDate(transaction.estimasiSelesai)}</span>
        </div>
        {transaction.catatan && (
          <div style={{ marginTop: 3, paddingTop: 3, borderTop: '1px dashed #ccc', fontSize: '8px', lineHeight: 1.4 }}>
            <strong>Catatan:</strong> {transaction.catatan}
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ textAlign: 'center', marginTop: 6, paddingTop: 6, borderTop: '2px solid #000', fontSize: '8px' }}>
        {(settings?.footerStruk || 'Terima kasih telah mempercayakan laundry Anda pada kami!').split('\n').map((line, i) => (
          <div key={i} style={{ marginBottom: 2, lineHeight: 1.4 }}>{line}</div>
        ))}
        <div style={{ marginTop: 6, fontWeight: 700, fontSize: '9px', letterSpacing: '0.08em' }}>
          *** SIMPAN STRUK INI ***
        </div>
      </div>
    </div>
  );
}

export default function PrintReceipt({ transaction, settings }) {
  useEffect(() => {
    if (!document.getElementById('receipt-portal')) {
      const div = document.createElement('div');
      div.id = 'receipt-portal';
      document.body.appendChild(div);
    }
  }, []);

  const portal = document.getElementById('receipt-portal');
  if (!portal || !transaction) return null;

  return createPortal(
    <ReceiptContent transaction={transaction} settings={settings} />,
    portal
  );
}

export function ReceiptPreview({ transaction, settings, receiptId }) {
  if (!transaction) return null;
  return <ReceiptContent transaction={transaction} settings={settings} receiptId={receiptId} />;
}