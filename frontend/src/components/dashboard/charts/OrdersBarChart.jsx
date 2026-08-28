// frontend/src/components/dashboard/charts/OrdersBarChart.jsx
// ---------------------------------------------------------------------------
// Barres empilées : commandes livrées / en attente / annulées par semaine.
// ---------------------------------------------------------------------------
import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

const SERIES = [
  { key: 'livrees', name: 'Livrées', color: '#10B981' },
  { key: 'en_attente', name: 'En attente', color: '#F59E0B' },
  { key: 'annulees', name: 'Annulées', color: '#F43F5E' },
];

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rc-tooltip" role="status">
      <p className="rc-tooltip-label">{label}</p>
      {payload.map((entry) => (
        <p key={entry.dataKey} className="rc-tooltip-row" style={{ color: entry.color }}>
          {entry.name} : <strong>{entry.value}</strong>
        </p>
      ))}
    </div>
  );
}

export default function OrdersBarChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 8, right: 12, left: -12, bottom: 0 }} barSize={22}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
        <XAxis dataKey="semaine" tick={{ fontSize: 12, fill: '#64748B' }} axisLine={{ stroke: '#E2E8F0' }} tickLine={false} />
        <YAxis tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(148,163,184,0.08)' }} />
        <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
        {SERIES.map((s) => (
          <Bar key={s.key} dataKey={s.key} name={s.name} stackId="orders" fill={s.color} radius={[4, 4, 0, 0]} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}