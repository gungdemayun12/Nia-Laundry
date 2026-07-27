import { useState, useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import {
  Bar, Line, Pie, Doughnut,
} from 'react-chartjs-2';
import {
  Download, ArrowUpRight, ArrowDownRight, Printer, Search, X, Filter,
} from 'lucide-react';
import { formatRupiah, getStartOfDay, getStartOfWeek, getStartOfMonth, exportCSV } from '../utils/helpers';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const CHART_COLORS = ['#212529', '#495057', '#6c757d', '#adb5bd', '#ced4da', '#f8f9fa'];

const PERIOD_PRESETS = [
  { key: 'today', label: 'Hari Ini' },
  { key: 'week', label: 'Minggu Ini' },
  { key: 'month', label: 'Bulan Ini' },
  { key: 'all', label: 'Semua' },
];

const CHART_TYPES = [
  { key: 'bar', label: 'Bar' },
  { key: 'line', label: 'Line' },
];

const PIE_CHART_TYPES = [
  { key: 'pie', label: 'Pie', component: Pie },
  { key: 'doughnut', label: 'Donut', component: Doughnut },
];

const SORT_OPTIONS = [
  { key: 'newest', label: 'Terbaru' },
  { key: 'oldest', label: 'Terlama' },
  { key: 'highest', label: 'Pendapatan Tertinggi' },
  { key: 'lowest', label: 'Pendapatan Terendah' },
];

function QuickStat({ label, value, sub, trendUp }) {
  return (
    <div className="card" style={{ padding: '16px 18px' }}>
      <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-3)', marginBottom: 6 }}>
        {label}
      </p>
      <p style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', lineHeight: 1, letterSpacing: '-0.02em' }}>
        {value}
      </p>
      {sub && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 6 }}>
          {trendUp ? <ArrowUpRight size={13} style={{ color: 'var(--green)' }} /> : <ArrowDownRight size={13} style={{ color: 'var(--red)' }} />}
          <span style={{ fontSize: 11, fontWeight: 600, color: trendUp ? 'var(--green)' : 'var(--red)' }}>
            {sub}
          </span>
        </div>
      )}
    </div>
  );
}

