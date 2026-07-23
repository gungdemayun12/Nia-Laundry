import { forwardRef } from 'react';
import { formatRupiah, formatDateTime, formatDate } from '../utils/helpers';
import LogoImage from '../assets/nia laundry.png';

const Receipt = forwardRef(function Receipt({ transaction, settings, id }, ref) {
  if (!transaction) return null;

  const is58mm = settings?.lebarKertas !== '80mm';
  const width = is58mm ? '54mm' : '76mm';
  const fontSize = is58mm ? '12px' : '14px';
  const smallSize = is58mm ? '11px' : '12px';
  const titleSize = is58mm ? '16px' : '18px';

  return (
    <div
      ref={ref}
      id={id}
      style={{
        fontFamily: "'Courier New', Courier, monospace",
        fontSize: fontSize,
        lineHeight: '1.4',
        color: '#000',
        background: '#fff',
        width: width,
        padding: is58mm ? '2mm' : '4mm',
        boxSizing: 'border-box',
        margin: '0 auto',
      }}
    >
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 8, paddingBottom: 8, borderBottom: '1px dashed #000' }}>
        <img 
          src={LogoImage} 
          alt="Logo" 
          style={{ width: is58mm ? 36 : 48, height: 'auto', marginBottom: 4, filter: 'grayscale(100%)' }} 
        />
        <div style={{ fontWeight: 'bold', fontSize: titleSize, marginBottom: 4 }}>
          {settings?.namaToko || 'NIA LAUNDRY'}
        </div>
        {settings?.alamat && (
          <div style={{ fontSize: smallSize, marginBottom: 2 }}>{settings.alamat}</div>
        )}
        {settings?.telp && (
          <div style={{ fontSize: smallSize }}>{settings.telp}</div>
        )}
      </div>

      {/* Invoice info */}
      <div style={{ fontSize: smallSize, marginBottom: 8, paddingBottom: 8, borderBottom: '1px dashed #000' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
          <span>Struk:</span>
          <span style={{ fontWeight: 'bold' }}>{transaction.id}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
          <span>Tgl:</span>
          <span>{formatDateTime(transaction.tanggal)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
          <span>Kasir:</span>
          <span>Admin</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Plgn:</span>
          <span style={{ fontWeight: 'bold' }}>{transaction.pelanggan?.nama || '-'}</span>
        </div>
        {transaction.pelanggan?.noHp && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
            <span>HP:</span>
            <span>{transaction.pelanggan.noHp}</span>
          </div>
        )}
      </div>

      {/* Items */}
      <div style={{ fontSize: smallSize, marginBottom: 8, paddingBottom: 8, borderBottom: '1px dashed #000' }}>
        {transaction.items?.map((item, i) => (
          <div key={i} style={{ marginBottom: 6 }}>
            <div style={{ fontWeight: 'bold', marginBottom: 2 }}>{item.layanan}</div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>{item.berat}kg x {formatRupiah(item.hargaPerKg)}</span>
              <span style={{ fontWeight: 'bold' }}>{formatRupiah(item.subtotal)}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div style={{ fontSize: smallSize, marginBottom: 8, paddingBottom: 8, borderBottom: '1px dashed #000' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
          <span>Berat Total:</span>
          <span>{transaction.totalBerat} kg</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
          <span>Subtotal:</span>
          <span>{formatRupiah(transaction.totalBayar + transaction.diskon)}</span>
        </div>
        {transaction.diskon > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
            <span>Diskon:</span>
            <span>-{formatRupiah(transaction.diskon)}</span>
          </div>
        )}
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          fontWeight: 'bold', fontSize: fontSize, marginTop: 4, paddingTop: 4,
          borderTop: '1px dashed #000',
        }}>
          <span>TOTAL:</span>
          <span>{formatRupiah(transaction.totalBayar)}</span>
        </div>
      </div>

      {/* Status & Estimation */}
      <div style={{ fontSize: smallSize, marginBottom: 8, paddingBottom: 8, borderBottom: '1px dashed #000' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
          <span>Status:</span>
          <span style={{ fontWeight: 'bold' }}>{transaction.status}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
          <span>Selesai:</span>
          <span style={{ fontWeight: 'bold' }}>{formatDate(transaction.estimasiSelesai)}</span>
        </div>
        {transaction.catatan && (
          <div style={{ marginTop: 4, paddingTop: 4, borderTop: '1px dashed #000', fontStyle: 'italic' }}>
            *{transaction.catatan}
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ textAlign: 'center', marginTop: 8, fontSize: smallSize }}>
        {(settings?.footerStruk || 'Terima Kasih!').split('\n').map((line, i) => (
          <div key={i} style={{ marginBottom: 2 }}>{line}</div>
        ))}
        <div style={{ marginTop: 8, fontWeight: 'bold' }}>
          -- SIMPAN STRUK INI --
        </div>
      </div>
    </div>
  );
});

export default Receipt;