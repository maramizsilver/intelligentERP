
export const colors = {

  primary: '#0EA5E9',
  primaryDark: '#0284C7',
  primaryDarker: '#0369A1',
  primaryLight: '#7DD3FC',
  primaryLighter: '#BAE6FD',
  primaryBg: '#F0F9FF',

  secondary: '#6366F1',
  secondaryDark: '#4F46E5',
  secondaryLight: '#A5B4FC',
  secondaryBg: '#EEF2FF',
  
  white: '#FFFFFF',
  bg: '#F1F5F9',
  bgCard: '#FFFFFF',
  text: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  border: '#E2E8F0',
  borderLight: '#F1F5F9',
  borderDark: '#CBD5E1',

  success: '#22C55E',
  successDark: '#16A34A',
  successBg: '#F0FDF4',
  successBorder: '#86EFAC',
  
  warning: '#F59E0B',
  warningDark: '#D97706',
  warningBg: '#FFFBEB',
  warningBorder: '#FDE68A',
  
  danger: '#EF4444',
  dangerDark: '#DC2626',
  dangerBg: '#FEF2F2',
  dangerBorder: '#FCA5A5',
  
  info: '#0EA5E9',
  infoBg: '#F0F9FF',
  infoBorder: '#7DD3FC',
  
  // Gradients
  gradientPrimary: 'linear-gradient(135deg, #0EA5E9 0%, #0284C7 50%, #0369A1 100%)',
  gradientSecondary: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
  gradientSuccess: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)',
  gradientDanger: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
  gradientWarning: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
  
  // Ombres (avec couleur)
  shadowColor: 'rgba(14, 165, 233, 0.15)',
  shadowColorDark: 'rgba(14, 165, 233, 0.25)',
};

export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  xxl: '48px',
  xxxl: '64px',
};

export const typography = {
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  h1: { fontSize: '32px', fontWeight: 700, lineHeight: '40px', letterSpacing: '-0.02em' },
  h2: { fontSize: '24px', fontWeight: 700, lineHeight: '32px', letterSpacing: '-0.01em' },
  h3: { fontSize: '20px', fontWeight: 600, lineHeight: '28px' },
  h4: { fontSize: '16px', fontWeight: 600, lineHeight: '24px' },
  body: { fontSize: '14px', fontWeight: 400, lineHeight: '20px' },
  bodyBold: { fontSize: '14px', fontWeight: 600, lineHeight: '20px' },
  small: { fontSize: '12px', fontWeight: 400, lineHeight: '16px' },
  smallBold: { fontSize: '12px', fontWeight: 600, lineHeight: '16px' },
  caption: { fontSize: '11px', fontWeight: 500, lineHeight: '14px', textTransform: 'uppercase', letterSpacing: '0.06em' },
};

export const borderRadius = {
  sm: '6px',
  md: '10px',
  lg: '14px',
  xl: '18px',
  xxl: '24px',
  full: '9999px',
};

export const shadows = {
  none: 'none',
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.07), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.07), 0 4px 6px -2px rgba(0, 0, 0, 0.03)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.07), 0 10px 10px -5px rgba(0, 0, 0, 0.02)',
  xxl: '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
  
  // Glow effects
  glowPrimary: '0 4px 20px rgba(14, 165, 233, 0.30)',
  glowPrimaryHover: '0 8px 32px rgba(14, 165, 233, 0.45)',
  glowSecondary: '0 4px 20px rgba(99, 102, 241, 0.30)',
  glowSuccess: '0 4px 20px rgba(34, 197, 94, 0.30)',
  glowDanger: '0 4px 20px rgba(239, 68, 68, 0.30)',
  
  // Card
  card: '0 1px 3px rgba(0, 0, 0, 0.04), 0 4px 16px rgba(0, 0, 0, 0.04)',
  cardHover: '0 4px 12px rgba(0, 0, 0, 0.06), 0 8px 32px rgba(0, 0, 0, 0.06)',
};

export const transitions = {
  fast: '0.15s ease',
  normal: '0.3s ease',
  slow: '0.5s ease',
  bounce: '0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
};

export const breakpoints = {
  mobile: '480px',
  tablet: '768px',
  desktop: '1024px',
  wide: '1280px',
};

export const media = {
  mobile: `@media (max-width: ${breakpoints.mobile})`,
  tablet: `@media (max-width: ${breakpoints.tablet})`,
  desktop: `@media (min-width: ${breakpoints.desktop})`,
  wide: `@media (min-width: ${breakpoints.wide})`,
};

// ============================================================
// 🎯 COMPOSANTS DE BASE
// ============================================================

