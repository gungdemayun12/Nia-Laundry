export function formatRupiah(number) {
  if (number == null || isNaN(number)) return 'Rp0';
  return 'Rp' + Number(number).toLocaleString('id-ID');
}

export function formatDate(dateString) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function formatDateTime(dateString) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function generateInvoiceId(transactions) {
  const maxNum = transactions.reduce((max, t) => {
    const match = t.id?.match(/INV-(\d+)/);
    if (match) {
      return Math.max(max, parseInt(match[1], 10));
    }
    return max;
  }, 0);
  const next = maxNum + 1;
  return `INV-${String(next).padStart(4, '0')}`;
}

export function generateId(prefix, items) {
  const maxNum = items.reduce((max, item) => {
    const match = item.id?.match(new RegExp(`${prefix}-(\\d+)`));
    if (match) {
      return Math.max(max, parseInt(match[1], 10));
    }
    return max;
  }, 0);
  const next = maxNum + 1;
  return `${prefix}-${String(next).padStart(3, '0')}`;
}

export function getDefaultEstimation(days = 2) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}

export function isOverdue(estimasiSelesai, status) {
  if (status === 'Diambil') return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const est = new Date(estimasiSelesai);
  est.setHours(0, 0, 0, 0);
  return est < today;
}

export function getStartOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function getStartOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function getStartOfMonth(date) {
  const d = new Date(date);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function exportCSV(data, filename) {
  if (!data || data.length === 0) return;
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row =>
      headers.map(h => {
        let val = row[h];
        if (typeof val === 'object') val = JSON.stringify(val);
        if (typeof val === 'string' && (val.includes(',') || val.includes('"') || val.includes('\n'))) {
          val = `"${val.replace(/"/g, '""')}"`;
        }
        return val ?? '';
      }).join(',')
    ),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

export function exportJSON(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

export function importJSON(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        resolve(JSON.parse(e.target.result));
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsText(file);
  });
}
