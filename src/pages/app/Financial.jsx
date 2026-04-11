import { useState, useEffect } from "react"
import { MotionToast, MotionModal, MotionCard } from "../../components/ui/MotionComponents"
import { supabase } from "../../supabaseClient"
import { useAuth } from "../../context/AuthContext"
import { useTheme } from "../../context/ThemeContext"
import AppLayout from "../AppLayout"
import RevenueChart from "../../components/financial/RevenueChart"
import { Button, Input, Badge } from "../../components/ui"
import { STATUS_COLORS } from "../../config/statusColors"

// ─── SVG Icons ────────────────────────────────────────────────────────────────
const Icons = {
  pix: (c) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
    </svg>
  ),
  credit: (c) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>
    </svg>
  ),
  cash: (c) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/>
    </svg>
  ),
  other: (c) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  ),
  send: (c) => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
    </svg>
  ),
  trash: (c) => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
    </svg>
  ),
  search: (c) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  ),
  check: (c) => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  plus: (c) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  ),
  edit: (c) => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  ),
}

// ─── Constantes ───────────────────────────────────────────────────────────────
const PAYMENT_METHOD = {
  pix:         { label: "Pix",          icon: Icons.pix   },
  credit_card: { label: "Cartão Créd.", icon: Icons.credit },
  debit_card:  { label: "Cartão Déb.",  icon: Icons.credit },
  cash:        { label: "Dinheiro",     icon: Icons.cash  },
  other:       { label: "Outro",        icon: Icons.other },
}

const STATUS_CONFIG = STATUS_COLORS

