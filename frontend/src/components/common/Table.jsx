// frontend/src/components/common/Table.jsx
import React, { useState } from 'react';
import { colors, borderRadius, shadows } from '../../styles/theme';

export default function Table({
  columns,
  data,
  loading,
  emptyMessage = 'Aucune donnée',
  onRowClick,
  actions,
  striped = true,
  hover = true,
}) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (loading) {
    return (
      <div
        style={{
          padding: '40px',
          textAlign: 'center',
          color: '#64748B',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
        }}
      >
        <span style={{ animation: 'spin 1s linear infinite' }}>⏳</span>
        Chargement...
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div
        style={{
          padding: '40px',
          textAlign: 'center',
          color: '#94A3B8',
          backgroundColor: '#FFFFFF',
          borderRadius: borderRadius.lg,
          border: '1px solid #E2E8F0',
        }}
      >
        {emptyMessage}
      </div>
    );
  }

  // Version mobile : affichage en cartes
  if (isMobile) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {data.map((row, idx) => (
          <div
            key={idx}
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: borderRadius.lg,
              padding: '16px',
              border: '1px solid #E2E8F0',
              boxShadow: shadows.sm,
              cursor: onRowClick ? 'pointer' : 'default',
            }}
            onClick={() => onRowClick && onRowClick(row)}
          >
            {columns.map((col, colIdx) => (
              <div
                key={colIdx}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '6px 0',
                  borderBottom: colIdx < columns.length - 1 ? '1px solid #F1F5F9' : 'none',
                }}
              >
                <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 500 }}>{col.label}</span>
                <span style={{ fontSize: '13px', color: '#1A1A2E' }}>
                  {col.render ? col.render(row) : row[col.key] || '—'}
                </span>
              </div>
            ))}
            {actions && (
              <div
                style={{
                  display: 'flex',
                  gap: '8px',
                  marginTop: '12px',
                  paddingTop: '12px',
                  borderTop: '1px solid #E2E8F0',
                  flexWrap: 'wrap',
                }}
              >
                {actions.map((action, idx) => (
                  <button
                    key={idx}
                    style={{
                      padding: '6px 12px',
                      border: 'none',
                      borderRadius: borderRadius.sm,
                      fontSize: '12px',
                      cursor: 'pointer',
                      fontWeight: 500,
                      transition: 'all 0.2s ease',
                      backgroundColor:
                        action.variant === 'danger'
                          ? '#FEE2E2'
                          : action.variant === 'success'
                          ? '#D1FAE5'
                          : '#F0F9FF',
                      color:
                        action.variant === 'danger'
                          ? '#991B1B'
                          : action.variant === 'success'
                          ? '#065F46'
                          : '#0EA5E9',
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      action.onClick(row);
                    }}
                  >
                    {action.icon} {action.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }

  // Version desktop : tableau
  return (
    <div
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: borderRadius.lg,
        boxShadow: shadows.sm,
        overflow: 'auto',
        border: '1px solid #E2E8F0',
      }}
    >
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
        <thead>
          <tr>
            {columns.map((col, idx) => (
              <th
                key={idx}
                style={{
                  padding: '12px 16px',
                  textAlign: 'left',
                  fontWeight: 600,
                  color: '#1A1A2E',
                  backgroundColor: '#F8FAFC',
                  borderBottom: '2px solid #E2E8F0',
                  whiteSpace: 'nowrap',
                  fontSize: '12px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  ...(col.width ? { width: col.width } : {}),
                }}
              >
                {col.label}
              </th>
            ))}
            {actions && (
              <th
                style={{
                  padding: '12px 16px',
                  textAlign: 'left',
                  fontWeight: 600,
                  color: '#1A1A2E',
                  backgroundColor: '#F8FAFC',
                  borderBottom: '2px solid #E2E8F0',
                  whiteSpace: 'nowrap',
                  fontSize: '12px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr
              key={idx}
              style={{
                transition: 'background-color 0.15s ease',
                backgroundColor: striped && idx % 2 === 0 ? '#FAFBFC' : '#FFFFFF',
                cursor: onRowClick ? 'pointer' : 'default',
              }}
              onClick={() => onRowClick && onRowClick(row)}
              onMouseEnter={(e) => {
                if (hover) e.currentTarget.style.backgroundColor = '#F0F9FF';
              }}
              onMouseLeave={(e) => {
                if (hover)
                  e.currentTarget.style.backgroundColor = striped && idx % 2 === 0 ? '#FAFBFC' : '#FFFFFF';
              }}
            >
              {columns.map((col, colIdx) => (
                <td
                  key={colIdx}
                  style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid #E2E8F0',
                    color: '#1A1A2E',
                  }}
                >
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
              {actions && (
                <td
                  style={{
                    padding: '8px 16px',
                    borderBottom: '1px solid #E2E8F0',
                    display: 'flex',
                    gap: '4px',
                    flexWrap: 'wrap',
                  }}
                >
                  {actions.map((action, idx) => (
                    <button
                      key={idx}
                      style={{
                        padding: '4px 10px',
                        border: 'none',
                        borderRadius: borderRadius.sm,
                        fontSize: '12px',
                        cursor: 'pointer',
                        fontWeight: 500,
                        transition: 'all 0.2s ease',
                        backgroundColor:
                          action.variant === 'danger'
                            ? '#FEE2E2'
                            : action.variant === 'success'
                            ? '#D1FAE5'
                            : '#F1F5F9',
                        color:
                          action.variant === 'danger'
                            ? '#991B1B'
                            : action.variant === 'success'
                            ? '#065F46'
                            : '#1A1A2E',
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        action.onClick(row);
                      }}
                      disabled={action.disabled?.(row)}
                    >
                      {action.icon} {action.label}
                    </button>
                  ))}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}