// src/components/common/Badge.jsx
import React from 'react';

export default function Badge({
  children,
  variant = 'primary',
  dot = false,
  dotColor,
  className = '',
  ...props
}) {
  const getVariantStyles = () => {
    const variants = {
      primary: { backgroundColor: '#F0F9FF', color: '#0EA5E9' },
      secondary: { backgroundColor: '#EEF2FF', color: '#6366F1' },
      success: { backgroundColor: '#F0FDF4', color: '#22C55E' },
      danger: { backgroundColor: '#FEF2F2', color: '#EF4444' },
      warning: { backgroundColor: '#FFFBEB', color: '#F59E0B' },
      outline: { backgroundColor: 'transparent', color: '#64748B', border: '1px solid #E2E8F0' },
    };
    return variants[variant] || variants.primary;
  };

  const dotColors = {
    primary: '#0EA5E9',
    secondary: '#6366F1',
    success: '#22C55E',
    danger: '#EF4444',
    warning: '#F59E0B',
  };

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '4px 12px',
        borderRadius: '9999px',
        fontSize: '11px',
        fontWeight: 600,
        letterSpacing: '0.02em',
        ...getVariantStyles(),
      }}
      className={`badge badge-${variant} ${className}`}
      {...props}
    >
      {dot && (
        <span
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: dotColor || dotColors[variant] || '#0EA5E9',
            display: 'inline-block',
          }}
        />
      )}
      {children}
    </span>
  );
}