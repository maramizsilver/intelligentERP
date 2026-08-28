// frontend/src/components/common/PageHero.jsx
// ---------------------------------------------------------------------------
// Bannière d'en-tête "pro" reprenant le style de la page de connexion :
// panneau sombre en dégradé + glow radial + carte de stats/actions en verre.
// À utiliser en haut de chaque page de module pour une identité visuelle
// cohérente avec l'écran de login/inscription.
// ---------------------------------------------------------------------------
import React from 'react';
import { colors, spacing, borderRadius, hero, glassmorphism } from '../../styles/theme';

export default function PageHero({
  icon,
  title,
  subtitle,
  stats = [],       // [{ label, value, accent }]
  actions,          // noeuds React (boutons) alignés à droite
}) {
  return (
    <div
      style={{
        ...glassmorphism.panel,
        padding: `${spacing.xl} ${spacing.xl}`,
        marginBottom: spacing.lg,
      }}
    >
      {/* Glows décoratifs */}
      <div style={{ position: 'absolute', inset: 0, background: hero.glowTopLeft, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', inset: 0, background: hero.glowBottomRight, pointerEvents: 'none' }} />

      <div
        style={{
          position: 'relative',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: spacing.lg,
        }}
      >
        <div style={{ display: 'flex', gap: spacing.md, alignItems: 'flex-start' }}>
          {icon && (
            <div
              style={{
                width: '52px',
                height: '52px',
                borderRadius: borderRadius.lg,
                background: colors.gradientPrimary,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                boxShadow: '0 8px 24px rgba(14,165,233,0.35)',
                flexShrink: 0,
              }}
            >
              {icon}
            </div>
          )}
          <div>
            <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 700, color: '#FFFFFF', letterSpacing: '-0.3px' }}>
              {title}
            </h1>
            {subtitle && (
              <p style={{ margin: '6px 0 0', fontSize: '13px', color: 'rgba(255,255,255,0.55)' }}>
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {actions && (
          <div style={{ display: 'flex', gap: spacing.sm, flexWrap: 'wrap' }}>
            {actions}
          </div>
        )}
      </div>

      {stats.length > 0 && (
        <div
          style={{
            position: 'relative',
            display: 'grid',
            gridTemplateColumns: `repeat(${Math.min(stats.length, 5)}, 1fr)`,
            gap: spacing.md,
            marginTop: spacing.xl,
          }}
        >
          {stats.map((s, i) => (
            <div
              key={i}
              style={{
                ...glassmorphism.glassCard,
                padding: `${spacing.md} ${spacing.md}`,
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
              }}
            >
              <span style={{ fontSize: '22px', fontWeight: 700, color: s.accent || '#FFFFFF' }}>
                {s.value}
              </span>
              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {s.label}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}