import Button from './Button';
import Modal from './Modal';
import { AlertTriangle } from 'lucide-react';

export default function ConfirmDialog({ isOpen, onClose, onConfirm, title = 'Confirm Action', message, loading, variant = 'danger' }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm" footer={
      <>
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button variant={variant} onClick={onConfirm} loading={loading}>Confirm</Button>
      </>
    }>
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
        <div style={{
          background: 'rgba(244,63,94,0.15)', borderRadius: 'var(--radius-md)',
          padding: '0.625rem', flexShrink: 0,
        }}>
          <AlertTriangle size={20} style={{ color: 'var(--accent-rose)' }} />
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', lineHeight: 1.6 }}>
          {message || 'Are you sure you want to proceed? This action cannot be undone.'}
        </p>
      </div>
    </Modal>
  );
}
