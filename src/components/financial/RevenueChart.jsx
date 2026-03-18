import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

// Formatação de moeda em português brasileiro
const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(value || 0);
};

// Tooltip customizado
const CustomTooltip = ({ active, payload, label, theme }) => {
  if (!active || !payload?.length) return null;
  
  return (
    <div style={{
      background: theme?.bgCard || '#0f172a',
      border: `1px solid ${theme?.border || '#1e293b'}`,
      borderRadius: 8,
      padding: '10px 14px',
      fontSize: 13,
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <p style={{ color: theme?.textMuted || '#64748b', margin: '0 0 6px', fontWeight: 600 }}>
        {label}
      </p>
      <p style={{ color: theme?.accent || '#3b82f6', margin: 0, fontWeight: 700 }}>
        {formatCurrency(payload[0].value)}
      </p>
    </div>
  );
};

export default function RevenueChart({ data, loading, theme }) {
  if (loading) {
    return (
      <div style={{ background: theme.bgCard, borderRadius: 12, padding: 24 }}>
        <div className="skeleton-shimmer" style={{ height: 200 }} />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div style={{ background: theme.bgCard, borderRadius: 12, padding: 24 }}>
        <p style={{ color: theme.textGhost, fontSize: 13, textAlign: 'center', padding: '40px 0' }}>
          Nenhum dado de faturamento no período
        </p>
      </div>
    );
  }

  return (
    <div style={{ background: theme.bgCard, borderRadius: 12, padding: 24 }}>
      <p style={{
        fontSize: 12,
        fontWeight: 700,
        color: theme.textGhost,
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
        margin: '0 0 20px',
      }}>
        Faturamento no Período
      </p>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
          <defs>
            <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={theme?.accent || '#3b82f6'} stopOpacity={0.25} />
              <stop offset="95%" stopColor={theme?.accent || '#3b82f6'} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={theme?.border || '#1e293b'} vertical={false} />
          <XAxis
            dataKey="semana"
            tick={{ fill: theme?.textMuted || '#475569', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: theme?.textMuted || '#475569', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
          />
          <Tooltip content={<CustomTooltip theme={theme} />} />
          <Area
            type="monotone"
            dataKey="valor"
            name="Faturamento"
            stroke={theme?.accent || '#3b82f6'}
            strokeWidth={2}
            fill="url(#revenueGradient)"
            dot={{ fill: theme?.accent || '#3b82f6', r: 3 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
