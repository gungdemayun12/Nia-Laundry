import { useState, useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import {
  Download, Activity, ArrowUpRight, ArrowDownRight, Printer,
} from 'lucide-react';
import { formatRupiah, exportCSV, getStartOfDay, getStartOfWeek, getStartOfMonth } from '../utils/helpers';

const CHART_COLORS = ['#212529', '#495057', '#6c757d', '#adb5bd', '#ced4da'];

const PERIOD_PRESETS = [
  { key: 'today', label: 'Hari Ini' },
  { key: 'week', label: 'Minggu Ini' },
  { key: 'month', label: 'Bulan Ini' },
  { key: 'all', label: 'Semua' },
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

export default function Laporan({ transactions }) {
  const [chartType, setChartType] = useState('bar');
  const [period, setPeriod] = useState('daily');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [preset, setPreset] = useState('all');

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

  const stats = useMemo(() => {
    const totalRevenue = filteredTx.reduce((s, t) => s + (t.totalBayar || 0), 0);
    const totalKg = filteredTx.reduce((s, t) => s + (t.totalBerat || 0), 0);
    const avgTransaction = filteredTx.length > 0 ? totalRevenue / filteredTx.length : 0;

    return { totalRevenue, totalKg, avgTransaction, count: filteredTx.length };
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
  }, [transactions, preset, now]);

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

  const getTrend = (current, previous) => {
    if (!previous || previous === 0) return { value: '-', up: true };
    const diff = ((current - previous) / previous) * 100;
    return { value: `${Math.abs(diff).toFixed(1)}%`, up: diff >= 0 };
  };

  const revenueTrend = getTrend(stats.totalRevenue, prevPeriodStats?.revenue);
  const countTrend = getTrend(stats.count, prevPeriodStats?.count);
  const kgTrend = getTrend(stats.totalKg, prevPeriodStats?.kg);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Quick Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }} className="quick-stats-grid">
        <QuickStat
          label="Total Pendapatan"
          value={formatRupiah(stats.totalRevenue)}
          sub={prevPeriodStats ? `${revenueTrend.value} dari periode sebelumnya` : undefined}
          trendUp={revenueTrend.up}
        />
        <QuickStat
          label="Total Transaksi"
          value={stats.count}
          sub={prevPeriodStats ? `${countTrend.value} dari periode sebelumnya` : undefined}
          trendUp={countTrend.up}
        />
        <QuickStat
          label="Total Kg Dicuci"
          value={`${stats.totalKg.toFixed(1)} kg`}
          sub={prevPeriodStats ? `${kgTrend.value} dari periode sebelumnya` : undefined}
          trendUp={kgTrend.up}
        />
      </div>

      {/* Filters */}
      <div className="card" style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Period Presets */}
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

          {/* Custom Date Range */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => { setDateFrom(e.target.value); setPreset('custom'); }}
              className="field-input"
              style={{ width: 140, padding: '6px 10px', fontSize: 12 }}
            />
            <span style={{ color: 'var(--text-3)', fontSize: 12 }}>s/d</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => { setDateTo(e.target.value); setPreset('custom'); }}
              className="field-input"
              style={{ width: 140, padding: '6px 10px', fontSize: 12 }}
            />
          </div>

          {/* Actions */}
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary" onClick={handleExport} style={{ padding: '7px 14px', fontSize: 12 }}>
              <Download size={14} /> Export CSV
            </button>
            <button className="btn btn-secondary" onClick={handlePrintReport} style={{ padding: '7px 14px', fontSize: 12 }}>
              <Printer size={14} /> Print
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
              {dateFrom && dateTo ? `${dateFrom} - ${dateTo}` : 'Semua data'}
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
              {[['bar','Bar'],['line','Line']].map(([k,l]) => (
                <button key={k} onClick={() => setChartType(k)} style={{
                  padding: '5px 12px', borderRadius: 7, border: 'none', cursor: 'pointer',
                  fontSize: 12, fontWeight: 600, transition: 'all 0.15s',
                  background: chartType === k ? 'var(--text)' : 'transparent',
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
                    cursor={{ fill: 'var(--accent-bg)' }} />
                  <Bar dataKey="pendapatan" fill="var(--text)" radius={[6,6,0,0]} />
                </BarChart>
              ) : (
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="period" tickFormatter={formatLabel} tick={{ fontSize: 11, fill: 'var(--text-3)' }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: 'var(--text-3)' }} axisLine={false} tickLine={false} width={38} />
                  <Tooltip formatter={(v) => [formatRupiah(v), 'Pendapatan']} labelFormatter={formatLabel}
                    contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 12, boxShadow: 'var(--shadow-md)' }} />
                  <Line type="monotone" dataKey="pendapatan" stroke="var(--text)" strokeWidth={2.5} dot={{ fill: 'var(--text)', r: 4, strokeWidth: 0 }} activeDot={{ r: 6 }} />
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

      {/* Service Popularity + Detail */}
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
                  <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{formatRupiah(s.revenue)}</p>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)', fontSize: 13 }}>Belum ada data</div>
          )}
        </div>
      </div>

      {/* Average Transaction Stat */}
      <div className="card" style={{ padding: '20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <div style={{ width: 34, height: 34, borderRadius: 9, background: 'var(--accent-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1.5px solid var(--accent-border)' }}>
            <Activity size={16} style={{ color: 'var(--text)' }} />
          </div>
          <div>
            <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Rata-rata per Transaksi</p>
            <p style={{ fontSize: 11, color: 'var(--text-3)' }}>Berdasarkan {stats.count} transaksi</p>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }} className="avg-grid">
          <div style={{ padding: '14px 16px', borderRadius: 10, background: 'var(--surface-2)', border: '1px solid var(--border)', textAlign: 'center' }}>
            <p style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Rata-rata</p>
            <p style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)' }}>{formatRupiah(Math.round(stats.avgTransaction))}</p>
          </div>
          <div style={{ padding: '14px 16px', borderRadius: 10, background: 'var(--surface-2)', border: '1px solid var(--border)', textAlign: 'center' }}>
            <p style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Total Kg</p>
            <p style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)' }}>{stats.totalKg.toFixed(1)} kg</p>
          </div>
          <div style={{ padding: '14px 16px', borderRadius: 10, background: 'var(--surface-2)', border: '1px solid var(--border)', textAlign: 'center' }}>
            <p style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Rata-rata Kg</p>
            <p style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)' }}>
              {stats.count > 0 ? (stats.totalKg / stats.count).toFixed(1) : '0'} kg
            </p>
          </div>
        </div>
      </div>

      <style>{`
        .quick-stats-grid { grid-template-columns: repeat(3,1fr) !important; }
        @media (max-width: 900px) { .quick-stats-grid { grid-template-columns: 1fr !important; } .laporan-bottom { grid-template-columns: 1fr !important; } .avg-grid { grid-template-columns: 1fr !important; } }
        @media (max-width: 560px) { .avg-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </div>
  );
}