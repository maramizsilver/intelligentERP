import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import SearchBar from './SearchBar';

export default function Table({
  columns,
  data,
  loading,
  emptyMessage,
  onRowClick,
  actions,
  striped = true,
  hover = true,
  filters = [],
  onFilterChange,
  pagination,
  onPageChange,
  searchable = false,
  onSearch,
  className = '',
}) {
  const { t } = useLanguage();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [sortField, setSortField] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSort = (key) => {
    if (sortField === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(key);
      setSortDirection('asc');
    }
  };

  const getSortedData = () => {
    if (!data || data.length === 0 || !sortField) return data;

    return [...data].sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      if (valA === null || valA === undefined) valA = '';
      if (valB === null || valB === undefined) valB = '';

      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortDirection === 'asc' ? valA - valB : valB - valA;
      }

      if (sortField.includes('date') || sortField.includes('Date') || sortField.includes('created_at') || sortField.includes('updated_at')) {
        const dateA = new Date(valA);
        const dateB = new Date(valB);
        if (!isNaN(dateA) && !isNaN(dateB)) {
          return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
        }
      }

      const strA = String(valA).toLowerCase();
      const strB = String(valB).toLowerCase();
      return sortDirection === 'asc' 
        ? strA.localeCompare(strB) 
        : strB.localeCompare(strA);
    });
  };

  const sortedData = getSortedData();

  const renderSearchBar = () => {
    if (!searchable) return null;
    return (
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #E2E8F0' }}>
        <SearchBar onSearch={onSearch} />
      </div>
    );
  };

  const renderFilters = () => {
    if (!filters || filters.length === 0) return null;

    return (
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '12px',
          padding: '12px 16px',
          backgroundColor: '#F8FAFC',
          borderBottom: '1px solid #E2E8F0',
        }}
      >
        {filters.map((filter, index) => (
          <div
            key={index}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
            }}
          >
            <label
              style={{
                fontSize: '11px',
                fontWeight: 600,
                color: '#64748B',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              {filter.label}
            </label>
            {filter.type === 'select' ? (
              <select
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  border: '1px solid #E2E8F0',
                  fontSize: '13px',
                  backgroundColor: '#FFFFFF',
                  outline: 'none',
                  transition: 'all 0.2s ease',
                }}
                value={filter.value}
                onChange={(e) => onFilterChange(filter.key, e.target.value)}
              >
                <option value="">{t('tous') || 'Tous'}</option>
                {filter.options.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            ) : (
              <input
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  border: '1px solid #E2E8F0',
                  fontSize: '13px',
                  backgroundColor: '#FFFFFF',
                  outline: 'none',
                  transition: 'all 0.2s ease',
                  width: '160px',
                }}
                type={filter.type || 'text'}
                value={filter.value}
                onChange={(e) => onFilterChange(filter.key, e.target.value)}
                placeholder={`${t('filtrer_par') || 'Filtrer par'} ${filter.label}`}
              />
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderPagination = () => {
    if (!pagination || !onPageChange) return null;

    const { page, pageSize, total } = pagination;
    const totalPages = Math.ceil(total / pageSize);

    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '16px',
          padding: '12px 16px',
          borderTop: '1px solid #E2E8F0',
        }}
      >
        <button
          style={{
            padding: '6px 14px',
            border: '1px solid #E2E8F0',
            borderRadius: '8px',
            backgroundColor: page === 1 ? '#F1F5F9' : '#FFFFFF',
            cursor: page === 1 ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            transition: 'all 0.2s ease',
            opacity: page === 1 ? 0.4 : 1,
          }}
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
        >
          ←
        </button>
        <span style={{ fontSize: '14px', color: '#64748B' }}>
          {t('page') || 'Page'} {page} / {totalPages}
        </span>
        <button
          style={{
            padding: '6px 14px',
            border: '1px solid #E2E8F0',
            borderRadius: '8px',
            backgroundColor: page === totalPages ? '#F1F5F9' : '#FFFFFF',
            cursor: page === totalPages ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            transition: 'all 0.2s ease',
            opacity: page === totalPages ? 0.4 : 1,
          }}
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
        >
          →
        </button>
      </div>
    );
  };

  const renderTableHeader = () => {
    return (
      <thead>
        <tr>
          {columns.map((col, idx) => {
            const isSorted = sortField === col.key;
            const isSortable = col.sortable !== false;

            return (
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
                  cursor: isSortable ? 'pointer' : 'default',
                  userSelect: 'none',
                  transition: 'all 0.2s ease',
                  ...(col.width ? { width: col.width } : {}),
                }}
                onClick={() => isSortable && handleSort(col.key)}
                onMouseEnter={(e) => {
                  if (isSortable) {
                    e.currentTarget.style.backgroundColor = '#F1F5F9';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#F8FAFC';
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {col.label}
                  {isSortable && (
                    <span style={{ 
                      fontSize: '10px', 
                      color: isSorted ? '#0EA5E9' : '#94A3B8',
                      fontWeight: isSorted ? 700 : 400,
                      transition: 'all 0.2s ease',
                    }}>
                      {isSorted ? (sortDirection === 'asc' ? '▲' : '▼') : '⇅'}
                    </span>
                  )}
                </span>
              </th>
            );
          })}
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
              {t('actions') || 'Actions'}
            </th>
          )}
        </tr>
      </thead>
    );
  };

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
        {t('chargement')}
      </div>
    );
  }

  if (isMobile) {
    return (
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '14px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          overflow: 'auto',
          border: '1px solid #E2E8F0',
        }}
        className={className}
      >
        {renderSearchBar()}
        {renderFilters()}

        {!data || data.length === 0 ? (
          <div
            style={{
              padding: '40px',
              textAlign: 'center',
              color: '#94A3B8',
            }}
          >
            {emptyMessage || t('aucune_donnee')}
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '12px' }}>
              {sortedData.map((row, idx) => (
                <div
                  key={idx}
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '14px',
                    padding: '16px',
                    border: '1px solid #E2E8F0',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                    cursor: onRowClick ? 'pointer' : 'default',
                    transition: 'all 0.2s ease',
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
                      <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 500 }}>
                        {col.label}
                      </span>
                      <span style={{ fontSize: '13px', color: '#0F172A' }}>
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
                            borderRadius: '8px',
                            fontSize: '12px',
                            cursor: 'pointer',
                            fontWeight: 500,
                            transition: 'all 0.2s ease',
                            backgroundColor: action.variant === 'danger' ? '#FEE2E2'
                              : action.variant === 'success' ? '#D1FAE5'
                              : '#F0F9FF',
                            color: action.variant === 'danger' ? '#991B1B'
                              : action.variant === 'success' ? '#065F46'
                              : '#0EA5E9',
                            opacity: action.disabled?.(row) ? 0.5 : 1,
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!action.disabled?.(row)) action.onClick(row);
                          }}
                          disabled={action.disabled?.(row)}
                        >
                          {action.icon} {action.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
            {renderPagination()}
          </>
        )}
      </div>
    );
  }

  return (
    <div
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '14px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        overflow: 'auto',
        border: '1px solid #E2E8F0',
      }}
      className={className}
    >
      {renderSearchBar()}
      {renderFilters()}

      {!data || data.length === 0 ? (
        <div
          style={{
            padding: '40px',
            textAlign: 'center',
            color: '#94A3B8',
          }}
        >
          {emptyMessage || t('aucune_donnee')}
        </div>
      ) : (
        <>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            {renderTableHeader()}
            <tbody>
              {sortedData.map((row, idx) => (
                <tr
                  key={idx}
                  style={{
                    transition: 'background-color 0.15s ease',
                    backgroundColor: striped && idx % 2 === 0 ? '#FAFBFC' : '#FFFFFF',
                    cursor: onRowClick ? 'pointer' : 'default',
                  }}
                  onClick={() => onRowClick && onRowClick(row)}
                >
                  {columns.map((col, colIdx) => (
                    <td
                      key={colIdx}
                      style={{
                        padding: '12px 16px',
                        borderBottom: '1px solid #E2E8F0',
                        color: '#0F172A',
                      }}
                    >
                      {col.render ? col.render(row) : row[col.key] || '—'}
                    </td>
                  ))}
                  {actions && (
                    <td
                      style={{
                        padding: '8px 16px',
                        borderBottom: '1px solid #E2E8F0',
                      }}
                    >
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        {actions.map((action, idx) => (
                          <button
                            key={idx}
                            style={{
                              padding: '4px 12px',
                              border: 'none',
                              borderRadius: '8px',
                              fontSize: '12px',
                              cursor: 'pointer',
                              fontWeight: 500,
                              transition: 'all 0.2s ease',
                              backgroundColor: action.variant === 'danger' ? '#FEE2E2'
                                : action.variant === 'success' ? '#D1FAE5'
                                : '#F1F5F9',
                              color: action.variant === 'danger' ? '#991B1B'
                                : action.variant === 'success' ? '#065F46'
                                : '#1A1A2E',
                              opacity: action.disabled?.(row) ? 0.5 : 1,
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!action.disabled?.(row)) action.onClick(row);
                            }}
                            disabled={action.disabled?.(row)}
                          >
                            {action.icon} {action.label}
                          </button>
                        ))}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          {renderPagination()}
        </>
      )}
    </div>
  );
}