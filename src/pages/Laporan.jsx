import { useState, useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import {
  TrendingUp, Download, Calendar, BarChart3, Activity,
} from 'lucide-react';
import { Card, StatCard, Button, Input } from '../components/UI';
import { formatRupiah, exportCSV } from '../utils/helpers';

const CHART_COLORS = ['#2563eb', '#7c3aed', '#0891b2', '#16a34a', '#d97706'];

export default function Laporan({ transactions, services }) {
  const [chartType, setChartType] = useState('bar');
  const [period, setPeriod] = useState('daily');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Filtered transactions by date range
  const filteredTx = useMemo(() => {
    return transactions.filter((t) => {
      const d = new Date(t.tanggal);
      if (dateFrom && d < new Date(dateFrom)) return false;
      if (dateTo) {
        const to = new Date(dateTo);
        to.setHours(23, 59, 59, 999);
        if (d > to) return false;
      }
      return true;
    });
  }, [transactions, dateFrom, dateTo]);

  // Stats
  const stats = useMemo(() => {
    const totalRevenue = filteredTx.reduce((s, t) => s + (t.totalBayar || 0), 0);
    const totalKg = filteredTx.reduce((s, t) => s + (t.totalBerat || 0), 0);
    const avgTransaction = filteredTx.length > 0 ? totalRevenue / filteredTx.length : 0;

    return { totalRevenue, totalKg, avgTransaction, count: filteredTx.length };
  }, [filteredTx]);

  // Chart data
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

  // Service popularity (pie chart)
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

  const handleExport = () => {
    const data = filteredTx.map((t) => ({
      'No. Invoice': t.id,
      Tanggal: new Date(t.tanggal).toLocaleString('id-ID'),
      Pelanggan: t.pelanggan?.nama || '-',
      Layanan: t.items?.map((i) => i.layanan).join('; ') || '-',
      'Total Berat': t.totalBerat,
      Diskon: t.diskon,
      'Total Bayar': t.totalBayar,
      Status: t.status,
    }));
    exportCSV(data, `laporan-laundry-${new Date().toISOString().split('T')[0]}.csv`);
  };

  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div>
          <label className="field-label">Dari Tanggal</label>
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="field-input" style={{ width: 160 }} />
        </div>
        <div>
          <label className="field-label">Sampai Tanggal</label>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="field-input" style={{ width: 160 }} />
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary" onClick={handleExport} style={{ padding: '9px 16px', fontSize: 12 }}>
            <Download size={14} /> Export CSV
          </button>
          <button className="btn btn-secondary" onClick={handlePrintReport} style={{ padding: '9px 16px', fontSize: 12 }}>
            <Download size={14} /> Print
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }} className="laporan-stat-grid">
        <StatCard
          icon={TrendingUp}
          label="Total Pendapatan"
          value={formatRupiah(stats.totalRevenue)}
          color="var(--blue)" iconBg="var(--blue-bg)"
        />
        <StatCard
          icon={BarChart3}
          label="Total Transaksi"
          value={stats.count}
          color="var(--violet)" iconBg="var(--violet-bg)"
        />
        <StatCard
          icon={Activity}
          label="Total Kg Dicuci"
          value={`${stats.totalKg.toFixed(1)} kg`}
          color="var(--cyan)" iconBg="var(--cyan-bg)"
        />
        <StatCard
          icon={Calendar}
          label="Rata-rata / Transaksi"
          value={formatRupiah(Math.round(stats.avgTransaction))}
          color="var(--green)" iconBg="var(--green-bg)"
        />
      </div>

      {/* Revenue Chart */}
      <div className="card" style={{ padding: '20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Grafik Pendapatan</p>
          <div style={{ display: 'flex', gap: 8 }}>
            {/* Period tabs */}
            <div style={{ display: 'flex', gap: 4, padding: 4, borderRadius: 10, background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
              {[['daily','Harian'],['weekly','Mingguan'],['monthly','Bulanan'],['yearly','Tahunan']].map(([k,l]) => (
                <button key={k} onClick={() => setPeriod(k)} style={{
                  padding: '5px 12px', borderRadius: 7, border: 'none', cursor: 'pointer',
                  fontSize: 12, fontWeight: 600, transition: 'all 0.15s',
                  background: period === k ? 'var(--blue)' : 'transparent',
                  color: period === k ? '#fff' : 'var(--text-3)',
                }}>{l}</button>
              ))}
            </div>
            {/* Chart type */}
            <div style={{ display: 'flex', gap: 4, padding: 4, borderRadius: 10, background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
              {[['bar','Bar'],['line','Line']].map(([k,l]) => (
                <button key={k} onClick={() => setChartType(k)} style={{
                  padding: '5px 12px', borderRadius: 7, border: 'none', cursor: 'pointer',
                  fontSize: 12, fontWeight: 600, transition: 'all 0.15s',
                  background: chartType === k ? 'var(--blue)' : 'transparent',
                  color: chartType === k ? '#fff' : 'var(--text-3)',
                }}>{l}</button>
              ))}
            </div>
          </div>
        </div>

        {chartData.length > 0 ? (
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              {chartType === 'bar' ? (
                <BarChart data={chartData} barSize={22}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="period" tickFormatter={formatLabel} tick={{ fontSize: 11, fill: 'var(--text-3)' }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: 'var(--text-3)' }} axisLine={false} tickLine={false} width={38} />
                  <Tooltip formatter={(v) => [formatRupiah(v), 'Pendapatan']} labelFormatter={formatLabel}
                    contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 12, boxShadow: 'var(--shadow-md)' }}
                    cursor={{ fill: 'var(--blue-bg)' }} />
                  <Bar dataKey="pendapatan" fill="var(--blue)" radius={[5,5,0,0]} />
                </BarChart>
              ) : (
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="period" tickFormatter={formatLabel} tick={{ fontSize: 11, fill: 'var(--text-3)' }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: 'var(--text-3)' }} axisLine={false} tickLine={false} width={38} />
                  <Tooltip formatter={(v) => [formatRupiah(v), 'Pendapatan']} labelFormatter={formatLabel}
                    contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 12, boxShadow: 'var(--shadow-md)' }} />
                  <Line dataKey="pendapatan" stroke="var(--blue)" strokeWidth={2.5} dot={{ fill: 'var(--blue)', r: 4, strokeWidth: 0 }} activeDot={{ r: 6 }} />
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>
        ) : (
          <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)', fontSize: 13 }}>
            Tidak ada data untuk ditampilkan
          </div>
        )}
      </div>

      {/* Service Popularity */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }} className="laporan-bottom">
        <div className="card" style={{ padding: '20px 24px' }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 16 }}>Layanan Paling Laris</p>
          {serviceData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={serviceData} dataKey="count" nameKey="nama" cx="50%" cy="50%" outerRadius={90} innerRadius={40} paddingAngle={2}
                  label={({ nama, percent }) => `${nama} (${(percent * 100).toFixed(0)}%)`} labelLine={{ stroke: 'var(--text-3)' }}>
                  {serviceData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v, n) => [`${v} transaksi`, n]}
                  contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
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
                  <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--blue)' }}>{formatRupiah(s.revenue)}</p>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)', fontSize: 13 }}>Belum ada data</div>
          )}
        </div>
      </div>

      <style>{`
        .laporan-stat-grid { grid-template-columns: repeat(4,1fr) !important; }
        @media (max-width: 900px) { .laporan-stat-grid { grid-template-columns: repeat(2,1fr) !important; } }
        @media (max-width: 560px) { .laporan-stat-grid { grid-template-columns: 1fr !important; } .laporan-bottom { grid-template-columns: 1fr !important; } }
      `}</style>
    </div>
  );
}