// frontend/src/components/dashboard/charts/RevenueDonutChart.jsx
// ---------------------------------------------------------------------------
// Camembert (donut) : répartition du chiffre d'affaires par module métier.
// Une légende personnalisée est affichée à côté plutôt qu'en dessous, pour
// une lecture plus rapide des proportions et des valeurs.
// ---------------------------------------------------------------------------
import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

function CustomTooltip({ active, payload }) {
  if (!active || !payload || payload.length === 0) return null;
  const entry = payload[0];
  return (
    <div className="rc-tooltip" role="status">
      <p className="rc-tooltip-row" style={{ color: entry.payload.color }}>
        {entry.name} : <strong>{entry.value}%</strong>
      </p>
    </div>
  );
}

export default function RevenueDonutChart({ data }) {
  return (
    <div className="donut-layout">
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={58}
            outerRadius={88}
            paddingAngle={3}
            startAngle={90}
            endAngle={-270}
          >
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.color} stroke="none" />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>

      <ul className="donut-legend" aria-label="Répartition du chiffre d'affaires par module">
        {data.map((entry) => (
          <li key={entry.name} className="donut-legend-item">
            <span className="donut-legend-dot" style={{ backgroundColor: entry.color }} aria-hidden="true" />
            <span className="donut-legend-name">{entry.name}</span>
            <span className="donut-legend-value">{entry.value}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}