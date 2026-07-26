/**
 * Utility helpers for iOS compatibility and fallback printing.
 *
 * On iOS (iPhone/iPad), Apple blocks the Web Bluetooth API in ALL browsers
 * (Chrome, Firefox, etc. all use WebKit/Safari engine under the hood).
 *
 * Fallback strategies for iPhone users:
 *   1. AirPrint via window.print() — works on every iOS browser
 *   2. Share Sheet via Web Share API — share PDF/image to printer app
 *   3. Open dedicated receipt page for manual print
 */

export function isIOS() {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  const isIPhone = /iPhone|iPad|iPod/i.test(ua);
  const isMacIPad = /Mac/i.test(ua) && navigator.maxTouchPoints && navigator.maxTouchPoints > 1;
  return isIPhone || isMacIPad;
}

export function isSafari() {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  return /^((?!chrome|android).)*safari/i.test(ua);
}

export function isWebShareSupported() {
  return !!(typeof navigator !== 'undefined' && navigator.share && navigator.canShare);
}

export function getIOSPrintGuide() {
  return [
    {
      step: 'Gunakan Safari',
      detail: 'Gunakan app Safari (bukan Chrome) karena iOS membatasi API di browser lain.',
    },
    {
      step: 'Update iOS ke 15.4+',
      detail: 'Pengaturan → Umum → Pembaruan Perangkat Lunak. Web Bluetooth baru ada di iOS 15.4 ke atas.',
    },
    {
      step: 'Tambahkan ke Layar Utama',
      detail: 'Di Safari, tap tombol Bagikan (kotak panah atas) → "Tambahkan ke Layar Utama". Buka appnya dari layar utama.',
    },
    {
      step: 'Atau pakai AirPrint (lebih mudah)',
      detail: 'Tap tombol Cetak Struk → pilih printer AirPrint yang sudah tersambung ke jaringan WiFi yang sama.',
    },
  ];
}

/**
 * Open the receipt in a new window and trigger the native print dialog.
 * This works on ALL platforms including iOS via AirPrint.
 */
export async function openReceiptPrintWindow(transaction, settings) {
  if (!transaction) return;
  const encodedTx = encodeURIComponent(JSON.stringify(transaction));
  const encodedSet = encodeURIComponent(JSON.stringify(settings || {}));
  const url = `${window.location.origin}/#/struk/${transaction.id}?tx=${encodedTx}&s=${encodedSet}&print=1`;
  window.open(url, '_blank');
}

/**
 * Trigger window.print() immediately on the current page (used inside ReceiptPage).
 */
export function triggerNativePrint() {
  if (typeof window === 'undefined') return;
  const tryPrint = () => {
    try {
      window.print();
    } catch (e) {
      console.warn('Print dialog failed:', e);
    }
  };
  if (document.readyState === 'complete') {
    setTimeout(tryPrint, 300);
  } else {
    window.addEventListener('load', () => setTimeout(tryPrint, 300), { once: true });
  }
}

/**
 * Build a printable HTML receipt string for use in window.open().
 */
