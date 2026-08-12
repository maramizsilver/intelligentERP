import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../../context/LanguageContext';

export default function SearchBar({
  onSearch,
  placeholder,
  className = '',
  debounceDelay = 300,
  variant = 'default',
  icon = '🔍',
}) {
  const { t } = useLanguage();
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const timeoutRef = useRef(null);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      onSearch(query);
    }, debounceDelay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [query, debounceDelay, onSearch]);

  const getStyles = () => {
    if (variant === 'dark') {
      return {
        container: {
          backgroundColor: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.08)',
        },
        containerFocused: {
          borderColor: 'rgba(14, 165, 233, 0.5)',
          boxShadow: '0 0 0 4px rgba(14, 165, 233, 0.1)',
        },
        input: {
          color: '#FFFFFF',
        },
        icon: {
          color: 'rgba(255,255,255,0.4)',
        },
      };
    }
    return {
      container: {
        backgroundColor: '#FFFFFF',
        border: '2px solid #E2E8F0',
      },
      containerFocused: {
        borderColor: '#0EA5E9',
        boxShadow: '0 0 0 4px rgba(14, 165, 233, 0.1)',
      },
      input: {
        color: '#0F172A',
      },
      icon: {
        color: '#94A3B8',
      },
    };
  };

  const styles = getStyles();

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '8px 14px',
        borderRadius: '12px',
        transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        width: '100%',
        ...styles.container,
        ...(isFocused ? styles.containerFocused : {}),
      }}
      className={className}
    >
      <span style={{ marginRight: '10px', fontSize: '16px', ...styles.icon }}>
        {icon}
      </span>
      <input
        style={{
          border: 'none',
          outline: 'none',
          fontSize: '14px',
          flex: 1,
          backgroundColor: 'transparent',
          ...styles.input,
        }}
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={placeholder || t('rechercher') || 'Rechercher'}
      />
      {query && (
        <button
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#94A3B8',
            fontSize: '16px',
            padding: '4px',
            transition: 'all 0.2s ease',
          }}
          onClick={() => setQuery('')}
        >
          ✕
        </button>
      )}
    </div>
  );
}