/* ─────────────────────────────────────────
   UI.jsx  –  shared components
   All styling via CSS variables (index.css)
───────────────────────────────────────── */

// ── StatusBadge ──────────────────────────
export function StatusBadge({ status }) {
  const map = {
    Proses:  { bg: 'var(--amber-bg)',  color: 'var(--amber)',  dot: 'var(--amber)' },
    Selesai: { bg: 'var(--green-bg)',  color: 'var(--green)',  dot: 'var(--green)' },
    Diambil: { bg: 'var(--surface-2)', color: 'var(--text-3)', dot: 'var(--text-3)' },
  };
  const s = map[status] || map.Proses;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 10px', borderRadius: 99,
      fontSize: 11, fontWeight: 600,
      background: s.bg, color: s.color,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.dot, flexShrink: 0 }} />
      {status}
    </span>
  );
}

// ── Card ─────────────────────────────────
export function Card({ children, className = '', style = {}, ...props }) {
  return (
    <div className={`card ${className}`} style={style} {...props}>
      {children}
    </div>
  );
}

// ── StatCard ─────────────────────────────
export function StatCard({ icon: Icon, label, value, sub, color = 'var(--blue)', iconBg = 'var(--blue-bg)' }) {
  return (
    <div className="card" style={{ padding: '18px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ minWidth: 0, flex: 1 }}>
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
        {Icon && (
          <div className="stat-icon" style={{ background: iconBg }}>
            <Icon size={19} style={{ color }} />
          </div>
        )}
      </div>
    </div>
  );
}

// ── Button ───────────────────────────────
export function Button({ children, variant = 'primary', className = '', style = {}, ...props }) {
  const variantClass = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    danger: 'btn-danger',
    success: 'btn-success',
    ghost: 'btn-ghost',
  }[variant] || 'btn-primary';

  return (
    <button className={`btn ${variantClass} ${className}`} style={style} {...props}>
      {children}
    </button>
  );
}

// ── Input ────────────────────────────────
export function Input({ label, className = '', style = {}, ...props }) {
  return (
    <div className={className} style={style}>
      {label && <label className="field-label">{label}</label>}
      <input className="field-input" {...props} />
    </div>
  );
}

// ── Select ───────────────────────────────
export function Select({ label, children, className = '', style = {}, ...props }) {
  return (
    <div className={className} style={style}>
      {label && <label className="field-label">{label}</label>}
      <select
        className="field-input"
        style={{ appearance: 'none', cursor: 'pointer', paddingRight: 32,
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center',
        }}
        {...props}
      >
        {children}
      </select>
    </div>
  );
}

// ── Textarea ─────────────────────────────
export function Textarea({ label, className = '', style = {}, ...props }) {
  return (
    <div className={className} style={style}>
      {label && <label className="field-label">{label}</label>}
      <textarea className="field-input" rows={3} style={{ resize: 'none' }} {...props} />
    </div>
  );
}
