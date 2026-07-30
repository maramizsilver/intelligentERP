import React from 'react';
import { useLanguage } from '../../context/LanguageContext';

const FLAGS = {
  fr: '🇫🇷',
  en: '🇬🇧',
  ar: '🇸🇦'
};

export default function LanguageSwitcher({ variant = 'default', className = '' }) {
  const { language, changeLanguage } = useLanguage();

  const languages = [
    { code: 'fr', label: 'Français' },
    { code: 'en', label: 'English' },
    { code: 'ar', label: 'العربية' }
  ];

  const getStyles = () => {
    if (variant === 'dark') {
      return {
        container: {
          backgroundColor: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.08)',
        },
        button: {
          color: 'rgba(255,255,255,0.6)',
        },
        buttonActive: {
          backgroundColor: 'rgba(255,255,255,0.1)',
          color: '#FFFFFF',
        },
      };
    }
    return {
      container: {
        backgroundColor: '#F1F5F9',
        border: '1px solid #E2E8F0',
      },
      button: {
        color: '#64748B',
      },
      buttonActive: {
        backgroundColor: '#FFFFFF',
        color: '#0F172A',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      },
    };
  };

  const styles = getStyles();

  return (
    <div
      style={{
        display: 'flex',
        gap: '4px',
        padding: '4px',
        borderRadius: '10px',
        transition: 'all 0.3s ease',
        ...styles.container,
      }}
      className={className}
    >
      {languages.map(lang => (
        <button
          key={lang.code}
          style={{
            padding: '6px 12px',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: language === lang.code ? 600 : 500,
            transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
            ...styles.button,
            ...(language === lang.code ? styles.buttonActive : {}),
          }}
          onClick={() => changeLanguage(lang.code)}
        >
          {FLAGS[lang.code]} {lang.label}
        </button>
      ))}
    </div>
  );
}