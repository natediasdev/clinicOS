import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtCurrency = (v) =>
  new Intl.NumberFormat("pt-BR", { style:"currency", currency:"BRL", maximumFractionDigits:0 }).format(v || 0)

// ─── Tooltip ──────────────────────────────────────────────────────────────────

const CustomTooltip = ({ active, payload, label, theme }) => {
  if (!active || !payload?.length) return null
  const bar  = payload.find(p => p.dataKey === "valor")
  const line = payload.find(p => p.dataKey === "ticket_medio")
  const qtd  = bar ? (payload.find(p => p.payload?.qtd != null)?.payload?.qtd ?? null) : null

  return (
    <div style={{
      background:   theme?.bgCard  || "#0f172a",
      border:       `1px solid ${theme?.border || "#1e293b"}`,
      borderRadius: 10,
      padding:      "12px 16px",
      fontSize:     13,
      fontFamily:   "'DM Sans', sans-serif",
      minWidth:     170,
      boxShadow:    "0 8px 24px rgba(0,0,0,0.3)",
    }}>
      <p style={{ color: theme?.textMuted || "#64748b", margin:"0 0 10px", fontWeight:600,
                  fontSize:11, textTransform:"uppercase", letterSpacing:"0.06em" }}>
        {label}
      </p>
      {bar && (
        <div style={{ display:"flex", justifyContent:"space-between", gap:20, marginBottom:6 }}>
          <span style={{ color: theme?.textGhost || "#475569" }}>Faturamento</span>
          <span style={{ color: theme?.accent || "#3b82f6", fontWeight:700 }}>
            {fmtCurrency(bar.value)}
          </span>
        </div>
      )}
      {line && (
        <div style={{ display:"flex", justifyContent:"space-between", gap:20, marginBottom:6 }}>
          <span style={{ color: theme?.textGhost || "#475569" }}>Ticket médio</span>
          <span style={{ color:"#22c55e", fontWeight:700 }}>
            {fmtCurrency(line.value)}
          </span>
        </div>
      )}
      {qtd != null && (
        <div style={{ display:"flex", justifyContent:"space-between", gap:20,
                      paddingTop:8, borderTop:`1px solid ${theme?.border || "#1e293b"}`, marginTop:4 }}>
          <span style={{ color: theme?.textGhost || "#475569" }}>Pagamentos</span>
          <span style={{ color: theme?.textMuted || "#94a3b8", fontWeight:600 }}>{qtd}</span>
        </div>
      )}
    </div>
  )
}

// ─── Legenda customizada ──────────────────────────────────────────────────────

const ChartLegend = ({ theme }) => (
  <div style={{ display:"flex", gap:20, justifyContent:"flex-end", marginBottom:4,
                fontSize:12, color: theme?.textGhost || "#475569" }}>
    <span style={{ display:"flex", alignItems:"center", gap:5 }}>
      <span style={{ width:10, height:10, borderRadius:2, background: theme?.accent || "#3b82f6",
                     display:"inline-block" }}/>
      Faturamento
    </span>
    <span style={{ display:"flex", alignItems:"center", gap:5 }}>
      <span style={{ width:12, height:2, background:"#22c55e", display:"inline-block", borderRadius:1 }}/>
      Ticket médio
    </span>
  </div>
)

// ─── Componente principal ─────────────────────────────────────────────────────

export default function RevenueChart({ data, loading, theme }) {

  if (loading) {
    return (
      <div style={{ background: theme?.bgCard, borderRadius:12, padding:24 }}>
        <div className="skeleton-shimmer" style={{ height:200 }}/>
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div style={{ background: theme?.bgCard, borderRadius:12, padding:24 }}>
        <p style={{ color: theme?.textGhost, fontSize:13, textAlign:"center", padding:"40px 0" }}>
          Nenhum dado de faturamento no período
        </p>
      </div>
    )
  }

  return (
    <div style={{ background: theme?.bgCard, borderRadius:12, padding:24 }}>

      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:16 }}>
        <p style={{ fontSize:12, fontWeight:700, color: theme?.textGhost,
                    textTransform:"uppercase", letterSpacing:"0.1em", margin:0 }}>
          Faturamento no Período
        </p>
        <ChartLegend theme={theme}/>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <ComposedChart data={data} margin={{ top:4, right:52, left:-16, bottom:0 }}>

          <defs>
            <linearGradient id="revenueBarGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor={theme?.accent || "#3b82f6"} stopOpacity={0.9}/>
              <stop offset="100%" stopColor={theme?.accent || "#3b82f6"} stopOpacity={0.6}/>
            </linearGradient>
          </defs>

          <CartesianGrid
            strokeDasharray="3 3"
            stroke={theme?.border || "#1e293b"}
            vertical={false}
          />

          <XAxis
            dataKey="semana"
            tick={{ fill: theme?.textGhost || "#475569", fontSize:11 }}
            axisLine={false}
            tickLine={false}
          />

          {/* Eixo esquerdo — faturamento */}
          <YAxis
            yAxisId="left"
            tick={{ fill: theme?.textGhost || "#475569", fontSize:11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={v => `R$${(v/1000).toFixed(0)}k`}
          />

          {/* Eixo direito — ticket médio (verde, menor escala) */}
          <YAxis
            yAxisId="right"
            orientation="right"
            tick={{ fill:"#22c55e", fontSize:11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={v => `R$${v}`}
          />

          <Tooltip content={<CustomTooltip theme={theme}/>}/>

          {/* Barras de faturamento */}
          <Bar
            yAxisId="left"
            dataKey="valor"
            name="Faturamento"
            fill="url(#revenueBarGrad)"
            radius={[4,4,0,0]}
            maxBarSize={56}
          />

          {/* Linha de ticket médio */}
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="ticket_medio"
            name="Ticket médio"
            stroke="#22c55e"
            strokeWidth={2}
            dot={{ fill:"#22c55e", r:3, strokeWidth:0 }}
            activeDot={{ r:5, strokeWidth:0 }}
          />

        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
