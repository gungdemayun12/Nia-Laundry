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
  INIT: [ESC, 0x40],
  ALIGN_CENTER: [ESC, 0x61, 0x01],
  ALIGN_LEFT: [ESC, 0x61, 0x00],
  ALIGN_RIGHT: [ESC, 0x61, 0x02],
  BOLD_ON: [ESC, 0x45, 0x01],
  BOLD_OFF: [ESC, 0x45, 0x00],
  DOUBLE_HEIGHT_ON: [ESC, 0x21, 0x10],
  DOUBLE_WIDTH_ON: [ESC, 0x21, 0x20],
  DOUBLE_ON: [ESC, 0x21, 0x30],
  NORMAL_SIZE: [ESC, 0x21, 0x00],
  UNDERLINE_ON: [ESC, 0x2D, 0x01],
  UNDERLINE_OFF: [ESC, 0x2D, 0x00],
  CUT_PAPER: [GS, 0x56, 0x00],
  PARTIAL_CUT: [GS, 0x56, 0x01],
  FEED_LINES: (n) => [ESC, 0x64, n],
  LINE_SPACING: (n) => [ESC, 0x33, n],
};

function textToBytes(text) {
  const encoder = new TextEncoder();
  return encoder.encode(text);
}

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

  push(CMD.INIT);
  push(CMD.LINE_SPACING(60));

  push(CMD.ALIGN_CENTER);
  push(CMD.BOLD_ON);
  push(CMD.DOUBLE_ON);
  printLine(settings?.namaToko || 'NIA LAUNDRY');
  push(CMD.NORMAL_SIZE);
  push(CMD.BOLD_OFF);

  if (settings?.alamat) printLine(settings.alamat);
  if (settings?.telp) printLine(settings.telp);

  push(CMD.ALIGN_LEFT);
  printLine(dashedLine(W));

  printLine(twoColumn('Struk:', transaction.id, W));
  printLine(twoColumn('Tgl:', formatDateTimePlain(transaction.tanggal), W));
  printLine(twoColumn('Kasir:', 'Admin', W));
  printLine(twoColumn('Pelanggan:', transaction.pelanggan?.nama || '-', W));
  if (transaction.pelanggan?.noHp) {
    printLine(twoColumn('HP:', transaction.pelanggan.noHp, W));
  }

  printLine(dashedLine(W));

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

  printLine(twoColumn('Selesai:', formatDatePlain(transaction.estimasiSelesai), W));

  if (transaction.catatan) {
    printLine(dashedLine(W));
    printLine(`*${transaction.catatan}`);
  }

  printLine(dashedLine(W));

  push(CMD.ALIGN_CENTER);
  const footer = settings?.footerStruk || 'Terima Kasih!';
  footer.split('\n').forEach(line => printLine(line));
  printLine('');
  push(CMD.BOLD_ON);
  printLine('-- SIMPAN STRUK INI --');
  push(CMD.BOLD_OFF);

  push(CMD.FEED_LINES(4));
  push(CMD.PARTIAL_CUT);

  return new Uint8Array(bytes);
}

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
    this._reconnectCallbacks = [];
  }

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

  getSavedPrinter() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  }

  _savePrinter() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      name: this.deviceName,
      id: this.deviceId,
      timestamp: Date.now(),
    }));
  }

  clearSavedPrinter() {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem('pos_bt_printer_disconnected');
    this.deviceName = '';
    this.deviceId = '';
    this.isConnected = false;
    this.device = null;
    this.server = null;
    this.writeCharacteristic = null;
    this._notify();
  }

  /**
   * Auto reconnect menggunakan getDevices().
   * Web Bluetooth API TIDAK BISA menjaga koneksi setelah refresh karena kebijakan browser.
   * Tapi kita bisa reconnect otomatis jika device masih terdaftar di browser.
   * 
   * Chrome di Windows/Linux biasanya menyimpan device yang sudah dipairing.
   * getDevices() akan mengembalikan device tersebut.
   */
  async autoReconnect() {
    const saved = this.getSavedPrinter();
    if (!saved || !saved.name || this._autoReconnecting) return null;

    if (localStorage.getItem('pos_bt_printer_disconnected') === 'true') {
      return null;
    }

    this._autoReconnecting = true;

    try {
      // Method: navigator.bluetooth.getDevices()
      // Browser menyimpan daftar device yang sudah pernah dipairing oleh website ini.
      // Setelah refresh, device masih ada di daftar ini (Chrome).
      if (navigator.bluetooth.getDevices) {
        const devices = await navigator.bluetooth.getDevices();
        
        // Cari device yang cocok
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

          // Coba connect GATT
          // KONEKSI INI AKAN BERHASIL jika browser mengizinkan reconnect
          // Chrome biasanya mengizinkan reconnect ke device yang sudah dipairing
          // TANPA perlu user gesture lagi (karena pairing sudah di-approve sebelumnya)
          await this._connectGATT();
          
          // Beri tahu semua callback bahwa reconnect berhasil
          this._reconnectCallbacks.forEach(cb => cb(true));
          this._reconnectCallbacks = [];
          
          return this.getState();
        }
      }

      // Device tidak ditemukan di daftar browser
      // Kita akan trigger callback reconnect gagal
      this._reconnectCallbacks.forEach(cb => cb(false));
      this._reconnectCallbacks = [];
      
      return null;
    } catch (err) {
      console.warn('Auto-reconnect gagal:', err.message);
      this._reconnectCallbacks.forEach(cb => cb(false));
      this._reconnectCallbacks = [];
      return null;
    } finally {
      this._autoReconnecting = false;
    }
  }

  /**
   * Daftarkan callback yang akan dipanggil saat autoReconnect selesai
   */
  onReconnectResult(callback) {
    this._reconnectCallbacks.push(callback);
  }

  /**
   * Reconnect cepat tanpa scan - langsung panggil dialog Bluetooth
   * dengan filter nama device yang sudah dikenal.
   * 
   * KARENA Chrome sudah pairing sebelumnya, dialog akan langsung
   * muncul dengan device yang dikenal. User tinggal klik nama printer
   * yang sama -> LANGSUNG CONNECT.
   * 
   * Ini lebih cepat daripada scan dari awal yang mencari semua device BLE.
   */
  async quickReconnect() {
    const saved = this.getSavedPrinter();
    if (!saved || !saved.name) {
      throw new Error('Tidak ada printer yang tersimpan. Silakan scan ulang.');
    }

    try {
      // Gunakan filter nama device yang sudah dikenal
      // Chrome akan menampilkan device ini di dialog tanpa perlu scan ulang
      this.device = await navigator.bluetooth.requestDevice({
        filters: [{ name: saved.name }],
        optionalServices: PRINTER_SERVICE_UUIDS,
      });

      if (!this.device) {
        throw new Error('Tidak ada perangkat yang dipilih.');
      }

      this.deviceName = this.device.name || saved.name;
      this.deviceId = this.device.id;

      localStorage.removeItem('pos_bt_printer_disconnected');

      this.device.addEventListener('gattserverdisconnected', () => {
        this.isConnected = false;
        this.writeCharacteristic = null;
        this.server = null;
        this._notify();
      });

      await this._connectGATT();
      return this.getState();
    } catch (err) {
      if (err.name === 'NotFoundError') {
        throw new Error('Tidak ada perangkat yang dipilih.');
      }
      throw err;
    }
  }

  async scanAndConnect() {
    if (!this.isSupported()) {
      throw new Error('Bluetooth tidak didukung di browser ini. Gunakan Chrome/Edge terbaru.');
    }

    try {
      this.device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: PRINTER_SERVICE_UUIDS,
      });

      if (!this.device) {
        throw new Error('Tidak ada perangkat yang dipilih.');
      }

      this.deviceName = this.device.name || 'Printer Bluetooth';
      this.deviceId = this.device.id;

      localStorage.removeItem('pos_bt_printer_disconnected');

      this.device.addEventListener('gattserverdisconnected', () => {
        this.isConnected = false;
        this.writeCharacteristic = null;
        this.server = null;
        this._notify();
      });

      await this._connectGATT();
      return this.getState();
    } catch (err) {
      if (err.name === 'NotFoundError') {
        throw new Error('Tidak ada perangkat yang dipilih. Silakan coba lagi.');
      }
      throw err;
    }
  }

  async reconnect() {
    if (!this.device || !this.device.gatt) {
      throw new Error('Perangkat tidak tersedia. Silakan scan ulang.');
    }
    await this._connectGATT();
    return this.getState();
  }

  async _connectGATT() {
    try {
      this.server = await this.device.gatt.connect();

      let service = null;
      for (const uuid of PRINTER_SERVICE_UUIDS) {
        try {
          service = await this.server.getPrimaryService(uuid);
          if (service) break;
        } catch {
          continue;
        }
      }

      if (!service) {
        try {
          const services = await this.server.getPrimaryServices();
          if (services.length > 0) service = services[0];
        } catch {
          throw new Error('Tidak dapat menemukan service printer.');
        }
      }

      if (!service) throw new Error('Service printer tidak ditemukan.');

      this.writeCharacteristic = null;
      for (const uuid of WRITE_CHARACTERISTIC_UUIDS) {
        try {
          this.writeCharacteristic = await service.getCharacteristic(uuid);
          if (this.writeCharacteristic) break;
        } catch {
          continue;
        }
      }

      if (!this.writeCharacteristic) {
        try {
          const characteristics = await service.getCharacteristics();
          for (const char of characteristics) {
            if (char.properties.write || char.properties.writeWithoutResponse) {
              this.writeCharacteristic = char;
              break;
            }
          }
        } catch { }
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

  disconnect() {
    localStorage.setItem('pos_bt_printer_disconnected', 'true');
    if (this.device && this.device.gatt.connected) {
      this.device.gatt.disconnect();
    }
    this.isConnected = false;
    this.writeCharacteristic = null;
    this.server = null;
    this._notify();
  }

  async sendBytes(data) {
    if (!this.writeCharacteristic) {
      throw new Error('Printer tidak terhubung.');
    }
    const CHUNK_SIZE = 100;
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
            throw new Error('Gagal mengirim data ke printer.');
          }
        }
        throw err;
      }
      if (i < totalChunks - 1) {
        await new Promise(r => setTimeout(r, 20));
      }
    }
  }

  async printReceipt(transaction, settings) {
    if (!this.isConnected || !this.writeCharacteristic) {
      if (this.device) {
        try {
          await this.reconnect();
        } catch {
          throw new Error('Printer tidak terhubung.');
        }
      } else {
        throw new Error('Printer tidak terhubung.');
      }
    }
    const receiptBytes = buildReceiptBytes(transaction, settings);
    await this.sendBytes(receiptBytes);
  }
}

const bluetoothPrinter = new BluetoothPrinterManager();
export default bluetoothPrinter;