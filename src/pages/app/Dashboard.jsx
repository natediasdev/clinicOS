import { useEffect, useState, useRef } from "react"
import { supabase } from "../../supabaseClient"
import { useAuth } from "../../context/AuthContext"
import { useTheme } from "../../context/ThemeContext"
import AppLayout from "../AppLayout"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  LineChart, Line, Area, AreaChart,
} from "recharts"

// ─── Helpers ─────────────────────────────────────────────────────────────────

function todayRange() {
  const s = new Date(); s.setHours(0,0,0,0)
  const e = new Date(); e.setHours(23,59,59,999)
  return { start: s.toISOString(), end: e.toISOString() }
}
function weekRange() {
  const now = new Date(); const day = now.getDay()
  const mon = new Date(now); mon.setDate(now.getDate()+(day===0?-6:1-day)); mon.setHours(0,0,0,0)
  const sun = new Date(mon); sun.setDate(mon.getDate()+6); sun.setHours(23,59,59,999)
  return { start: mon.toISOString(), end: sun.toISOString() }
}
function formatTime(iso) { return iso ? new Date(iso).toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"}) : "--" }
function formatDate(iso) { return iso ? new Date(iso).toLocaleDateString("pt-BR",{weekday:"short",day:"2-digit",month:"short"}) : "--" }
function formatCurrency(v) { return new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL",maximumFractionDigits:0}).format(v||0) }
function useIsMobile() {
  const [v,setV] = useState(window.innerWidth<=768)
  useEffect(()=>{const fn=()=>setV(window.innerWidth<=768);window.addEventListener("resize",fn);return()=>window.removeEventListener("resize",fn)},[])
  return v
}

const STATUS_STYLE = {
  scheduled: { label:"Agendado",  color:"#3b82f6", bg:"#0c1f3a" },
  completed: { label:"Concluído", color:"#22c55e", bg:"#052e16" },
  cancelled: { label:"Cancelado", color:"#ef4444", bg:"#450a0a" },
  no_show:   { label:"Não veio",  color:"#f59e0b", bg:"#1c1107" },
}
const DAYS = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"]

// ─── Data fetching ────────────────────────────────────────────────────────────

function useDashboardData(clinicId) {
  const [data, setData] = useState({
    totalPatients: null, todayAppointments: null,
    nextAppointments: [], weekOccupancy: null, weekNoShow: null,
    // gráficos
    revenueByWeek: [],        // faturamento das últimas 8 semanas
    statusPie: [],            // agendamentos por status (mês)
    occupancyByDay: [],       // ocupação por dia da semana
    patientGrowth: [],        // crescimento de pacientes (últimos 6 meses)
    loading: true, error: null,
  })

  useEffect(() => {
    if (!clinicId) return
    async function fetchAll() {
      try {
        const week = weekRange(); const today = todayRange()
        const now  = new Date()

        // ── Métricas base ─────────────────────────────────────────
        const [pR, tR, nR, wR] = await Promise.all([
          supabase.from("patients").select("id",{count:"exact",head:true}).is("deleted_at",null),
          supabase.from("appointments").select("id",{count:"exact",head:true}).gte("datetime",today.start).lte("datetime",today.end).neq("status","cancelled").is("deleted_at",null),
          supabase.from("appointments").select("id,datetime,status,client_id").gte("datetime",now.toISOString()).eq("status","scheduled").is("deleted_at",null).order("datetime",{ascending:true}).limit(5),
          supabase.from("appointments").select("id,status").gte("datetime",week.start).lte("datetime",week.end).is("deleted_at",null),
        ])

        // nomes dos próximos
        const next = nR.data ?? []
        let nextNamed = next
        if (next.length > 0) {
          const ids = [...new Set(next.map(a=>a.client_id).filter(Boolean))]
          const { data: pts } = await supabase.from("patients").select("id,name").in("id",ids)
          const pm = Object.fromEntries((pts??[]).map(p=>[p.id,p.name]))
          nextNamed = next.map(a=>({...a, patientName: pm[a.client_id]??"Paciente"}))
        }
        const wd = wR.data ?? []
        const active = wd.filter(a=>["scheduled","completed"].includes(a.status)).length
        const total  = wd.filter(a=>a.status!=="cancelled").length

        // ── Gráfico 1: Faturamento últimas 8 semanas ──────────────
        const since8w = new Date(now); since8w.setDate(now.getDate()-56)
        const { data: payData } = await supabase.from("payments")
          .select("final_amount,created_at")
          .is("deleted_at",null)
          .eq("status","paid")
          .gte("created_at", since8w.toISOString())
          .order("created_at",{ascending:true})

        const weekBuckets = {}
        ;(payData??[]).forEach(p => {
          const d = new Date(p.created_at)
          const mon = new Date(d); mon.setDate(d.getDate()-(d.getDay()===0?6:d.getDay()-1)); mon.setHours(0,0,0,0)
          const key = mon.toLocaleDateString("pt-BR",{day:"2-digit",month:"2-digit"})
          weekBuckets[key] = (weekBuckets[key]||0) + parseFloat(p.final_amount||0)
        })
        const revenueByWeek = Object.entries(weekBuckets).map(([semana,valor])=>({semana,valor}))

        // ── Gráfico 2: Agendamentos por status (mês atual) ─────────
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
        const { data: apptMonth } = await supabase.from("appointments")
          .select("status").is("deleted_at",null)
          .gte("datetime", monthStart)
        const statusCount = { scheduled:0, completed:0, cancelled:0, no_show:0 }
        ;(apptMonth??[]).forEach(a => { if (statusCount[a.status]!==undefined) statusCount[a.status]++ })
        const statusPie = [
          { name:"Agendado",  value: statusCount.scheduled, color:"#3b82f6" },
          { name:"Concluído", value: statusCount.completed,  color:"#22c55e" },
          { name:"Cancelado", value: statusCount.cancelled,  color:"#ef4444" },
          { name:"Não veio",  value: statusCount.no_show,    color:"#f59e0b" },
        ].filter(s=>s.value>0)

        // ── Gráfico 3: Ocupação por dia da semana ──────────────────
        const { data: apptAll } = await supabase.from("appointments")
          .select("datetime,status").is("deleted_at",null)
        const dayBuckets = [0,1,2,3,4,5,6].map(d=>({ dia:DAYS[d], total:0, concluido:0, falta:0 }))
        ;(apptAll??[]).forEach(a => {
          const dow = new Date(a.datetime).getDay()
          dayBuckets[dow].total++
          if (a.status==="completed") dayBuckets[dow].concluido++
          if (a.status==="no_show")   dayBuckets[dow].falta++
        })
        // remove dom/seg (folga)
        const occupancyByDay = dayBuckets.filter((_,i)=>i!==0&&i!==1)

        // ── Gráfico 4: Crescimento de pacientes (últimos 6 meses) ──
        const { data: patsAll } = await supabase.from("patients")
          .select("created_at").is("deleted_at",null).order("created_at",{ascending:true})
        const growthMap = {}
        let running = 0
        ;(patsAll??[]).forEach(p => {
          const d = new Date(p.created_at)
          const key = d.toLocaleDateString("pt-BR",{month:"short",year:"2-digit"})
          growthMap[key] = (growthMap[key]||0) + 1
        })
        // transforma em acumulado dos últimos 6 meses
        const allKeys = Object.keys(growthMap)
        const last6   = allKeys.slice(-6)
        let acc = 0
        // calcula acumulado até o início dos últimos 6
        const before6Keys = allKeys.slice(0, allKeys.length-6)
        before6Keys.forEach(k => { acc += growthMap[k] })
        const patientGrowth = last6.map(mes => {
          acc += growthMap[mes]
          return { mes, total: acc }
        })

        setData({
          totalPatients: pR.count??0, todayAppointments: tR.count??0,
          nextAppointments: nextNamed,
          weekOccupancy: total>0?Math.round((active/total)*100):0,
          weekNoShow: wd.filter(a=>a.status==="no_show").length,
          revenueByWeek, statusPie, occupancyByDay, patientGrowth,
          loading: false, error: null,
        })
      } catch(err) {
        setData(p=>({...p, loading:false, error:err.message}))
      }
    }
    fetchAll()
  }, [clinicId])

  return data
}

// ─── Tooltip customizado ──────────────────────────────────────────────────────

function CustomTooltip({ active, payload, label, currency }) {
  if (!active||!payload?.length) return null
  return (
    <div style={{ background:"#0f172a", border:"1px solid #1e293b", borderRadius:8, padding:"10px 14px", fontSize:13, fontFamily:"'DM Sans',sans-serif" }}>
      <p style={{ color:"#64748b", margin:"0 0 6px", fontWeight:600 }}>{label}</p>
      {payload.map((p,i)=>(
        <p key={i} style={{ color:p.color, margin:"2px 0", fontWeight:700 }}>
          {p.name}: {currency ? formatCurrency(p.value) : p.value}
        </p>
      ))}
    </div>
  )
}

// ─── Componentes de seção ─────────────────────────────────────────────────────

function SectionCard({ title, children, span }) {
  const { t } = useTheme()
  return (
    <div style={{ background:t.bgCard, borderRadius:12, padding:24, gridColumn:span?`span ${span}`:undefined }}>
      <p style={{ fontSize:12, fontWeight:700, color:t.textGhost, textTransform:"uppercase", letterSpacing:"0.1em", margin:"0 0 20px" }}>{title}</p>
      {children}
    </div>
  )
}

function MetricCard({ label, value, sub, accent }) {
  const { t } = useTheme()
  return (
    <div style={{ background:t.bgCard, borderRadius:12, padding:"20px 18px", display:"flex", flexDirection:"column", gap:4, borderTop:`3px solid ${accent}`, minWidth:0 }}>
      <span style={{ fontSize:32, fontWeight:800, lineHeight:1, letterSpacing:"-1px", color:accent, wordBreak:"break-word" }}>{value}</span>
      <span style={{ fontSize:13, fontWeight:600, color:t.textBody, marginTop:6 }}>{label}</span>
      {sub && <span style={{ fontSize:11, color:t.textGhost }}>{sub}</span>}
    </div>
  )
}

function Skeleton({ h=80 }) {
  const { t } = useTheme()
  return <div style={{ background:t.bgCard, borderRadius:12, padding:24 }}><div className="skeleton-shimmer" style={{ height:h }}/></div>
}

function NextAppointmentsList({ items }) {
  const { t } = useTheme()
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:0 }}>
      {items.length === 0 ? (
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", padding:"32px 0", gap:6 }}>
          <span style={{ fontSize:32 }}>📅</span>
          <p style={{ fontSize:14, color:t.textGhost, margin:0, fontWeight:600 }}>Nenhum agendamento pendente</p>
        </div>
      ) : items.map(appt => {
        const st = STATUS_STYLE[appt.status]??STATUS_STYLE.scheduled
        return (
          <div key={appt.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"12px 0", borderBottom:`1px solid ${t.bgInset}` }}>
            <div style={{ display:"flex", flexDirection:"column", gap:2 }}>
              <span style={{ fontSize:16, fontWeight:700, color:t.textPrimary }}>{formatTime(appt.datetime)}</span>
              <span style={{ fontSize:11, color:t.textGhost, textTransform:"capitalize" }}>{formatDate(appt.datetime)}</span>
            </div>
            <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:4 }}>
              <span style={{ fontSize:13, fontWeight:600, color:t.textBody }}>{appt.patientName??"—"}</span>
              <span style={{ fontSize:11, fontWeight:600, padding:"3px 10px", borderRadius:20, color:st.color, background:st.bg }}>{st.label}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const { clinicId, clinic } = useAuth()
  const { t }  = useTheme()
  const isMobile = useIsMobile()
  const d = useDashboardData(clinicId)

  const gridCols = isMobile ? "1fr" : "repeat(2, 1fr)"

  return (
    <AppLayout>
      <div style={{ color:t.textBody, fontFamily:"'DM Sans','Segoe UI',sans-serif" }}>

        {/* Header */}
        <header style={{ marginBottom:28 }}>
          <h1 style={{ fontSize:isMobile?22:28, fontWeight:800, margin:0, color:t.textPrimary, letterSpacing:"-0.5px" }}>
            {clinic?.name ?? "Dashboard"}
          </h1>
          <p style={{ margin:"4px 0 0", fontSize:13, color:t.textFaint }}>Visão geral da clínica</p>
        </header>

        {d.error && (
          <div style={{ background:"#450a0a", color:"#fca5a5", border:"1px solid #7f1d1d", borderRadius:8, padding:"10px 16px", fontSize:13, marginBottom:20 }}>
            ⚠️ {d.error}
          </div>
        )}

        {/* ── Métricas ── */}
        <div style={{ display:"grid", gridTemplateColumns: isMobile?"1fr 1fr":"repeat(5,1fr)", gap:12, marginBottom:20 }}>
          {d.loading ? [1,2,3,4,5].map(i=><Skeleton key={i} h={88}/>) : <>
            <MetricCard label="Pacientes ativos"   value={d.totalPatients}           sub="total cadastrado"       accent="#3b82f6"/>
            <MetricCard label="Agendamentos hoje"  value={d.todayAppointments}        sub="excluindo cancelados"   accent="#8b5cf6"/>
            <MetricCard label="Próximos na fila"   value={d.nextAppointments.length}  sub="aguardando"             accent="#f59e0b"/>
            <MetricCard label="Ocupação semanal"   value={`${d.weekOccupancy??0}%`}   sub="desta semana"           accent="#22c55e"/>
            <MetricCard label="Faltas esta semana" value={d.weekNoShow??0}            sub="não compareceram"       accent="#ef4444"/>
          </>}
        </div>

        {/* ── Gráficos linha 1: Faturamento + Status pie ── */}
        <div style={{ display:"grid", gridTemplateColumns: isMobile?"1fr":"2fr 1fr", gap:16, marginBottom:16 }}>

          {/* Faturamento por semana */}
          {d.loading ? <Skeleton h={240}/> : (
            <SectionCard title="Faturamento por semana (R$)">
              {d.revenueByWeek.length === 0 ? (
                <p style={{ color:t.textGhost, fontSize:13, textAlign:"center", padding:"40px 0" }}>Nenhum pagamento registrado</p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={d.revenueByWeek} margin={{ top:4, right:4, left:-16, bottom:0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false}/>
                    <XAxis dataKey="semana" tick={{ fill:"#475569", fontSize:11 }} axisLine={false} tickLine={false}/>
                    <YAxis tick={{ fill:"#475569", fontSize:11 }} axisLine={false} tickLine={false} tickFormatter={v=>`R$${(v/1000).toFixed(0)}k`}/>
                    <Tooltip content={<CustomTooltip currency/>}/>
                    <Bar dataKey="valor" name="Faturamento" fill="#3b82f6" radius={[4,4,0,0]}>
                      {d.revenueByWeek.map((_,i)=>(
                        <Cell key={i} fill={i===d.revenueByWeek.length-1?"#60a5fa":"#3b82f6"}/>
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </SectionCard>
          )}

          {/* Pizza por status */}
          {d.loading ? <Skeleton h={240}/> : (
            <SectionCard title="Agendamentos por status (mês)">
              {d.statusPie.length === 0 ? (
                <p style={{ color:t.textGhost, fontSize:13, textAlign:"center", padding:"40px 0" }}>Sem dados este mês</p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={d.statusPie} cx="50%" cy="45%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                      {d.statusPie.map((s,i)=><Cell key={i} fill={s.color}/>)}
                    </Pie>
                    <Tooltip content={<CustomTooltip/>}/>
                    <Legend iconType="circle" iconSize={8} formatter={v=><span style={{ color:"#64748b", fontSize:12 }}>{v}</span>}/>
                  </PieChart>
                </ResponsiveContainer>
              )}
            </SectionCard>
          )}
        </div>

        {/* ── Gráficos linha 2: Ocupação por dia + Crescimento pacientes ── */}
        <div style={{ display:"grid", gridTemplateColumns: isMobile?"1fr":"1fr 1fr", gap:16, marginBottom:16 }}>

          {/* Ocupação por dia da semana */}
          {d.loading ? <Skeleton h={220}/> : (
            <SectionCard title="Atendimentos por dia da semana">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={d.occupancyByDay} margin={{ top:4, right:4, left:-16, bottom:0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false}/>
                  <XAxis dataKey="dia" tick={{ fill:"#475569", fontSize:12 }} axisLine={false} tickLine={false}/>
                  <YAxis tick={{ fill:"#475569", fontSize:11 }} axisLine={false} tickLine={false}/>
                  <Tooltip content={<CustomTooltip/>}/>
                  <Bar dataKey="concluido" name="Concluído" stackId="a" fill="#22c55e" radius={[0,0,0,0]}/>
                  <Bar dataKey="falta"     name="Não veio"  stackId="a" fill="#f59e0b" radius={[0,0,0,0]}/>
                  <Bar dataKey="total"     name="Total"     fill="#3b82f620" radius={[4,4,0,0]}/>
                </BarChart>
              </ResponsiveContainer>
            </SectionCard>
          )}

          {/* Crescimento de pacientes */}
          {d.loading ? <Skeleton h={220}/> : (
            <SectionCard title="Crescimento de pacientes">
              {d.patientGrowth.length < 2 ? (
                <p style={{ color:t.textGhost, fontSize:13, textAlign:"center", padding:"40px 0" }}>Dados insuficientes</p>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={d.patientGrowth} margin={{ top:4, right:4, left:-16, bottom:0 }}>
                    <defs>
                      <linearGradient id="pgGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.25}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false}/>
                    <XAxis dataKey="mes" tick={{ fill:"#475569", fontSize:11 }} axisLine={false} tickLine={false}/>
                    <YAxis tick={{ fill:"#475569", fontSize:11 }} axisLine={false} tickLine={false}/>
                    <Tooltip content={<CustomTooltip/>}/>
                    <Area type="monotone" dataKey="total" name="Pacientes" stroke="#3b82f6" strokeWidth={2} fill="url(#pgGrad)" dot={{ fill:"#3b82f6", r:3 }}/>
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </SectionCard>
          )}
        </div>

        {/* ── Próximos atendimentos ── */}
        <div style={{ display:"grid", gridTemplateColumns: isMobile?"1fr":"2fr 1fr", gap:16 }}>
          {d.loading
            ? <Skeleton h={180}/>
            : <SectionCard title="Próximos atendimentos"><NextAppointmentsList items={d.nextAppointments}/></SectionCard>}

          {/* Barra de ocupação semanal */}
          {!d.loading && (
            <SectionCard title="Ocupação semanal">
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
                <span style={{ fontSize:13, color:t.textGhost }}>Esta semana</span>
                <span style={{ fontSize:32, fontWeight:800, color:t.textPrimary }}>{d.weekOccupancy??0}%</span>
              </div>
              <div style={{ height:10, background:t.bgInset, borderRadius:99, overflow:"hidden", marginBottom:12 }}>
                <div style={{ height:"100%", borderRadius:99, transition:"width .6s ease",
                  width:`${d.weekOccupancy??0}%`,
                  background:(d.weekOccupancy??0)>=80?"#22c55e":(d.weekOccupancy??0)>=50?"#f59e0b":"#64748b"
                }}/>
              </div>
              <p style={{ fontSize:12, color:t.textGhost, margin:0 }}>
                {(d.weekOccupancy??0)>=80?"🔥 Agenda bem ocupada":(d.weekOccupancy??0)>=50?"📊 Ocupação moderada":"📭 Agenda com espaço"}
              </p>
            </SectionCard>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
