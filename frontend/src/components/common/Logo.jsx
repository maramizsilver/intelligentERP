// src/components/common/Logo.jsx
import React from 'react';
import logoImage from '../../logo/logo.png';

const Logo = ({ size = 100, showText = true, textColor = '#FFFFFF' }) => {
  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: '20px' 
    }}>
      <div style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: 'transparent',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        flexShrink: 0,
        border: '4px solid rgba(255, 255, 255, 0.25)',
        boxShadow: '0 8px 40px rgba(14, 165, 233, 0.4)',
      }}>
        <img 
          src={logoImage} 
          alt="ERP Logo" 
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            borderRadius: '50%',
          }}
        />
      </div>
      {showText && (
        <span style={{
          fontSize: size * 0.65,
          fontWeight: 700,
          color: textColor,
          letterSpacing: '1.5px',
          textShadow: '0 2px 15px rgba(0, 0, 0, 0.3)',
        }}>
          ERP
        </span>
      )}
    </div>
  );
};

export default Logo;