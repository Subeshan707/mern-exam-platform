import { Inbox } from 'lucide-react';

export default function EmptyState({ icon: Icon = Inbox, title = 'No data found', message, action }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '4rem 2rem', textAlign: 'center',
    }}>
      <div style={{
        background: 'var(--bg-glass)', borderRadius: 'var(--radius-xl)',
        padding: '1.5rem', marginBottom: '1.5rem',
        border: '1px solid var(--border-color)',
      }}>
        <Icon size={48} style={{ color: 'var(--text-muted)' }} />
      </div>
      <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.5rem' }}>{title}</h3>
      {message && <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', maxWidth: 320 }}>{message}</p>}
      {action && <div style={{ marginTop: '1.5rem' }}>{action}</div>}
    </div>
  );
}
