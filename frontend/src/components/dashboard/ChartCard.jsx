// frontend/src/components/dashboard/ChartCard.jsx
// ---------------------------------------------------------------------------
// Enveloppe visuelle commune à tous les graphiques du dashboard (titre,
// sous-titre optionnel, zone de contenu). Centraliser ce conteneur évite de
// dupliquer le style "carte" dans chaque graphique et garantit que tout
// nouveau graphique ajouté plus tard aura automatiquement le bon habillage.
// ---------------------------------------------------------------------------
import React from 'react';
import './ChartCard.css';

export default function ChartCard({ title, subtitle, action, children, className = '' }) {
  return (
    <section className={`chart-card ${className}`}>
      <header className="chart-card-header">
        <div>
          <h3 className="chart-card-title">{title}</h3>
          {subtitle && <p className="chart-card-subtitle">{subtitle}</p>}
        </div>
        {action && <div className="chart-card-action">{action}</div>}
      </header>
      <div className="chart-card-body">{children}</div>
    </section>
  );
}