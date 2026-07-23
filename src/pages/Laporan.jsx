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
  Download, ArrowUpRight, ArrowDownRight, Printer,
} from 'lucide-react';
import { formatRupiah, getStartOfDay, getStartOfWeek, getStartOfMonth } from '../utils/helpers';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

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
  const [filterStatus, setFilterStatus] = useState('Diambil');

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
    return transactions.filter((t) => {
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
      return true;
    });
  }, [transactions, dateFrom, dateTo, filterService, filterCustomer, filterStatus]);

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
          color: '#6c757d',
          padding: 16,
          usePointStyle: true,
          pointStyle: 'circle',
        },
      },
      tooltip: {
        backgroundColor: '#212529',
        titleFont: { family: "'Inter', sans-serif", size: 12, weight: '600' },
        bodyFont: { family: "'Inter', sans-serif", size: 11 },
        padding: 12,
        cornerRadius: 8,
        displayColors: true,
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          font: { family: "'Inter', sans-serif", size: 11 },
          color: '#6c757d',
        },
      },
      y: {
        grid: { color: '#f1f3f5', drawBorder: false },
        ticks: {
          font: { family: "'Inter', sans-serif", size: 11 },
          color: '#6c757d',
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
          color: '#212529',
          padding: 12,
          usePointStyle: true,
          pointStyle: 'circle',
        },
      },
      tooltip: {
        backgroundColor: '#212529',
        titleFont: { family: "'Inter', sans-serif", size: 12, weight: '600' },
        bodyFont: { family: "'Inter', sans-serif", size: 11 },
        padding: 12,
        cornerRadius: 8,
      },
    },
  };

  const revenueChartData = {
    labels: chartData.map(d => formatLabel(d.period)),
    datasets: [
      {
        label: 'Pendapatan',
        data: chartData.map(d => d.pendapatan),
        backgroundColor: chartType === 'bar' ? '#212529' : 'transparent',
        borderColor: '#212529',
        borderWidth: chartType === 'line' ? 2.5 : 0,
        fill: chartType === 'line',
        tension: 0.3,
        pointRadius: chartType === 'line' ? 4 : 0,
        pointHoverRadius: chartType === 'line' ? 6 : 0,
        pointBackgroundColor: '#212529',
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
        borderColor: '#fff',
        borderWidth: 2,
      },
    ],
  };

  const handleExportExcel = () => {
    const data = filteredTx.map((t) => ({
      'No. Invoice': t.id,
      Tanggal: new Date(t.tanggal).toLocaleString('id-ID'),
      Pelanggan: t.pelanggan?.nama || '-',
      Layanan: t.items?.map((i) => i.layanan).join('; ') || '-',
      'Total Berat (kg)': t.totalBerat,
      'Total Bayar (Rp)': t.totalBayar,
      Status: t.status,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Laporan");
    try {
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const dataBlob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
      const url = window.URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Laporan_Laundry_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => window.URL.revokeObjectURL(url), 1000);
    } catch (e) {
      console.error(e);
      XLSX.writeFile(wb, `Laporan_Laundry_${new Date().toISOString().split('T')[0]}.xlsx`);
    }
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Laporan Transaksi Laundry', 14, 20);
    doc.setFontSize(10);
    doc.text(`Dicetak pada: ${new Date().toLocaleString('id-ID')}`, 14, 28);
    
    const tableColumn = ["No. Invoice", "Tanggal", "Pelanggan", "Berat", "Total", "Status"];
    const tableRows = [];

    filteredTx.forEach(t => {
      const rowData = [
        t.id,
        new Date(t.tanggal).toLocaleDateString('id-ID'),
        t.pelanggan?.nama || '-',
        `${t.totalBerat} kg`,
        formatRupiah(t.totalBayar),
        t.status
      ];
      tableRows.push(rowData);
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 35,
      theme: 'striped',
      styles: { fontSize: 9 },
      headStyles: { fillColor: [33, 37, 41] },
    });
    
    try {
      const blob = doc.output('blob');
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Laporan_Laundry_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => window.URL.revokeObjectURL(url), 1000);
    } catch (e) {
      console.error(e);
      doc.save(`Laporan_Laundry_${new Date().toISOString().split('T')[0]}.pdf`);
    }
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
  };

  const hasActiveFilters = dateFrom || dateTo || filterService || filterCustomer || filterStatus;

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

      {/* Filters */}
      <div className="card" style={{ padding: '16px 20px' }}>
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
                    color: preset === p.key ? '#fff' : 'var(--text-3)',
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
              style={{ width: 140, padding: '6px 10px', fontSize: 12, appearance: 'none',
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

          {/* Actions */}
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            {hasActiveFilters && (
              <button className="btn btn-secondary" onClick={clearFilters} style={{ padding: '7px 14px', fontSize: 12 }}>
                Reset
              </button>
            )}
              <button className="btn btn-secondary" onClick={handleExportExcel} style={{ padding: '8px 16px', fontSize: 12 }}>
                <Download size={14} /> Excel
              </button>
              <button className="btn btn-secondary" onClick={handleExportPDF} style={{ padding: '8px 16px', fontSize: 12 }}>
                <Download size={14} /> PDF
              </button>
              <button className="btn btn-secondary" onClick={handlePrintReport} style={{ padding: '8px 16px', fontSize: 12 }}>
                <Printer size={14} /> Cetak
              </button>
          </div>
        </div>
      </div>

      {/* Revenue Chart */}
      <div className="card" style={{ padding: '22px 26px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
          <div>
            <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 2 }}>Grafik Pendapatan</p>
            <p style={{ fontSize: 11, color: 'var(--text-3)' }}>
              {dateFrom && dateTo ? `${dateFrom} - ${dateTo}` : 'Semua data'} · {filteredTx.length} transaksi
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ display: 'flex', gap: 4, padding: 4, borderRadius: 10, background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
              {[['daily','Harian'],['weekly','Mingguan'],['monthly','Bulanan'],['yearly','Tahunan']].map(([k,l]) => (
                <button key={k} onClick={() => setPeriod(k)} style={{
                  padding: '5px 12px', borderRadius: 7, border: 'none', cursor: 'pointer',
                  fontSize: 12, fontWeight: 600, transition: 'all 0.15s',
                  background: period === k ? 'var(--text)' : 'transparent',
                  color: period === k ? '#fff' : 'var(--text-3)',
                }}>{l}</button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 4, padding: 4, borderRadius: 10, background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
              {CHART_TYPES.map(({ key, label }) => (
                <button key={key} onClick={() => setChartType(key)} style={{
                  padding: '5px 12px', borderRadius: 7, border: 'none', cursor: 'pointer',
                  fontSize: 12, fontWeight: 600, transition: 'all 0.15s',
                  background: chartType === key ? 'var(--text)' : 'transparent',
                  color: chartType === key ? '#fff' : 'var(--text-3)',
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
                  color: pieChartType === key ? '#fff' : 'var(--text-3)',
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
        <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 16 }}>Status Transaksi</p>
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
            <p style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-3)' }}>
              {filteredTx.filter(t => t.status === 'Diambil').length}
            </p>
          </div>
        </div>
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