export const button = {
  base: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: `${spacing.sm} ${spacing.lg}`,
    borderRadius: borderRadius.md,
    fontSize: typography.body.fontSize,
    fontWeight: 600,
    border: 'none',
    cursor: 'pointer',
    transition: `all ${transitions.normal}`,
    fontFamily: typography.fontFamily,
    textDecoration: 'none',
    position: 'relative',
    overflow: 'hidden',
    ':hover': {
      transform: 'translateY(-2px)',
    },
    ':active': {
      transform: 'translateY(0) scale(0.98)',
    },
    ':disabled': {
      opacity: 0.5,
      cursor: 'not-allowed',
      transform: 'none !important',
    },
  },
  primary: {
    background: colors.gradientPrimary,
    color: colors.white,
    boxShadow: shadows.glowPrimary,
    ':hover': {
      boxShadow: shadows.glowPrimaryHover,
    },
  },
  secondary: {
    background: colors.gradientSecondary,
    color: colors.white,
    boxShadow: shadows.glowSecondary,
    ':hover': {
      boxShadow: '0 8px 32px rgba(99, 102, 241, 0.45)',
    },
  },
  success: {
    background: colors.gradientSuccess,
    color: colors.white,
    boxShadow: shadows.glowSuccess,
    ':hover': {
      boxShadow: '0 8px 32px rgba(34, 197, 94, 0.45)',
    },
  },
  danger: {
    background: colors.gradientDanger,
    color: colors.white,
    boxShadow: shadows.glowDanger,
    ':hover': {
      boxShadow: '0 8px 32px rgba(239, 68, 68, 0.45)',
    },
  },
  warning: {
    background: colors.gradientWarning,
    color: colors.white,
    boxShadow: '0 4px 20px rgba(245, 158, 11, 0.30)',
    ':hover': {
      boxShadow: '0 8px 32px rgba(245, 158, 11, 0.45)',
    },
  },
  outline: {
    background: 'transparent',
    color: colors.primary,
    border: `2px solid ${colors.primary}`,
    ':hover': {
      background: colors.primary,
      color: colors.white,
      boxShadow: shadows.glowPrimary,
    },
  },
  ghost: {
    background: 'transparent',
    color: colors.textSecondary,
    ':hover': {
      background: colors.bg,
      color: colors.text,
    },
  },
  sm: {
    padding: `${spacing.xs} ${spacing.md}`,
    fontSize: typography.small.fontSize,
    borderRadius: borderRadius.sm,
  },
  md: {
    padding: `${spacing.sm} ${spacing.lg}`,
    fontSize: typography.body.fontSize,
    borderRadius: borderRadius.md,
  },
  lg: {
    padding: `${spacing.md} ${spacing.xl}`,
    fontSize: typography.h4.fontSize,
    borderRadius: borderRadius.lg,
  },
  full: {
    width: '100%',
  },
};

export const card = {
  base: {
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.lg,
    border: `1px solid ${colors.border}`,
    boxShadow: shadows.card,
    overflow: 'hidden',
    transition: `all ${transitions.normal}`,
  },
  hover: {
    ':hover': {
      boxShadow: shadows.cardHover,
      transform: 'translateY(-4px)',
    },
  },
  primary: {
    borderTop: `4px solid ${colors.primary}`,
  },
  secondary: {
    borderTop: `4px solid ${colors.secondary}`,
  },
  success: {
    borderTop: `4px solid ${colors.success}`,
  },
  danger: {
    borderTop: `4px solid ${colors.danger}`,
  },
  warning: {
    borderTop: `4px solid ${colors.warning}`,
  },
  header: {
    padding: `${spacing.md} ${spacing.lg}`,
    borderBottom: `1px solid ${colors.border}`,
    backgroundColor: colors.bg,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  body: {
    padding: spacing.lg,
  },
  footer: {
    padding: `${spacing.md} ${spacing.lg}`,
    borderTop: `1px solid ${colors.border}`,
    backgroundColor: colors.bg,
  },
};

export const input = {
  base: {
    width: '100%',
    padding: `${spacing.sm} ${spacing.md}`,
    borderRadius: borderRadius.md,
    border: `2px solid ${colors.border}`,
    fontSize: typography.body.fontSize,
    transition: `all ${transitions.fast}`,
    backgroundColor: colors.bg,
    boxSizing: 'border-box',
    outline: 'none',
    fontFamily: typography.fontFamily,
    color: colors.text,
    ':focus': {
      borderColor: colors.primary,
      boxShadow: `0 0 0 4px ${colors.primaryBg}`,
      backgroundColor: colors.white,
    },
    ':hover': {
      borderColor: colors.primaryLight,
    },
    '::placeholder': {
      color: colors.textMuted,
    },
  },
  error: {
    borderColor: colors.danger,
    ':focus': {
      borderColor: colors.danger,
      boxShadow: `0 0 0 4px ${colors.dangerBg}`,
    },
    ':hover': {
      borderColor: colors.danger,
    },
  },
  success: {
    borderColor: colors.success,
    ':focus': {
      borderColor: colors.success,
      boxShadow: `0 0 0 4px ${colors.successBg}`,
    },
    ':hover': {
      borderColor: colors.success,
    },
  },
  disabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
  },
  withIcon: {
    paddingLeft: '42px',
  },
  label: {
    fontSize: typography.small.fontSize,
    fontWeight: 600,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    display: 'block',
  },
  helper: {
    fontSize: typography.small.fontSize,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  errorText: {
    fontSize: typography.small.fontSize,
    color: colors.danger,
    marginTop: spacing.xs,
  },
};

export const table = {
  container: {
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.lg,
    border: `1px solid ${colors.border}`,
    overflow: 'auto',
    boxShadow: shadows.card,
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: typography.body.fontSize,
  },
  th: {
    padding: `${spacing.sm} ${spacing.md}`,
    textAlign: 'left',
    fontWeight: 600,
    color: colors.textSecondary,
    backgroundColor: colors.bg,
    borderBottom: `2px solid ${colors.border}`,
    fontSize: typography.caption.fontSize,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    whiteSpace: 'nowrap',
  },
  td: {
    padding: `${spacing.sm} ${spacing.md}`,
    borderBottom: `1px solid ${colors.border}`,
    color: colors.text,
  },
  tr: {
    transition: `background ${transitions.fast}`,
  },
  hover: {
    ':hover': {
      backgroundColor: colors.primaryBg,
    },
  },
  striped: {
    ':nth-child(even)': {
      backgroundColor: colors.bg,
    },
  },
  actions: {
    display: 'flex',
    gap: spacing.xs,
    flexWrap: 'wrap',
  },
};

export const badge = {
  base: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: spacing.xs,
    padding: `${spacing.xs} ${spacing.sm}`,
    borderRadius: borderRadius.full,
    fontSize: typography.caption.fontSize,
    fontWeight: 600,
    letterSpacing: '0.02em',
  },
  primary: {
    backgroundColor: colors.primaryBg,
    color: colors.primary,
  },
  secondary: {
    backgroundColor: colors.secondaryBg,
    color: colors.secondary,
  },
  success: {
    backgroundColor: colors.successBg,
    color: colors.success,
  },
  danger: {
    backgroundColor: colors.dangerBg,
    color: colors.danger,
  },
  warning: {
    backgroundColor: colors.warningBg,
    color: colors.warning,
  },
  outline: {
    backgroundColor: 'transparent',
    border: `1px solid ${colors.border}`,
    color: colors.textSecondary,
  },
  dot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    display: 'inline-block',
  },
  dotPrimary: { backgroundColor: colors.primary },
  dotSecondary: { backgroundColor: colors.secondary },
  dotSuccess: { backgroundColor: colors.success },
  dotDanger: { backgroundColor: colors.danger },
  dotWarning: { backgroundColor: colors.warning },
};

