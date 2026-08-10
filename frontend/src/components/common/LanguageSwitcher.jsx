// src/components/common/LanguageSwitcher.jsx
import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';

const LANGUAGES = [
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'ar', label: 'العربية', flag: '🇸🇦' },
];

export default function LanguageSwitcher({ variant = 'default' }) {
  const { language, changeLanguage } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const current = LANGUAGES.find((l) => l.code === language) || LANGUAGES[0];
  const dark = variant === 'dark';

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '7px 12px',
          borderRadius: '10px',
          border: dark ? '1px solid rgba(255,255,255,0.12)' : '1px solid #E2E8F0',
          backgroundColor: dark ? 'rgba(255,255,255,0.06)' : '#FFFFFF',
          color: dark ? '#FFFFFF' : '#0F172A',
          cursor: 'pointer',
          fontSize: '13px',
          fontWeight: 600,
          transition: 'all 0.2s ease',
          boxShadow: open ? '0 0 0 3px rgba(14,165,233,0.15)' : 'none',
        }}
      >
        <span style={{ fontSize: '16px' }}>{current.flag}</span>
        <span>{current.code.toUpperCase()}</span>
        <span
          style={{
            fontSize: '10px',
            marginLeft: '2px',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
            color: dark ? 'rgba(255,255,255,0.5)' : '#94A3B8',
          }}
        >
          ▼
        </span>
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            right: 0,
            minWidth: '170px',
            backgroundColor: '#FFFFFF',
            borderRadius: '12px',
            border: '1px solid #E2E8F0',
            boxShadow: '0 10px 30px rgba(15,23,42,0.12)',
            overflow: 'hidden',
            zIndex: 2000,
            animation: 'langMenuIn 0.15s ease',
          }}
        >
          {LANGUAGES.map((lang) => {
            const active = lang.code === language;
            return (
              <button
                key={lang.code}
                onClick={() => {
                  changeLanguage(lang.code);
                  setOpen(false);
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 14px',
                  border: 'none',
                  background: active ? '#F0F9FF' : 'transparent',
                  color: active ? '#0EA5E9' : '#334155',
                  fontSize: '13px',
                  fontWeight: active ? 600 : 500,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background 0.15s ease',
                }}
                onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = '#F8FAFC'; }}
                onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'transparent'; }}
              >
                <span style={{ fontSize: '17px' }}>{lang.flag}</span>
                <span style={{ flex: 1 }}>{lang.label}</span>
                {active && <span style={{ color: '#0EA5E9' }}>✓</span>}
              </button>
            );
          })}
        </div>
      )}

      <style>{`
        @keyframes langMenuIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}