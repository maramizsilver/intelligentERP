// src/components/common/EmptyState.jsx
import React from 'react';

export default function EmptyState({
  icon = '📭',
  title = 'Aucune donnée',
  description = 'Commencez par ajouter votre première entrée.',
  action,
  className = '',
}) {
  return (
    <div
      style={{
        textAlign: 'center',
        padding: '48px',
        backgroundColor: '#FFFFFF',
        borderRadius: '12px',
        border: '2px dashed #E2E8F0',
      }}
      className={className}
    >
      <div style={{ fontSize: '48px', marginBottom: '16px' }}>{icon}</div>
      <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#0F172A' }}>{title}</h3>
      <p style={{ fontSize: '14px', color: '#64748B', marginTop: '8px' }}>{description}</p>
      {action && <div style={{ marginTop: '24px' }}>{action}</div>}
    </div>
  );
}