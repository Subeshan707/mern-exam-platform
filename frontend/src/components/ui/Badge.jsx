const variants = {
  success:  { bg: 'rgba(16,185,129,0.15)', color: '#10b981', border: 'rgba(16,185,129,0.3)' },
  danger:   { bg: 'rgba(244,63,94,0.15)',   color: '#f43f5e', border: 'rgba(244,63,94,0.3)' },
  warning:  { bg: 'rgba(245,158,11,0.15)',  color: '#f59e0b', border: 'rgba(245,158,11,0.3)' },
  info:     { bg: 'rgba(59,130,246,0.15)',   color: '#3b82f6', border: 'rgba(59,130,246,0.3)' },
  purple:   { bg: 'rgba(139,92,246,0.15)',   color: '#8b5cf6', border: 'rgba(139,92,246,0.3)' },
  default:  { bg: 'rgba(0,0,0,0.04)',        color: '#64748b', border: 'rgba(0,0,0,0.08)' },
};

export default function Badge({ children, variant = 'default', dot, size = 'md' }) {
  const v = variants[variant] || variants.default;
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.375rem',
      padding: size === 'sm' ? '0.15rem 0.5rem' : '0.25rem 0.75rem',
      fontSize: size === 'sm' ? '0.6875rem' : '0.75rem',
      fontWeight: 600,
      borderRadius: '9999px',
      background: v.bg,
      color: v.color,
      border: `1px solid ${v.border}`,
      textTransform: 'capitalize',
      letterSpacing: '0.02em',
    }}>
      {dot && <span style={{
        width: 6, height: 6, borderRadius: '50%', background: v.color,
      }} />}
      {children}
    </span>
  );
}