export function buildReceiptHTML(transaction, settings) {
  if (!transaction) return '';
  const is58mm = settings?.lebarKertas !== '80mm';
  const width = is58mm ? '54mm' : '76mm';
  const logoSrc = new URL('../assets/nia_laundry.png', import.meta.url).href;
  const escape = (s) => String(s ?? '').replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  const rupiah = (n) => 'Rp' + Number(n ?? 0).toLocaleString('id-ID');
  const fmtDT = (d) => d ? new Date(d).toLocaleString('id-ID') : '-';
  const fmtD = (d) => d ? new Date(d).toLocaleDateString('id-ID') : '-';

  const items = (transaction.items || []).map((it) => `
    <tr>
      <td style="font-weight:bold;padding:4px 0;">${escape(it.layanan)}</td>
    </tr>
    <tr>
      <td>${it.berat}kg x ${rupiah(it.hargaPerKg)}</td>
      <td style="text-align:right;font-weight:bold;">${rupiah(it.subtotal)}</td>
    </tr>
  `).join('');

  return `<!doctype html><html lang="id"><head><meta charset="utf-8">
    <title>Struk ${escape(transaction.id)}</title>
    <style>
      @page { size: auto; margin: 2mm; }
      body { font-family: 'Courier New', monospace; font-size: ${is58mm ? '12px' : '14px'}; color: #000; background: #fff; margin: 0; padding: 2mm; }
      .wrap { width: ${width}; margin: 0 auto; box-sizing: border-box; padding: ${is58mm ? '2mm' : '4mm'}; }
      .center { text-align: center; }
      .logo { width: ${is58mm ? 42 : 52}px; height: ${is58mm ? 42 : 52}px; border-radius: 50%; border: 0.5px solid #aaa; display: block; margin: 0 auto 6px; }
      .title { font-weight: bold; font-size: ${is58mm ? '16px' : '18px'}; }
      .small { font-size: ${is58mm ? '11px' : '12px'}; }
      .dash { border-top: 1px dashed #000; margin: 8px 0; }
      table { width: 100%; border-collapse: collapse; font-size: inherit; }
      td { padding: 0; vertical-align: top; }
      .row td { padding-bottom: 2px; }
      .bold { font-weight: bold; }
      .big { font-size: ${is58mm ? '14px' : '16px'}; }
      .italic { font-style: italic; }
      .footer { margin-top: 12px; }
    </style>
    </head><body>
    <div class="wrap">
      <div class="center" style="border-bottom:1px dashed #000;padding-bottom:8px;margin-bottom:8px;">
        <img src="${logoSrc}" alt="logo" class="logo" onerror="this.style.display='none'">
        <div class="title">${escape(settings?.namaToko || 'NIA LAUNDRY')}</div>
        ${settings?.alamat ? `<div class="small">${escape(settings.alamat)}</div>` : ''}
        ${settings?.telp ? `<div class="small">${escape(settings.telp)}</div>` : ''}
      </div>
      <table class="small" style="border-bottom:1px dashed #000;padding-bottom:8px;margin-bottom:8px;">
        <tr class="row"><td>Struk:</td><td class="bold" style="text-align:right;">${escape(transaction.id)}</td></tr>
        <tr class="row"><td>Tgl:</td><td style="text-align:right;">${fmtDT(transaction.tanggal)}</td></tr>
        <tr class="row"><td>Kasir:</td><td style="text-align:right;">Admin</td></tr>
        <tr class="row"><td>Plgn:</td><td class="bold" style="text-align:right;">${escape(transaction.pelanggan?.nama || '-')}</td></tr>
        ${transaction.pelanggan?.noHp ? `<tr class="row"><td>HP:</td><td style="text-align:right;">${escape(transaction.pelanggan.noHp)}</td></tr>` : ''}
      </table>
      <table class="small" style="border-bottom:1px dashed #000;padding-bottom:8px;margin-bottom:8px;">
        ${items}
      </table>
      <table class="small" style="border-bottom:1px dashed #000;padding-bottom:8px;margin-bottom:8px;">
        <tr class="row"><td>Berat Total:</td><td style="text-align:right;">${transaction.totalBerat} kg</td></tr>
        <tr class="row"><td>Subtotal:</td><td style="text-align:right;">${rupiah((transaction.totalBayar || 0) + (transaction.diskon || 0))}</td></tr>
        ${(transaction.diskon || 0) > 0 ? `<tr class="row"><td>Diskon:</td><td style="text-align:right;">-${rupiah(transaction.diskon)}</td></tr>` : ''}
        <tr class="row" style="border-top:1px dashed #000;"><td class="bold big">TOTAL:</td><td class="bold big" style="text-align:right;">${rupiah(transaction.totalBayar)}</td></tr>
      </table>
      <table class="small" style="border-bottom:1px dashed #000;padding-bottom:8px;margin-bottom:8px;">
        <tr class="row"><td>Status:</td><td class="bold" style="text-align:right;">${escape(transaction.status)}</td></tr>
        <tr class="row"><td>Selesai:</td><td class="bold" style="text-align:right;">${fmtD(transaction.estimasiSelesai)}</td></tr>
        ${transaction.catatan ? `<tr class="row" style="border-top:1px dashed #000;"><td colspan="2" class="italic">*${escape(transaction.catatan)}</td></tr>` : ''}
      </table>
      <div class="center small footer">
        ${(settings?.footerStruk || 'Terima Kasih!').split('\n').map(l => `<div>${escape(l)}</div>`).join('')}
        <div class="bold" style="margin-top:8px;">-- SIMPAN STRUK INI --</div>
      </div>
    </div>
    </body></html>`;
}

/**
 * Open a popup with receipt HTML and trigger print (AirPrint on iOS).
 */
export function airPrintReceipt(transaction, settings) {
  if (!transaction) return;
  const html = buildReceiptHTML(transaction, settings);
  const w = window.open('', 'receipt_print', 'width=400,height=700');
  if (!w) {
    Swal && Swal.fire({ icon: 'warning', title: 'Popup Diblokir', text: 'Izinkan pop-up di pengaturan browser, lalu coba lagi.', showCloseButton: true });
    return false;
  }
  w.document.open();
  w.document.write(html);
  w.document.close();
  w.focus();
  setTimeout(() => {
    try { w.print(); } catch (e) { console.warn(e); }
  }, 500);
  return true;
}
