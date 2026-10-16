import React, { useState } from 'react';

const grad = (a, b, rgb) => ({
  base: { background: `linear-gradient(135deg, ${a} 0%, ${b} 100%)`, color: '#FFFFFF', boxShadow: `0 4px 16px rgba(${rgb}, 0.30)` },
  hover: { boxShadow: `0 8px 32px rgba(${rgb}, 0.45)`, transform: 'translateY(-2px)' }
});

const VARIANTS = {
  primary:   grad('#0EA5E9', '#0284C7', '14,165,233'),
  secondary: grad('#6366F1', '#4F46E5', '99,102,241'),
  success:   grad('#22C55E', '#16A34A', '34,197,94'),
  danger:    grad('#EF4444', '#DC2626', '239,68,68'),
  warning:   grad('#F59E0B', '#D97706', '245,158,11'),
  info:      grad('#0EA5E9', '#0369A1', '14,165,233'),
  outline: {
    base: { background: 'transparent', color: '#0EA5E9', border: '2px solid #0EA5E9' },
    hover: { background: '#0EA5E9', color: '#FFFFFF', boxShadow: '0 4px 16px rgba(14,165,233,0.30)', transform: 'translateY(-2px)' }
  },
  ghost: {
    base: { background: 'transparent', color: '#64748B' },
    hover: { background: '#F1F5F9', color: '#0F172A' }
  }
};

const SIZES = {
  sm: { padding: '6px 12px', fontSize: '12px', borderRadius: '6px' },
  md: { padding: '10px 20px', fontSize: '14px', borderRadius: '8px' },
  lg: { padding: '14px 28px', fontSize: '16px', borderRadius: '10px' }
};

export default function Button({
  children, variant = 'primary', size = 'md', fullWidth = false, loading = false, disabled = false,
  icon, iconPosition = 'left', onClick, type = 'button', className = '', style, ...props
}) {
  const [survol, setSurvol] = useState(false);
  const v = VARIANTS[variant] || VARIANTS.primary;
  const inactif = disabled || loading;

  return (
    <button
      {...props}
      type={type}
      onClick={onClick}
      disabled={inactif}
      onMouseEnter={(e) => { setSurvol(true); props.onMouseEnter?.(e); }}
      onMouseLeave={(e) => { setSurvol(false); props.onMouseLeave?.(e); }}   // le style repart de zéro au départ du curseur
      className={`btn btn-${variant} btn-${size} ${fullWidth ? 'w-full' : ''} ${className}`}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
        border: 'none', fontWeight: 600, transition: 'all 0.3s ease',
        width: fullWidth ? '100%' : 'auto',
        cursor: inactif ? 'not-allowed' : 'pointer',
        opacity: inactif ? 0.6 : 1,
        ...SIZES[size] || SIZES.md,
        ...v.base,
        ...(survol && !inactif ? v.hover : {}),
        ...style                        // ← style de la page fusionné
      }}
    >
      {loading ? (
        <>
          <span style={{
            display: 'inline-block', width: '18px', height: '18px',
            border: '2px solid rgba(255,255,255,0.3)',
            borderTop: `2px solid ${variant === 'outline' || variant === 'ghost' ? '#0EA5E9' : '#FFFFFF'}`,
            borderRadius: '50%', animation: 'spin 0.8s linear infinite'
          }} />
          {children}
        </>
      ) : (
        <>
          {icon && iconPosition === 'left' && <span>{icon}</span>}
          {children}
          {icon && iconPosition === 'right' && <span>{icon}</span>}
        </>
      )}
    </button>
  );
}
