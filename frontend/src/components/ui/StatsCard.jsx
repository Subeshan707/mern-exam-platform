import { TrendingUp, TrendingDown } from 'lucide-react';

export default function StatsCard({ title, value, subtitle, icon: Icon, trend, trendValue, color = 'blue' }) {
  const colors = {
    blue:    { gradient: 'linear-gradient(135deg, #3b82f6, #6366f1)', glow: 'rgba(59,130,246,0.1)' },
    emerald: { gradient: 'linear-gradient(135deg, #10b981, #059669)', glow: 'rgba(16,185,129,0.1)' },
    amber:   { gradient: 'linear-gradient(135deg, #f59e0b, #d97706)', glow: 'rgba(245,158,11,0.1)' },
    rose:    { gradient: 'linear-gradient(135deg, #f43f5e, #e11d48)', glow: 'rgba(244,63,94,0.1)' },
    purple:  { gradient: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', glow: 'rgba(139,92,246,0.1)' },
    cyan:    { gradient: 'linear-gradient(135deg, #06b6d4, #0891b2)', glow: 'rgba(6,182,212,0.1)' },
  };

  const c = colors[color] || colors.blue;

  return (
    <div className="glass-card" style={{ position: 'relative', overflow: 'hidden' }}>
      {/* Glow effect */}
      <div style={{
        position: 'absolute', top: -20, right: -20,
        width: 100, height: 100, borderRadius: '50%',
        background: c.glow, filter: 'blur(30px)',
      }} />

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', position: 'relative' }}>
        <div>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: 500, marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {title}
          </p>
          <p style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
            {value}
          </p>
          {subtitle && (
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
              {subtitle}
            </p>
          )}
          {trend && (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
              marginTop: '0.5rem', fontSize: '0.75rem', fontWeight: 600,
              color: trend === 'up' ? '#10b981' : '#f43f5e',
            }}>
              {trend === 'up' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              <span>{trendValue}</span>
            </div>
          )}
        </div>

        {Icon && (
          <div style={{
            background: c.gradient,
            padding: '0.75rem', borderRadius: 'var(--radius-md)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 4px 12px ${c.glow}`,
          }}>
            <Icon size={22} color="white" />
          </div>
        )}
      </div>
    </div>
  );
}
