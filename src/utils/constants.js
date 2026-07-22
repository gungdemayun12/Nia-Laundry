export const DEFAULT_SERVICES = [
  { id: 'srv-001', nama: 'Laundry Biasa', hargaPerKg: 5000 },
  { id: 'srv-002', nama: 'Laundry Ekspres', hargaPerKg: 8000 },
];

export const DEFAULT_SETTINGS = {
  namaToko: 'Laundry Gung Sri',
  alamat: 'Jl. Contoh No. 123, Kota',
  telp: '0812-3456-7890',
  footerStruk: 'Terima kasih telah mempercayakan laundry Anda pada kami!',
  lebarKertas: '58mm',
};

export const STATUS_OPTIONS = ['Proses', 'Selesai', 'Diambil'];

export const STATUS_COLORS = {
  Proses: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500' },
  Selesai: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },
  Diambil: { bg: 'bg-neutral-100', text: 'text-neutral-500', border: 'border-neutral-200', dot: 'bg-neutral-400' },
};
