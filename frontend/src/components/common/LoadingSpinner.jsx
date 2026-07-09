
import React from 'react';

export default function LoadingSpinner({ size = 'md', color = 'primary', text, className = '' }) {
  const sizeMap = {
    sm: '20px',
    md: '32px',
    lg: '48px',
    xl: '64px',
  };

  const colorMap = {
    primary: '#0EA5E9',
    secondary: '#6366F1',
    white: '#FFFFFF',
    gray: '#94A3B8',
  };

  const dimension = sizeMap[size] || '32px';
  const borderColor = colorMap[color] || '#0EA5E9';

  return (
    <div style={{ textAlign: 'center', padding: '24px' }} className={className}>
      <div
        style={{
          display: 'inline-block',
          width: dimension,
          height: dimension,
          border: `3px solid #E2E8F0`,
          borderTop: `3px solid ${borderColor}`,
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }}
      />
      {text && <p style={{ marginTop: '16px', color: '#64748B', fontSize: '14px' }}>{text}</p>}
    </div>
  );
}