// Período padrão: esta semana
const PERIOD_OPTIONS = [
  { label: "Esta semana",     value: "this_week"  },
  { label: "2 semanas",       value: "2_weeks"    },
  { label: "Este mês",        value: "this_month" },
  { label: "Mês passado",     value: "last_month" },
  { label: "Últimos 3 meses", value: "3_months"   },
  { label: "Este ano",        value: "this_year"  },
  { label: "Tudo",            value: "all"        },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────
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
  const dow = now.getDay()
  switch (period) {
    case "this_week": {
      const s = new Date(y, m, d - (dow === 0 ? 6 : dow - 1))
      return { start: s, end: new Date(y, m, d, 23, 59, 59) }
    }
    case "2_weeks":    return { start: new Date(y,m,d-13),  end: new Date(y,m,d,23,59,59) }
    case "this_month": return { start: new Date(y,m,1),     end: new Date(y,m+1,0,23,59,59) }
    case "last_month": return { start: new Date(y,m-1,1),   end: new Date(y,m,0,23,59,59) }
    case "3_months":   return { start: new Date(y,m-3,1),   end: new Date(y,m+1,0,23,59,59) }
    case "this_year":  return { start: new Date(y,0,1),     end: new Date(y,11,31,23,59,59) }
    default: return null
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
function Toast({ toast, t }) {
  if (!toast) return null
  const ok = toast.type === "success"
  return (
    <div style={{ position:"fixed", bottom:24, right:24, zIndex:999, borderRadius:10, padding:"12px 20px",
      fontSize:14, fontWeight:600, boxShadow:"0 8px 24px rgba(0,0,0,0.3)",
      background: ok ? t.successBg : t.errorBg,
      border: `1px solid ${ok ? t.successBorder : t.errorBorder}`,
      color: ok ? t.successText : t.errorText,
    }}>
      {ok ? "✓" : "✕"} {toast.msg}
    </div>
  )
}

// ─── Modal de pagamento (novo e edição) ───────────────────────────────────────
function PaymentModal({ onClose, onSave, clinicId, editData = null }) {
  const { t } = useTheme()
  const isEdit = !!editData

  const [amount,      setAmount]      = useState(editData?.amount?.toString() ?? "")
  const [discount,    setDiscount]    = useState(editData?.discount?.toString() ?? "")
  const [method,      setMethod]      = useState(editData?.payment_method ?? "pix")
  const [status,      setStatus]      = useState(editData?.status ?? "paid")
  const [description, setDescription] = useState(editData?.description ?? "")
  const [patientName, setPatientName] = useState("")
  const [patients,    setPatients]    = useState([])
  const [patientId,   setPatientId]   = useState(editData?.patient_id ?? "")
  const [pSearch,     setPSearch]     = useState("")
  const [pOpen,       setPOpen]       = useState(false)
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState(null)

  // Carrega nome do paciente se editando
  useEffect(() => {
    if (editData?.patient_id) {
      supabase.from("patients").select("name").eq("id", editData.patient_id).single()
        .then(({ data }) => { if (data) setPatientName(data.name) })
    }
  }, [])

  async function searchPatients(q) {
    setPSearch(q); setPatientId(""); setPatientName("")
    if (q.length < 2) { setPatients([]); setPOpen(false); return }
    const { data } = await supabase.from("patients").select("id,name")
      .eq("clinic_id", clinicId).ilike("name", `%${q}%`).is("deleted_at", null).limit(6)
    setPatients(data ?? []); setPOpen(true)
  }

  async function handleSave() {
    if (!amount || isNaN(parseFloat(amount))) { setError("Informe o valor"); return }
    setError(null); setLoading(true)

    const payload = {
      clinic_id:      clinicId,
      patient_id:     patientId || null,
      amount:         parseFloat(amount),
      discount:       parseFloat(discount) || 0,
      payment_method: method,
      status,
      description:    description.trim() || null,
      paid_at:        status === "paid" ? new Date().toISOString() : null,
      updated_at:     new Date().toISOString(),
    }

    let err
    if (isEdit) {
      ({ error: err } = await supabase.from("payments").update(payload).eq("id", editData.id))
    } else {
      ({ error: err } = await supabase.from("payments").insert([payload]))
    }

    setLoading(false)
    if (err) { setError(err.message); return }
    onSave()
  }

  const finalAmount = (parseFloat(amount) || 0) - (parseFloat(discount) || 0)

  // Status válidos para o modal (apenas financeiros)
  const MODAL_STATUS = ["paid", "pending", "cancelled"]

  return (
    <MotionModal open={true} onClose={onClose} maxWidth={460}>
      {/* Container com scroll interno — sem overflow para fora */}
      <div style={{
        background: t.bgSidebar, border: `1px solid ${t.border}`,
        borderRadius: 16, width: "100%", maxWidth: 460,
        display: "flex", flexDirection: "column",
        maxHeight: "85vh",
        // Sem overflow aqui — o scroll fica só no body
      }}>
        {/* Header fixo */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
          padding:"18px 24px", borderBottom:`1px solid ${t.border}`, flexShrink:0 }}>
          <h2 style={{ fontSize:16, fontWeight:700, color:t.textPrimary, margin:0 }}>
            {isEdit ? "Editar lançamento" : "Novo lançamento"}
          </h2>
          <button onClick={onClose} style={{ background:"transparent", border:"none",
            color:t.textGhost, fontSize:20, cursor:"pointer", lineHeight:1 }}>✕</button>
        </div>

        {/* Body com scroll */}
        <div style={{ padding:24, display:"flex", flexDirection:"column", gap:14,
          overflowY:"auto", overflowX:"hidden", flex:1 }}>

          {/* Paciente */}
          <div style={{ position:"relative" }}>
            <label style={{ fontSize:12, fontWeight:600, color:t.textFaint, display:"block", marginBottom:6 }}>
              Paciente
            </label>
            <Input
              type="text"
              placeholder="Buscar paciente (opcional)..."
              value={patientId ? patientName : pSearch}
              onChange={e => searchPatients(e.target.value)}
              onBlur={() => setTimeout(() => setPOpen(false), 150)}
            />
            {pOpen && patients.length > 0 && (
              <div style={{ position:"absolute", top:"calc(100% + 2px)", left:0, right:0, zIndex:50,
                background:t.bgCard, border:`1px solid ${t.borderStrong}`, borderRadius:8,
                overflow:"hidden", boxShadow:"0 8px 24px rgba(0,0,0,0.4)" }}>
                {patients.map(p => (
                  <div key={p.id}
                    onMouseDown={() => { setPatientId(p.id); setPatientName(p.name); setPSearch(""); setPOpen(false) }}
                    style={{ padding:"10px 14px", cursor:"pointer", fontSize:14, color:t.textPrimary,
                      borderBottom:`1px solid ${t.bgInset}` }}>
                    {p.name}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Valor e desconto */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <div>
              <label style={{ fontSize:12, fontWeight:600, color:t.textFaint, display:"block", marginBottom:6 }}>
                Valor (R$) *
              </label>
              <Input type="number" placeholder="0,00" value={amount}
                onChange={e => setAmount(e.target.value)} min="0" step="0.01" />
            </div>
            <div>
              <label style={{ fontSize:12, fontWeight:600, color:t.textFaint, display:"block", marginBottom:6 }}>
                Desconto (R$)
              </label>
              <Input type="number" placeholder="0,00" value={discount}
                onChange={e => setDiscount(e.target.value)} min="0" step="0.01" />
            </div>
          </div>

          {/* Total calculado */}
          {amount && (
            <div style={{ background:t.bgInset, borderRadius:8, padding:"10px 14px",
              display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <span style={{ fontSize:13, color:t.textGhost }}>Total a receber</span>
              <span style={{ fontSize:18, fontWeight:800, color:t.successText }}>{formatCurrency(finalAmount)}</span>
            </div>
          )}

          {/* Forma de pagamento — SVG icons */}
          <div>
            <label style={{ fontSize:12, fontWeight:600, color:t.textFaint, display:"block", marginBottom:8 }}>
              Forma de pagamento
            </label>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3, 1fr)", gap:8 }}>
              {Object.entries(PAYMENT_METHOD).map(([k, v]) => {
                const active = method === k
                return (
                  <button key={k} onClick={() => setMethod(k)} style={{
                    display:"flex", flexDirection:"column", alignItems:"center", gap:5,
                    padding:"10px 8px", borderRadius:10, cursor:"pointer", fontFamily:"inherit",
                    background: active ? `${t.accent}18` : t.bgCard,
                    border: `1px solid ${active ? t.accent : t.border}`,
                    color: active ? t.accent : t.textMuted,
                    transition:"all .15s",
                  }}>
                    {v.icon(active ? t.accent : t.textGhost)}
                    <span style={{ fontSize:11, fontWeight:600 }}>{v.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Status */}
          <div>
            <label style={{ fontSize:12, fontWeight:600, color:t.textFaint, display:"block", marginBottom:8 }}>
              Status
            </label>
            <div style={{ display:"flex", gap:8 }}>
              {MODAL_STATUS.map(k => {
                const v = STATUS_CONFIG[k]
                if (!v) return null
                const active = status === k
                return (
                  <button key={k} onClick={() => setStatus(k)} style={{
                    background: active ? v.bg : t.bgCard,
                    border: `1px solid ${active ? v.border : t.border}`,
                    color: active ? v.color : t.textMuted,
                    borderRadius:8, padding:"8px 14px", fontSize:13, fontWeight:700,
                    cursor:"pointer", flex:1, fontFamily:"inherit",
                  }}>
                    {v.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Descrição */}
          <div>
            <label style={{ fontSize:12, fontWeight:600, color:t.textFaint, display:"block", marginBottom:6 }}>
              Descrição
            </label>
            <textarea
              placeholder="Ex: Consulta de retorno, avaliação..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={2}
              style={{ background:t.bgCard, border:`1px solid ${t.border}`, borderRadius:8,
                padding:"10px 12px", fontSize:14, color:t.textPrimary, outline:"none",
                width:"100%", boxSizing:"border-box", resize:"vertical", lineHeight:1.6,
                fontFamily:"inherit" }}
              onFocus={e => e.target.style.borderColor = t.accent}
              onBlur={e  => e.target.style.borderColor = t.border}
            />
          </div>

          {error && (
            <div style={{ background:t.errorBg, border:`1px solid ${t.errorBorder}`,
              color:t.errorText, borderRadius:8, padding:"10px 14px", fontSize:13 }}>
              {error}
            </div>
          )}
        </div>

        {/* Footer fixo */}
        <div style={{ display:"flex", justifyContent:"flex-end", gap:10,
          padding:"16px 24px", borderTop:`1px solid ${t.border}`, flexShrink:0 }}>
          <Button onClick={onClose} variant="ghost">Cancelar</Button>
          <Button onClick={handleSave} disabled={loading || !amount} loading={loading}>
            {loading ? "Salvando..." : isEdit ? "Salvar edição" : "Salvar lançamento"}
          </Button>
        </div>
      </div>
    </MotionModal>
  )
}

// ─── Card de métrica ──────────────────────────────────────────────────────────
function MetricCard({ label, value, sub, accent, t, isMobile }) {
  return (
    <div style={{ background:t.bgCard, borderRadius:12, padding: isMobile ? "14px" : "20px",
      borderTop:`3px solid ${accent}`, display:"flex", flexDirection:"column", gap:4,
      minWidth:0, overflow:"hidden" }}>
      <span style={{ fontSize: isMobile ? 20 : 28, fontWeight:800, color:accent,
        letterSpacing:"-0.5px", lineHeight:1.1, wordBreak:"break-word" }}>{value}</span>
      <span style={{ fontSize: isMobile ? 11 : 13, fontWeight:600, color:t.textBody,
        marginTop:4, lineHeight:1.3 }}>{label}</span>
      {sub && <span style={{ fontSize: isMobile ? 10 : 11, color:t.textGhost }}>{sub}</span>}
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function Financial() {
  const { clinicId } = useAuth()
  const { t }        = useTheme()
  const isMobile     = useIsMobile()

  const [payments,       setPayments]       = useState([])
  const [patientMap,     setPatientMap]     = useState({})
  const [chargeSentMap,  setChargeSentMap]  = useState({})  // { [paymentId]: created_at }
  const [fetching,        setFetching]       = useState(true)
  const [showModal,    setShowModal]    = useState(false)
  const [editPayment,  setEditPayment]  = useState(null)  // pagamento sendo editado
  const [toast,        setToast]        = useState(null)
  const [period,       setPeriod]       = useState("this_week")  // padrão: esta semana
  const [filterStatus, setFilterStatus] = useState("all")
  const [query,        setQuery]        = useState("")

  function showToast(msg, type = "success") { setToast({ msg, type }); setTimeout(() => setToast(null), 3000) }

  async function fetchPayments() {
    setFetching(true)
    let q = supabase.from("payments").select("*").eq("clinic_id", clinicId)
      .is("deleted_at", null).order("created_at", { ascending: false })
    const range = getPeriodRange(period)
    if (range) q = q.gte("created_at", range.start.toISOString()).lte("created_at", range.end.toISOString())
    const { data } = await q
    const pays = data ?? []

    const ids = [...new Set(pays.map(p => p.patient_id).filter(Boolean))]
    let pMap = {}
    if (ids.length) {
      const { data: pts } = await supabase.from("patients").select("id,name").in("id", ids)
      pts?.forEach(p => { pMap[p.id] = p.name })
    }

    // Buscar cobranças enviadas com sucesso
    const paymentIds = pays.map(p => p.id)
    let sentMap = {}
    if (paymentIds.length) {
      const { data: logs } = await supabase.from("whatsapp_logs")
        .select("payment_id, created_at")
        .eq("type", "charge")
        .eq("status", "sent")
        .in("payment_id", paymentIds)
      logs?.forEach(log => {
        // Mantém o mais recente se houver múltiplos
        if (!sentMap[log.payment_id] || new Date(log.created_at) > new Date(sentMap[log.payment_id])) {
          sentMap[log.payment_id] = log.created_at
        }
      })
    }

    setPayments(pays); setPatientMap(pMap); setChargeSentMap(sentMap); setFetching(false)
  }

  const aggregateRevenueByWeek = (pays) => {
    const buckets = {}
    pays.forEach(p => {
      if (p.status !== "paid") return
      const d = new Date(p.created_at)
      const mon = new Date(d); mon.setDate(d.getDate() - (d.getDay() === 0 ? 6 : d.getDay() - 1)); mon.setHours(0,0,0,0)
      const sun = new Date(mon); sun.setDate(mon.getDate() + 6)
      const key = `${mon.toLocaleDateString("pt-BR",{day:"2-digit",month:"2-digit"})} - ${sun.toLocaleDateString("pt-BR",{day:"2-digit",month:"2-digit"})}`
      if (!buckets[key]) buckets[key] = { valor: 0, qtd: 0 }
      buckets[key].valor += parseFloat(p.final_amount || 0)
      buckets[key].qtd   += 1
    })
    return Object.entries(buckets).map(([semana, { valor, qtd }]) => ({
      semana, valor: Math.round(valor), qtd,
      ticket_medio: qtd > 0 ? Math.round(valor / qtd) : 0,
    }))
  }

  async function handleStatusChange(id, newStatus) {
    const { error } = await supabase.from("payments").update({
      status:     newStatus,
      paid_at:    newStatus === "paid" ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    }).eq("id", id)
    if (!error) { fetchPayments(); showToast(`Status atualizado`) }
  }

  async function handleDelete(id) {
    const { error } = await supabase.from("payments").update({ deleted_at: new Date().toISOString() }).eq("id", id)
    if (!error) { fetchPayments(); showToast("Lançamento removido.", "error") }
  }

async function handleSendCharge(payment) {
    if (!payment.patient_id) { showToast("Paciente não encontrado", "error"); return }
    showToast("Enviando cobrança...")
    const { data, error } = await supabase.functions.invoke("send-whatsapp", {
      body: { type: "charge", patient_id: payment.patient_id, clinic_id: clinicId, payment_id: payment.id }
    })
    if (error) showToast("Erro ao enviar", "error")
    else if (data?.sent > 0) {
      showToast("Cobrança enviada!")
      setChargeSentMap(prev => ({ ...prev, [payment.id]: new Date().toISOString() }))
    }
    else showToast(data?.error || "Erro ao enviar", "error")
  }

  useEffect(() => { fetchPayments() }, [period])

  const byStatus = filterStatus === "all" ? payments : payments.filter(p => p.status === filterStatus)
  const filtered = query.trim()
    ? byStatus.filter(p => {
        const name = patientMap[p.patient_id]?.toLowerCase() ?? ""
        const desc = p.description?.toLowerCase() ?? ""
        return name.includes(query.toLowerCase()) || desc.includes(query.toLowerCase())
      })
    : byStatus

  const totalPaid  = payments.filter(p => p.status === "paid").reduce((s,p) => s + (parseFloat(p.final_amount)||0), 0)
  const totalPend  = payments.filter(p => p.status === "pending").reduce((s,p) => s + (parseFloat(p.final_amount)||0), 0)
  const totalAll   = payments.reduce((s,p) => s + (parseFloat(p.final_amount)||0), 0)
  const countPaid  = payments.filter(p => p.status === "paid").length
  const revenueData = aggregateRevenueByWeek(payments)

  function openEdit(p) { setEditPayment(p); setShowModal(true) }
  function closeModal() { setShowModal(false); setEditPayment(null) }

  return (
    <AppLayout>
      <Toast toast={toast} t={t} />

      {showModal && (
        <PaymentModal
          clinicId={clinicId}
          editData={editPayment}
          onClose={closeModal}
          onSave={() => { closeModal(); fetchPayments(); showToast(editPayment ? "Lançamento atualizado!" : "Lançamento salvo!") }}
        />
      )}

      <div style={{ color:t.textBody, fontFamily:"'DM Sans','Segoe UI',sans-serif" }}>

        {/* Header */}
        <header style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start",
          marginBottom: isMobile?16:28, gap:16, flexWrap:"wrap" }}>
          <div>
            <h1 style={{ fontSize:isMobile?22:28, fontWeight:800, margin:0, color:t.textPrimary, letterSpacing:"-0.5px" }}>
              Financeiro
            </h1>
            <p style={{ margin:"4px 0 0", fontSize:13, color:t.textFaint }}>Controle de faturamento da clínica</p>
          </div>
          <div style={{ display:"flex", gap:10, alignItems:"center", flexWrap:"wrap", width:isMobile?"100%":"auto" }}>
            <select value={period} onChange={e => setPeriod(e.target.value)} style={{
              background:t.bgCard, border:`1px solid ${t.border}`, borderRadius:8,
              padding:"8px 12px", fontSize:13, color:t.textMuted, cursor:"pointer", outline:"none",
              fontFamily:"inherit",
            }}>
              {PERIOD_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <Button onClick={() => { setEditPayment(null); setShowModal(true) }} fullWidth={isMobile}>
              <span style={{ display:"flex", alignItems:"center", gap:6 }}>
                {Icons.plus("#fff")} Novo lançamento
              </span>
            </Button>
          </div>
        </header>

        {/* Métricas */}
        <div style={{ display:"grid", gridTemplateColumns: isMobile?"1fr 1fr":"repeat(4,1fr)",
          gap: isMobile?8:16, marginBottom: isMobile?16:24 }}>
          {[
            { label:"Total recebido",   value:formatCurrency(totalPaid), sub:`${countPaid} pagamentos`, accent:STATUS_COLORS.paid?.color ?? "#22c55e" },
            { label:"A receber",        value:formatCurrency(totalPend), sub:"pendentes",               accent:STATUS_COLORS.pending?.color ?? "#f59e0b" },
            { label:"Total do período", value:formatCurrency(totalAll),  sub:"incl. pendentes",         accent:t.accent },
            { label:"Lançamentos",      value:payments.length,           sub:"no período",              accent:"#8b5cf6" },
          ].map((m, i) => (
            <MotionCard key={m.label} delay={i * 0.06}>
              <MetricCard {...m} t={t} isMobile={isMobile} />
            </MotionCard>
          ))}
        </div>

        {/* Gráfico */}
        <div style={{ marginBottom:16 }}>
          <RevenueChart data={revenueData} loading={fetching} theme={t} />
        </div>

        {/* Lista */}
        <div style={{ background:t.bgCard, borderRadius:12, padding: isMobile?"16px":"24px" }}>

          {/* Filtros de status */}
          <div style={{ display:"flex", gap:8, marginBottom:12, overflowX:"auto", paddingBottom:4 }}>
            {[["all","Todos",payments.length],["paid","Pagos",payments.filter(p=>p.status==="paid").length],
              ["pending","Pendentes",payments.filter(p=>p.status==="pending").length],
              ["cancelled","Cancelados",payments.filter(p=>p.status==="cancelled").length],
            ].map(([key,label,count]) => (
              <button key={key} onClick={() => setFilterStatus(key)} style={{
                background: filterStatus===key ? t.bgInset : "transparent",
                border: `1px solid ${filterStatus===key ? t.borderStrong : t.border}`,
                color: filterStatus===key ? t.textPrimary : t.textFaint,
                borderRadius:8, padding:"6px 14px", fontSize:13, fontWeight:600, cursor:"pointer",
                display:"flex", alignItems:"center", gap:6, flexShrink:0, fontFamily:"inherit",
              }}>
                {label}
                <span style={{ background:t.bgPage, borderRadius:99, padding:"1px 7px", fontSize:11 }}>{count}</span>
              </button>
            ))}
          </div>

          {/* Busca */}
          <div style={{ position:"relative", marginBottom:16 }}>
            <span style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }}>
              {Icons.search(t.textGhost)}
            </span>
            <Input type="text" placeholder="Buscar por paciente ou descrição..."
              value={query} onChange={e => setQuery(e.target.value)} style={{ paddingLeft:36 }} />
            {query && (
              <button onClick={() => setQuery("")} style={{ position:"absolute", right:8, top:"50%",
                transform:"translateY(-50%)", background:"transparent", border:"none",
                color:t.textGhost, cursor:"pointer", fontSize:16 }}>✕</button>
            )}
          </div>

          {/* Conteúdo */}
          {fetching ? (
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {[1,2,3,4].map(i => <div key={i} className="skeleton-shimmer" style={{ height:56 }}/>)}
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign:"center", padding:"48px 0", display:"flex", flexDirection:"column", alignItems:"center", gap:8 }}>
              <span style={{ fontSize:36 }}>{query ? "🔍" : "💰"}</span>
              <p style={{ fontSize:15, color:t.textGhost, margin:0, fontWeight:600 }}>
                {query ? `Nenhum resultado para "${query}"` : "Nenhum lançamento encontrado"}
              </p>
            </div>
          ) : isMobile ? (
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {filtered.map(p => {
                const st  = STATUS_CONFIG[p.status] ?? STATUS_CONFIG.pending
                const met = PAYMENT_METHOD[p.payment_method]
                return (
                  <div key={p.id} style={{ background:t.bgInset, borderRadius:10, padding:"14px 16px",
                    display:"flex", flexDirection:"column", gap:8 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", gap: 8 }}>
                      <span style={{ fontWeight:700, color:t.textPrimary, fontSize:16 }}>
                        {formatCurrency(p.final_amount)}
                      </span>
                      <span style={{ fontSize:11, fontWeight:700, padding:"3px 10px", borderRadius:99,
                        color:st.color, background:st.bg, border:`1px solid ${st.border}` }}>
                        {st.label}
                      </span>
                    </div>
                    {patientMap[p.patient_id] && (
                      <span style={{ fontSize:13, color:t.textGhost }}>
                        👤 {patientMap[p.patient_id]}
                      </span>
                    )}
                    {p.description && <span style={{ fontSize:13, color:t.textGhost }}>{p.description}</span>}
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                      <span style={{ fontSize:12, color:t.textDisabled, display:"flex", alignItems:"center", gap:5 }}>
                        {met?.icon(t.textDisabled)} {met?.label} · {formatDate(p.created_at)}
                      </span>
                      <div style={{ display:"flex", gap:6 }}>
                        <button onClick={() => openEdit(p)} style={{ background:"transparent", border:`1px solid ${t.border}`,
                          color:t.textGhost, borderRadius:6, padding:"4px 8px", cursor:"pointer",
                          display:"flex", alignItems:"center", gap:4 }}>
                          {Icons.edit(t.textGhost)}
                        </button>
                        {p.status === "pending" && (
                          <>
                            {chargeSentMap[p.id] && (
                              <Badge variant="success" style={{ fontSize: 12, padding: "2px 8px", marginBottom: 4, display: "block", textAlign: "center" }}>
                                ✓ Enviada em {formatDate(chargeSentMap[p.id])}
                              </Badge>
                            )}
                            <Button 
                              onClick={() => handleSendCharge(p)} 
                              size="sm" 
                              variant={chargeSentMap[p.id] ? "ghost" : "secondary"}
                              style={chargeSentMap[p.id] ? { border: `1px solid ${t.border}`, color: t.textMuted } : {}}
                            >
                              {Icons.send(chargeSentMap[p.id] ? t.textMuted : t.textMuted)}
                              {chargeSentMap[p.id] ? "Cobrar Novamente" : "Enviar Cobrança"}
                            </Button>
                            <Button onClick={() => handleStatusChange(p.id, "paid")} size="sm"
                              style={{ background:t.successBg, border:`1px solid ${t.successBorder}`, color:t.successText,
                                display:"flex", alignItems:"center", gap:4 }}>
                              {Icons.check(t.successText)} Pago
                            </Button>
                          </>
                        )}
                        <button onClick={() => handleDelete(p.id)} style={{ background:"transparent",
                          border:`1px solid ${t.border}`, color:t.textGhost, borderRadius:6,
                          padding:"4px 8px", cursor:"pointer", display:"flex", alignItems:"center" }}>
                          {Icons.trash(t.textGhost)}
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <table style={{ width:"100%", borderCollapse:"collapse" }}>
              <thead>
                <tr>
                  {["Paciente","Descrição","Forma","Valor","Status","Data",""].map((h,i) => (
                    <th key={i} style={{ fontSize:11, fontWeight:700, color:t.textGhost, textTransform:"uppercase",
                      letterSpacing:"0.08em", padding:"0 12px 12px",
                      textAlign: i >= 4 ? "center" : "left", borderBottom:`1px solid ${t.bgInset}` }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => {
                  const st  = STATUS_CONFIG[p.status] ?? STATUS_CONFIG.pending
                  const met = PAYMENT_METHOD[p.payment_method]
                  return (
                    <tr key={p.id} style={{ borderBottom:`1px solid ${t.bgInset}` }}>
                      <td style={{ padding:"14px 12px", fontSize:14, color:t.textBody }}>
                        {patientMap[p.patient_id] ?? <span style={{ color:t.textDisabled }}>—</span>}
                      </td>
                      <td style={{ padding:"14px 12px", fontSize:13, color:t.textGhost, maxWidth:180 }}>
                        <span style={{ display:"block", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                          {p.description ?? "—"}
                        </span>
                      </td>
                      <td style={{ padding:"14px 12px", fontSize:13, color:t.textGhost }}>
                        <span style={{ display:"flex", alignItems:"center", gap:6 }}>
                          {met?.icon(t.textGhost)} {met?.label ?? "—"}
                        </span>
                      </td>
                      <td style={{ padding:"14px 12px", fontSize:15, fontWeight:700, color:t.textPrimary }}>
                        {formatCurrency(p.final_amount)}
                        {p.discount > 0 && (
                          <span style={{ display:"block", fontSize:11, color:t.textDisabled, fontWeight:400 }}>
                            - {formatCurrency(p.discount)} desc.
                          </span>
                        )}
                      </td>
                      <td style={{ padding:"14px 12px", textAlign:"center" }}>
                        <span style={{ fontSize:11, fontWeight:700, padding:"3px 10px", borderRadius:99,
                          color:st.color, background:st.bg, border:`1px solid ${st.border}` }}>
                          {st.label}
                        </span>
                      </td>
                      <td style={{ padding:"14px 12px", fontSize:13, color:t.textGhost, textAlign:"center" }}>
                        {formatDate(p.created_at)}
                      </td>
                      <td style={{ padding:"14px 12px", textAlign:"right" }}>
                        <div style={{ display:"flex", gap:6, justifyContent:"flex-end", alignItems:"center" }}>
                          {/* Botão editar */}
                          <button onClick={() => openEdit(p)} title="Editar" style={{
                            background:"transparent", border:`1px solid ${t.border}`, color:t.textGhost,
                            borderRadius:6, padding:"5px 8px", cursor:"pointer",
                            display:"flex", alignItems:"center",
                          }}>
                            {Icons.edit(t.textGhost)}
                          </button>
                          {p.status === "pending" && (
                            <>
                              {chargeSentMap[p.id] && (
                                <Badge variant="success" style={{ fontSize: 12, padding: "2px 8px", marginBottom: 4, display: "block", textAlign: "center" }}>
                                  ✓ Enviada em {formatDate(chargeSentMap[p.id])}
                                </Badge>
                              )}
                              <button onClick={() => handleSendCharge(p)} title={chargeSentMap[p.id] ? "Cobrar novamente" : "Enviar cobrança"} style={{
                                background: chargeSentMap[p.id] ? t.bgInset : "transparent", 
                                border: `1px solid ${t.border}`, color: t.textMuted,
                                borderRadius:6, padding:"5px 10px", cursor:"pointer",
                                display:"flex", alignItems:"center", gap:4, fontSize:11, fontWeight:600,
                              }}>
                                {Icons.send(t.textMuted)}
                                {chargeSentMap[p.id] ? "Cobrar Novamente" : "Enviar Cobrança"}
                              </button>
                              <Button onClick={() => handleStatusChange(p.id, "paid")} size="sm"
                                style={{ background:t.successBg, border:`1px solid ${t.successBorder}`,
                                  color:t.successText, display:"flex", alignItems:"center", gap:4 }}>
                                {Icons.check(t.successText)} Pago
                              </Button>
                            </>
                          )}
                          <button onClick={() => handleDelete(p.id)} title="Remover" style={{
                            background:"transparent", border:`1px solid ${t.border}`, color:t.textGhost,
                            borderRadius:6, padding:"5px 8px", cursor:"pointer",
                            display:"flex", alignItems:"center",
                          }}>
                            {Icons.trash(t.textGhost)}
                          </button>
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
