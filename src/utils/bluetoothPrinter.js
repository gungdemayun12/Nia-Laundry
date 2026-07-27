/**
 * Bluetooth Thermal Printer Utility
 * Uses Web Bluetooth API to connect to BLE thermal printers
 * and send ESC/POS commands for direct printing.
 */

// Common BLE printer service UUIDs (covers most thermal printers)
const PRINTER_SERVICE_UUIDS = [
  '000018f0-0000-1000-8000-00805f9b34fb',
  '49535343-fe7d-4ae5-8fa9-9fafd205e455',
  'e7810a71-73ae-499d-8c15-faa9aef0c3f2',
];

// Common write characteristic UUIDs
const WRITE_CHARACTERISTIC_UUIDS = [
  '00002af1-0000-1000-8000-00805f9b34fb',
  '49535343-8841-43f4-a8d4-ecbe34729bb3',
  'bef8d6c9-9c21-4c9e-b632-bd58c1009f9f',
];

const STORAGE_KEY = 'pos_bt_printer';

// ── ESC/POS Commands ──
const ESC = 0x1B;
const GS = 0x1D;
const LF = 0x0A;

const CMD = {
  INIT: [ESC, 0x40],                         // Initialize printer
  ALIGN_CENTER: [ESC, 0x61, 0x01],           // Center alignment
  ALIGN_LEFT: [ESC, 0x61, 0x00],             // Left alignment
  ALIGN_RIGHT: [ESC, 0x61, 0x02],            // Right alignment
  BOLD_ON: [ESC, 0x45, 0x01],                // Bold on
  BOLD_OFF: [ESC, 0x45, 0x00],               // Bold off
  DOUBLE_HEIGHT_ON: [ESC, 0x21, 0x10],       // Double height
  DOUBLE_WIDTH_ON: [ESC, 0x21, 0x20],        // Double width
  DOUBLE_ON: [ESC, 0x21, 0x30],              // Double height + width
  NORMAL_SIZE: [ESC, 0x21, 0x00],            // Normal text
  UNDERLINE_ON: [ESC, 0x2D, 0x01],           // Underline on
  UNDERLINE_OFF: [ESC, 0x2D, 0x00],          // Underline off
  CUT_PAPER: [GS, 0x56, 0x00],              // Full cut
  PARTIAL_CUT: [GS, 0x56, 0x01],            // Partial cut
  FEED_LINES: (n) => [ESC, 0x64, n],         // Feed n lines
  LINE_SPACING: (n) => [ESC, 0x33, n],       // Set line spacing
};

// ── Text Encoding ──
function textToBytes(text) {
  const encoder = new TextEncoder();
  return encoder.encode(text);
}

// ── Format helpers ──
function formatRupiahPlain(number) {
  if (number == null || isNaN(number)) return 'Rp0';
  return 'Rp' + Number(number).toLocaleString('id-ID');
}

