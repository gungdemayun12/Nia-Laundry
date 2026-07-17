import { useMemo, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts';
import { formatRupiah, formatDate, formatDateTime, isOverdue, exportCSV } from '../utils/helpers';
import { StatusBadge } from '../components/UI';
import {
  Banknote, ShoppingCart, Weight, Clock,
  AlertTriangle, TrendingUp, Download, Printer, Activity, PieChart as PieChartIcon
} from 'lucide-react';
import { STATUS_OPTIONS } from '../utils/constants';

const COLORS = ['#2563eb', '#16a34a', '#d97706', '#7c3aed', '#0891b2', '#dc2626'];

/* ── mini helpers ── */
function StatCard({ icon: Icon, label, value, sub, color, iconBg }) {
  return (
    <div className="card" style={{ padding: '18px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-3)', marginBottom: 6 }}>
            {label}
          </p>
          <p style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', lineHeight: 1, letterSpacing: '-0.02em' }}>
            {value}
          </p>
          {sub && (
            <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--amber)', marginTop: 6 }}>
              ⚠ {sub}
            </p>
          )}
        </div>
        <div style={{
          width: 40, height: 40, borderRadius: 10, flexShrink: 0,
          background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={19} style={{ color }} />
        </div>
      </div>
    </div>
  );
}

export default function Dashboard({ transactions, setTransactions, services }) {
  const [period, setPeriod] = useState('daily');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const handleStatusUpdate = (id, newStatus) => {
    if (setTransactions) {
      setTransactions((prev) => prev.map((t) => t.id === id ? { ...t, status: newStatus } : t));
    }
  };

  const getNextStatus = (current) => {
    const idx = STATUS_OPTIONS.indexOf(current);
    return idx < STATUS_OPTIONS.length - 1 ? STATUS_OPTIONS[idx + 1] : current;
  };

  const today = useMemo(() => {
    const d = new Date(); d.setHours(0, 0, 0, 0); return d;
  }, []);

  const todayStats = useMemo(() => {
    const tx = transactions.filter((t) => {
      const d = new Date(t.tanggal); d.setHours(0, 0, 0, 0);
      return d.getTime() === today.getTime();
    });
    return {
      revenue: tx.reduce((s, t) => s + (t.totalBayar || 0), 0),
      count: tx.length,
      kg: tx.reduce((s, t) => s + (t.totalBerat || 0), 0),
    };
  }, [transactions, today]);

  const pendingPickup = useMemo(
    () => transactions.filter((t) => t.status !== 'Diambil'),
    [transactions]
  );

  const overdueItems = useMemo(
    () => transactions.filter((t) => isOverdue(t.estimasiSelesai, t.status)),
    [transactions]
  );

  const recentTx = useMemo(
    () => [...transactions].sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal)).slice(0, 6),
    [transactions]
  );

  const chartData = useMemo(() => {
    let filtered = transactions;
    if (startDate && endDate) {
      const s = new Date(startDate).getTime();
      const e = new Date(endDate);
      e.setHours(23, 59, 59, 999);
      filtered = transactions.filter(t => {
        const d = new Date(t.tanggal).getTime();
        return d >= s && d <= e.getTime();
      });
    }

    if (!filtered.length) return [];
    const map = {};
    filtered.forEach((t) => {
      const d = new Date(t.tanggal);
      let key;
      if (period === 'daily') {
        key = d.toISOString().split('T')[0];
      } else if (period === 'weekly') {
        const w = new Date(d);
        const day = w.getDay();
        w.setDate(w.getDate() - day + (day === 0 ? -6 : 1));
        key = w.toISOString().split('T')[0];
      } else {
        key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      }
      if (!map[key]) map[key] = { period: key, pendapatan: 0, transaksi: 0, berat: 0 };
      map[key].pendapatan += t.totalBayar || 0;
      map[key].transaksi += 1;
      map[key].berat += t.totalBerat || 0;
    });
    return Object.values(map).sort((a, b) => a.period.localeCompare(b.period)).slice(-14);
  }, [transactions, period, startDate, endDate]);

  const serviceData = useMemo(() => {
    let filtered = transactions;
    if (startDate && endDate) {
      const s = new Date(startDate).getTime();
      const e = new Date(endDate);
      e.setHours(23, 59, 59, 999);
      filtered = transactions.filter(t => {
        const d = new Date(t.tanggal).getTime();
        return d >= s && d <= e.getTime();
      });
    }
    const map = {};
    filtered.forEach(t => {
      t.items?.forEach(i => {
        map[i.layanan] = (map[i.layanan] || 0) + i.berat;
      });
    });
    return Object.entries(map)
      .map(([name, value]) => ({ name, value: Number(value.toFixed(1)) }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5); // top 5
  }, [transactions, startDate, endDate]);

  const formatLabel = (key) => {
    if (period === 'monthly') {
      const [y, m] = key.split('-');
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];
      return months[parseInt(m) - 1] + ' ' + y.slice(2);
    }
    const d = new Date(key);
    return `${d.getDate()}/${d.getMonth() + 1}`;
  };

  const totalRevenue = useMemo(
    () => chartData.reduce((s, d) => s + (d.pendapatan || 0), 0),
    [chartData]
  );

  const handleExportCSV = () => {
    const data = chartData.map(d => ({
      Periode: formatLabel(d.period),
      Pendapatan: d.pendapatan,
      'Jml Transaksi': d.transaksi,
      'Total Berat (kg)': d.berat
    }));
    exportCSV(data, `laporan-pendapatan-${new Date().toISOString().split('T')[0]}.csv`);
  };

  const handleExportPDF = () => {
    const win = window.open('', '_blank');
    let html = `<html><head><title>Laporan Pendapatan</title>
      <style>
        body { font-family: sans-serif; padding: 20px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background: #f4f4f4; }
      </style>
    </head><body>
      <h2>Laporan Pendapatan</h2>
      <p>Total Pendapatan: ${formatRupiah(totalRevenue)}</p>
      <table>
        <thead><tr><th>Periode</th><th>Pendapatan</th><th>Jml Transaksi</th><th>Total Berat (kg)</th></tr></thead>
        <tbody>
          ${chartData.map(d => `<tr>
            <td>${formatLabel(d.period)}</td>
            <td>${formatRupiah(d.pendapatan)}</td>
            <td>${d.transaksi}</td>
            <td>${d.berat} kg</td>
          </tr>`).join('')}
        </tbody>
      </table>
    </body></html>`;
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 250);
  };

  /* ── render ── */
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Alert */}
      {overdueItems.length > 0 && (
        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: 12,
          padding: '12px 16px', borderRadius: 12,
          background: 'var(--amber-bg)', border: '1px solid var(--amber-border)',
        }}>
          <AlertTriangle size={17} style={{ color: 'var(--amber)', flexShrink: 0, marginTop: 1 }} />
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--amber)' }}>
              {overdueItems.length} laundry sudah melewati estimasi selesai
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px 16px', marginTop: 4 }}>
              {overdueItems.slice(0, 3).map((t) => (
                <span key={t.id} style={{ fontSize: 11, color: 'var(--amber)' }}>
                  {t.id} · {t.pelanggan?.nama} · Est: {formatDate(t.estimasiSelesai)}
                </span>
              ))}
              {overdueItems.length > 3 && (
                <span style={{ fontSize: 11, color: 'var(--amber)' }}>
                  +{overdueItems.length - 3} lainnya
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Stat Cards — 4 kolom */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}
        className="stat-grid">
        <StatCard icon={Banknote} label="Pendapatan Hari Ini" value={formatRupiah(todayStats.revenue)} color="var(--blue)" iconBg="var(--blue-bg)" />
        <StatCard icon={ShoppingCart} label="Transaksi Hari Ini" value={todayStats.count} color="var(--violet)" iconBg="var(--violet-bg)" />
        <StatCard icon={Weight} label="Kg Dicuci Hari Ini" value={`${todayStats.kg.toFixed(1)} kg`} color="var(--cyan)" iconBg="var(--cyan-bg)" />
        <StatCard
          icon={Clock}
          label="Belum Diambil"
          value={pendingPickup.length}
          sub={overdueItems.length > 0 ? `${overdueItems.length} terlambat` : undefined}
          color={overdueItems.length > 0 ? 'var(--amber)' : 'var(--green)'}
          iconBg={overdueItems.length > 0 ? 'var(--amber-bg)' : 'var(--green-bg)'}
        />
      </div>

      {/* Chart Section */}
      <div className="card" style={{ padding: '20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--blue-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp size={16} style={{ color: 'var(--blue)' }} />
            </div>
            <div>
              <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Ringkasan Pendapatan</p>
              <p style={{ fontSize: 11, color: 'var(--text-3)' }}>Total: {formatRupiah(totalRevenue)}</p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="field-input" style={{ width: 130, padding: '5px 8px', fontSize: 12 }} />
              <span style={{ color: 'var(--text-3)', fontSize: 12 }}>-</span>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="field-input" style={{ width: 130, padding: '5px 8px', fontSize: 12 }} />
            </div>

            <div style={{ display: 'flex', gap: 4, padding: 4, borderRadius: 10, background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
              {[['daily', 'Harian'], ['weekly', 'Mingguan'], ['monthly', 'Bulanan']].map(([k, l]) => (
                <button key={k} onClick={() => setPeriod(k)}
                  style={{
                    padding: '5px 14px', borderRadius: 7, border: 'none', cursor: 'pointer',
                    fontSize: 12, fontWeight: 600, transition: 'all 0.15s',
                    background: period === k ? 'var(--blue)' : 'transparent',
                    color: period === k ? '#fff' : 'var(--text-3)',
                    boxShadow: period === k ? '0 1px 4px rgba(37,99,235,0.3)' : 'none',
                  }}
                >{l}</button>
              ))}
            </div>

            <button className="btn btn-secondary" onClick={handleExportCSV} style={{ padding: '5px 12px', fontSize: 12 }}>
              <Download size={14} /> Excel
            </button>
            <button className="btn btn-secondary" onClick={handleExportPDF} style={{ padding: '5px 12px', fontSize: 12 }}>
              <Printer size={14} /> PDF
            </button>
          </div>
        </div>

        {chartData.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData} barSize={24}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="period" tickFormatter={formatLabel}
                  tick={{ fontSize: 11, fill: 'var(--text-3)', fontWeight: 500 }}
                  axisLine={false} tickLine={false} />
                <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                  tick={{ fontSize: 11, fill: 'var(--text-3)' }}
                  axisLine={false} tickLine={false} width={38} />
                <Tooltip
                  formatter={(v) => [formatRupiah(v), 'Pendapatan']}
                  labelFormatter={formatLabel}
                  contentStyle={{
                    background: 'var(--surface)', border: '1px solid var(--border)',
                    borderRadius: 10, fontSize: 12, boxShadow: 'var(--shadow-md)',
                  }}
                  cursor={{ fill: 'var(--blue-bg)' }}
                />
                <Bar dataKey="pendapatan" fill="var(--blue)" radius={[5, 5, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }} className="bottom-grid">
              {/* Pie Chart */}
              <div style={{ background: 'var(--surface-2)', padding: 16, borderRadius: 12, border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <PieChartIcon size={16} style={{ color: 'var(--violet)' }} />
                  <p style={{ fontSize: 13, fontWeight: 600 }}>Layanan Terlaris (Kg)</p>
                </div>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={serviceData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={2} dataKey="value">
                      {serviceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Line Chart */}
              <div style={{ background: 'var(--surface-2)', padding: 16, borderRadius: 12, border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <Activity size={16} style={{ color: 'var(--green)' }} />
                  <p style={{ fontSize: 13, fontWeight: 600 }}>Tren Jumlah Transaksi</p>
                </div>
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                    <XAxis dataKey="period" tickFormatter={formatLabel} tick={{ fontSize: 10, fill: 'var(--text-3)' }} axisLine={false} tickLine={false} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: 'var(--text-3)' }} axisLine={false} tickLine={false} width={24} />
                    <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                    <Line type="monotone" dataKey="transaksi" name="Transaksi" stroke="var(--green)" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ height: 230, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, color: 'var(--text-3)' }}>
            <TrendingUp size={36} style={{ opacity: 0.25 }} />
            <p style={{ fontSize: 13 }}>Belum ada data transaksi pada periode ini</p>
          </div>
        )}
      </div>

      {/* Bottom 2-col */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }} className="bottom-grid">

        {/* Perlu Diambil */}
        <div className="card" style={{ padding: '20px 20px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 4, height: 18, borderRadius: 99, background: 'var(--amber)' }} />
              <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>Perlu Diambil</p>
            </div>
            <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 99, background: 'var(--amber-bg)', color: 'var(--amber)' }}>
              {pendingPickup.length} item
            </span>
          </div>

          {pendingPickup.length === 0 ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, color: 'var(--text-3)', minHeight: 140 }}>
              <span style={{ fontSize: 28 }}>🎉</span>
              <p style={{ fontSize: 13 }}>Semua sudah diambil</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, overflowY: 'auto', maxHeight: 260 }}>
              {pendingPickup.slice(0, 8).map((t) => (
                <div key={t.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
                  padding: '10px 12px', borderRadius: 8,
                  background: 'var(--surface-2)', border: '1px solid var(--border)',
                }}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {t.pelanggan?.nama || '-'}
                    </p>
                    <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>
                      {t.id} · {t.totalBerat} kg · {formatDate(t.estimasiSelesai)}
                    </p>
                  </div>
                  <button
                    onClick={() => { const next = getNextStatus(t.status); if (next !== t.status) handleStatusUpdate(t.id, next); }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                    title="Klik untuk ubah status"
                  >
                    <StatusBadge status={t.status} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Transaksi Terbaru */}
        <div className="card" style={{ padding: '20px 20px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 4, height: 18, borderRadius: 99, background: 'var(--blue)' }} />
              <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>Transaksi Terbaru</p>
            </div>
            <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 99, background: 'var(--blue-bg)', color: 'var(--blue)' }}>
              {transactions.length} total
            </span>
          </div>

          {recentTx.length === 0 ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, color: 'var(--text-3)', minHeight: 140 }}>
              <span style={{ fontSize: 28 }}>📋</span>
              <p style={{ fontSize: 13 }}>Belum ada transaksi</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, overflowY: 'auto', maxHeight: 260 }}>
              {recentTx.map((t) => (
                <div key={t.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
                  padding: '10px 12px', borderRadius: 8,
                  background: 'var(--surface-2)', border: '1px solid var(--border)',
                }}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {t.pelanggan?.nama || '-'}
                    </p>
                    <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>
                      {t.id} · {formatDateTime(t.tanggal)}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>
                      {formatRupiah(t.totalBayar)}
                    </p>
                    <div style={{ marginTop: 3 }}>
                      <button
                        onClick={() => { const next = getNextStatus(t.status); if (next !== t.status) handleStatusUpdate(t.id, next); }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                        title="Klik untuk ubah status"
                      >
                        <StatusBadge status={t.status} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Responsive */}
      <style>{`
        @media (max-width: 900px) { .stat-grid { grid-template-columns: repeat(2, 1fr) !important; } }
        @media (max-width: 600px) { .stat-grid { grid-template-columns: 1fr !important; } .bottom-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </div>
  );
}
