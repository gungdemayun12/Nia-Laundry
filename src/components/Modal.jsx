import { X } from 'lucide-react';

export default function Modal({ isOpen, onClose, title, children, maxWidth = '480px' }) {
  if (!isOpen) return null;
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
    }}>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: 'absolute', inset: 0, background: 'transparent', backdropFilter: 'blur(4px)' }}
      />

      {/* Dialog */}
      <div style={{
        position: 'relative', width: '100%', maxWidth,
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 16, boxShadow: 'var(--shadow-lg)',
        overflow: 'hidden',
        animation: 'fadeUp 0.18s ease-out both',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: '1px solid var(--border)',
          background: 'var(--surface-2)',
        }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{title}</p>
          <button
            onClick={onClose}
            style={{
              width: 28, height: 28, borderRadius: 7, border: 'none',
              background: 'transparent', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--text-3)',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--border)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px', maxHeight: '70vh', overflowY: 'auto' }}>
          {children}
        </div>
      </div>
    </div>
  );
}

export function ConfirmModal({ isOpen, onClose, onConfirm, title, message }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="400px">
      <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6, marginBottom: 20 }}>
        {message}
      </p>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <button className="btn btn-secondary" onClick={onClose} style={{ padding: '8px 18px' }}>
          Batal
        </button>
        <button
          className="btn btn-danger"
          onClick={() => { onConfirm(); onClose(); }}
          style={{ padding: '8px 18px' }}
        >
          Hapus
        </button>
      </div>
    </Modal>
  );
}
