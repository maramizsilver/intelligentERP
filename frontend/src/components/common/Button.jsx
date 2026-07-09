// src/components/common/Button.jsx
import React from 'react';

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  disabled = false,
  icon,
  iconPosition = 'left',
  onClick,
  type = 'button',
  className = '',
  ...props
}) {
  const getVariantStyles = () => {
    const variants = {
      primary: {
        background: 'linear-gradient(135deg, #0EA5E9 0%, #0284C7 100%)',
        color: '#FFFFFF',
        boxShadow: '0 4px 16px rgba(14, 165, 233, 0.30)',
        ':hover': {
          boxShadow: '0 8px 32px rgba(14, 165, 233, 0.45)',
          transform: 'translateY(-2px)',
        },
      },
      secondary: {
        background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
        color: '#FFFFFF',
        boxShadow: '0 4px 16px rgba(99, 102, 241, 0.30)',
        ':hover': {
          boxShadow: '0 8px 32px rgba(99, 102, 241, 0.45)',
          transform: 'translateY(-2px)',
        },
      },
      success: {
        background: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)',
        color: '#FFFFFF',
        boxShadow: '0 4px 16px rgba(34, 197, 94, 0.30)',
        ':hover': {
          boxShadow: '0 8px 32px rgba(34, 197, 94, 0.45)',
          transform: 'translateY(-2px)',
        },
      },
      danger: {
        background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
        color: '#FFFFFF',
        boxShadow: '0 4px 16px rgba(239, 68, 68, 0.30)',
        ':hover': {
          boxShadow: '0 8px 32px rgba(239, 68, 68, 0.45)',
          transform: 'translateY(-2px)',
        },
      },
      outline: {
        background: 'transparent',
        color: '#0EA5E9',
        border: '2px solid #0EA5E9',
        ':hover': {
          background: '#0EA5E9',
          color: '#FFFFFF',
          boxShadow: '0 4px 16px rgba(14, 165, 233, 0.30)',
          transform: 'translateY(-2px)',
        },
      },
      ghost: {
        background: 'transparent',
        color: '#64748B',
        ':hover': {
          background: '#F1F5F9',
          color: '#0F172A',
        },
      },
    };
    return variants[variant] || variants.primary;
  };

  const getSizeStyles = () => {
    const sizes = {
      sm: { padding: '6px 12px', fontSize: '12px', borderRadius: '6px' },
      md: { padding: '10px 20px', fontSize: '14px', borderRadius: '8px' },
      lg: { padding: '14px 28px', fontSize: '16px', borderRadius: '10px' },
    };
    return sizes[size] || sizes.md;
  };

  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        border: 'none',
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        fontWeight: 600,
        transition: 'all 0.3s ease',
        width: fullWidth ? '100%' : 'auto',
        opacity: disabled || loading ? 0.6 : 1,
        ...variantStyles,
        ...sizeStyles,
      }}
      className={`btn btn-${variant} btn-${size} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
      onMouseEnter={(e) => {
        if (!disabled && !loading && variantStyles[':hover']) {
          const hoverStyles = variantStyles[':hover'];
          Object.keys(hoverStyles).forEach((key) => {
            e.target.style[key] = hoverStyles[key];
          });
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled && !loading) {
          Object.keys(variantStyles).forEach((key) => {
            if (key !== ':hover') {
              e.target.style[key] = variantStyles[key];
            }
          });
        }
      }}
    >
      {loading ? (
        <>
          <span style={{
            display: 'inline-block',
            width: '18px',
            height: '18px',
            border: '2px solid rgba(255,255,255,0.3)',
            borderTop: `2px solid ${variant === 'outline' || variant === 'ghost' ? '#0EA5E9' : '#FFFFFF'}`,
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
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

// Injection des keyframes
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;
document.head.appendChild(styleSheet);