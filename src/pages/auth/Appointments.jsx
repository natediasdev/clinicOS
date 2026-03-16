import { useEffect, useState, useRef } from "react"
import { useAuth } from "../../context/AuthContext"
import { useTheme } from "../../context/ThemeContext"
import { supabase } from "../../supabaseClient"
import AppLayout from "../AppLayout"

// ─── Constantes ───────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  scheduled: { label: "Agendado",  color: "#3b82f6", bg: "#0c1f3a" },
  completed: { label: "Concluído", color: "#22c55e", bg: "#052e16" },
  cancelled: { label: "Cancelado", color: "#ef4444", bg: "#450a0a" },
  no_show:   { label: "Não veio",  color: "#f59e0b", bg: "#1c1107" },
}

const DAYS_PT   = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"]
const MONTHS_PT = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"]

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDateTime(iso) {
  if (!iso) return "--"
  return new Date(iso).toLocaleString("pt-BR", { day:"2-digit", month:"2-digit", year:"numeric", hour:"2-digit", minute:"2-digit" })
}
function formatTime(iso) {
  if (!iso) return "--"
  return new Date(iso).toLocaleTimeString("pt-BR", { hour:"2-digit", minute:"2-digit" })
}
function isSameDay(a, b) {
  return a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate()
}
function getDaysInMonth(year, month) { return new Date(year, month+1, 0).getDate() }
function getFirstDayOfMonth(year, month) { return new Date(year, month, 1).getDay() }

// ─── useIsMobile ──────────────────────────────────────────────────────────────

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)
  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth <= 768)
    window.addEventListener("resize", fn)
    return () => window.removeEventListener("resize", fn)
  }, [])
  return isMobile
}

// ─── Toast ────────────────────────────────────────────────────────────────────

function Toast({ toast }) {
  if (!toast) return null
  const ok = toast.type === "success"
  return (
    <div style={{
      position:"fixed", bottom:24, right:24, zIndex:999,
      background: ok ? "#052e16" : "#450a0a",
      border: `1px solid ${ok ? "#166534" : "#7f1d1d"}`,
      color: ok ? "#86efac" : "#fca5a5",
      borderRadius:10, padding:"12px 20px", fontSize:14, fontWeight:600,
      fontFamily:"'DM Sans','Segoe UI',sans-serif", boxShadow:"0 8px 24px rgba(0,0,0,0.4)",
    }}>
      {ok ? "✓" : "✕"} {toast.message}
    </div>
  )
}

// ─── StatusBadge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] ?? { label:status, color:"#64748b", bg:"#1e293b" }
  return (
    <span style={{ fontSize:11, fontWeight:700, padding:"3px 10px", borderRadius:99, color:cfg.color, background:cfg.bg, border:`1px solid ${cfg.color}22`, textTransform:"uppercase", letterSpacing:"0.05em" }}>
      {cfg.label}
    </span>
  )
}

// ─── PatientSearchInput ───────────────────────────────────────────────────────
// Chama useTheme() diretamente — sem depender de props s/t