function formatDateTimePlain(dateString) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('id-ID', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function formatDatePlain(dateString) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('id-ID', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
}

/**
 * Pad/align text for thermal printer columns
 * @param {string} left - Left text
 * @param {string} right - Right text
 * @param {number} width - Total character width (32 for 58mm, 48 for 80mm)
 */
function twoColumn(left, right, width = 32) {
  const maxLeft = width - right.length - 1;
  const paddedLeft = left.length > maxLeft ? left.substring(0, maxLeft) : left;
  const spaces = width - paddedLeft.length - right.length;
  return paddedLeft + ' '.repeat(Math.max(spaces, 1)) + right;
}

function centerText(text, width = 32) {
  if (text.length >= width) return text.substring(0, width);
  const pad = Math.floor((width - text.length) / 2);
  return ' '.repeat(pad) + text;
}

function dashedLine(width = 32) {
  return '-'.repeat(width);
}

// ── Build ESC/POS receipt bytes ──
export function buildReceiptBytes(transaction, settings) {
  if (!transaction) return new Uint8Array(0);

  const is58mm = settings?.lebarKertas !== '80mm';
  const W = is58mm ? 32 : 48;
  const bytes = [];

  const push = (...arrs) => arrs.forEach(a => {
    if (a instanceof Uint8Array) bytes.push(...a);
    else if (Array.isArray(a)) bytes.push(...a);
    else bytes.push(a);
  });

  const printLine = (text) => {
    push(textToBytes(text), [LF]);
  };

  // Initialize
  push(CMD.INIT);
  push(CMD.LINE_SPACING(60));

  // ── Header ──
  push(CMD.ALIGN_CENTER);
  push(CMD.BOLD_ON);
  push(CMD.DOUBLE_ON);
  printLine(settings?.namaToko || 'NIA LAUNDRY');
  push(CMD.NORMAL_SIZE);
  push(CMD.BOLD_OFF);

  if (settings?.alamat) {
    printLine(settings.alamat);
  }
  if (settings?.telp) {
    printLine(settings.telp);
  }

  push(CMD.ALIGN_LEFT);
  printLine(dashedLine(W));

  // ── Invoice info ──
  printLine(twoColumn('Struk:', transaction.id, W));
  printLine(twoColumn('Tgl:', formatDateTimePlain(transaction.tanggal), W));
  printLine(twoColumn('Kasir:', 'Admin', W));
  printLine(twoColumn('Plgn:', transaction.pelanggan?.nama || '-', W));
  if (transaction.pelanggan?.noHp) {
    printLine(twoColumn('HP:', transaction.pelanggan.noHp, W));
  }

  printLine(dashedLine(W));

  // ── Items ──
  if (transaction.items && transaction.items.length > 0) {
    transaction.items.forEach((item) => {
      push(CMD.BOLD_ON);
      printLine(item.layanan);
      push(CMD.BOLD_OFF);
      const qtyPrice = `${item.berat}kg x ${formatRupiahPlain(item.hargaPerKg)}`;
      const subtotal = formatRupiahPlain(item.subtotal);
      printLine(twoColumn(qtyPrice, subtotal, W));
    });
  }

  printLine(dashedLine(W));

  // ── Totals ──
  printLine(twoColumn('Berat Total:', `${transaction.totalBerat} kg`, W));
  printLine(twoColumn('Subtotal:', formatRupiahPlain(transaction.totalBayar + transaction.diskon), W));

  if (transaction.diskon > 0) {
    printLine(twoColumn('Diskon:', `-${formatRupiahPlain(transaction.diskon)}`, W));
  }

  printLine(dashedLine(W));

  push(CMD.BOLD_ON);
  push(CMD.DOUBLE_HEIGHT_ON);
  printLine(twoColumn('TOTAL:', formatRupiahPlain(transaction.totalBayar), W));
  push(CMD.NORMAL_SIZE);
  push(CMD.BOLD_OFF);

  printLine(dashedLine(W));

  // ── Status & Estimation ──
  printLine(twoColumn('Status:', transaction.status, W));
  printLine(twoColumn('Selesai:', formatDatePlain(transaction.estimasiSelesai), W));

  if (transaction.catatan) {
    printLine(dashedLine(W));
    printLine(`*${transaction.catatan}`);
  }

  printLine(dashedLine(W));

  // ── Footer ──
  push(CMD.ALIGN_CENTER);
  const footer = settings?.footerStruk || 'Terima Kasih!';
  footer.split('\n').forEach(line => printLine(line));
  printLine('');
  push(CMD.BOLD_ON);
  printLine('-- SIMPAN STRUK INI --');
  push(CMD.BOLD_OFF);

  // Feed and cut
  push(CMD.FEED_LINES(4));
  push(CMD.PARTIAL_CUT);

  return new Uint8Array(bytes);
}

// ── Bluetooth Printer Class ──
class BluetoothPrinterManager {
  constructor() {
    this.device = null;
    this.server = null;
    this.writeCharacteristic = null;
    this.isConnected = false;
    this.deviceName = '';
    this.deviceId = '';
    this._listeners = new Set();
    this._autoReconnecting = false;
    this._manualDisconnect = false;
  }

  // Subscribe to state changes
  subscribe(listener) {
    this._listeners.add(listener);
    return () => this._listeners.delete(listener);
  }

  _notify() {
    const state = this.getState();
    this._listeners.forEach(fn => fn(state));
  }

  getState() {
    return {
      isConnected: this.isConnected,
      deviceName: this.deviceName,
      deviceId: this.deviceId,
      isSupported: this.isSupported(),
    };
  }

  isSupported() {
    return !!navigator.bluetooth;
  }

  // Load saved printer info
  getSavedPrinter() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  }

  // Save printer info
  _savePrinter() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      name: this.deviceName,
      id: this.deviceId,
      timestamp: Date.now(),
    }));
  }

  // Clear saved printer
  clearSavedPrinter() {
    localStorage.removeItem(STORAGE_KEY);
    this.deviceName = '';
    this.deviceId = '';
    this.isConnected = false;
    this.device = null;
    this.server = null;
    this.writeCharacteristic = null;
    this._notify();
  }

  /**
   * Coba auto-reconnect ke printer yang sudah pernah dipairing sebelumnya.
   * Ini dipanggil saat aplikasi dimuat / refresh halaman.
   * Web Bluetooth tetap butuh user gesture untuk reconnect, tapi kita bisa tampilkan status dan proses reconnect otomatis.
   */
  async autoReconnect() {
    const saved = this.getSavedPrinter();
    if (!saved || !saved.name || this._autoReconnecting) return null;

    // Cek apakah sebelumnya manual disconnect
    if (localStorage.getItem('pos_bt_printer_disconnected') === 'true') {
      return null;
    }

    this._autoReconnecting = true;

    try {
      // Coba dapatkan device yang sudah pernah dipairing
      if (navigator.bluetooth.getDevices) {
        const devices = await navigator.bluetooth.getDevices();
        const matched = devices.find(d => 
          d.name === saved.name || d.id === saved.id
        );

        if (matched) {
          this.device = matched;
          this.deviceName = matched.name || saved.name;
          this.deviceId = matched.id || saved.id;

          // Pasang event listener disconnect
          this.device.addEventListener('gattserverdisconnected', () => {
            this.isConnected = false;
            this.writeCharacteristic = null;
            this.server = null;
            this._notify();
          });

          await this._connectGATT();
          return this.getState();
        }
      }
      return null;
    } catch (err) {
      console.warn('Auto-reconnect gagal:', err.message);
      return null;
    } finally {
      this._autoReconnecting = false;
    }
  }

  /**
   * Scan for and connect to a Bluetooth printer
   */
  async scanAndConnect() {
    if (!this.isSupported()) {
      throw new Error('Bluetooth tidak didukung di browser ini. Gunakan Chrome/Edge terbaru.');
    }

    try {
      // Request device with broad filter for thermal printers
      this.device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: PRINTER_SERVICE_UUIDS,
      });

      if (!this.device) {
        throw new Error('Tidak ada perangkat yang dipilih.');
      }

      this.deviceName = this.device.name || 'Printer Bluetooth';
      this.deviceId = this.device.id;

      // Hapus flag manual disconnect
      localStorage.removeItem('pos_bt_printer_disconnected');

      // Listen for disconnection - auto reconnect ketika device tiba-tiba putus
      this.device.addEventListener('gattserverdisconnected', () => {
        this.isConnected = false;
        this.writeCharacteristic = null;
        this.server = null;
        this._notify();
      });

      // Connect to GATT server
      await this._connectGATT();

      return this.getState();
    } catch (err) {
      if (err.name === 'NotFoundError') {
        throw new Error('Tidak ada perangkat yang dipilih. Silakan coba lagi.');
      }
      throw err;
    }
  }

  /**
   * Reconnect to a previously paired device
   */
  async reconnect() {
    if (!this.device || !this.device.gatt) {
      throw new Error('Perangkat tidak tersedia. Silakan scan ulang.');
    }

    await this._connectGATT();
    return this.getState();
  }

  /**
   * Connect to GATT server and find write characteristic
   */
  async _connectGATT() {
    try {
      this.server = await this.device.gatt.connect();

      // Try each known service UUID
      let service = null;
      for (const uuid of PRINTER_SERVICE_UUIDS) {
        try {
          service = await this.server.getPrimaryService(uuid);
          if (service) break;
        } catch {
          continue;
        }
      }

      // If no known service found, try to discover all services
      if (!service) {
        try {
          const services = await this.server.getPrimaryServices();
          if (services.length > 0) {
            service = services[0];
          }
        } catch {
          throw new Error('Tidak dapat menemukan service printer. Pastikan printer mendukung BLE.');
        }
      }

      if (!service) {
        throw new Error('Service printer tidak ditemukan.');
      }

      // Find write characteristic
      this.writeCharacteristic = null;

      // Try known characteristic UUIDs first
      for (const uuid of WRITE_CHARACTERISTIC_UUIDS) {
        try {
          this.writeCharacteristic = await service.getCharacteristic(uuid);
          if (this.writeCharacteristic) break;
        } catch {
          continue;
        }
      }

      // If not found, discover all characteristics and find one that supports write
      if (!this.writeCharacteristic) {
        try {
          const characteristics = await service.getCharacteristics();
          for (const char of characteristics) {
            if (char.properties.write || char.properties.writeWithoutResponse) {
              this.writeCharacteristic = char;
              break;
            }
          }
        } catch {
          // ignore
        }
      }

      if (!this.writeCharacteristic) {
        throw new Error('Characteristic write printer tidak ditemukan.');
      }

      this.isConnected = true;
      this._savePrinter();
      this._notify();
    } catch (err) {
      this.isConnected = false;
      this._notify();
      throw err;
    }
  }

  /**
   * Disconnect from the printer
   */
  disconnect() {
    // Set flag bahwa ini disconnect manual (bukan karena refresh/hilang sinyal)
    localStorage.setItem('pos_bt_printer_disconnected', 'true');
    
    if (this.device && this.device.gatt.connected) {
      this.device.gatt.disconnect();
    }
    this.isConnected = false;
    this.writeCharacteristic = null;
    this.server = null;
    this._notify();
  }

  /**
   * Send raw bytes to the printer in chunks (BLE has MTU limits)
   */
  async sendBytes(data) {
    if (!this.writeCharacteristic) {
      throw new Error('Printer tidak terhubung. Sambungkan printer terlebih dahulu.');
    }

    const CHUNK_SIZE = 100; // Safe BLE chunk size
    const totalChunks = Math.ceil(data.length / CHUNK_SIZE);

    for (let i = 0; i < totalChunks; i++) {
      const start = i * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, data.length);
      const chunk = data.slice(start, end);

      try {
        if (this.writeCharacteristic.properties.writeWithoutResponse) {
          await this.writeCharacteristic.writeValueWithoutResponse(chunk);
        } else {
          await this.writeCharacteristic.writeValue(chunk);
        }
      } catch (err) {
        // If write fails, try reconnecting once
        if (i === 0 && this.device) {
          try {
            await this._connectGATT();
            if (this.writeCharacteristic.properties.writeWithoutResponse) {
              await this.writeCharacteristic.writeValueWithoutResponse(chunk);
            } else {
              await this.writeCharacteristic.writeValue(chunk);
            }
            continue;
          } catch {
            throw new Error('Gagal mengirim data ke printer. Coba sambungkan ulang.');
          }
        }
        throw err;
      }

      // Small delay between chunks
      if (i < totalChunks - 1) {
        await new Promise(r => setTimeout(r, 20));
      }
    }
  }

  /**
   * Print a receipt transaction
   */
  async printReceipt(transaction, settings) {
    if (!this.isConnected || !this.writeCharacteristic) {
      // Try to reconnect if device exists
      if (this.device) {
        try {
          await this.reconnect();
        } catch {
          throw new Error('Printer tidak terhubung. Buka Pengaturan untuk menyambungkan printer.');
        }
      } else {
        throw new Error('Printer tidak terhubung. Buka Pengaturan untuk menyambungkan printer.');
      }
    }

    const receiptBytes = buildReceiptBytes(transaction, settings);
    await this.sendBytes(receiptBytes);
  }
}

// Singleton instance
const bluetoothPrinter = new BluetoothPrinterManager();
export default bluetoothPrinter;