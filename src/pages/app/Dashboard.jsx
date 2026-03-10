import { useEffect, useState } from "react"
import { supabase } from "../../supabaseClient"
import { useAuth } from "../../context/AuthContext"
import { useTheme } from "../../context/ThemeContext"
import AppLayout from "../AppLayout"

function todayRange() {
  const s = new Date(); s.setHours(0,0,0,0)
  const e = new Date(); e.setHours(23,59,59,999)
  return { start: s.toISOString(), end: e.toISOString() }
}
function weekRange() {
  const now = new Date(); const day = now.getDay()
  const mon = new Date(now); mon.setDate(now.getDate() + (day===0?-6:1-day)); mon.setHours(0,0,0,0)
  const sun = new Date(mon); sun.setDate(mon.getDate()+6); sun.setHours(23,59,59,999)
  return { start: mon.toISOString(), end: sun.toISOString() }
}
function formatTime(iso) { return iso ? new Date(iso).toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"}) : "--" }
function formatDate(iso) { return iso ? new Date(iso).toLocaleDateString("pt-BR",{weekday:"short",day:"2-digit",month:"short"}) : "--" }

const STATUS_STYLE = {
  scheduled: { label: "Agendado",  color: "#3b82f6", bg: "#0c1f3a" },
  completed: { label: "Concluído", color: "#22c55e", bg: "#052e16" },
  cancelled: { label: "Cancelado", color: "#ef4444", bg: "#450a0a" },
  no_show:   { label: "Não veio",  color: "#f59e0b", bg: "#1c1107" },
}

function useDashboardMetrics(clinicId) {
  const [metrics, setMetrics] = useState({ totalPatients:null, todayAppointments:null, nextAppointments:[], weekOccupancy:null, weekNoShow:null, loading:true, error:null })
  useEffect(() => {
    if (!clinicId) return
    async function fetchAll() {
      try {
        const week = weekRange(); const today = todayRange()
        const [pR, tR, nR, wR] = await Promise.all([
          supabase.from("patients").select("id",{count:"exact",head:true}).is("deleted_at",null),
          supabase.from("appointments").select("id",{count:"exact",head:true}).gte("datetime",today.start).lte("datetime",today.end).neq("status","cancelled").is("deleted_at",null),
          supabase.from("appointments").select("id,datetime,status,client_id").gte("datetime",new Date().toISOString()).eq("status","scheduled").is("deleted_at",null).order("datetime",{ascending:true}).limit(5),
          supabase.from("appointments").select("id,status").gte("datetime",week.start).lte("datetime",week.end).is("deleted_at",null),
        ])
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
        const total = wd.filter(a=>a.status!=="cancelled").length
        setMetrics({ totalPatients: pR.count??0, todayAppointments: tR.count??0, nextAppointments: nextNamed, weekOccupancy: total>0?Math.round((active/total)*100):0, weekNoShow: wd.filter(a=>a.status==="no_show").length, loading:false, error:null })
      } catch(err) { setMetrics(p=>({...p,loading:false,error:err.message})) }
    }
    fetchAll()
  }, [clinicId])
  return metrics
}

function MetricCard({ label, value, sub, accent }) {
  const { t } = useTheme()
  return (
    <div style={{ background: t.bgCard, borderRadius: 12, padding: "24px 20px", display: "flex", flexDirection: "column", gap: 4, borderTop: `3px solid ${accent}` }}>
      <span style={{ fontSize: 36, fontWeight: 800, lineHeight: 1, letterSpacing: "-1px", color: accent }}>{value}</span>
      <span style={{ fontSize: 13, fontWeight: 600, color: t.textBody, marginTop: 6 }}>{label}</span>
      {sub && <span style={{ fontSize: 11, color: t.textGhost }}>{sub}</span>}
    </div>
  )
}

function MetricSkeleton() {
  const { t } = useTheme()
  return <div style={{ background: t.bgCard, borderRadius: 12, padding: "24px 20px" }}><div className="skeleton-shimmer" style={{ height: 72 }} /></div>
}

function OccupancyBar({ value }) {
  const { t } = useTheme()
  return (
    <div style={{ background: t.bgCard, borderRadius: 12, padding: "24px 20px", display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: t.textMuted, textTransform: "uppercase", letterSpacing: "0.08em" }}>Ocupação semanal</span>
        <span style={{ fontSize: 28, fontWeight: 800, color: t.textPrimary }}>{value}%</span>
      </div>
      <div style={{ height: 12, background: t.bgInset, borderRadius: 99, overflow: "hidden" }}>
        <div style={{ height: "100%", borderRadius: 99, transition: "width 0.6s ease", width: `${value}%`, background: value>=80?"#22c55e":value>=50?"#f59e0b":"#64748b" }} />
      </div>
      <p style={{ fontSize: 12, color: t.textGhost, margin: 0 }}>
        {value>=80 ? "🔥 Agenda bem ocupada esta semana" : value>=50 ? "📊 Ocupação moderada" : "📭 Agenda com espaço disponível"}
      </p>
    </div>
  )
}

function NextAppointmentsList({ items }) {
  const { t } = useTheme()
  return (
    <div style={{ background: t.bgCard, borderRadius: 12, padding: "24px 20px", display: "flex", flexDirection: "column" }}>
      <span style={{ fontSize: 13, fontWeight: 700, color: t.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 16 }}>Próximos atendimentos</span>
      {items.length === 0 ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "32px 0", gap: 6 }}>
          <span style={{ fontSize: 32 }}>📅</span>
          <p style={{ fontSize: 14, color: t.textGhost, margin: 0, fontWeight: 600 }}>Nenhum agendamento pendente</p>
          <p style={{ fontSize: 12, color: t.textDisabled, margin: 0 }}>Os próximos atendimentos aparecerão aqui</p>
        </div>
      ) : items.map(appt => {
        const st = STATUS_STYLE[appt.status] ?? STATUS_STYLE.scheduled
        return (
          <div key={appt.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: `1px solid ${t.bgInset}` }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <span style={{ fontSize: 16, fontWeight: 700, color: t.textPrimary }}>{formatTime(appt.datetime)}</span>
              <span style={{ fontSize: 11, color: t.textGhost, textTransform: "capitalize" }}>{formatDate(appt.datetime)}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: t.textBody }}>{appt.patientName ?? "—"}</span>
              <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20, color: st.color, background: st.bg }}>{st.label}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function Dashboard() {
  const { clinicId, clinic } = useAuth()
  const { t } = useTheme()
  const metrics = useDashboardMetrics(clinicId)
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)

  useEffect(() => {
    function handleResize() { setIsMobile(window.innerWidth <= 768) }
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  return (
    <AppLayout>
      <div style={{ color: t.textBody, fontFamily: "'DM Sans','Segoe UI',sans-serif" }}>
        <header style={{ marginBottom: isMobile ? 20 : 36 }}>
          <h1 style={{ fontSize: isMobile ? 22 : 28, fontWeight: 700, margin: 0, color: t.textPrimary, letterSpacing: "-0.5px" }}>{clinic?.name ?? "Dashboard"}</h1>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: t.textFaint }}>Visão geral da clínica</p>
        </header>

        {metrics.error && <div style={{ background: t.errorBg, color: t.errorText, border: `1px solid ${t.errorBorder}`, borderRadius: 8, padding: "10px 16px", fontSize: 13, marginBottom: 20 }}>⚠️ {metrics.error}</div>}

        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(auto-fit, minmax(180px, 1fr))", gap: isMobile ? 10 : 16, marginBottom: isMobile ? 12 : 24 }}>
          {metrics.loading ? [1,2,3,4,5].map(i=><MetricSkeleton key={i}/>) : <>
            <MetricCard label="Pacientes ativos"    value={metrics.totalPatients}          sub="total cadastrado"               accent="#3b82f6" />
            <MetricCard label="Agendamentos hoje"   value={metrics.todayAppointments}       sub="excluindo cancelados"           accent="#8b5cf6" />
            <MetricCard label="Próximos na fila"    value={metrics.nextAppointments.length} sub="aguardando atendimento"         accent="#f59e0b" />
            <MetricCard label="Ocupação semanal"    value={`${metrics.weekOccupancy??0}%`}  sub="desta semana"                   accent="#22c55e" />
            <MetricCard label="Faltas esta semana"  value={metrics.weekNoShow??0}           sub="não compareceram"               accent="#ef4444" />
          </>}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 340px", gap: isMobile ? 12 : 16 }}>
          {metrics.loading
            ? <div style={{ background: t.bgCard, borderRadius: 12, padding: 24 }}>{[1,2,3].map(i=><div key={i} className="skeleton-shimmer" style={{ height: 48, marginBottom: 8 }}/>)}</div>
            : <NextAppointmentsList items={metrics.nextAppointments} />}
          {metrics.loading
            ? <div style={{ background: t.bgCard, borderRadius: 12, padding: 24 }}><div className="skeleton-shimmer" style={{ height: 120 }}/></div>
            : <OccupancyBar value={metrics.weekOccupancy??0} />}
        </div>
      </div>
    </AppLayout>
  )
}
