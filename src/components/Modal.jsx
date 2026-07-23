import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

export default function Modal({ isOpen, onClose, title, maxWidth = '440px', children }) {
  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const modalContent = (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 99999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px',
    }}>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 99999,
          background: 'rgba(0,0,0,0.35)',
          backdropFilter: 'blur(4px)',
          animation: 'modalFadeIn 0.15s ease-out',
        }}
      />

      {/* Dialog */}
      <div style={{
        position: 'relative', width: '100%', maxWidth,
        zIndex: 100000,
        background: '#ffffff',
        border: '1px solid #e5e7eb',
        borderRadius: 14,
        boxShadow: '0 20px 60px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.05)',
        animation: 'modalSlideIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Header */}
        {title && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '18px 24px',
            borderBottom: '1px solid #f3f4f6',
            background: '#ffffff',
            flexShrink: 0,
            borderRadius: '14px 14px 0 0',
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

        {/* Body — scrollable */}
        <div style={{
          padding: 24,
          background: '#ffffff',
          overflowY: 'auto',
          flex: 1,
          borderRadius: title ? '0 0 14px 14px' : 14,
        }}>
          {children}
        </div>
      </div>

      <style>{`
        @keyframes modalFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes modalSlideIn {
          from { opacity: 0; transform: translateY(16px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );

  // Render via portal to #modal-root (or fallback to body)
  const portalTarget = document.getElementById('modal-root') || document.body;
  return createPortal(modalContent, portalTarget);
}