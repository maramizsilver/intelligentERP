// Styles globaux - Palette Bleu ciel / Vert
export const colors = {

  primary: '#0ea5e9',        
  primaryLight: '#7dd3fc',   
  primaryDark: '#0284c7',    
  primaryBg: '#f0f9ff',     
  secondary: '#22c55e',      // l
  secondaryLight: '#86efac', 
  secondaryDark: '#16a34a', 
  secondaryBg: '#f0fdf4',    
  
  
  white: '#ffffff',
  bg: '#f8fafc',
  text: '#0f172a',
  textLight: '#64748b',
  border: '#e2e8f0',
  shadow: '0 1px 3px rgba(14, 165, 233, 0.10), 0 1px 2px rgba(14, 165, 233, 0.06)',
  shadowHover: '0 10px 40px rgba(14, 165, 233, 0.15)',
  
  // États
  success: '#22c55e',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#0ea5e9'
};

// Boutons
export const buttons = {
  primary: {
    backgroundColor: colors.primary,
    color: colors.white,
    border: 'none',
    padding: '10px 20px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    ':hover': {
      backgroundColor: colors.primaryDark,
      transform: 'translateY(-2px)',
      boxShadow: colors.shadowHover
    }
  },
  secondary: {
    backgroundColor: colors.secondary,
    color: colors.white,
    border: 'none',
    padding: '10px 20px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    ':hover': {
      backgroundColor: colors.secondaryDark,
      transform: 'translateY(-2px)',
      boxShadow: colors.shadowHover
    }
  },
  outline: {
    backgroundColor: 'transparent',
    color: colors.primary,
    border: `2px solid ${colors.primary}`,
    padding: '8px 18px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    ':hover': {
      backgroundColor: colors.primary,
      color: colors.white
    }
  },
  danger: {
    backgroundColor: colors.danger,
    color: colors.white,
    border: 'none',
    padding: '8px 16px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    ':hover': {
      backgroundColor: '#dc2626',
      transform: 'translateY(-1px)'
    }
  }
};

//  Cartes
export const cards = {
  card: {
    backgroundColor: colors.white,
    borderRadius: '12px',
    padding: '24px',
    boxShadow: colors.shadow,
    border: `1px solid ${colors.border}`,
    transition: 'all 0.2s ease'
  },
  cardHover: {
    backgroundColor: colors.white,
    borderRadius: '12px',
    padding: '24px',
    boxShadow: colors.shadow,
    border: `1px solid ${colors.border}`,
    transition: 'all 0.2s ease',
    cursor: 'pointer',
    ':hover': {
      boxShadow: colors.shadowHover,
      transform: 'translateY(-4px)',
      borderColor: colors.primaryLight
    }
  },
  cardPrimary: {
    backgroundColor: colors.primaryBg,
    borderRadius: '12px',
    padding: '24px',
    border: `1px solid ${colors.primaryLight}`,
    transition: 'all 0.2s ease'
  }
};

//  Champs de saisie
export const inputs = {
  input: {
    width: '100%',
    padding: '12px 16px',
    borderRadius: '8px',
    border: `2px solid ${colors.border}`,
    fontSize: '14px',
    transition: 'all 0.2s ease',
    boxSizing: 'border-box',
    ':focus': {
      borderColor: colors.primary,
      outline: 'none',
      boxShadow: '0 0 0 3px rgba(14, 165, 233, 0.15)'
    }
  },
  select: {
    width: '100%',
    padding: '12px 16px',
    borderRadius: '8px',
    border: `2px solid ${colors.border}`,
    fontSize: '14px',
    transition: 'all 0.2s ease',
    backgroundColor: colors.white,
    boxSizing: 'border-box',
    ':focus': {
      borderColor: colors.primary,
      outline: 'none',
      boxShadow: '0 0 0 3px rgba(14, 165, 233, 0.15)'
    }
  }
};

//  Badges
export const badges = {
  admin: {
    backgroundColor: '#fee2e2',
    color: '#991b1b',
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '600'
  },
  manager: {
    backgroundColor: '#fef3c7',
    color: '#92400e',
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '600'
  },
  employe: {
    backgroundColor: colors.primaryBg,
    color: colors.primaryDark,
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '600'
  },
  client: {
    backgroundColor: colors.secondaryBg,
    color: colors.secondaryDark,
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '600'
  }
};

//  Layouts
export const layouts = {
  container: {
    padding: '24px',
    backgroundColor: colors.bg,
    minHeight: '100vh'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px'
  },
  grid3: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '16px'
  },
  grid4: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '16px'
  },
  flexRow: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
    alignItems: 'center'
  },
  flexBetween: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '12px'
  }
};