function PatientSearchInput({ value, onSelect, clinicId }) {
  const { t } = useTheme()
  const [query, setQuery]     = useState(value?.name ?? "")
  const [results, setResults] = useState([])
  const [open, setOpen]       = useState(false)
  const ref = useRef()

  const inp = { background:t.bgCard, border:"1px solid #1e293b", borderRadius:8, padding:"10px 12px", fontSize:14, color:t.textPrimary, outline:"none", transition:"border-color 0.2s", width:"100%", boxSizing:"border-box" }

  useEffect(() => { if (value) setQuery(value.name) }, [value])
  useEffect(() => {
    const fn = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener("mousedown", fn)
    return () => document.removeEventListener("mousedown", fn)
  }, [])

  async function search(q) {
    setQuery(q); onSelect(null)
    if (q.length < 2) { setResults([]); setOpen(false); return }
    let req = supabase.from("patients").select("id,name,phone").is("deleted_at",null).ilike("name",`%${q}%`).limit(6)
    if (clinicId) req = req.eq("clinic_id", clinicId)
    const { data } = await req
    setResults(data ?? [])
    setOpen(true)
  }

  return (
    <div ref={ref} style={{ position:"relative" }}>
      <input type="text" placeholder="Digite o nome do paciente..." value={query} onChange={e=>search(e.target.value)} style={inp}
        onFocus={e=>{ e.target.style.borderColor="#3b82f6"; if (results.length) setOpen(true) }}
        onBlur={e=>e.target.style.borderColor="#1e293b"} />
      {open && results.length > 0 && (
        <div style={{ position:"absolute", top:"calc(100% + 4px)", left:0, right:0, background:t.bgCard, border:"1px solid #334155", borderRadius:8, zIndex:50, overflow:"hidden", boxShadow:"0 8px 24px rgba(0,0,0,0.4)" }}>
          {results.map(p => (
            <div key={p.id} onMouseDown={()=>{ onSelect(p); setQuery(p.name); setOpen(false) }}
              style={{ padding:"10px 16px", cursor:"pointer", display:"flex", flexDirection:"column", gap:2, borderBottom:"1px solid #0f172a" }}>
              <span style={{ fontWeight:600, color:"#f1f5f9" }}>{p.name}</span>
              {p.phone && <span style={{ fontSize:12, color:"#475569" }}>{p.phone}</span>}
            </div>
          ))}
        </div>
      )}
      {open && query.length >= 2 && results.length === 0 && (
        <div style={{ position:"absolute", top:"calc(100% + 4px)", left:0, right:0, background:t.bgCard, border:"1px solid #334155", borderRadius:8, zIndex:50 }}>
          <div style={{ padding:"12px 16px", fontSize:13, color:"#475569" }}>Nenhum paciente encontrado</div>
        </div>
      )}
    </div>
  )
}

// ─── AppointmentModal ─────────────────────────────────────────────────────────
// Chama useTheme() diretamente — sem depender de props s/t

function AppointmentModal({ onClose, onSave, staffList, clinicId }) {
  const { t } = useTheme()
  const [patient,  setPatient]  = useState(null)
  const [staffId,  setStaffId]  = useState("")
  const [datetime, setDatetime] = useState("")
  const [status,   setStatus]   = useState("scheduled")
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState(null)

  const inp = { background:t.bgCard, border:"1px solid #1e293b", borderRadius:8, padding:"10px 12px", fontSize:14, color:t.textPrimary, outline:"none", transition:"border-color 0.2s", width:"100%", boxSizing:"border-box" }

  useEffect(() => {
    const fn = e => { if (e.key === "Escape") onClose() }
    window.addEventListener("keydown", fn)
    return () => window.removeEventListener("keydown", fn)
  }, [])

  async function handleSave() {
    if (!patient)  { setError("Selecione um paciente"); return }
    if (!datetime) { setError("Informe a data e hora"); return }
    setError(null); setLoading(true)
    const { error } = await supabase.from("appointments").insert([{
      clinic_id:clinicId, client_id:patient.id, staff_id:staffId||null, datetime, status
    }])
    setLoading(false)
    if (error) { setError(error.message); return }
    onSave(patient.name)
  }

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.7)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:100, padding:24 }}
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{ background:t.bgInset, border:"1px solid #1e293b", borderRadius:16, width:"100%", maxWidth:480, display:"flex", flexDirection:"column" }}>

        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"20px 24px", borderBottom:"1px solid #1e293b" }}>
          <h2 style={{ fontSize:16, fontWeight:700, color:t.textPrimary, margin:0 }}>Novo agendamento</h2>
          <button style={{ background:"transparent", border:"none", color:t.textGhost, fontSize:18, cursor:"pointer" }} onClick={onClose}>✕</button>
        </div>

        <div style={{ padding:24, display:"flex", flexDirection:"column", gap:16 }}>
          <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
            <label style={{ fontSize:12, fontWeight:600, color:t.textFaint }}>Paciente *</label>
            <PatientSearchInput value={patient} onSelect={setPatient} clinicId={clinicId} />
          </div>

          <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
            <label style={{ fontSize:12, fontWeight:600, color:t.textFaint }}>Data e hora *</label>
            <input type="datetime-local" value={datetime} onChange={e=>setDatetime(e.target.value)} style={inp}
              onFocus={e=>e.target.style.borderColor="#3b82f6"} onBlur={e=>e.target.style.borderColor="#1e293b"} />
          </div>

          {staffList.length > 0 && (
            <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
              <label style={{ fontSize:12, fontWeight:600, color:t.textFaint }}>Profissional</label>
              <select value={staffId} onChange={e=>setStaffId(e.target.value)} style={{ ...inp, cursor:"pointer" }}>
                <option value="">Sem profissional definido</option>
                {staffList.map(st=><option key={st.id} value={st.id}>{st.name}</option>)}
              </select>
            </div>
          )}

          <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
            <label style={{ fontSize:12, fontWeight:600, color:t.textFaint }}>Status</label>
            <select value={status} onChange={e=>setStatus(e.target.value)} style={{ ...inp, cursor:"pointer" }}>
              {Object.entries(STATUS_CONFIG).map(([k,cfg])=><option key={k} value={k}>{cfg.label}</option>)}
            </select>
          </div>

          {error && <div style={{ background:"#450a0a", border:"1px solid #7f1d1d", color:"#fca5a5", borderRadius:8, padding:"10px 14px", fontSize:13 }}>{error}</div>}
        </div>

        <div style={{ display:"flex", justifyContent:"flex-end", gap:10, padding:"16px 24px", borderTop:"1px solid #1e293b" }}>
          <button style={{ background:"transparent", border:"1px solid #334155", color:t.textMuted, borderRadius:8, padding:"10px 18px", fontSize:14, cursor:"pointer" }} onClick={onClose}>Cancelar</button>
          <button style={{ background:"#3b82f6", border:"none", color:"#fff", borderRadius:8, padding:"10px 20px", fontSize:14, fontWeight:700, cursor:"pointer", opacity:loading||!patient||!datetime?0.5:1 }}
            onClick={handleSave} disabled={loading||!patient||!datetime}>
            {loading ? "Salvando..." : "Agendar"}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── CalendarView ─────────────────────────────────────────────────────────────
