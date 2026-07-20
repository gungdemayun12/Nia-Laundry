import { X } from 'lucide-react';

export default function Modal({ isOpen, onClose, title, maxWidth = '440px', children }) {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px',
    }}>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'absolute', inset: 0,
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(6px)',
          animation: 'fadeIn 0.15s ease-out',
        }}
      />

      {/* Dialog */}
      <div style={{
        position: 'relative', width: '100%', maxWidth,
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        boxShadow: 'var(--shadow-lg)',
        overflow: 'hidden',
        animation: 'slideUp 0.2s ease-out',
        maxHeight: '85vh',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Header */}
        {title && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: '1px solid var(--border)',
            background: 'var(--surface-2)',
            flexShrink: 0,
          }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{title}</p>
            <button
              onClick={onClose}
              style={{
                width: 30, height: 30, borderRadius: 8, border: '1.5px solid var(--border)',
                background: 'var(--surface)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--text-3)',
                transition: 'all 0.12s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-2)'; e.currentTarget.style.borderColor = 'var(--border-2)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--surface)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Body */}
        <div style={{
          padding: '20px',
          overflowY: 'auto',
          flex: 1,
        }}>
          {children}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(12px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}