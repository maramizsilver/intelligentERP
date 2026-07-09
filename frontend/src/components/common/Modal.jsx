// frontend/src/components/common/Modal.jsx
import React from 'react';
import { colors, borderRadius, shadows } from '../../styles/theme';
import Button from './Button';

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  actions,
  size = 'md',
  closeOnOutsideClick = true,
}) {
  if (!isOpen) return null;

  const getSizeStyles = () => {
    const sizes = {
      sm: { maxWidth: '400px' },
      md: { maxWidth: '560px' },
      lg: { maxWidth: '720px' },
      xl: { maxWidth: '960px' },
    };
    return sizes[size] || sizes.md;
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999,
        padding: '20px',
      }}
      onClick={closeOnOutsideClick ? onClose : undefined}
    >
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: borderRadius.lg,
          boxShadow: shadows.xl,
          width: '100%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          ...getSizeStyles(),
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '16px 24px',
            borderBottom: '1px solid #E2E8F0',
            flexShrink: 0,
          }}
        >
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#1A1A2E' }}>{title}</h3>
          <button
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: '20px',
              cursor: 'pointer',
              color: '#64748B',
              padding: '4px 8px',
              borderRadius: borderRadius.sm,
            }}
            onClick={onClose}
            onMouseEnter={(e) => (e.target.style.backgroundColor = '#F1F5F9')}
            onMouseLeave={(e) => (e.target.style.backgroundColor = 'transparent')}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div
          style={{
            padding: '24px',
            overflow: 'auto',
            flex: 1,
          }}
        >
          {children}
        </div>

        {/* Footer */}
        {actions && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '8px',
              padding: '16px 24px',
              borderTop: '1px solid #E2E8F0',
              flexShrink: 0,
              flexWrap: 'wrap',
            }}
          >
            {actions.map((action, idx) => (
              <Button
                key={idx}
                variant={action.variant || 'primary'}
                onClick={action.onClick}
                loading={action.loading}
                disabled={action.disabled}
                size="sm"
              >
                {action.label}
              </Button>
            ))}
            <Button variant="secondary" onClick={onClose} size="sm">
              Annuler
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}