// Chama useTheme() diretamente — sem depender de props s/t

function CalendarView({ appointments, onDayClick }) {
  const { t } = useTheme()
  const [current, setCurrent] = useState(new Date())
  const year  = current.getFullYear()
  const month = current.getMonth()
  const today = new Date()

  const cells = []
  for (let i = 0; i < getFirstDayOfMonth(year, month); i++) cells.push(null)
  for (let d = 1; d <= getDaysInMonth(year, month); d++) cells.push(d)

  function getApptsByDay(day) {
    return appointments.filter(a=>isSameDay(new Date(a.datetime), new Date(year,month,day)))
  }

  return (
    <div style={{ background:t.bgCard, borderRadius:12, padding:24 }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
        <button style={{ background:"transparent", border:"1px solid #334155", color:t.textMuted, borderRadius:8, padding:"6px 14px", fontSize:18, cursor:"pointer" }}
          onClick={()=>setCurrent(new Date(year,month-1,1))}>‹</button>
        <span style={{ fontSize:16, fontWeight:700, color:t.textPrimary }}>{MONTHS_PT[month]} {year}</span>
        <button style={{ background:"transparent", border:"1px solid #334155", color:t.textMuted, borderRadius:8, padding:"6px 14px", fontSize:18, cursor:"pointer" }}
          onClick={()=>setCurrent(new Date(year,month+1,1))}>›</button>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:4 }}>
        {DAYS_PT.map(d=><div key={d} style={{ fontSize:11, fontWeight:700, color:t.textGhost, textAlign:"center", padding:"4px 0 8px", textTransform:"uppercase" }}>{d}</div>)}
        {cells.map((day,i) => {
          if (!day) return <div key={`e-${i}`} />
          const appts   = getApptsByDay(day)
          const isToday = isSameDay(new Date(year,month,day), today)
          return (
            <div key={day}
              style={{ minHeight:72, background:t.bgInset, borderRadius:8, padding:"6px 8px", cursor:appts.length?"pointer":"default", border:isToday?"1px solid #3b82f6":"1px solid transparent" }}
              onClick={()=>appts.length&&onDayClick(new Date(year,month,day),appts)}>
              <span style={{ fontSize:13, color:isToday?"#3b82f6":t.textFaint, fontWeight:isToday?800:400, display:"block", marginBottom:4 }}>{day}</span>
              <div style={{ display:"flex", gap:3, flexWrap:"wrap", alignItems:"center" }}>
                {appts.slice(0,3).map((a,idx)=>(
                  <span key={idx} style={{ width:7, height:7, borderRadius:"50%", display:"inline-block", background:STATUS_CONFIG[a.status]?.color??"#64748b" }} title={formatTime(a.datetime)} />
                ))}
                {appts.length > 3 && <span style={{ fontSize:10, color:t.textGhost }}>+{appts.length-3}</span>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function Appointments() {
  const { clinicId } = useAuth()
  const { t }        = useTheme()
  const isMobile     = useIsMobile()

  const [appointments,   setAppointments]   = useState([])
  const [staffList,      setStaffList]      = useState([])
  const [patientMap,     setPatientMap]     = useState({})
  const [staffMap,       setStaffMap]       = useState({})
  const [fetching,       setFetching]       = useState(true)
  const [showModal,      setShowModal]      = useState(false)
  const [view,           setView]           = useState("list")
  const [filterStatus,   setFilterStatus]   = useState("all")
  const [toast,          setToast]          = useState(null)
  const [selectedDay,    setSelectedDay]    = useState(null)
  const [changingStatus, setChangingStatus] = useState(null)
  const [query,          setQuery]          = useState("")
  const [searching,      setSearching]      = useState(false)
  const [remoteAppts,    setRemoteAppts]    = useState(null)
  const searchTimerAppt                     = useRef(null)

  // styles locais usados apenas neste componente
  const s = {
    btnPrimary:      { background:"#3b82f6", border:"none", color:"#fff", borderRadius:8, padding:"10px 20px", fontSize:14, fontWeight:700, cursor:"pointer" },
    viewToggle:      { display:"flex", background:t.bgInset, borderRadius:8, border:"1px solid #1e293b", overflow:"hidden" },
    toggleBtn:       { background:"transparent", border:"none", color:t.textGhost, padding:"8px 16px", fontSize:13, fontWeight:600, cursor:"pointer" },
    toggleBtnActive: { background:t.bgCard, color:t.textPrimary },
    filterBtn:       { background:"transparent", border:"1px solid #1e293b", color:t.textFaint, borderRadius:8, padding:"6px 14px", fontSize:13, fontWeight:600, cursor:"pointer", display:"flex", alignItems:"center", gap:6 },
    filterBtnActive: { background:t.bgCard, color:t.textPrimary, borderColor:t.borderStrong },
    filterCount:     { background:t.bgInset, borderRadius:99, padding:"1px 7px", fontSize:11 },
    listCard:        { background:t.bgCard, borderRadius:12, padding:24, overflow:"hidden" },
    table:           { width:"100%", borderCollapse:"collapse" },
    th:              { fontSize:11, fontWeight:700, color:t.textGhost, textTransform:"uppercase", letterSpacing:"0.08em", padding:"0 12px 12px", textAlign:"left", borderBottom:"1px solid #0f172a" },
    tr:              { borderBottom:"1px solid #0f172a" },
    td:              { padding:"14px 12px", fontSize:14, verticalAlign:"middle" },
    patientName:     { fontWeight:600, color:t.textPrimary, display:"block" },
    patientPhone:    { fontSize:12, color:t.textGhost, display:"block" },
    tdMain:          { fontWeight:500, color:t.textBody },
    tdMuted:         { color:t.textGhost },
    statusSelect:    { background:t.bgInset, border:"1px solid #1e293b", borderRadius:6, padding:"4px 8px", fontSize:12, fontWeight:700, cursor:"pointer", outline:"none" },
    btnDelete:       { background:"transparent", border:"1px solid #334155", color:t.textFaint, borderRadius:6, padding:"5px 14px", fontSize:12, cursor:"pointer" },
    modalOverlay:    { position:"fixed", inset:0, background:"rgba(0,0,0,0.7)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:100, padding:24 },
    modal:           { background:t.bgInset, border:"1px solid #1e293b", borderRadius:16, width:"100%", maxWidth:480, display:"flex", flexDirection:"column" },
    modalHeader:     { display:"flex", justifyContent:"space-between", alignItems:"center", padding:"20px 24px", borderBottom:"1px solid #1e293b" },
    modalTitle:      { fontSize:16, fontWeight:700, color:t.textPrimary, margin:0 },
    modalClose:      { background:"transparent", border:"none", color:t.textGhost, fontSize:18, cursor:"pointer" },
    modalBody:       { padding:24, display:"flex", flexDirection:"column", gap:16 },
    dayApptRow:      { display:"flex", alignItems:"center", gap:12, padding:"10px 0", borderBottom:"1px solid #1e293b" },
    dayApptTime:     { fontSize:14, fontWeight:700, color:"#3b82f6", width:48, flexShrink:0 },
    dayApptName:     { fontSize:14, fontWeight:600, color:t.textPrimary, flex:1 },
  }

  function showToast(message, type="success") {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  async function fetchAll() {
    setFetching(true)
    const [apptRes, staffRes] = await Promise.all([
      supabase.from("appointments").select("*").is("deleted_at",null).order("datetime",{ascending:true}),
      supabase.from("staff").select("id,name").is("deleted_at",null),
    ])
    const appts = apptRes.data ?? []
    const staff = staffRes.data ?? []
    const clientIds = [...new Set(appts.map(a=>a.client_id).filter(Boolean))]
    let pMap = {}
    if (clientIds.length) {
      const { data: patients } = await supabase.from("patients").select("id,name,phone").in("id",clientIds)
      patients?.forEach(p=>{ pMap[p.id]=p })
    }
    const sMap = {}
    staff.forEach(st=>{ sMap[st.id]=st })
    setAppointments(appts); setStaffList(staff); setPatientMap(pMap); setStaffMap(sMap)
    setFetching(false)
  }

  async function handleStatusChange(id, newStatus) {
    setChangingStatus(id)
    const { error } = await supabase.from("appointments").update({ status:newStatus }).eq("id",id)
    setChangingStatus(null)
    if (!error) { fetchAll(); showToast(`Status atualizado para "${STATUS_CONFIG[newStatus]?.label}"`) }
    else showToast(error.message, "error")
  }

  async function handleDelete(id) {
    const { error } = await supabase.rpc("soft_delete_appointment", { appointment_id: id })
    if (!error) { fetchAll(); showToast("Agendamento removido.", "error") }
    else showToast(error.message, "error")
  }

  function handleSaved(patientName) {
    setShowModal(false); fetchAll()
    showToast(`Agendamento criado para ${patientName}!`)
  }

  useEffect(() => { fetchAll() }, [])

  // Busca local: nome do paciente, data, status, profissional
  function localSearchAppts(list, q) {
    if (!q.trim()) return list
    const lower = q.toLowerCase()
    return list.filter(a => {
      const patName  = patientMap[a.client_id]?.name?.toLowerCase() ?? ""
      const staffName = staffMap[a.staff_id]?.name?.toLowerCase() ?? ""
      const dateStr  = new Date(a.datetime).toLocaleDateString("pt-BR")
      const statusLabel = STATUS_CONFIG[a.status]?.label?.toLowerCase() ?? ""
      return patName.includes(lower) || dateStr.includes(lower) || statusLabel.includes(lower) || staffName.includes(lower)
    })
  }

  async function searchRemoteAppts(q) {
    setSearching(true)
    // Busca no banco por IDs de pacientes que batem com o nome
    const { data: pts } = await supabase.from("patients").select("id").ilike("name", `%${q}%`)
    const ids = pts?.map(p => p.id) ?? []
    let query = supabase.from("appointments").select("*").is("deleted_at", null)
    if (ids.length > 0) query = query.in("client_id", ids)
    else query = query.eq("id", "00000000-0000-0000-0000-000000000000") // retorna vazio se sem match
    const { data } = await query.order("datetime", { ascending: true })
    setRemoteAppts(data ?? [])
    setSearching(false)
  }

  function handleQueryChange(q) {
    setQuery(q)
    setRemoteAppts(null)
    clearTimeout(searchTimerAppt.current)
    if (!q.trim()) return
    const byStatus = STATUS_CONFIG[q.toLowerCase()] ? appointments : []
    const local = localSearchAppts(filterStatus === "all" ? appointments : appointments.filter(a=>a.status===filterStatus), q)
    if (local.length === 0   const filtered = filterStatus === "all" ? appointments : appointments.filter(a=>a.status===filterStatus)  const filtered = filterStatus === "all" ? appointments : appointments.filter(a=>a.status===filterStatus) byStatus.length === 0) {
      searchTimerAppt.current = setTimeout(() => searchRemoteAppts(q), 400)
    }
  }

  const byStatus  = filterStatus === "all" ? appointments : appointments.filter(a=>a.status===filterStatus)
  const filtered  = query.trim()
    ? (remoteAppts !== null ? remoteAppts : localSearchAppts(byStatus, query))
    : byStatus

  return (
    <AppLayout>
      <Toast toast={toast} />

      {showModal && (
        <AppointmentModal onClose={()=>setShowModal(false)} onSave={handleSaved} staffList={staffList} clinicId={clinicId} />
      )}

      {selectedDay && (
        <div style={s.modalOverlay} onClick={()=>setSelectedDay(null)}>
          <div style={s.modal} onClick={e=>e.stopPropagation()}>
            <div style={s.modalHeader}>
              <h2 style={s.modalTitle}>{selectedDay.date.toLocaleDateString("pt-BR",{weekday:"long",day:"2-digit",month:"long"})}</h2>
              <button style={s.modalClose} onClick={()=>setSelectedDay(null)}>✕</button>
            </div>
            <div style={s.modalBody}>
              {selectedDay.appts.map(a=>(
                <div key={a.id} style={s.dayApptRow}>
                  <span style={s.dayApptTime}>{formatTime(a.datetime)}</span>
                  <span style={s.dayApptName}>{patientMap[a.client_id]?.name ?? "—"}</span>
                  <StatusBadge status={a.status} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div style={{ color:t.textBody, fontFamily:"'DM Sans','Segoe UI',sans-serif" }}>
        <header style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:isMobile?16:24, gap:16, flexWrap:"wrap" }}>
          <div>
            <h1 style={{ fontSize:isMobile?22:28, fontWeight:800, margin:0, color:t.textPrimary, letterSpacing:"-0.5px" }}>Agendamentos</h1>
            <p style={{ margin:"4px 0 0", fontSize:13, color:t.textFaint }}>Gerencie a agenda da clínica</p>
          </div>
          <div style={{ display:"flex", gap:10, alignItems:"center", flexWrap:"wrap", width:isMobile?"100%":"auto" }}>
            <div style={s.viewToggle}>
              <button style={view==="list"?{...s.toggleBtn,...s.toggleBtnActive}:s.toggleBtn} onClick={()=>setView("list")}>☰ Lista</button>
              <button style={view==="calendar"?{...s.toggleBtn,...s.toggleBtnActive}:s.toggleBtn} onClick={()=>setView("calendar")}>⊟ Calendário</button>
            </div>
            <button style={{ ...s.btnPrimary, flex:isMobile?1:"unset" }} onClick={()=>setShowModal(true)}>+ Novo agendamento</button>
          </div>
        </header>

        {view === "list" ? (
          <>
            <div style={{ display:"flex", gap:8, marginBottom:12, overflowX:"auto", flexWrap:isMobile?"nowrap":"wrap", paddingBottom:isMobile?4:0 }}>
              <button style={filterStatus==="all"?{...s.filterBtn,...s.filterBtnActive,flexShrink:0}:{...s.filterBtn,flexShrink:0}} onClick={()=>setFilterStatus("all")}>
                Todos <span style={s.filterCount}>{appointments.length}</span>
              </button>
              {Object.entries(STATUS_CONFIG).map(([key,cfg])=>{
                const count = appointments.filter(a=>a.status===key).length
                return (
                  <button key={key}
                    style={filterStatus===key?{...s.filterBtn,...s.filterBtnActive,borderColor:cfg.color,color:cfg.color,flexShrink:0}:{...s.filterBtn,flexShrink:0}}
                    onClick={()=>setFilterStatus(key)}>
                    {cfg.label} <span style={s.filterCount}>{count}</span>
                  </button>
                )
              })}
            </div>

            {/* Campo de busca */}
            <div style={{ position:"relative", marginBottom:16 }}>
              <span style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", fontSize:14, color:"#475569", pointerEvents:"none" }}>🔍</span>
              <input
                type="text"
                placeholder="Buscar por paciente, data (15/03), status (cancelado) ou profissional..."
                value={query}
                onChange={e=>handleQueryChange(e.target.value)}
                style={{ background:t.bgCard, border:`1px solid ${t.border}`, borderRadius:8, padding:"10px 12px 10px 36px", fontSize:14, color:t.textPrimary, outline:"none", width:"100%", boxSizing:"border-box" }}
                onFocus={e=>e.target.style.borderColor=t.accent}
                onBlur={e=>e.target.style.borderColor=t.border}
              />
              {searching && <span style={{ position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",fontSize:11,color:"#475569" }}>buscando...</span>}
              {query && !searching && (
                <button onClick={()=>{setQuery("");setRemoteAppts(null)}} style={{ position:"absolute",right:8,top:"50%",transform:"translateY(-50%)",background:"transparent",border:"none",color:"#475569",cursor:"pointer",fontSize:16 }}>✕</button>
              )}
            </div>

            <div style={s.listCard}>
              {fetching ? (
                <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                  {[1,2,3,4].map(i=><div key={i} className="skeleton-shimmer" style={{ height:52 }}/>)}
                </div>
              ) : filtered.length === 0 ? (
                <div style={{ textAlign:"center", padding:"48px 0", display:"flex", flexDirection:"column", alignItems:"center", gap:8 }}>
                  <span style={{ fontSize:36 }}>📅</span>
                  <p style={{ fontSize:15, color:t.textGhost, margin:0, fontWeight:600 }}>Nenhum agendamento encontrado</p>
                  <p style={{ fontSize:13, color:t.borderStrong, margin:0 }}>{filterStatus!=="all"?"Tente outro filtro ou ":""}clique em "+ Novo agendamento" para começar.</p>
                </div>
              ) : isMobile ? (
                <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                  {filtered.map(a=>(
                    <div key={a.id} style={{ background:t.bgInset, borderRadius:10, padding:"14px 16px", display:"flex", flexDirection:"column", gap:8 }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                        <span style={{ fontWeight:700, color:t.textPrimary, fontSize:15 }}>{patientMap[a.client_id]?.name ?? "—"}</span>
                        <StatusBadge status={a.status} />
                      </div>
                      <span style={{ fontSize:13, color:t.textGhost }}>{formatDateTime(a.datetime)}</span>
                      {staffMap[a.staff_id] && <span style={{ fontSize:13, color:t.textGhost }}>👤 {staffMap[a.staff_id].name}</span>}
                      <div style={{ display:"flex", gap:8, marginTop:4 }}>
                        <select value={a.status} disabled={changingStatus===a.id} onChange={e=>handleStatusChange(a.id,e.target.value)}
                          style={{ ...s.statusSelect, flex:1, color:STATUS_CONFIG[a.status]?.color??"#64748b", opacity:changingStatus===a.id?0.5:1 }}>
                          {Object.entries(STATUS_CONFIG).map(([k,cfg])=><option key={k} value={k}>{cfg.label}</option>)}
                        </select>
                        <button style={s.btnDelete} onClick={()=>handleDelete(a.id)}>Remover</button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <table style={s.table}>
                  <thead>
                    <tr>
                      <th style={s.th}>Paciente</th>
                      <th style={s.th}>Data / Hora</th>
                      <th style={s.th}>Profissional</th>
                      <th style={s.th}>Status</th>
                      <th style={{ ...s.th, textAlign:"right" }}>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(a=>(
                      <tr key={a.id} style={s.tr}>
                        <td style={s.td}>
                          <span style={s.patientName}>{patientMap[a.client_id]?.name ?? "—"}</span>
                          {patientMap[a.client_id]?.phone && <span style={s.patientPhone}>{patientMap[a.client_id].phone}</span>}
                        </td>
                        <td style={s.td}><span style={s.tdMain}>{formatDateTime(a.datetime)}</span></td>
                        <td style={s.td}><span style={s.tdMuted}>{staffMap[a.staff_id]?.name ?? "—"}</span></td>
                        <td style={s.td}>
                          <select value={a.status} disabled={changingStatus===a.id} onChange={e=>handleStatusChange(a.id,e.target.value)}
                            style={{ ...s.statusSelect, color:STATUS_CONFIG[a.status]?.color??"#64748b", opacity:changingStatus===a.id?0.5:1 }}>
                            {Object.entries(STATUS_CONFIG).map(([k,cfg])=><option key={k} value={k}>{cfg.label}</option>)}
                          </select>
                        </td>
                        <td style={{ ...s.td, textAlign:"right" }}>
                          <button style={s.btnDelete} onClick={()=>handleDelete(a.id)}>Remover</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        ) : (
          <CalendarView appointments={appointments} onDayClick={(date,appts)=>setSelectedDay({date,appts})} />
        )}
      </div>
    </AppLayout>
  )
}
