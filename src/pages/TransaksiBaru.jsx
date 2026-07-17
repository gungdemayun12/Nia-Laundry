import { useState, useMemo, useEffect, useCallback } from 'react';
import { PlusCircle, Trash2, Printer, Search, CheckCircle2, User, Package, FileText } from 'lucide-react';
import Swal from 'sweetalert2';
import { Input, Textarea } from '../components/UI';
import PrintReceipt, { ReceiptPreview } from '../components/PrintReceipt';
import { formatRupiah, generateInvoiceId, getDefaultEstimation, generateId } from '../utils/helpers';

export default function TransaksiBaru({
  transactions, setTransactions,
  customers, setCustomers,
  services, settings,
}) {
  const [pelangganNama, setPelangganNama] = useState('');
  const [pelangganHp,   setPelangganHp]   = useState('');
  const [items,         setItems]         = useState([{ layananId: '', berat: '' }]);
  const [estimasi,      setEstimasi]      = useState(getDefaultEstimation(2));
  const [catatan,       setCatatan]       = useState('');
  const [lastTx,        setLastTx]        = useState(null);
  const [showReceipt,   setShowReceipt]   = useState(false);
  const [suggestions,   setSuggestions]   = useState([]);
  const [showSug,       setShowSug]       = useState(false);

  /* ── autocomplete ── */
  const handleNama = (val) => {
    setPelangganNama(val);
    if (val.length >= 1) {
      const m = customers
        .filter((c) => c.nama.toLowerCase().includes(val.toLowerCase()))
        .slice(0, 6);
      setSuggestions(m);
      setShowSug(m.length > 0);
    } else {
      setShowSug(false);
    }
  };

  const pickSug = (c) => {
    setPelangganNama(c.nama);
    setPelangganHp(c.noHp || '');
    setShowSug(false);
  };

  /* ── items ── */
  const addItem    = () => setItems((p) => [...p, { layananId: '', berat: '' }]);
  const removeItem = (i) => { if (items.length > 1) setItems((p) => p.filter((_, idx) => idx !== i)); };
  const updateItem = (i, field, val) => {
    setItems((p) => { const u = [...p]; u[i] = { ...u[i], [field]: val }; return u; });
  };

  /* ── calculations ── */
  const calc = useMemo(() => {
    let subtotalAll = 0, totalBerat = 0;
    const computedItems = items.map((item) => {
      const svc   = services.find((s) => s.id === item.layananId);
      const berat = parseFloat(item.berat) || 0;
      const harga = svc?.hargaPerKg || 0;
      const sub   = berat * harga;
      subtotalAll += sub;
      totalBerat  += berat;
      return { layanan: svc?.nama || '', hargaPerKg: harga, berat, subtotal: sub };
    });
    return { computedItems, subtotalAll, totalBerat, diskon: 0, totalBayar: subtotalAll };
  }, [items, services]);

  const validCount = items.filter((i) => i.layananId && parseFloat(i.berat) > 0).length;

  /* ── save ── */
  const handleSave = useCallback(() => {
    if (!pelangganNama.trim()) { 
      Swal.fire({ icon: 'warning', title: 'Perhatian', text: 'Nama pelanggan harus diisi' });
      return; 
    }
    const validItems = calc.computedItems.filter((i) => i.layanan && i.berat > 0);
    if (!validItems.length) { 
      Swal.fire({ icon: 'warning', title: 'Perhatian', text: 'Pilih layanan dan masukkan berat terlebih dahulu' });
      return; 
    }

    Swal.fire({
      title: 'Simpan Transaksi?',
      text: "Apakah Anda yakin ingin menyimpan transaksi ini?",
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#2563eb',
      cancelButtonColor: '#ef4444',
      confirmButtonText: 'Iya, Simpan',
      cancelButtonText: 'Batal'
    }).then((result) => {
      if (result.isConfirmed) {
        const tx = {
          id:             generateInvoiceId(transactions),
          tanggal:        new Date().toISOString(),
          pelanggan:      { nama: pelangganNama.trim(), noHp: pelangganHp.trim() },
          items:          validItems,
          diskon:         0,
          totalBerat:     calc.totalBerat,
          totalBayar:     calc.totalBayar,
          status:         'Proses',
          estimasiSelesai: estimasi,
          catatan:        catatan.trim(),
        };

        setTransactions((p) => [...p, tx]);

        setCustomers((p) => {
          const idx = p.findIndex((c) => c.nama.toLowerCase() === pelangganNama.trim().toLowerCase());
          if (idx >= 0) {
            const u = [...p];
            u[idx] = {
              ...u[idx],
              noHp:           pelangganHp.trim() || u[idx].noHp,
              totalTransaksi: u[idx].totalTransaksi + 1,
              totalBelanja:   u[idx].totalBelanja + calc.totalBayar,
            };
            return u;
          }
          return [...p, {
            id:             generateId('cust', p),
            nama:           pelangganNama.trim(),
            noHp:           pelangganHp.trim(),
            totalTransaksi: 1,
            totalBelanja:   calc.totalBayar,
          }];
        });

        setLastTx(tx);
        setShowReceipt(true);

        Swal.fire({
          title: 'Berhasil!',
          html: `Transaksi <strong>${tx.id}</strong> berhasil disimpan.`,
          icon: 'success',
          confirmButtonColor: '#16a34a',
          confirmButtonText: '<span style="display:inline-flex;align-items:center;gap:6px;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 9V3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v6"/><rect x="6" y="14" width="12" height="8" rx="1"/></svg> Cetak Struk</span>',
          allowOutsideClick: false,
          showCancelButton: true,
          cancelButtonText: '<span style="display:inline-flex;align-items:center;gap:6px;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg> Tutup</span>',
          cancelButtonColor: '#64748b'
        }).then((res) => {
          if (res.isConfirmed) {
            setTimeout(() => window.print(), 150);
          }
        });

        // reset form
        setPelangganNama('');
        setPelangganHp('');
        setItems([{ layananId: '', berat: '' }]);
        setEstimasi(getDefaultEstimation(2));
        setCatatan('');
      }
    });
  }, [pelangganNama, pelangganHp, items, calc, estimasi, catatan, transactions, setTransactions, setCustomers]);

  /* ── print ── */
  const handlePrint = () => {
    // small delay to ensure portal is mounted
    setTimeout(() => window.print(), 150);
  };

  /* ── keyboard shortcut ── */
  useEffect(() => {
    const h = (e) => { if (e.ctrlKey && e.key === 'Enter') { e.preventDefault(); handleSave(); } };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [handleSave]);

  /* ─────────────────── RENDER ─────────────────── */
  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Print portal — always mounted when receipt exists */}
      {showReceipt && lastTx && (
        <PrintReceipt transaction={lastTx} settings={settings} />
      )}

      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }} className="tx-grid">

        {/* ═══ LEFT COLUMN ═══ */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* ── 1. Data Pelanggan ── */}
          <div className="card" style={{ overflow: 'visible' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '14px 20px', borderBottom: '1px solid var(--border)',
              background: 'var(--surface-2)', borderRadius: 'var(--r-lg) var(--r-lg) 0 0',
            }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--blue-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <User size={15} style={{ color: 'var(--blue)' }} />
              </div>
              <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>Data Pelanggan</p>
            </div>
            <div style={{ padding: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }} className="two-col">
                {/* nama + autocomplete */}
                <div style={{ position: 'relative' }}>
                  <label className="field-label">Nama Pelanggan *</label>
                  <input
                    className="field-input"
                    value={pelangganNama}
                    onChange={(e) => handleNama(e.target.value)}
                    onBlur={() => setTimeout(() => setShowSug(false), 200)}
                    placeholder="Ketik nama pelanggan..."
                    autoComplete="off"
                  />
                  {/* Dropdown suggestion — z-index tinggi, keluar dari card */}
                  {showSug && suggestions.length > 0 && (
                    <div style={{
                      position: 'absolute', left: 0, right: 0, top: 'calc(100% + 4px)',
                      zIndex: 9999,
                      background: 'var(--surface)',
                      border: '1.5px solid var(--blue-border)',
                      borderRadius: 10,
                      boxShadow: '0 8px 24px rgba(15,23,42,0.15)',
                      overflow: 'hidden',
                    }}>
                      <div style={{
                        padding: '6px 12px',
                        fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
                        color: 'var(--text-3)',
                        borderBottom: '1px solid var(--border)',
                        background: 'var(--surface-2)',
                      }}>
                        Pelanggan ditemukan
                      </div>
                      {suggestions.map((c) => (
                        <button
                          key={c.id}
                          onMouseDown={(e) => { e.preventDefault(); pickSug(c); }}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 10,
                            width: '100%', padding: '10px 12px',
                            background: 'none', border: 'none', cursor: 'pointer',
                            fontSize: 13, color: 'var(--text)', textAlign: 'left',
                            borderBottom: '1px solid var(--border)',
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = 'var(--blue-bg)'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                        >
                          <div style={{
                            width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                            background: 'var(--blue-bg)', color: 'var(--blue)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 12, fontWeight: 800,
                          }}>
                            {c.nama.charAt(0).toUpperCase()}
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.nama}</div>
                            {c.noHp && <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{c.noHp}</div>}
                          </div>
                          <Search size={12} style={{ color: 'var(--text-3)', marginLeft: 'auto', flexShrink: 0 }} />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="field-label">No. HP (Opsional)</label>
                  <input
                    className="field-input"
                    value={pelangganHp}
                    onChange={(e) => setPelangganHp(e.target.value)}
                    placeholder="08xxxxxxxxxx"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ── 2. Layanan ── */}
          <div className="card" style={{ overflow: 'visible' }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '14px 20px', borderBottom: '1px solid var(--border)',
              background: 'var(--surface-2)', borderRadius: 'var(--r-lg) var(--r-lg) 0 0',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Package size={15} style={{ color: 'var(--violet)' }} />
                </div>
                <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>Layanan</p>
              </div>
              <button
                onClick={addItem}
                className="btn btn-secondary"
                style={{ padding: '6px 12px', fontSize: 12, gap: 5 }}
              >
                <PlusCircle size={13} /> Tambah Baris
              </button>
            </div>

            <div style={{ padding: '16px 20px' }}>
              {/* Table header */}
              <div style={{
                display: 'grid', gridTemplateColumns: '1fr 120px 150px 40px',
                gap: 10, padding: '0 4px 10px',
                borderBottom: '1px solid var(--border)', marginBottom: 10,
              }} className="item-row">
                {['Jenis Layanan', 'Berat (kg)', 'Subtotal', ''].map((h, i) => (
                  <span key={i} style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-3)' }}>{h}</span>
                ))}
              </div>

              {/* Item rows */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {items.map((item, index) => {
                  const svc  = services.find((s) => s.id === item.layananId);
                  const berat = parseFloat(item.berat) || 0;
                  const sub   = berat * (svc?.hargaPerKg || 0);
                  return (
                    <div key={index} style={{
                      display: 'grid', gridTemplateColumns: '1fr 120px 150px 40px',
                      gap: 10, alignItems: 'center',
                      padding: '10px 12px', borderRadius: 10,
                      background: 'var(--surface-2)', border: '1px solid var(--border)',
                    }} className="item-row">
                      <select
                        value={item.layananId}
                        onChange={(e) => updateItem(index, 'layananId', e.target.value)}
                        className="field-input"
                        style={{ padding: '7px 10px', fontSize: 12, background: 'var(--surface)' }}
                      >
                        <option value="">-- Pilih Layanan --</option>
                        {services.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.nama} — {formatRupiah(s.hargaPerKg)}/kg
                          </option>
                        ))}
                      </select>

                      <input
                        type="number" step="0.1" min="0"
                        value={item.berat}
                        onChange={(e) => updateItem(index, 'berat', e.target.value)}
                        placeholder="0"
                        className="field-input"
                        style={{ padding: '7px 10px', fontSize: 12, background: 'var(--surface)' }}
                      />

                      <div style={{
                        padding: '8px 12px', borderRadius: 8, textAlign: 'right',
                        fontWeight: 700, fontSize: 13,
                        color: sub > 0 ? 'var(--blue)' : 'var(--text-3)',
                        background: sub > 0 ? 'var(--blue-bg)' : 'var(--surface)',
                        border: '1px solid var(--border)',
                      }}>
                        {formatRupiah(sub)}
                      </div>

                      <button
                        onClick={() => removeItem(index)}
                        disabled={items.length === 1}
                        style={{
                          width: 32, height: 32, borderRadius: 8, border: 'none',
                          background: 'transparent', cursor: items.length === 1 ? 'not-allowed' : 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: 'var(--red)', opacity: items.length === 1 ? 0.25 : 1,
                        }}
                        onMouseEnter={(e) => { if (items.length > 1) e.currentTarget.style.background = 'var(--red-bg)'; }}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ── 3. Detail Tambahan ── */}
          <div className="card">
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '14px 20px', borderBottom: '1px solid var(--border)',
              background: 'var(--surface-2)', borderRadius: 'var(--r-lg) var(--r-lg) 0 0',
            }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--green-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FileText size={15} style={{ color: 'var(--green)' }} />
              </div>
              <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>Detail Tambahan</p>
            </div>
            <div style={{ padding: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }} className="two-col">
                <Input
                  label="Estimasi Selesai"
                  type="date"
                  value={estimasi}
                  onChange={(e) => setEstimasi(e.target.value)}
                />
                <Textarea
                  label="Catatan (Opsional)"
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                  placeholder="Contoh: luntur, banyak noda..."
                />
              </div>
            </div>
          </div>
        </div>

        {/* ═══ RIGHT COLUMN — Summary ═══ */}
        <div style={{ width: 280, flexShrink: 0 }}>
          <div style={{ position: 'sticky', top: 16 }}>
            <div className="card" style={{ overflow: 'hidden' }}>
              {/* Header */}
              <div style={{
                padding: '14px 18px',
                background: 'linear-gradient(135deg, var(--blue) 0%, var(--blue-2) 100%)',
              }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>Ringkasan Pesanan</p>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', marginTop: 2 }}>
                  {validCount} layanan · {calc.totalBerat.toFixed(1)} kg
                </p>
              </div>

              <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {/* Item breakdown */}
                {items.map((item, i) => {
                  const svc   = services.find((s) => s.id === item.layananId);
                  const berat = parseFloat(item.berat) || 0;
                  if (!svc || berat === 0) return null;
                  const sub = berat * svc.hargaPerKg;
                  return (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {svc.nama}
                        </p>
                        <p style={{ fontSize: 11, color: 'var(--text-3)' }}>
                          {berat} kg × {formatRupiah(svc.hargaPerKg)}
                        </p>
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', flexShrink: 0 }}>
                        {formatRupiah(sub)}
                      </span>
                    </div>
                  );
                })}

                {validCount > 0 && <div style={{ borderTop: '1px dashed var(--border)' }} />}

                {/* Subtotals */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 12, color: 'var(--text-2)' }}>Subtotal</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{formatRupiah(calc.subtotalAll)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 12, color: 'var(--text-2)' }}>Total Berat</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{calc.totalBerat.toFixed(1)} kg</span>
                  </div>
                </div>

                {/* Total box */}
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '12px 14px', borderRadius: 10,
                  background: 'var(--blue-bg)', border: '1px solid var(--blue-border)',
                }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--blue)' }}>TOTAL</span>
                  <span style={{ fontSize: 20, fontWeight: 900, color: 'var(--blue)', letterSpacing: '-0.02em' }}>
                    {formatRupiah(calc.totalBayar)}
                  </span>
                </div>

                {/* Save button */}
                <button
                  onClick={handleSave}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    width: '100%', padding: 12, borderRadius: 10, border: 'none',
                    background: 'var(--blue)', color: '#fff',
                    fontSize: 13, fontWeight: 700, cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(37,99,235,0.3)',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--blue-2)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'var(--blue)'}
                >
                  <CheckCircle2 size={16} />
                  Simpan &amp; Cetak Struk
                </button>
                <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-3)' }}>
                  Ctrl+Enter untuk simpan cepat
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>



      <style>{`
        .tx-grid > div:first-child { flex: 1; min-width: 0; }
        .item-row { grid-template-columns: 1fr 120px 150px 40px; }
        @media (max-width: 860px) {
          .tx-grid { flex-direction: column !important; }
          .tx-grid > div:last-child { width: 100% !important; }
        }
        @media (max-width: 600px) {
          .two-col  { grid-template-columns: 1fr !important; }
          .item-row { grid-template-columns: 1fr 80px 110px 36px !important; }
        }
      `}</style>
    </div>
  );
}
