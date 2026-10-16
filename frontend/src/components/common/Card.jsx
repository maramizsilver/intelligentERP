import React, { useState } from 'react';

const VARIANTS = {
  primary:   { borderTop: '4px solid #0EA5E9' },
  secondary: { borderTop: '4px solid #6366F1' },
  success:   { borderTop: '4px solid #22C55E' },
  danger:    { borderTop: '4px solid #EF4444' },
  warning:   { borderTop: '4px solid #F59E0B' },
  info:      { borderTop: '4px solid #0EA5E9' },
  default:   {}
};

export default function Card({
  children, title, subtitle, actions, variant = 'default',
  hover = false, padding = '24px', className = '', style, ...props
}) {
  const [survol, setSurvol] = useState(false);

  return (
    <div
      {...props}
      onMouseEnter={(e) => { if (hover) setSurvol(true); props.onMouseEnter?.(e); }}
      onMouseLeave={(e) => { if (hover) setSurvol(false); props.onMouseLeave?.(e); }}
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '12px',
        border: '1px solid #E2E8F0',
        boxShadow: survol
          ? '0 4px 12px rgba(0,0,0,0.06), 0 8px 32px rgba(0,0,0,0.06)'
          : '0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04)',
        transform: survol ? 'translateY(-4px)' : 'none',
        overflow: 'hidden',
        transition: 'all 0.3s ease',
        ...(VARIANTS[variant] || VARIANTS.default),
        ...style                       // ← le style passé en prop est FUSIONNÉ, plus écrasé
      }}
      className={`card ${variant !== 'default' ? `card-${variant}` : ''} ${className}`}
    >
      {(title || subtitle || actions) && (
        <div style={{
          padding: '16px 24px', borderBottom: '1px solid #E2E8F0', backgroundColor: '#F8FAFC',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px'
        }}>
          <div>
            {title && <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#0F172A' }}>{title}</h3>}
            {subtitle && <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748B' }}>{subtitle}</p>}
          </div>
          {actions && <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>{actions}</div>}
        </div>
      )}
      <div style={{ padding }}>{children}</div>
    </div>
  );
}