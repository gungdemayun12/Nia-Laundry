import { forwardRef } from 'react';
import { formatRupiah, formatDateTime, formatDate } from '../utils/helpers';

const Receipt = forwardRef(function Receipt({ transaction, settings }, ref) {
  if (!transaction) return null;

  const paperClass = settings?.lebarKertas === '80mm' ? 'receipt-80mm' : 'receipt-58mm';

  return (
    <div
      ref={ref}
      className={`receipt-print ${paperClass}`}
      style={{
        fontFamily: "'Courier New', Courier, monospace",
        fontSize: '11px',
        lineHeight: '1.4',
        color: '#000',
        background: '#fff',
        width: settings?.lebarKertas === '80mm' ? '80mm' : '58mm',
        padding: '3mm 2mm',
        boxSizing: 'border-box',
        margin: '0 auto',
      }}
    >
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '6px' }}>
        <div style={{ borderTop: '2px solid #000', borderBottom: '2px solid #000', padding: '3px 0', marginBottom: '3px' }}>
          <div style={{ fontWeight: 'bold', fontSize: '14px', letterSpacing: '0.02em' }}>
            {settings?.namaToko || 'LAUNDRY'}
          </div>
          {settings?.alamat && (
            <div style={{ fontSize: '10px', marginTop: '1px' }}>{settings.alamat}</div>
          )}
          {settings?.telp && (
            <div style={{ fontSize: '10px' }}>{settings.telp}</div>
          )}
        </div>
      </div>

      {/* Invoice Info */}
      <div style={{ marginBottom: '6px', fontSize: '10px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            <tr>
              <td style={{ width: '55px', fontWeight: 600 }}>No. Struk</td>
              <td>: {transaction.id}</td>
            </tr>
            <tr>
              <td style={{ fontWeight: 600 }}>Tanggal</td>
              <td>: {formatDateTime(transaction.tanggal)}</td>
            </tr>
            <tr>
              <td style={{ fontWeight: 600 }}>Kasir</td>
              <td>: Admin</td>
            </tr>
            <tr>
              <td style={{ fontWeight: 600 }}>Pelanggan</td>
              <td>: {transaction.pelanggan?.nama || '-'}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style={{ borderTop: '1px solid #000', margin: '5px 0' }}></div>

      {/* Items */}
      <div style={{ fontSize: '10px', marginBottom: '5px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #000' }}>
              <th style={{ textAlign: 'left', paddingBottom: 2 }}>Item</th>
              <th style={{ textAlign: 'right', paddingBottom: 2 }}>Harga</th>
              <th style={{ textAlign: 'right', paddingBottom: 2 }}>Sub</th>
            </tr>
          </thead>
          <tbody>
            {transaction.items?.map((item, i) => (
              <tr key={i}>
                <td style={{ padding: '3px 0', borderBottom: '1px dashed #ccc' }}>
                  <div style={{ fontWeight: 'bold' }}>{item.layanan}</div>
                  <div style={{ fontSize: '9px', color: '#666' }}>{item.berat} kg x {formatRupiah(item.hargaPerKg)}</div>
                </td>
                <td style={{ padding: '3px 0', borderBottom: '1px dashed #ccc', textAlign: 'right', fontSize: '9px', color: '#666' }}>
                  {formatRupiah(item.hargaPerKg)}
                </td>
                <td style={{ padding: '3px 0', borderBottom: '1px dashed #ccc', textAlign: 'right', fontWeight: 600 }}>
                  {formatRupiah(item.subtotal)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ borderTop: '1px solid #000', margin: '5px 0' }}></div>

      {/* Totals */}
      <div style={{ fontSize: '10px', marginBottom: '6px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
          <span>Total Berat</span>
          <span>{transaction.totalBerat} kg</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
          <span>Subtotal</span>
          <span>{formatRupiah(transaction.totalBayar + transaction.diskon)}</span>
        </div>
        {transaction.diskon > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
            <span>Diskon</span>
            <span>-{formatRupiah(transaction.diskon)}</span>
          </div>
        )}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontWeight: 'bold',
          fontSize: '13px',
          marginTop: 4,
          paddingTop: 4,
          borderTop: '2px solid #000',
        }}>
          <span>TOTAL</span>
          <span>{formatRupiah(transaction.totalBayar)}</span>
        </div>
      </div>

      <div style={{ borderTop: '1px solid #000', margin: '5px 0' }}></div>

      {/* Status & Estimation */}
      <div style={{ fontSize: '10px', marginBottom: '6px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Status</span>
          <span style={{ fontWeight: 'bold' }}>{transaction.status}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Estimasi</span>
          <span style={{ fontWeight: 'bold' }}>{formatDate(transaction.estimasiSelesai)}</span>
        </div>
        {transaction.catatan && (
          <div style={{ marginTop: 3, padding: '3px 0', borderTop: '1px dashed #ccc' }}>Catatan: {transaction.catatan}</div>
        )}
      </div>

      {/* Footer */}
      <div style={{ textAlign: 'center', marginTop: '8px', fontSize: '9px' }}>
        {(settings?.footerStruk || 'Terima kasih telah mempercayakan laundry Anda pada kami!').split('\n').map((line, i) => (
          <div key={i} style={{ marginBottom: '1px' }}>{line}</div>
        ))}
        <div style={{ marginTop: '6px', borderTop: '2px solid #000', paddingTop: '3px' }}>
          *** SIMPAN STRUK INI ***
        </div>
      </div>
    </div>
  );
});

export default Receipt;