import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rc-tooltip" role="status">
      <p className="rc-tooltip-label">{label}</p>
      {payload.map((entry) => (
        <p key={entry.dataKey} className="rc-tooltip-row" style={{ color: entry.color }}>
          {entry.name} : <strong>{entry.value.toLocaleString('fr-FR')} DT</strong>
        </p>
      ))}
    </div>
  );
}

export default function RevenueLineChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
        <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748B' }} axisLine={{ stroke: '#E2E8F0' }} tickLine={false} />
        <YAxis
          tick={{ fontSize: 12, fill: '#64748B' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `${Math.round(v / 1000)}k`}
        />
        <Tooltip content={<CustomTooltip />} />
        <Line
          type="monotone"
          dataKey="revenu"
          name="Chiffre d'affaires"
          stroke="#0EA5E9"
          strokeWidth={3}
          dot={{ r: 3, fill: '#0EA5E9' }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}