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
        fontSize: '12px',
        lineHeight: '1.4',
        color: '#000',
        background: '#fff',
        width: settings?.lebarKertas === '80mm' ? '80mm' : '58mm',
        padding: '2mm',
        boxSizing: 'border-box',
        margin: '0 auto',
      }}
    >
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '8px' }}>
        <div style={{ borderTop: '2px dashed #000', borderBottom: '2px dashed #000', padding: '4px 0', marginBottom: '4px' }}>
          <div style={{ fontWeight: 'bold', fontSize: '16px' }}>
            {settings?.namaToko || 'LAUNDRY'}
          </div>
          {settings?.alamat && (
            <div style={{ fontSize: '11px', marginTop: '2px' }}>{settings.alamat}</div>
          )}
          {settings?.telp && (
            <div style={{ fontSize: '11px' }}>{settings.telp}</div>
          )}
        </div>
      </div>

      {/* Invoice Info */}
      <div style={{ marginBottom: '8px', fontSize: '11px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            <tr>
              <td style={{ width: '60px' }}>Struk</td>
              <td>: {transaction.id}</td>
            </tr>
            <tr>
              <td>Tanggal</td>
              <td>: {formatDateTime(transaction.tanggal)}</td>
            </tr>
            <tr>
              <td>Kasir</td>
              <td>: Admin</td>
            </tr>
            <tr>
              <td>Pelanggan</td>
              <td>: {transaction.pelanggan?.nama || '-'}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style={{ borderTop: '1px dashed #000', margin: '6px 0' }}></div>

      {/* Items */}
      <div style={{ fontSize: '11px', marginBottom: '6px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            {transaction.items?.map((item, i) => (
              <tr key={i}>
                <td colSpan={2} style={{ paddingBottom: '4px' }}>
                  <div style={{ fontWeight: 'bold' }}>{item.layanan}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>{item.berat} kg x {formatRupiah(item.hargaPerKg)}</span>
                    <span>{formatRupiah(item.subtotal)}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ borderTop: '1px dashed #000', margin: '6px 0' }}></div>

      {/* Totals */}
      <div style={{ fontSize: '11px', marginBottom: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
          <span>Total Berat</span>
          <span>{transaction.totalBerat} kg</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
          <span>Subtotal</span>
          <span>{formatRupiah(transaction.totalBayar + transaction.diskon)}</span>
        </div>
        {transaction.diskon > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
            <span>Diskon</span>
            <span>-{formatRupiah(transaction.diskon)}</span>
          </div>
        )}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          fontWeight: 'bold', 
          fontSize: '14px', 
          marginTop: '6px',
          paddingTop: '6px',
          borderTop: '1px dashed #000'
        }}>
          <span>TOTAL</span>
          <span>{formatRupiah(transaction.totalBayar)}</span>
        </div>
      </div>

      <div style={{ borderTop: '1px dashed #000', margin: '6px 0' }}></div>

      {/* Status & Estimation */}
      <div style={{ fontSize: '11px', marginBottom: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Status: <strong>{transaction.status}</strong></span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Estimasi: <strong>{formatDate(transaction.estimasiSelesai)}</strong></span>
        </div>
        {transaction.catatan && (
          <div style={{ marginTop: '4px' }}>Catatan: {transaction.catatan}</div>
        )}
      </div>

      {/* Footer */}
      <div style={{ textAlign: 'center', marginTop: '12px', fontSize: '10px' }}>
        {(settings?.footerStruk || 'Terima kasih telah mempercayakan laundry Anda pada kami!').split('\n').map((line, i) => (
          <div key={i} style={{ marginBottom: '2px' }}>{line}</div>
        ))}
        <div style={{ marginTop: '8px', borderTop: '2px dashed #000', paddingTop: '4px' }}>
          *** SIMPAN STRUK INI ***
        </div>
      </div>
    </div>
  );
});

export default Receipt;
