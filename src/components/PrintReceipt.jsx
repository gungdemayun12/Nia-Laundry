import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { formatRupiah, formatDateTime, formatDate } from '../utils/helpers';

/**
 * Renders the receipt into a top-level portal div (#receipt-portal).
 * This ensures the receipt is always visible during window.print(),
 * regardless of any modal/overlay z-index or visibility rules.
 */
function ReceiptContent({ transaction, settings }) {
  if (!transaction) return null;

  const w = settings?.lebarKertas === '80mm' ? '76mm' : '54mm';

  const styles = {
    wrap: {
      fontFamily: "'Courier New', Courier, monospace",
      fontSize: '12px', lineHeight: '1.5',
      color: '#000', background: '#fff',
      width: w, padding: '4mm 3mm', margin: '0 auto',
    },
    center: { textAlign: 'center' },
    dash: { borderTop: '1px dashed #000', margin: '6px 0' },
    row: { display: 'flex', justifyContent: 'space-between', marginBottom: 2 },
    bold: { fontWeight: 'bold' },
    sm: { fontSize: '11px' },
    totalRow: {
      display: 'flex', justifyContent: 'space-between',
      fontWeight: 'bold', fontSize: '14px',
      borderTop: '2px dashed #000', marginTop: 6, paddingTop: 6,
    },
  };

  return (
    <div style={styles.wrap}>
      {/* Header */}
      <div style={{ ...styles.center, ...styles.sm, borderBottom: '2px dashed #000', paddingBottom: 6, marginBottom: 6 }}>
        <div style={{ fontWeight: 'bold', fontSize: '15px', letterSpacing: '0.05em' }}>
          {settings?.namaToko || 'LAUNDRY'}
        </div>
        {settings?.alamat && <div style={{ marginTop: 2 }}>{settings.alamat}</div>}
        {settings?.telp && <div>{settings.telp}</div>}
      </div>

      {/* Invoice info */}
      <div style={{ ...styles.sm, marginBottom: 6 }}>
        <div style={styles.row}><span>No. Struk</span><span>{transaction.id}</span></div>
        <div style={styles.row}><span>Tanggal</span><span>{formatDateTime(transaction.tanggal)}</span></div>
        <div style={styles.row}><span>Kasir</span><span>Admin</span></div>
        <div style={styles.row}><span>Pelanggan</span><span>{transaction.pelanggan?.nama || '-'}</span></div>
        {transaction.pelanggan?.noHp && (
          <div style={styles.row}><span>No. HP</span><span>{transaction.pelanggan.noHp}</span></div>
        )}
      </div>

      <div style={styles.dash} />

      {/* Items */}
      <div style={{ ...styles.sm, marginBottom: 6 }}>
        {transaction.items?.map((item, i) => (
          <div key={i} style={{ marginBottom: 6 }}>
            <div style={styles.bold}>{item.layanan}</div>
            <div style={styles.row}>
              <span>{item.berat} kg × {formatRupiah(item.hargaPerKg)}</span>
              <span>{formatRupiah(item.subtotal)}</span>
            </div>
          </div>
        ))}
      </div>

      <div style={styles.dash} />

      {/* Totals */}
      <div style={{ ...styles.sm, marginBottom: 6 }}>
        <div style={styles.row}><span>Total Berat</span><span>{transaction.totalBerat} kg</span></div>
        <div style={styles.row}><span>Subtotal</span><span>{formatRupiah(transaction.totalBayar)}</span></div>
        {transaction.diskon > 0 && (
          <div style={styles.row}><span>Diskon</span><span>-{formatRupiah(transaction.diskon)}</span></div>
        )}
        <div style={styles.totalRow}>
          <span>TOTAL</span>
          <span>{formatRupiah(transaction.totalBayar)}</span>
        </div>
      </div>

      <div style={styles.dash} />

      {/* Status */}
      <div style={{ ...styles.sm, marginBottom: 8 }}>
        <div style={styles.row}><span>Status</span><span style={styles.bold}>{transaction.status}</span></div>
        <div style={styles.row}><span>Estimasi</span><span style={styles.bold}>{formatDate(transaction.estimasiSelesai)}</span></div>
        {transaction.catatan && (
          <div style={{ marginTop: 4 }}>Catatan: {transaction.catatan}</div>
        )}
      </div>

      {/* Footer */}
      <div style={{ ...styles.center, ...styles.sm, borderTop: '2px dashed #000', paddingTop: 6 }}>
        {(settings?.footerStruk || 'Terima kasih atas kepercayaan Anda!').split('\n').map((l, i) => (
          <div key={i}>{l}</div>
        ))}
        <div style={{ marginTop: 6, fontWeight: 'bold' }}>*** SIMPAN STRUK INI ***</div>
      </div>
    </div>
  );
}

// Portal wrapper — mounts into #receipt-portal in body
export default function PrintReceipt({ transaction, settings }) {
  // Ensure portal div exists
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

// Preview component (shown in UI, not used for print)
export function ReceiptPreview({ transaction, settings }) {
  if (!transaction) return null;
  return <ReceiptContent transaction={transaction} settings={settings} />;
}