export const modal = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
    padding: spacing.lg,
    animation: 'fadeIn 0.3s ease',
  },
  container: {
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.xl,
    boxShadow: shadows.xxl,
    width: '100%',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    animation: 'slideUp 0.3s ease',
  },
  header: {
    padding: `${spacing.lg} ${spacing.xl}`,
    borderBottom: `1px solid ${colors.border}`,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexShrink: 0,
  },
  title: {
    fontSize: typography.h3.fontSize,
    fontWeight: 600,
    color: colors.text,
    margin: 0,
  },
  close: {
    background: 'transparent',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    color: colors.textMuted,
    padding: spacing.xs,
    borderRadius: borderRadius.md,
    transition: `all ${transitions.fast}`,
    ':hover': {
      backgroundColor: colors.bg,
      color: colors.text,
    },
  },
  body: {
    padding: spacing.xl,
    overflow: 'auto',
    flex: 1,
  },
  footer: {
    padding: `${spacing.md} ${spacing.xl}`,
    borderTop: `1px solid ${colors.border}`,
    display: 'flex',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    flexShrink: 0,
    backgroundColor: colors.bg,
  },
};

export const form = {
  group: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  row: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: spacing.md,
    '@media (max-width: 640px)': {
      gridTemplateColumns: '1fr',
    },
  },
  actions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
    borderTop: `1px solid ${colors.border}`,
  },
};

export const layout = {
  container: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: spacing.lg,
  },
  sidebar: {
    width: '240px',
    backgroundColor: colors.text,
    color: colors.white,
    height: '100vh',
    position: 'fixed',
    left: 0,
    top: 0,
    transition: `width ${transitions.normal}`,
  },
  main: {
    marginLeft: '240px',
    minHeight: '100vh',
    backgroundColor: colors.bg,
  },
  header: {
    backgroundColor: colors.bgCard,
    borderBottom: `1px solid ${colors.border}`,
    padding: `${spacing.md} ${spacing.lg}`,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
};

// ============================================================
// 📱 RESPONSIVE UTILITIES
// ============================================================

export const responsive = {
  hideMobile: {
    '@media (max-width: 768px)': {
      display: 'none !important',
    },
  },
  showMobile: {
    display: 'none',
    '@media (max-width: 768px)': {
      display: 'block !important',
    },
  },
  hideTablet: {
    '@media (min-width: 769px) and (max-width: 1024px)': {
      display: 'none !important',
    },
  },
  fullWidthMobile: {
    '@media (max-width: 768px)': {
      width: '100% !important',
    },
  },
};