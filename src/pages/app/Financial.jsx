import { useState, useEffect } from "react"
import { supabase } from "../../supabaseClient"
import { useAuth } from "../../context/AuthContext"
import { useTheme } from "../../context/ThemeContext"
import AppLayout from "../AppLayout"

// ─── Constantes ───────────────────────────────────────────────────────────────

const PAYMENT_METHOD = {
  pix:         { label: "Pix",          icon: "⚡" },
  credit_card: { label: "Cartão Créd.", icon: "💳" },
  debit_card:  { label: "Cartão Déb.",  icon: "💳" },
  cash:        { label: "Dinheiro",     icon: "💵" },
  other:       { label: "Outro",        icon: "📋" },
}

const STATUS_CONFIG = {
  paid:      { label: "Pago",      color: "#22c55e", bg: "#052e16", border: "#166534" },
  pending:   { label: "Pendente",  color: "#f59e0b", bg: "#1c1107", border: "#92400e" },
  cancelled: { label: "Cancelado", color: "#ef4444", bg: "#450a0a", border: "#7f1d1d" },
}

const PERIOD_OPTIONS = [
  { label: "Esta semana",     value: "this_week"  },
  { label: "2 semanas",       value: "2_weeks"    },
  { label: "Este mês",        value: "this_month" },
  { label: "Mês passado",     value: "last_month" },
  { label: "Últimos 3 meses", value: "3_months"   },
  { label: "Este ano",        value: "this_year"  },
  { label: "Tudo",            value: "all"        },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatCurrency(val) {
  if (val == null) return "—"
  return new Intl.NumberFormat("pt-BR", { style:"currency", currency:"BRL" }).format(val)
}

function formatDate(iso) {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("pt-BR", { day:"2-digit", month:"2-digit", year:"numeric" })
}

function getPeriodRange(period) {
  const now = new Date()
  const y = now.getFullYear(), m = now.getMonth(), d = now.getDate()
  const dow = now.getDay() // 0=dom
  switch (period) {
    case "this_week": {
      const startOfWeek = new Date(y, m, d - (dow === 0 ? 6 : dow - 1))
      return { start: startOfWeek, end: new Date(y, m, d, 23, 59, 59) }
    }
    case "2_weeks": {
      const twoWeeksAgo = new Date(y, m, d - 13)
      return { start: twoWeeksAgo, end: new Date(y, m, d, 23, 59, 59) }
    }
    case "this_month":  return { start: new Date(y, m, 1),   end: new Date(y, m+1, 0, 23,59,59) }
    case "last_month":  return { start: new Date(y, m-1, 1), end: new Date(y, m, 0, 23,59,59) }
    case "3_months":    return { start: new Date(y, m-3, 1), end: new Date(y, m+1, 0, 23,59,59) }
    case "this_year":   return { start: new Date(y, 0, 1),   end: new Date(y, 11, 31, 23,59,59) }
    default:            return null
  }
}

function useIsMobile() {
  const [v, setV] = useState(window.innerWidth <= 768)
  useEffect(() => {
    const fn = () => setV(window.innerWidth <= 768)
    window.addEventListener("resize", fn)
    return () => window.removeEventListener("resize", fn)
  }, [])
  return v
}

// ─── Toast ────────────────────────────────────────────────────────────────────

function Toast({ toast }) {
  if (!toast) return null
  const ok = toast.type === "success"
  return (
    <div style={{ position:"fixed", bottom:24, right:24, zIndex:999, borderRadius:10, padding:"12px 20px",
      fontSize:14, fontWeight:600, boxShadow:"0 8px 24px rgba(0,0,0,0.3)",
      background: ok ? "#052e16" : "#450a0a",
      border: `1px solid ${ok ? "#166534" : "#7f1d1d"}`,
      color: ok ? "#86efac" : "#fca5a5",
    }}>
      {ok ? "✓" : "✕"} {toast.msg}
    </div>
  )
}

// ─── Modal de novo pagamento ──────────────────────────────────────────────────

function PaymentModal({ onClose, onSave, clinicId }) {
  const { t } = useTheme()
  const [amount,      setAmount]      = useState("")
  const [discount,    setDiscount]    = useState("")
  const [method,      setMethod]      = useState("pix")
  const [status,      setStatus]      = useState("paid")
  const [description, setDescription] = useState("")
  const [patientName, setPatientName] = useState("")
  const [patients,    setPatients]    = useState([])
  const [patientId,   setPatientId]   = useState("")
  const [pSearch,     setPSearch]     = useState("")
  const [pOpen,       setPOpen]       = useState(false)
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState(null)

  const inp = { background:t.bgCard, border:`1px solid ${t.border}`, borderRadius:8, padding:"10px 12px", fontSize:14, color:t.textPrimary, outline:"none", width:"100%", boxSizing:"border-box", transition:"border-color 0.2s" }

  async function searchPatients(q) {
    setPSearch(q); setPatientId(""); setPatientName("")
    if (q.length < 2) { setPatients([]); setPOpen(false); return }
    const { data } = await supabase.from("patients").select("id,name").ilike("name",`%${q}%`).is("deleted_at",null).limit(6)
    setPatients(data ?? []); setPOpen(true)
  }

  async function handleSave() {
    if (!amount || isNaN(parseFloat(amount))) { setError("Informe o valor"); return }
    setError(null); setLoading(true)
    const { error } = await supabase.from("payments").insert([{
      clinic_id:   clinicId,
      patient_id:  patientId || null,
      amount:      parseFloat(amount),
      discount:    parseFloat(discount) || 0,
      payment_method: method,
      status,
      description: description.trim() || null,
      paid_at:     status === "paid" ? new Date().toISOString() : null,
    }])
    setLoading(false)
    if (error) { setError(error.message); return }
    onSave()
  }

  const finalAmount = (parseFloat(amount) || 0) - (parseFloat(discount) || 0)

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.7)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:100, padding:20 }}
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{ background:t.bgSidebar, border:`1px solid ${t.border}`, borderRadius:16, width:"100%", maxWidth:460, display:"flex", flexDirection:"column", maxHeight:"90vh", overflowY:"auto" }}>

        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"20px 24px", borderBottom:`1px solid ${t.border}` }}>
          <h2 style={{ fontSize:16, fontWeight:700, color:t.textPrimary, margin:0 }}>Novo lançamento</h2>
          <button onClick={onClose} style={{ background:"transparent", border:"none", color:t.textGhost, fontSize:20, cursor:"pointer" }}>✕</button>
        </div>

        <div style={{ padding:24, display:"flex", flexDirection:"column", gap:14 }}>

          {/* Paciente */}
          <div style={{ position:"relative" }}>
            <label style={{ fontSize:12, fontWeight:600, color:t.textFaint, display:"block", marginBottom:6 }}>Paciente</label>
            <input type="text" placeholder="Buscar paciente (opcional)..." value={patientId ? patientName : pSearch}
              onChange={e=>searchPatients(e.target.value)} style={inp}
              onFocus={e=>e.target.style.borderColor=t.accent} onBlur={e=>setTimeout(()=>setPOpen(false),150)} />
            {pOpen && patients.length > 0 && (
              <div style={{ position:"absolute", top:"calc(100% + 2px)", left:0, right:0, background:t.bgCard, border:`1px solid ${t.borderStrong}`, borderRadius:8, zIndex:50, overflow:"hidden", boxShadow:"0 8px 24px rgba(0,0,0,0.4)" }}>
                {patients.map(p=>(
                  <div key={p.id} onMouseDown={()=>{ setPatientId(p.id); setPatientName(p.name); setPSearch(""); setPOpen(false) }}
                    style={{ padding:"10px 14px", cursor:"pointer", fontSize:14, color:t.textPrimary, borderBottom:`1px solid ${t.bgInset}` }}>
                    {p.name}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Valor e desconto */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <div>
              <label style={{ fontSize:12, fontWeight:600, color:t.textFaint, display:"block", marginBottom:6 }}>Valor (R$) *</label>
              <input type="number" placeholder="0,00" value={amount} onChange={e=>setAmount(e.target.value)} style={inp} min="0" step="0.01"
                onFocus={e=>e.target.style.borderColor=t.accent} onBlur={e=>e.target.style.borderColor=t.border} />
            </div>
            <div>
              <label style={{ fontSize:12, fontWeight:600, color:t.textFaint, display:"block", marginBottom:6 }}>Desconto (R$)</label>
              <input type="number" placeholder="0,00" value={discount} onChange={e=>setDiscount(e.target.value)} style={inp} min="0" step="0.01"
                onFocus={e=>e.target.style.borderColor=t.accent} onBlur={e=>e.target.style.borderColor=t.border} />
            </div>
          </div>

          {/* Total calculado */}
          {amount && (
            <div style={{ background:t.bgInset, borderRadius:8, padding:"10px 14px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <span style={{ fontSize:13, color:t.textGhost }}>Total a receber</span>
              <span style={{ fontSize:18, fontWeight:800, color:"#22c55e" }}>{formatCurrency(finalAmount)}</span>
            </div>
          )}

          {/* Forma de pagamento */}
          <div>
            <label style={{ fontSize:12, fontWeight:600, color:t.textFaint, display:"block", marginBottom:6 }}>Forma de pagamento</label>
            <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
              {Object.entries(PAYMENT_METHOD).map(([k,v])=>(
                <button key={k} onClick={()=>setMethod(k)} style={{
                  background: method===k ? t.accent : t.bgCard,
                  border: `1px solid ${method===k ? t.accent : t.border}`,
                  color: method===k ? "#fff" : t.textMuted,
                  borderRadius:8, padding:"7px 12px", fontSize:13, fontWeight:600, cursor:"pointer"
                }}>
                  {v.icon} {v.label}
                </button>
              ))}
            </div>
          </div>

          {/* Status */}
          <div>
            <label style={{ fontSize:12, fontWeight:600, color:t.textFaint, display:"block", marginBottom:6 }}>Status</label>
            <div style={{ display:"flex", gap:8 }}>
              {Object.entries(STATUS_CONFIG).map(([k,v])=>(
                <button key={k} onClick={()=>setStatus(k)} style={{
                  background: status===k ? v.bg : t.bgCard,
                  border: `1px solid ${status===k ? v.border : t.border}`,
                  color: status===k ? v.color : t.textMuted,
                  borderRadius:8, padding:"7px 14px", fontSize:13, fontWeight:700, cursor:"pointer", flex:1
                }}>
                  {v.label}
                </button>
              ))}
            </div>
          </div>

          {/* Descrição */}
          <div>
            <label style={{ fontSize:12, fontWeight:600, color:t.textFaint, display:"block", marginBottom:6 }}>Descrição</label>
            <textarea placeholder="Ex: Consulta de retorno, limpeza..." value={description} onChange={e=>setDescription(e.target.value)} rows={2}
              style={{ ...inp, resize:"vertical", lineHeight:1.6 }}
              onFocus={e=>e.target.style.borderColor=t.accent} onBlur={e=>e.target.style.borderColor=t.border} />
          </div>

          {error && <div style={{ background:"#450a0a", border:"1px solid #7f1d1d", color:"#fca5a5", borderRadius:8, padding:"10px 14px", fontSize:13 }}>{error}</div>}
        </div>

        <div style={{ display:"flex", justifyContent:"flex-end", gap:10, padding:"16px 24px", borderTop:`1px solid ${t.border}` }}>
          <button onClick={onClose} style={{ background:"transparent", border:`1px solid ${t.border}`, color:t.textMuted, borderRadius:8, padding:"10px 18px", fontSize:14, cursor:"pointer" }}>Cancelar</button>
          <button onClick={handleSave} disabled={loading||!amount} style={{ background:t.accent, border:"none", color:"#fff", borderRadius:8, padding:"10px 24px", fontSize:14, fontWeight:700, cursor:"pointer", opacity:loading||!amount?0.5:1 }}>
            {loading ? "Salvando..." : "Salvar lançamento"}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Card de métrica ──────────────────────────────────────────────────────────

function MetricCard({ label, value, sub, accent, t, isMobile }) {
  return (
    <div style={{ background:t.bgCard, borderRadius:12, padding: isMobile ? "14px" : "20px", borderTop:`3px solid ${accent}`, display:"flex", flexDirection:"column", gap:4, minWidth:0, overflow:"hidden" }}>
      <span style={{ fontSize: isMobile ? 20 : 28, fontWeight:800, color:accent, letterSpacing:"-0.5px", lineHeight:1.1, wordBreak:"break-word" }}>{value}</span>
      <span style={{ fontSize: isMobile ? 11 : 13, fontWeight:600, color:t.textBody, marginTop:4, lineHeight:1.3 }}>{label}</span>
      {sub && <span style={{ fontSize: isMobile ? 10 : 11, color:t.textGhost }}>{sub}</span>}
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function Financial() {
  const { clinicId } = useAuth()
  const { t }        = useTheme()
  const isMobile     = useIsMobile()

  const [payments,     setPayments]     = useState([])
  const [patientMap,   setPatientMap]   = useState({})
  const [fetching,     setFetching]     = useState(true)
  const [showModal,    setShowModal]    = useState(false)
  const [toast,        setToast]        = useState(null)
  const [period,       setPeriod]       = useState("this_month")
  const [filterStatus, setFilterStatus] = useState("all")
  const [editingId,    setEditingId]    = useState(null)
  const [query,        setQuery]        = useState("")

  function showToast(msg, type="success") { setToast({msg,type}); setTimeout(()=>setToast(null),3000) }

  async function fetchPayments() {
    setFetching(true)
    let query = supabase.from("payments").select("*").is("deleted_at",null).order("created_at",{ascending:false})
    const range = getPeriodRange(period)
    if (range) {
      query = query.gte("created_at", range.start.toISOString()).lte("created_at", range.end.toISOString())
    }
    const { data } = await query
    const pays = data ?? []

    // Busca nomes dos pacientes
    const ids = [...new Set(pays.map(p=>p.patient_id).filter(Boolean))]
    let pMap = {}
    if (ids.length) {
      const { data: pts } = await supabase.from("patients").select("id,name").in("id",ids)
      pts?.forEach(p=>{ pMap[p.id]=p.name })
    }

    setPayments(pays); setPatientMap(pMap); setFetching(false)
  }

  const aggregateRevenueByWeek = (payments) => {
    const weekBuckets = {};
    
    payments.forEach(p => {
      if (p.status !== 'paid') return;
      
      const d = new Date(p.created_at);
      const startOfWeek = new Date(d);
      startOfWeek.setDate(d.getDate() - (d.getDay() === 0 ? 6 : d.getDay() - 1));
      startOfWeek.setHours(0, 0, 0, 0);
      
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      
      const key = `${startOfWeek.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} - ${endOfWeek.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}`;
      
      weekBuckets[key] = (weekBuckets[key] || 0) + parseFloat(p.final_amount || 0);
    });
    
    return Object.entries(weekBuckets).map(([semana, valor]) => ({ semana, valor }));
  };

  async function handleStatusChange(id, newStatus) {
    const { error } = await supabase.from("payments").update({
      status: newStatus,
      paid_at: newStatus==="paid" ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    }).eq("id",id)
    if (!error) { fetchPayments(); showToast(`Status atualizado para "${STATUS_CONFIG[newStatus]?.label}"`) }
  }

  async function handleDelete(id) {
    const { error } = await supabase.from("payments").update({ deleted_at:new Date().toISOString() }).eq("id",id)
    if (!error) { fetchPayments(); showToast("Lançamento removido.", "error") }
  }

  useEffect(() => { fetchPayments() }, [period])

  // Métricas calculadas
  const byStatus  = filterStatus==="all" ? payments : payments.filter(p=>p.status===filterStatus)
  const filtered  = query.trim()
    ? byStatus.filter(p => {
        const name = patientMap[p.patient_id]?.toLowerCase() ?? ""
        const desc = p.description?.toLowerCase() ?? ""
        const q    = query.toLowerCase()
        return name.includes(q) || desc.includes(q)
      })
    : byStatus
  const totalPaid = payments.filter(p=>p.status==="paid").reduce((s,p)=>s+(parseFloat(p.final_amount)||0),0)
  const totalPend = payments.filter(p=>p.status==="pending").reduce((s,p)=>s+(parseFloat(p.final_amount)||0),0)
  const totalAll  = payments.reduce((s,p)=>s+(parseFloat(p.final_amount)||0),0)
  const countPaid = payments.filter(p=>p.status==="paid").length

  return (
    <AppLayout>
      <Toast toast={toast} />

      {showModal && (
        <PaymentModal clinicId={clinicId} onClose={()=>setShowModal(false)} onSave={()=>{ setShowModal(false); fetchPayments(); showToast("Lançamento salvo!") }} />
      )}

      <div style={{ color:t.textBody, fontFamily:"'DM Sans','Segoe UI',sans-serif" }}>

        {/* Header */}
        <header style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom: isMobile?16:28, gap:16, flexWrap:"wrap" }}>
          <div>
            <h1 style={{ fontSize:isMobile?22:28, fontWeight:800, margin:0, color:t.textPrimary, letterSpacing:"-0.5px" }}>Financeiro</h1>
            <p style={{ margin:"4px 0 0", fontSize:13, color:t.textFaint }}>Controle de faturamento da clínica</p>
          </div>
          <div style={{ display:"flex", gap:10, alignItems:"center", flexWrap:"wrap", width:isMobile?"100%":"auto" }}>
            {/* Filtro de período */}
            <select value={period} onChange={e=>setPeriod(e.target.value)} style={{
              background:t.bgCard, border:`1px solid ${t.border}`, borderRadius:8,
              padding:"8px 12px", fontSize:13, color:t.textMuted, cursor:"pointer", outline:"none"
            }}>
              {PERIOD_OPTIONS.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <button onClick={()=>setShowModal(true)} style={{ background:t.accent, border:"none", color:"#fff", borderRadius:8, padding:"10px 20px", fontSize:14, fontWeight:700, cursor:"pointer", flex:isMobile?1:"unset" }}>
              + Novo lançamento
            </button>
          </div>
        </header>

        {/* Cards de métricas */}
        <div style={{ display:"grid", gridTemplateColumns: isMobile?"1fr 1fr":"repeat(4,1fr)", gap: isMobile?8:16, marginBottom: isMobile?16:24 }}>
          <MetricCard label="Total recebido"   value={formatCurrency(totalPaid)} sub={`${countPaid} pagamentos`} accent="#22c55e" t={t} isMobile={isMobile} />
          <MetricCard label="A receber"        value={formatCurrency(totalPend)} sub="pendentes"                 accent="#f59e0b" t={t} isMobile={isMobile} />
          <MetricCard label="Total do período" value={formatCurrency(totalAll)}  sub="incl. pendentes"           accent="#3b82f6" t={t} isMobile={isMobile} />
          <MetricCard label="Lançamentos"      value={payments.length}           sub="no período"                accent="#8b5cf6" t={t} isMobile={isMobile} />
        </div>

        {/* Lista */}
        <div style={{ background:t.bgCard, borderRadius:12, padding: isMobile?"16px":"24px" }}>

          {/* Filtros de status */}
          <div style={{ display:"flex", gap:8, marginBottom:12, overflowX:"auto", paddingBottom:4 }}>
            {[["all","Todos",payments.length],
              ["paid","Pagos",payments.filter(p=>p.status==="paid").length],
              ["pending","Pendentes",payments.filter(p=>p.status==="pending").length],
              ["cancelled","Cancelados",payments.filter(p=>p.status==="cancelled").length],
            ].map(([key,label,count])=>(
              <button key={key} onClick={()=>setFilterStatus(key)} style={{
                background: filterStatus===key ? t.bgInset : "transparent",
                border: `1px solid ${filterStatus===key ? t.borderStrong : t.border}`,
                color: filterStatus===key ? t.textPrimary : t.textFaint,
                borderRadius:8, padding:"6px 14px", fontSize:13, fontWeight:600, cursor:"pointer",
                display:"flex", alignItems:"center", gap:6, flexShrink:0,
              }}>
                {label}
                <span style={{ background:t.bgPage, borderRadius:99, padding:"1px 7px", fontSize:11 }}>{count}</span>
              </button>
            ))}
          </div>

          {/* Campo de busca */}
          <div style={{ position:"relative", marginBottom:16 }}>
            <span style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", fontSize:14, color:t.textGhost, pointerEvents:"none" }}>🔍</span>
            <input
              type="text"
              placeholder="Buscar por paciente ou descrição..."
              value={query}
              onChange={e=>setQuery(e.target.value)}
              style={{ background:t.bgInset, border:`1px solid ${t.border}`, borderRadius:8, padding:"10px 12px 10px 36px", fontSize:14, color:t.textPrimary, outline:"none", width:"100%", boxSizing:"border-box" }}
              onFocus={e=>e.target.style.borderColor=t.accent}
              onBlur={e=>e.target.style.borderColor=t.border}
            />
            {query && (
              <button onClick={()=>setQuery("")} style={{ position:"absolute",right:8,top:"50%",transform:"translateY(-50%)",background:"transparent",border:"none",color:t.textGhost,cursor:"pointer",fontSize:16 }}>✕</button>
            )}
          </div>

          {fetching ? (
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {[1,2,3,4].map(i=><div key={i} className="skeleton-shimmer" style={{ height:56 }}/>)}
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign:"center", padding:"48px 0", display:"flex", flexDirection:"column", alignItems:"center", gap:8 }}>
              <span style={{ fontSize:36 }}>{query ? "🔍" : "💰"}</span>
              <p style={{ fontSize:15, color:t.textGhost, margin:0, fontWeight:600 }}>
                {query ? `Nenhum resultado para "${query}"` : "Nenhum lançamento encontrado"}
              </p>
              <p style={{ fontSize:13, color:t.textDisabled, margin:0 }}>
                {query ? "Tente outro termo de busca." : "Clique em \"+ Novo lançamento\" para começar."}
              </p>
            </div>
          ) : isMobile ? (
            // Cards mobile
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {filtered.map(p=>{
                const st  = STATUS_CONFIG[p.status] ?? STATUS_CONFIG.pending
                const met = PAYMENT_METHOD[p.payment_method]
                return (
                  <div key={p.id} style={{ background:t.bgInset, borderRadius:10, padding:"14px 16px", display:"flex", flexDirection:"column", gap:8 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                      <span style={{ fontWeight:700, color:t.textPrimary, fontSize:16 }}>{formatCurrency(p.final_amount)}</span>
                      <span style={{ fontSize:11, fontWeight:700, padding:"3px 10px", borderRadius:99, color:st.color, background:st.bg, border:`1px solid ${st.border}` }}>{st.label}</span>
                    </div>
                    {patientMap[p.patient_id] && <span style={{ fontSize:13, color:t.textGhost }}>👤 {patientMap[p.patient_id]}</span>}
                    {p.description && <span style={{ fontSize:13, color:t.textGhost }}>{p.description}</span>}
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                      <span style={{ fontSize:12, color:t.textDisabled }}>{met?.icon} {met?.label} · {formatDate(p.created_at)}</span>
                      <div style={{ display:"flex", gap:6 }}>
                        {p.status==="pending" && (
                          <button onClick={()=>handleStatusChange(p.id,"paid")} style={{ background:"#052e16", border:"1px solid #166534", color:"#86efac", borderRadius:6, padding:"4px 10px", fontSize:11, fontWeight:700, cursor:"pointer" }}>Marcar pago</button>
                        )}
                        <button onClick={()=>handleDelete(p.id)} style={{ background:"transparent", border:`1px solid ${t.borderStrong}`, color:t.textFaint, borderRadius:6, padding:"4px 10px", fontSize:11, cursor:"pointer" }}>✕</button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            // Tabela desktop
            <table style={{ width:"100%", borderCollapse:"collapse" }}>
              <thead>
                <tr>
                  {["Paciente","Descrição","Forma","Valor","Status","Data",""].map((h,i)=>(
                    <th key={i} style={{ fontSize:11, fontWeight:700, color:t.textGhost, textTransform:"uppercase", letterSpacing:"0.08em", padding:"0 12px 12px", textAlign: i>=4?"center":"left", borderBottom:`1px solid ${t.bgInset}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(p=>{
                  const st  = STATUS_CONFIG[p.status] ?? STATUS_CONFIG.pending
                  const met = PAYMENT_METHOD[p.payment_method]
                  return (
                    <tr key={p.id} style={{ borderBottom:`1px solid ${t.bgInset}` }}>
                      <td style={{ padding:"14px 12px", fontSize:14, color:t.textBody }}>
                        {patientMap[p.patient_id] ?? <span style={{ color:t.textDisabled }}>—</span>}
                      </td>
                      <td style={{ padding:"14px 12px", fontSize:13, color:t.textGhost, maxWidth:200 }}>
                        <span style={{ display:"block", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{p.description ?? "—"}</span>
                      </td>
                      <td style={{ padding:"14px 12px", fontSize:13, color:t.textGhost }}>
                        {met?.icon} {met?.label ?? "—"}
                      </td>
                      <td style={{ padding:"14px 12px", fontSize:15, fontWeight:700, color:t.textPrimary }}>
                        {formatCurrency(p.final_amount)}
                        {p.discount > 0 && <span style={{ display:"block", fontSize:11, color:t.textDisabled, fontWeight:400 }}>- {formatCurrency(p.discount)} desc.</span>}
                      </td>
                      <td style={{ padding:"14px 12px", textAlign:"center" }}>
                        <span style={{ fontSize:11, fontWeight:700, padding:"3px 10px", borderRadius:99, color:st.color, background:st.bg, border:`1px solid ${st.border}` }}>{st.label}</span>
                      </td>
                      <td style={{ padding:"14px 12px", fontSize:13, color:t.textGhost, textAlign:"center" }}>
                        {formatDate(p.created_at)}
                      </td>
                      <td style={{ padding:"14px 12px", textAlign:"right" }}>
                        <div style={{ display:"flex", gap:6, justifyContent:"flex-end" }}>
                          {p.status==="pending" && (
                            <button onClick={()=>handleStatusChange(p.id,"paid")} style={{ background:"#052e16", border:"1px solid #166534", color:"#86efac", borderRadius:6, padding:"5px 12px", fontSize:12, fontWeight:700, cursor:"pointer", whiteSpace:"nowrap" }}>✓ Pago</button>
                          )}
                          <button onClick={()=>handleDelete(p.id)} style={{ background:"transparent", border:`1px solid ${t.borderStrong}`, color:t.textFaint, borderRadius:6, padding:"5px 12px", fontSize:12, cursor:"pointer" }}>Remover</button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
