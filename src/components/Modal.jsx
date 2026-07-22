import { X } from 'lucide-react';

export default function Modal({ isOpen, onClose, title, maxWidth = '440px', children }) {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px',
      overflowY: 'auto',
    }}>
      {/* Backdrop — softer, not too dark */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.25)',
          backdropFilter: 'blur(2px)',
          animation: 'fadeIn 0.15s ease-out',
        }}
      />

      {/* Dialog — clean white, sharp shadow */}
      <div style={{
        position: 'relative', width: '100%', maxWidth,
        background: '#ffffff',
        border: '1px solid #e5e7eb',
        borderRadius: 14,
        boxShadow: '0 20px 60px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05)',
        overflow: 'hidden',
        animation: 'modalIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        maxHeight: '85vh',
        display: 'flex',
        flexDirection: 'column',
        margin: 'auto',
      }}>
        {/* Header */}
        {title && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '18px 24px',
            borderBottom: '1px solid #f3f4f6',
            background: '#ffffff',
            flexShrink: 0,
          }}>
            <p style={{ fontSize: 15, fontWeight: 700, color: '#111827', letterSpacing: '-0.01em' }}>{title}</p>
            <button
              onClick={onClose}
              style={{
                width: 32, height: 32, borderRadius: 8, border: '1px solid #e5e7eb',
                background: '#ffffff', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#6b7280',
                transition: 'all 0.12s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#f9fafb'; e.currentTarget.style.borderColor = '#d1d5db'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#ffffff'; e.currentTarget.style.borderColor = '#e5e7eb'; }}
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Body — light gray inset for depth */}
        <div style={{
          padding: 24,
          background: '#ffffff',
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
        @keyframes modalIn {
          from { opacity: 0; transform: translateY(16px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}