export default function Laporan({ transactions, services, customers }) {
  const [chartType, setChartType] = useState('bar');
  const [pieChartType, setPieChartType] = useState('doughnut');
  const [period, setPeriod] = useState('daily');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [preset, setPreset] = useState('all');
  const [filterService, setFilterService] = useState('');
  const [filterCustomer, setFilterCustomer] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [searchQuery, setSearchQuery] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');

  const now = useMemo(() => new Date(), []);

  const applyPreset = (key) => {
    setPreset(key);
    if (key === 'today') {
      setDateFrom(getStartOfDay(now).toISOString().split('T')[0]);
      setDateTo(getStartOfDay(now).toISOString().split('T')[0]);
    } else if (key === 'week') {
      setDateFrom(getStartOfWeek(now).toISOString().split('T')[0]);
      setDateTo(now.toISOString().split('T')[0]);
    } else if (key === 'month') {
      setDateFrom(getStartOfMonth(now).toISOString().split('T')[0]);
      setDateTo(now.toISOString().split('T')[0]);
    } else {
      setDateFrom('');
      setDateTo('');
    }
  };

  const filteredTx = useMemo(() => {
    let result = transactions.filter((t) => {
      if (filterStatus && t.status !== filterStatus) return false;
      if (filterService && !t.items?.some(i => i.layanan === filterService)) return false;
      if (filterCustomer && t.pelanggan?.nama !== filterCustomer) return false;
      const d = new Date(t.tanggal);
      if (dateFrom && d < new Date(dateFrom)) return false;
      if (dateTo) {
        const to = new Date(dateTo);
        to.setHours(23, 59, 59, 999);
        if (d > to) return false;
      }
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchId = t.id?.toLowerCase().includes(q);
        const matchCustomer = t.pelanggan?.nama?.toLowerCase().includes(q);
        const matchPhone = t.pelanggan?.noHp?.includes(q);
        if (!matchId && !matchCustomer && !matchPhone) return false;
      }
      if (minAmount && (t.totalBayar || 0) < Number(minAmount)) return false;
      if (maxAmount && (t.totalBayar || 0) > Number(maxAmount)) return false;
      return true;
    });

    // Sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case 'oldest': return new Date(a.tanggal) - new Date(b.tanggal);
        case 'highest': return (b.totalBayar || 0) - (a.totalBayar || 0);
        case 'lowest': return (a.totalBayar || 0) - (b.totalBayar || 0);
        default: return new Date(b.tanggal) - new Date(a.tanggal);
      }
    });

    return result;
  }, [transactions, dateFrom, dateTo, filterService, filterCustomer, filterStatus, sortBy, searchQuery, minAmount, maxAmount]);

  const stats = useMemo(() => {
    const totalRevenue = filteredTx.reduce((s, t) => s + (t.totalBayar || 0), 0);
    const totalKg = filteredTx.reduce((s, t) => s + (t.totalBerat || 0), 0);
    const avgTransaction = filteredTx.length > 0 ? totalRevenue / filteredTx.length : 0;
    const completedTx = filteredTx.filter(t => t.status === 'Selesai' || t.status === 'Diambil').length;
    const processTx = filteredTx.filter(t => t.status === 'Proses').length;

    return { totalRevenue, totalKg, avgTransaction, count: filteredTx.length, completedTx, processTx };
  }, [filteredTx]);

  const prevPeriodStats = useMemo(() => {
    let from, to;
    if (preset === 'today') {
      const yesterday = new Date(now); yesterday.setDate(yesterday.getDate() - 1);
      from = getStartOfDay(yesterday).toISOString().split('T')[0];
      to = from;
    } else if (preset === 'week') {
      const lastWeek = new Date(now); lastWeek.setDate(lastWeek.getDate() - 7);
      from = getStartOfWeek(lastWeek).toISOString().split('T')[0];
      to = new Date(getStartOfWeek(lastWeek)); to.setDate(to.getDate() + 6);
      to = to.toISOString().split('T')[0];
    } else if (preset === 'month') {
      const lastMonth = new Date(now); lastMonth.setMonth(lastMonth.getMonth() - 1);
      from = getStartOfMonth(lastMonth).toISOString().split('T')[0];
      to = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0).toISOString().split('T')[0];
    } else {
      return null;
    }

    const prev = transactions.filter((t) => {
      if (filterStatus && t.status !== filterStatus) return false;
      if (filterService && !t.items?.some(i => i.layanan === filterService)) return false;
      if (filterCustomer && t.pelanggan?.nama !== filterCustomer) return false;
      const d = new Date(t.tanggal);
      if (from && d < new Date(from)) return false;
      if (to) {
        const te = new Date(to); te.setHours(23, 59, 59, 999);
        if (d > te) return false;
      }
      return true;
    });

    return {
      revenue: prev.reduce((s, t) => s + (t.totalBayar || 0), 0),
      count: prev.length,
      kg: prev.reduce((s, t) => s + (t.totalBerat || 0), 0),
    };
  }, [transactions, preset, filterStatus, filterService, filterCustomer, now]);

  const chartData = useMemo(() => {
    const map = {};

    filteredTx.forEach((t) => {
      const d = new Date(t.tanggal);
      let key;
      if (period === 'daily') {
        key = d.toISOString().split('T')[0];
      } else if (period === 'weekly') {
        const weekStart = new Date(d);
        const day = weekStart.getDay();
        weekStart.setDate(weekStart.getDate() - day + (day === 0 ? -6 : 1));
        key = weekStart.toISOString().split('T')[0];
      } else if (period === 'monthly') {
        key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      } else {
        key = `${d.getFullYear()}`;
      }

      if (!map[key]) map[key] = { period: key, pendapatan: 0, transaksi: 0, berat: 0 };
      map[key].pendapatan += t.totalBayar || 0;
      map[key].transaksi += 1;
      map[key].berat += t.totalBerat || 0;
    });

    return Object.values(map).sort((a, b) => a.period.localeCompare(b.period));
  }, [filteredTx, period]);

  const serviceData = useMemo(() => {
    const map = {};
    filteredTx.forEach((t) => {
      t.items?.forEach((item) => {
        if (!map[item.layanan]) map[item.layanan] = { nama: item.layanan, count: 0, revenue: 0 };
        map[item.layanan].count += 1;
        map[item.layanan].revenue += item.subtotal || 0;
      });
    });
    return Object.values(map).sort((a, b) => b.count - a.count);
  }, [filteredTx]);

  const formatLabel = (key) => {
    if (period === 'yearly') return key;
    if (period === 'monthly') {
      const [y, m] = key.split('-');
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];
      return months[parseInt(m) - 1] + ' ' + y.slice(2);
    }
    const d = new Date(key);
    return `${d.getDate()}/${d.getMonth() + 1}`;
  };

  const getTrend = (current, previous) => {
    if (!previous || previous === 0) return { value: '-', up: true };
    const diff = ((current - previous) / previous) * 100;
    return { value: `${Math.abs(diff).toFixed(1)}%`, up: diff >= 0 };
  };

  const revenueTrend = getTrend(stats.totalRevenue, prevPeriodStats?.revenue);
  const countTrend = getTrend(stats.count, prevPeriodStats?.count);
  const kgTrend = getTrend(stats.totalKg, prevPeriodStats?.kg);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'bottom',
        labels: {
          font: { family: "'Inter', sans-serif", size: 11 },
          color: 'var(--text-3)',
          padding: 16,
          usePointStyle: true,
          pointStyle: 'circle',
        },
      },
      tooltip: {
        backgroundColor: 'var(--surface)',
        titleFont: { family: "'Inter', sans-serif", size: 12, weight: '600' },
        bodyFont: { family: "'Inter', sans-serif", size: 11 },
        titleColor: 'var(--text)',
        bodyColor: 'var(--text-2)',
        padding: 12,
        cornerRadius: 8,
        displayColors: true,
        borderColor: 'var(--border)',
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          font: { family: "'Inter', sans-serif", size: 11 },
          color: 'var(--text-3)',
        },
      },
      y: {
        grid: { color: 'var(--border)' },
        drawBorder: false,
        ticks: {
          font: { family: "'Inter', sans-serif", size: 11 },
          color: 'var(--text-3)',
          callback: (value) => `${(value / 1000).toFixed(0)}k`,
        },
      },
    },
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          font: { family: "'Inter', sans-serif", size: 11 },
          color: 'var(--text)',
          padding: 12,
          usePointStyle: true,
          pointStyle: 'circle',
        },
      },
      tooltip: {
        backgroundColor: 'var(--surface)',
        titleFont: { family: "'Inter', sans-serif", size: 12, weight: '600' },
        bodyFont: { family: "'Inter', sans-serif", size: 11 },
        titleColor: 'var(--text)',
        bodyColor: 'var(--text-2)',
        padding: 12,
        cornerRadius: 8,
        borderColor: 'var(--border)',
        borderWidth: 1,
      },
    },
  };

  const revenueChartData = {
    labels: chartData.map(d => formatLabel(d.period)),
    datasets: [
      {
        label: 'Pendapatan',
        data: chartData.map(d => d.pendapatan),
        backgroundColor: chartType === 'bar' ? 'var(--text)' : 'transparent',
        borderColor: 'var(--text)',
        borderWidth: chartType === 'line' ? 2.5 : 0,
        fill: chartType === 'line',
        tension: 0.3,
        pointRadius: chartType === 'line' ? 4 : 0,
        pointHoverRadius: chartType === 'line' ? 6 : 0,
        pointBackgroundColor: 'var(--text)',
        borderRadius: chartType === 'bar' ? 6 : 0,
      },
    ],
  };

  const serviceChartData = {
    labels: serviceData.map(d => d.nama),
    datasets: [
      {
        label: 'Jumlah Transaksi',
        data: serviceData.map(d => d.count),
        backgroundColor: CHART_COLORS.slice(0, serviceData.length),
        borderColor: 'var(--surface)',
        borderWidth: 2,
      },
    ],
  };

  const handleExportExcel = () => {
    // Buat data dengan format yang lebih rapi
    const data = filteredTx.map((t) => ({
      'No. Invoice': t.id,
      Tanggal: new Date(t.tanggal).toLocaleString('id-ID'),
      Pelanggan: t.pelanggan?.nama || '-',
      'No. HP': t.pelanggan?.noHp || '-',
      Layanan: t.items?.map((i) => `${i.layanan} (${i.berat}kg x ${formatRupiah(i.hargaPerKg)})`).join('; ') || '-',
      'Total Berat (kg)': t.totalBerat,
      'Subtotal (Rp)': t.totalBayar + (t.diskon || 0),
      'Diskon (Rp)': t.diskon || 0,
      'Total Bayar (Rp)': t.totalBayar,
      Status: t.status,
      'Estimasi Selesai': t.estimasiSelesai ? new Date(t.estimasiSelesai).toLocaleDateString('id-ID') : '-',
    }));
    
    // Tambah summary row
    data.push({});
    data.push({ 'No. Invoice': 'RINGKASAN' });
    data.push({ 'No. Invoice': 'Total Transaksi', 'Total Bayar (Rp)': filteredTx.length });
    data.push({ 'No. Invoice': 'Total Pendapatan', 'Total Bayar (Rp)': stats.totalRevenue });
    data.push({ 'No. Invoice': 'Total Berat', 'Total Berat (kg)': stats.totalKg.toFixed(1) });
    data.push({ 'No. Invoice': 'Rata-rata / Transaksi', 'Total Bayar (Rp)': Math.round(stats.avgTransaction) });
    
    exportCSV(data, `Laporan_Laundry_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    
    // Header with logo
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('LAPORAN TRANSAKSI LAUNDRY', 14, 20);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Dicetak pada: ${new Date().toLocaleString('id-ID')}`, 14, 28);
    
    // Periode
    let periodeText = 'Periode: ';
    if (dateFrom && dateTo) {
      periodeText += `${dateFrom} - ${dateTo}`;
    } else {
      periodeText += 'Semua Data';
    }
    if (filterStatus) periodeText += ` | Status: ${filterStatus}`;
    if (filterService) periodeText += ` | Layanan: ${filterService}`;
    doc.text(periodeText, 14, 34);

    // Summary
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('RINGKASAN', 14, 42);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Total Pendapatan: ${formatRupiah(stats.totalRevenue)}`, 14, 48);
    doc.text(`Total Transaksi: ${stats.count}`, 14, 54);
    doc.text(`Total Berat: ${stats.totalKg.toFixed(1)} kg`, 14, 60);
    doc.text(`Rata-rata/Transaksi: ${formatRupiah(Math.round(stats.avgTransaction))}`, 14, 66);

    // Table
    const tableColumn = ['No. Invoice', 'Tanggal', 'Pelanggan', 'Layanan', 'Berat', 'Total', 'Status'];
    const tableRows = [];

    filteredTx.slice(0, 50).forEach(t => {
      const rowData = [
        t.id,
        new Date(t.tanggal).toLocaleDateString('id-ID'),
        t.pelanggan?.nama || '-',
        t.items?.map(i => i.layanan).join(', ') || '-',
        `${t.totalBerat} kg`,
        formatRupiah(t.totalBayar),
        t.status
      ];
      tableRows.push(rowData);
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 72,
      theme: 'grid',
      styles: { 
        fontSize: 8,
        cellPadding: 3,
        textColor: [33, 37, 41],
      },
      headStyles: { 
        fillColor: [33, 37, 41],
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [248, 249, 250],
      },
      foot: [[
        { content: 'TOTAL', colSpan: 4, styles: { fontStyle: 'bold', fontSize: 9 } },
        { content: `${stats.totalKg.toFixed(1)} kg`, styles: { fontStyle: 'bold', fontSize: 9 } },
        { content: formatRupiah(stats.totalRevenue), styles: { fontStyle: 'bold', fontSize: 9 } },
        { content: `${stats.count} tx`, styles: { fontStyle: 'bold', fontSize: 9 } },
      ]],
      footStyles: {
        fillColor: [241, 243, 245],
        textColor: [33, 37, 41],
      },
    });

    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(
        `Halaman ${i} dari ${pageCount} | Nia Laundry POS`,
        doc.internal.pageSize.width / 2,
        doc.internal.pageSize.height - 10,
        { align: 'center' }
      );
    }

    doc.save(`Laporan_Laundry_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const handlePrintReport = () => {
    window.print();
  };

  const clearFilters = () => {
    setDateFrom('');
    setDateTo('');
    setPreset('all');
    setFilterService('');
    setFilterCustomer('');
    setFilterStatus('');
    setSearchQuery('');
    setMinAmount('');
    setMaxAmount('');
    setSortBy('newest');
  };

  const hasActiveFilters = dateFrom || dateTo || filterService || filterCustomer || filterStatus || searchQuery || minAmount || maxAmount;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Quick Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }} className="quick-stats-grid">
        <QuickStat
          label="Total Pendapatan"
          value={formatRupiah(stats.totalRevenue)}
          sub={prevPeriodStats ? `${revenueTrend.value} vs periode sebelumnya` : undefined}
          trendUp={revenueTrend.up}
        />
        <QuickStat
          label="Total Transaksi"
          value={stats.count}
          sub={prevPeriodStats ? `${countTrend.value} vs periode sebelumnya` : undefined}
          trendUp={countTrend.up}
        />
        <QuickStat
          label="Total Kg Dicuci"
          value={`${stats.totalKg.toFixed(1)} kg`}
          sub={prevPeriodStats ? `${kgTrend.value} vs periode sebelumnya` : undefined}
          trendUp={kgTrend.up}
        />
        <QuickStat
          label="Rata-rata / Transaksi"
          value={formatRupiah(Math.round(stats.avgTransaction))}
          sub={`${stats.completedTx} selesai`}
          trendUp={true}
        />
      </div>

      {/* Filters Section */}
      <div className="card" style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <Filter size={16} style={{ color: 'var(--text)' }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>Filter & Pencarian</span>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              style={{
                marginLeft: 'auto', padding: '4px 10px', borderRadius: 6, border: '1px solid var(--border)',
                background: 'var(--surface)', cursor: 'pointer', fontSize: 11, fontWeight: 600,
                color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 4,
              }}
            >
              <X size={12} /> Reset
            </button>
          )}
        </div>

        {/* Search bar */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ position: 'relative' }}>
            <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari invoice, nama pelanggan, atau no. HP..."
              className="field-input"
              style={{ paddingLeft: 32, padding: '7px 12px 7px 32px', fontSize: 12, width: '100%' }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)',
                  padding: 4,
                }}
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          {/* Period Presets */}
          <div>
            <label className="field-label">Periode</label>
            <div style={{ display: 'flex', gap: 4, padding: 4, borderRadius: 10, background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
              {PERIOD_PRESETS.map((p) => (
                <button
                  key={p.key}
                  onClick={() => applyPreset(p.key)}
                  style={{
                    padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
                    fontSize: 12, fontWeight: 600, transition: 'all 0.15s',
                    background: preset === p.key ? 'var(--text)' : 'transparent',
                    color: preset === p.key ? 'var(--bg)' : 'var(--text-3)',
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Date Range */}
          <div>
            <label className="field-label">Dari Tanggal</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => { setDateFrom(e.target.value); setPreset('custom'); }}
              className="field-input"
              style={{ width: 140, padding: '6px 10px', fontSize: 12 }}
            />
          </div>
          <div>
            <label className="field-label">Sampai Tanggal</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => { setDateTo(e.target.value); setPreset('custom'); }}
              className="field-input"
              style={{ width: 140, padding: '6px 10px', fontSize: 12 }}
            />
          </div>

          {/* Service Filter */}
          <div>
            <label className="field-label">Layanan</label>
            <select
              value={filterService}
              onChange={(e) => setFilterService(e.target.value)}
              className="field-input"
              style={{ width: 160, padding: '6px 10px', fontSize: 12, appearance: 'none',
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236c757d' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center', paddingRight: 32,
              }}
            >
              <option value="">Semua Layanan</option>
              {services?.map((s) => <option key={s.id} value={s.nama}>{s.nama}</option>)}
            </select>
          </div>

          {/* Customer Filter */}
          <div>
            <label className="field-label">Pelanggan</label>
            <select
              value={filterCustomer}
              onChange={(e) => setFilterCustomer(e.target.value)}
              className="field-input"
              style={{ width: 160, padding: '6px 10px', fontSize: 12, appearance: 'none',
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236c757d' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center', paddingRight: 32,
              }}
            >
              <option value="">Semua Pelanggan</option>
              {customers?.map((c) => <option key={c.id} value={c.nama}>{c.nama}</option>)}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="field-label">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="field-input"
              style={{ width: 130, padding: '6px 10px', fontSize: 12, appearance: 'none',
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236c757d' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center', paddingRight: 32,
              }}
            >
              <option value="">Semua Status</option>
              <option value="Proses">Proses</option>
              <option value="Selesai">Selesai</option>
              <option value="Diambil">Diambil</option>
            </select>
          </div>

          {/* Sort */}
          <div>
            <label className="field-label">Urutkan</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="field-input"
              style={{ width: 170, padding: '6px 10px', fontSize: 12, appearance: 'none',
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236c757d' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center', paddingRight: 32,
              }}
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.key} value={o.key}>{o.label}</option>
              ))}
            </select>
          </div>

          {/* Range Amount */}
          <div>
            <label className="field-label">Min. Total (Rp)</label>
            <input
              type="number"
              value={minAmount}
              onChange={(e) => setMinAmount(e.target.value)}
              placeholder="0"
              className="field-input"
              style={{ width: 110, padding: '6px 10px', fontSize: 12 }}
            />
          </div>
          <div>
            <label className="field-label">Maks. Total (Rp)</label>
            <input
              type="number"
              value={maxAmount}
              onChange={(e) => setMaxAmount(e.target.value)}
              placeholder="999999"
              className="field-input"
              style={{ width: 110, padding: '6px 10px', fontSize: 12 }}
            />
          </div>

          {/* Export Buttons - moved to separate row */}
        </div>

        {/* Export actions */}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 14, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
          <button className="btn btn-secondary" onClick={handleExportExcel} style={{ padding: '8px 16px', fontSize: 12 }}>
            <Download size={14} /> Export Excel
          </button>
          <button className="btn btn-secondary" onClick={handleExportPDF} style={{ padding: '8px 16px', fontSize: 12 }}>
            <Download size={14} /> Export PDF
          </button>
          <button className="btn btn-secondary" onClick={handlePrintReport} style={{ padding: '8px 16px', fontSize: 12 }}>
            <Printer size={14} /> Cetak
          </button>
        </div>
      </div>

      {/* Revenue Chart */}
      <div className="card" style={{ padding: '22px 26px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
          <div>
            <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 2 }}>Grafik Pendapatan</p>
            <p style={{ fontSize: 11, color: 'var(--text-3)' }}>
              {dateFrom && dateTo ? `${dateFrom} - ${dateTo}` : 'Semua data'} · {filteredTx.length} transaksi
              {filterStatus && ` · Status: ${filterStatus}`}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ display: 'flex', gap: 4, padding: 4, borderRadius: 10, background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
              {[['daily','Harian'],['weekly','Mingguan'],['monthly','Bulanan'],['yearly','Tahunan']].map(([k,l]) => (
                <button key={k} onClick={() => setPeriod(k)} style={{
                  padding: '5px 12px', borderRadius: 7, border: 'none', cursor: 'pointer',
                  fontSize: 12, fontWeight: 600, transition: 'all 0.15s',
                  background: period === k ? 'var(--text)' : 'transparent',
                  color: period === k ? 'var(--bg)' : 'var(--text-3)',
                }}>{l}</button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 4, padding: 4, borderRadius: 10, background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
              {CHART_TYPES.map(({ key, label }) => (
                <button key={key} onClick={() => setChartType(key)} style={{
                  padding: '5px 12px', borderRadius: 7, border: 'none', cursor: 'pointer',
                  fontSize: 12, fontWeight: 600, transition: 'all 0.15s',
                  background: chartType === key ? 'var(--text)' : 'transparent',
                  color: chartType === key ? 'var(--bg)' : 'var(--text-3)',
                }}>{label}</button>
              ))}
            </div>
          </div>
        </div>

        {chartData.length > 0 ? (
          <div style={{ width: '100%', height: 300 }}>
            {chartType === 'bar' ? (
              <Bar data={revenueChartData} options={chartOptions} />
            ) : (
              <Line data={revenueChartData} options={chartOptions} />
            )}
          </div>
        ) : (
          <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)', fontSize: 13 }}>
            Tidak ada data untuk ditampilkan
          </div>
        )}
      </div>

      {/* Service Popularity + Detail */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }} className="laporan-bottom">
        <div className="card" style={{ padding: '20px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Layanan Paling Laris</p>
            <div style={{ display: 'flex', gap: 4, padding: 3, borderRadius: 8, background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
              {PIE_CHART_TYPES.map(({ key, label }) => (
                <button key={key} onClick={() => setPieChartType(key)} style={{
                  padding: '4px 10px', borderRadius: 6, border: 'none', cursor: 'pointer',
                  fontSize: 11, fontWeight: 600, transition: 'all 0.15s',
                  background: pieChartType === key ? 'var(--text)' : 'transparent',
                  color: pieChartType === key ? 'var(--bg)' : 'var(--text-3)',
                }}>{label}</button>
              ))}
            </div>
          </div>
          {serviceData.length > 0 ? (
            <div style={{ height: 280 }}>
              {pieChartType === 'pie' ? (
                <Pie data={serviceChartData} options={pieOptions} />
              ) : (
                <Doughnut data={serviceChartData} options={pieOptions} />
              )}
            </div>
          ) : (
            <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)', fontSize: 13 }}>Belum ada data</div>
          )}
        </div>

        <div className="card" style={{ padding: '20px 24px' }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 16 }}>Detail Layanan</p>
          {serviceData.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {serviceData.map((s, i) => (
                <div key={s.nama} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 12px', borderRadius: 8,
                  borderBottom: i < serviceData.length - 1 ? '1px solid var(--border)' : 'none',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: CHART_COLORS[i % CHART_COLORS.length], flexShrink: 0 }} />
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{s.nama}</p>
                      <p style={{ fontSize: 11, color: 'var(--text-3)' }}>{s.count} penggunaan</p>
                    </div>
                  </div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{formatRupiah(s.revenue)}</p>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)', fontSize: 13 }}>Belum ada data</div>
          )}
        </div>
      </div>

      {/* Transaction Status Breakdown */}
      <div className="card" style={{ padding: '20px 24px' }}>
        <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 16 }}>Breakdown Status Transaksi</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }} className="status-grid">
          <div style={{ padding: '16px', borderRadius: 10, background: 'var(--surface-2)', border: '1px solid var(--border)', textAlign: 'center' }}>
            <p style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Proses</p>
            <p style={{ fontSize: 28, fontWeight: 800, color: 'var(--amber)' }}>{stats.processTx}</p>
          </div>
          <div style={{ padding: '16px', borderRadius: 10, background: 'var(--surface-2)', border: '1px solid var(--border)', textAlign: 'center' }}>
            <p style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Selesai</p>
            <p style={{ fontSize: 28, fontWeight: 800, color: 'var(--green)' }}>{stats.completedTx}</p>
          </div>
          <div style={{ padding: '16px', borderRadius: 10, background: 'var(--surface-2)', border: '1px solid var(--border)', textAlign: 'center' }}>
            <p style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Diambil</p>
            <p style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-2)' }}>
              {filteredTx.filter(t => t.status === 'Diambil').length}
            </p>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="card" style={{ padding: '20px 24px' }}>
        <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 16 }}>Data Transaksi ({filteredTx.length})</p>
        {filteredTx.length > 0 ? (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Invoice</th>
                  <th>Tanggal</th>
                  <th>Pelanggan</th>
                  <th>Layanan</th>
                  <th>Berat</th>
                  <th>Total</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredTx.map((t) => (
                  <tr key={t.id}>
                    <td style={{ fontWeight: 600, fontSize: 12 }}>{t.id}</td>
                    <td style={{ fontSize: 12, color: 'var(--text-2)' }}>{new Date(t.tanggal).toLocaleDateString('id-ID')}</td>
                    <td>{t.pelanggan?.nama || '-'}</td>
                    <td style={{ fontSize: 12, color: 'var(--text-2)' }}>
                      {t.items?.map(i => i.layanan).join(', ') || '-'}
                    </td>
                    <td style={{ fontWeight: 600 }}>{t.totalBerat} kg</td>
                    <td style={{ fontWeight: 700 }}>{formatRupiah(t.totalBayar)}</td>
                    <td>
                      <span style={{
                        padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600,
                        background: t.status === 'Diambil' ? 'var(--green-bg)' : t.status === 'Selesai' ? 'var(--accent-bg)' : 'var(--amber-bg)',
                        color: t.status === 'Diambil' ? 'var(--green)' : t.status === 'Selesai' ? 'var(--text)' : 'var(--amber)',
                        border: `1px solid ${
                          t.status === 'Diambil' ? 'var(--green-border)' : 
                          t.status === 'Selesai' ? 'var(--accent-border)' : 
                          'var(--amber-border)'
                        }`,
                      }}>
                        {t.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)', fontSize: 13 }}>
            Tidak ada data transaksi
          </div>
        )}
      </div>

      <style>{`
        .quick-stats-grid { grid-template-columns: repeat(4,1fr) !important; }
        .status-grid { grid-template-columns: repeat(3,1fr) !important; }
        @media (max-width: 1200px) { .quick-stats-grid { grid-template-columns: repeat(2,1fr) !important; } }
        @media (max-width: 900px) { 
          .quick-stats-grid { grid-template-columns: 1fr !important; } 
          .laporan-bottom { grid-template-columns: 1fr !important; } 
          .status-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 560px) { 
          .status-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}