// frontend/src/components/common/Input.jsx
import React from 'react';
import { colors, borderRadius } from '../../styles/theme';

export default function Input({ label, error, touched, icon, className, ...props }) {
  const hasError = error && touched;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '100%' }}>
      {label && (
        <label style={{ fontSize: '13px', fontWeight: 500, color: '#1A1A2E' }}>{label}</label>
      )}
      <div style={{ position: 'relative' }}>
        {icon && (
          <span
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#64748B',
              fontSize: '16px',
            }}
          >
            {icon}
          </span>
        )}
        <input
          style={{
            width: '100%',
            padding: icon ? '10px 14px 10px 40px' : '10px 14px',
            borderRadius: borderRadius.md,
            border: hasError ? `2px solid ${colors.danger}` : '2px solid #E2E8F0',
            fontSize: '14px',
            transition: 'all 0.2s ease',
            backgroundColor: '#FFFFFF',
            boxSizing: 'border-box',
            outline: 'none',
          }}
          onFocus={(e) => {
            e.target.style.borderColor = hasError ? colors.danger : '#0EA5E9';
            e.target.style.boxShadow = hasError
              ? '0 0 0 3px rgba(239, 68, 68, 0.1)'
              : '0 0 0 3px rgba(14, 165, 233, 0.1)';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = hasError ? colors.danger : '#E2E8F0';
            e.target.style.boxShadow = 'none';
          }}
          {...props}
        />
      </div>
      {hasError && <p style={{ margin: 0, fontSize: '12px', color: colors.danger }}>{error}</p>}
    </div>
  );
}