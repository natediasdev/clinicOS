import { useEffect, useState, useRef, useCallback } from "react"
import { usePermissions } from "../../hooks/usePermissions"
import DayView from "../../components/DayView"
import { MotionToast, MotionModal, MotionList, MotionItem } from "../../components/ui/MotionComponents"
import { useAuth } from "../../context/AuthContext"
import { useTheme } from "../../context/ThemeContext"
import { supabase } from "../../supabaseClient"
import AppLayout from "../AppLayout"
import { Button, Input } from "../../components/ui"
import { STATUS_COLORS, getStatusConfig } from "../../config/statusColors"

// ─── Constantes ───────────────────────────────────────────────────────────────

const APPOINTMENT_STATUSES = ["scheduled", "completed", "cancelled", "no_show"]
const STATUS_CONFIG = Object.fromEntries(
  APPOINTMENT_STATUSES.map(k => [k, STATUS_COLORS[k]])
)

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
function formatCurrency(v) { return new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(v ?? 0) }

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

function Toast({ toast, t }) {
  const ok = toast?.type === "success"
  return (
    <MotionToast toast={toast}>
      <div style={{
        background: ok ? t.successBg : t.errorBg,
        border: `1px solid ${ok ? t.successBorder : t.errorBorder}`,
        color: ok ? t.successText : t.errorText,
        borderRadius:10, padding:"12px 20px", fontSize:14, fontWeight:600,
        fontFamily:"'DM Sans','Segoe UI',sans-serif", boxShadow:"0 8px 24px rgba(0,0,0,0.4)",
      }}>
        {ok ? "✓" : "✕"} {toast?.message}
      </div>
    </MotionToast>
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

function PatientSearchInput({ value, onSelect, clinicId }) {
  const { t } = useTheme()
  const [query, setQuery]     = useState(value?.name ?? "")
  const [results, setResults] = useState([])
  const [open, setOpen]       = useState(false)
  const ref = useRef()

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
      <Input type="text" placeholder="Digite o nome do paciente..." value={query} onChange={e=>search(e.target.value)}
        onFocus={() => { if (results.length) setOpen(true) }}
        onBlur={() => {}} />
      {open && results.length > 0 && (
        <div style={{ position:"absolute", top:"calc(100% + 4px)", left:0, right:0, background:t.bgCard, border:`1px solid ${t.borderStrong}`, borderRadius:8, zIndex:50, overflow:"hidden", boxShadow:"0 8px 24px rgba(0,0,0,0.4)" }}>
          {results.map(p => (
            <div key={p.id} onMouseDown={()=>{ onSelect(p); setQuery(p.name); setOpen(false) }}
              style={{ padding:"10px 16px", cursor:"pointer", display:"flex", flexDirection:"column", gap:2, borderBottom:`1px solid ${t.bgInset}` }}>
              <span style={{ fontWeight:600, color:t.textPrimary }}>{p.name}</span>
              {p.phone && <span style={{ fontSize:12, color:t.textGhost }}>{p.phone}</span>}
            </div>
          ))}
        </div>
      )}
      {open && query.length >= 2 && results.length === 0 && (
        <div style={{ position:"absolute", top:"calc(100% + 4px)", left:0, right:0, background:t.bgCard, border:`1px solid ${t.borderStrong}`, borderRadius:8, zIndex:50 }}>
          <div style={{ padding:"12px 16px", fontSize:13, color:t.textGhost }}>Nenhum paciente encontrado</div>
        </div>
      )}
    </div>
  )
}

// ─── GroupAssignModal — exibido após criar agendamento ────────────────────────
// Pergunta se o usuário quer adicionar o paciente a uma turma.

function GroupAssignModal({ patient, clinicId, onClose }) {
  const { t } = useTheme()
  const [groups, setGroups]     = useState([])
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [selected, setSelected] = useState(null)
  const [done, setDone]         = useState(false)

  useEffect(() => {
    async function load() {
      // Busca turmas ativas que o paciente ainda não participa
      const { data: allGroups } = await supabase
        .from("groups")
        .select("id, name, specialty, max_capacity")
        .eq("clinic_id", clinicId)
        .eq("active", true)
        .is("deleted_at", null)
        .order("name")

      if (!allGroups?.length) { setGroups([]); setLoading(false); return }

      // Verifica em quais turmas o paciente já está
      const { data: memberships } = await supabase
        .from("patient_groups")
        .select("group_id")
        .eq("patient_id", patient.id)

      const memberGroupIds = new Set((memberships ?? []).map(m => m.group_id))
      setGroups(allGroups.filter(g => !memberGroupIds.has(g.id)))
      setLoading(false)
    }
    load()
  }, [patient.id, clinicId])

  async function handleAssign() {
    if (!selected) return
    setSaving(true)
    await supabase.from("patient_groups").insert([{
      patient_id: patient.id,
      group_id:   selected,
      clinic_id:  clinicId,
    }])
    setSaving(false)
    setDone(true)
    setTimeout(onClose, 1200)
  }

  return (
    <MotionModal open={true} onClose={onClose} maxWidth={420}>
      <div style={{
        background:t.bgInset, border:`1px solid ${t.border}`, borderRadius:16,
        width:"100%", maxWidth:420, display:"flex", flexDirection:"column",
        maxHeight:"70vh",
      }}>
        {/* Header */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
          padding:"18px 24px", borderBottom:`1px solid ${t.border}`, flexShrink:0 }}>
          <div>
            <h2 style={{ fontSize:15, fontWeight:700, color:t.textPrimary, margin:0 }}>
              Adicionar a uma turma?
            </h2>
            <p style={{ fontSize:12, color:t.textFaint, margin:"2px 0 0" }}>
              {patient.name}
            </p>
          </div>
          <button style={{ background:"transparent", border:"none", color:t.textGhost, fontSize:18, cursor:"pointer" }} onClick={onClose}>✕</button>
        </div>

        <div style={{ padding:24, display:"flex", flexDirection:"column", gap:16, overflowY:"auto" }}>
          {done ? (
            <div style={{ textAlign:"center", padding:"16px 0" }}>
              <div style={{ fontSize:32, marginBottom:8 }}>✓</div>
              <p style={{ color:t.successText, fontWeight:700, margin:0 }}>Adicionado à turma!</p>
            </div>
          ) : loading ? (
            <div style={{ textAlign:"center", padding:"16px 0", color:t.textGhost, fontSize:13 }}>
              Carregando turmas...
            </div>
          ) : groups.length === 0 ? (
            <div style={{ textAlign:"center", padding:"12px 0" }}>
              <p style={{ color:t.textGhost, fontSize:13, margin:0 }}>
                Nenhuma turma disponível para adicionar este paciente.
              </p>
            </div>
          ) : (
            <>
              <p style={{ fontSize:13, color:t.textBody, margin:0 }}>
                Deseja adicionar <strong style={{ color:t.textPrimary }}>{patient.name}</strong> a uma turma agora?
              </p>

              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {groups.map(g => (
                  <button
                    key={g.id}
                    onClick={() => setSelected(g.id)}
                    style={{
                      display:"flex", alignItems:"center", justifyContent:"space-between",
                      padding:"12px 14px", borderRadius:10, cursor:"pointer",
                      fontFamily:"inherit", transition:"all .15s",
                      background: selected === g.id ? `${t.accent}12` : t.bgCard,
                      border: `1px solid ${selected === g.id ? t.accent : t.border}`,
                    }}
                  >
                    <div style={{ textAlign:"left" }}>
                      <span style={{ fontSize:13, fontWeight:600, color:t.textPrimary, display:"block" }}>
                        {g.name}
                      </span>
                      {g.specialty && (
                        <span style={{ fontSize:11, color:t.textFaint }}>{g.specialty}</span>
                      )}
                    </div>
                    {/* Check visual */}
                    <div style={{
                      width:18, height:18, borderRadius:"50%", flexShrink:0,
                      background: selected === g.id ? t.accent : "transparent",
                      border: `2px solid ${selected === g.id ? t.accent : t.textDisabled}`,
                      display:"flex", alignItems:"center", justifyContent:"center",
                    }}>
                      {selected === g.id && <span style={{ color:"#fff", fontSize:10 }}>✓</span>}
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {!done && (
          <div style={{ display:"flex", justifyContent:"flex-end", gap:10,
            padding:"16px 24px", borderTop:`1px solid ${t.border}` }}>
            <Button onClick={onClose} variant="secondary">
              {groups.length === 0 ? "Fechar" : "Pular"}
            </Button>
            {groups.length > 0 && (
              <Button onClick={handleAssign} disabled={!selected || saving} loading={saving}>
                {saving ? "Adicionando..." : "Adicionar à turma"}
              </Button>
            )}
          </div>
        )}
      </div>
    </MotionModal>
  )
}

// ─── AppointmentModal ─────────────────────────────────────────────────────────

const PAYMENT_METHODS = {
  pix:         "Pix",
  credit_card: "Cartão Crédito",
  debit_card:  "Cartão Débito",
  cash:        "Dinheiro",
  other:       "Outro",
}

/**
 * Props:
 *   onClose, onSave(patientName, appointmentId, patientObj)
 *   staffList, clinicId, specialties
 *   productTypes (Tabela no supabase registrado como "product_types") — array de { id, name, price, sessions_in_package }
 *   initialData — optional: objeto do agendamento para edição { id, client_id, staff_id, datetime, status, specialty, product_type_id }
 *   patientMap  — optional: mapa de pacientes { [id]: { id, name, phone } } para pré-preencher paciente na edição
 */
function AppointmentModal({ onClose, onSave, staffList, clinicId, specialties, productTypes = [], initialData = null, patientMap = {} }) {
  const { t } = useTheme()
  
  // Flag de modo edição
  const isEditing = !!initialData?.id

  // Agendamento
  const [patient,   setPatient]   = useState(null)
  const [staffId,   setStaffId]   = useState("")
  const [datetime,  setDatetime]  = useState("")
  const [status,    setStatus]    = useState("scheduled")
  const [specialty, setSpecialty] = useState("")
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState(null)

  // Tipo de serviço selecionado
  const [productTypeId, setProductTypeId] = useState("")
  const selectedProduct = productTypes.find(p => p.id === productTypeId) ?? null

  // Lançamento financeiro
  const [addPayment,  setAddPayment]  = useState(false)
  const [payAmount,   setPayAmount]   = useState("")
  const [payDiscount, setPayDiscount] = useState("")
  const [payMethod,   setPayMethod]   = useState("pix")
  const [payStatus,   setPayStatus]   = useState("pending")
  const [payDesc,     setPayDesc]     = useState("")

  useEffect(() => {
    const fn = e => { if (e.key === "Escape") onClose() }
    window.addEventListener("keydown", fn)
    return () => window.removeEventListener("keydown", fn)
  }, [])

  // Preenche valor e descrição automaticamente ao selecionar tipo de serviço
  useEffect(() => {
    if (selectedProduct) {
      setPayAmount(String(selectedProduct.price ?? ""))
      setPayDesc(selectedProduct.name)
      if (selectedProduct.price) setAddPayment(true)
    }
  }, [productTypeId])

  // Preenche descrição automaticamente pela especialidade (fallback sem tipo de serviço)
  useEffect(() => {
    if (specialty && !payDesc && !selectedProduct) setPayDesc(`Consulta - ${specialty}`)
  }, [specialty])

  // Preenche campos quando em modo edicao
  useEffect(() => {
    if (initialData) {
      setDatetime(initialData.datetime ? initialData.datetime.slice(0, 16) : "")
      setStatus(initialData.status || "scheduled")
      setSpecialty(initialData.specialty || "")
      setStaffId(initialData.staff_id || "")
      setProductTypeId(initialData.product_type_id || "")
      if (initialData.client_id && patientMap[initialData.client_id]) {
        setPatient(patientMap[initialData.client_id])
      }
    }
  }, [initialData])

  async function handleSave() {
    if (!patient)  { setError("Selecione um paciente"); return }
    if (!datetime) { setError("Informe a data e hora"); return }
    if (addPayment && (!payAmount || isNaN(parseFloat(payAmount)))) {
      setError("Informe o valor do lançamento"); return
    }
    setError(null); setLoading(true)

    // Converte datetime local para UTC antes de salvar no banco
    const datetimeUtc = datetime ? new Date(datetime).toISOString() : datetime

    let appt = null

    // 1. Cria ou atualiza o agendamento
    if (isEditing) {
      // Modo edicao: UPDATE
      const { data, error: apptError } = await supabase
        .from("appointments")
        .update({
          client_id:       patient.id,
          staff_id:        staffId || null,
          datetime:        datetimeUtc,
          status,
          specialty:       specialty || null,
          product_type_id: productTypeId || null,
          updated_at:      new Date().toISOString(),
        })
        .eq("id", initialData.id)
        .select().single()

      if (apptError) { setError(apptError.message); setLoading(false); return }
      appt = data
    } else {
      // Modo criacao: INSERT
      const { data, error: apptError } = await supabase
        .from("appointments")
        .insert([{
          clinic_id:       clinicId,
          client_id:       patient.id,
          staff_id:        staffId || null,
          datetime:        datetimeUtc,
          status,
          specialty:       specialty || null,
          product_type_id: productTypeId || null,
        }])
        .select().single()

      if (apptError) { setError(apptError.message); setLoading(false); return }
      appt = data
    }

    // 2. Cria o lançamento financeiro se solicitado
    if (addPayment && payAmount) {
      const amount   = parseFloat(payAmount)
      const discount = parseFloat(payDiscount) || 0

      // NOTA: product_type_id será adicionado ao payments após a migration correspondente.
      // Por ora é omitido para evitar erro 400 de coluna inexistente.
      const paymentPayload = {
        clinic_id:      clinicId,
        patient_id:     patient.id,
        appointment_id: appt.id,
        amount,
        discount,
        payment_method: payMethod,
        status:         payStatus,
        description:    payDesc.trim() || `Consulta - ${specialty || "Geral"}`,
        paid_at:        payStatus === "paid" ? new Date().toISOString() : null,
      }

      const { error: payError } = await supabase.from("payments").insert([paymentPayload])
      if (payError) console.error("Payment insert error:", payError.message)
    }

    // 3. Envia confirmação WhatsApp
    if (patient.phone) {
      supabase.functions.invoke("send-whatsapp", {
        body: { type: "confirmation", appointment_id: appt.id }
      }).catch(() => {})
    }

    setLoading(false)
    onSave(patient.name, appt.id, patient)
  }

  const finalAmount = (parseFloat(payAmount)||0) - (parseFloat(payDiscount)||0)

  return (
    <MotionModal open={true} onClose={onClose} maxWidth={500}>
      <div style={{ background:t.bgInset, border:`1px solid ${t.border}`, borderRadius:16,
        width:"100%", maxWidth:500, display:"flex", flexDirection:"column", maxHeight:"90vh" }}>

        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
          padding:"18px 24px", borderBottom:`1px solid ${t.border}`, flexShrink:0 }}>
          <h2 style={{ fontSize:16, fontWeight:700, color:t.textPrimary, margin:0 }}>
            {isEditing ? "Editar agendamento" : "Novo agendamento"}
          </h2>
          <button style={{ background:"transparent", border:"none", color:t.textGhost, fontSize:18, cursor:"pointer" }} onClick={onClose}>✕</button>
        </div>

        <div style={{ padding:24, display:"flex", flexDirection:"column", gap:16, overflowY:"auto", flex:1 }}>

          {/* Paciente */}
          <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
            <label style={{ fontSize:12, fontWeight:600, color:t.textFaint }}>Paciente *</label>
            <PatientSearchInput value={patient} onSelect={setPatient} clinicId={clinicId} />
          </div>

          {/* Data e hora */}
          <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
            <label style={{ fontSize:12, fontWeight:600, color:t.textFaint }}>Data e hora *</label>
            <Input type="datetime-local" value={datetime} onChange={e=>setDatetime(e.target.value)} />
          </div>

          {/* Profissional */}
          {staffList.length > 0 && (
            <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
              <label style={{ fontSize:12, fontWeight:600, color:t.textFaint }}>Profissional</label>
              <select value={staffId} onChange={e=>setStaffId(e.target.value)}
                style={{ background:t.bgInput, border:`1px solid ${t.border}`, borderRadius:8,
                  padding:"10px 12px", fontSize:14, color:t.textPrimary, outline:"none",
                  width:"100%", boxSizing:"border-box", cursor:"pointer" }}>
                <option value="">Sem profissional definido</option>
                {staffList.map(st=><option key={st.id} value={st.id}>{st.name}</option>)}
              </select>
            </div>
          )}

          {/* Especialidade */}
          {specialties?.length > 0 && (
            <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
              <label style={{ fontSize:12, fontWeight:600, color:t.textFaint }}>Especialidade</label>
              <select value={specialty} onChange={e=>setSpecialty(e.target.value)}
                style={{ background:t.bgInput, border:`1px solid ${t.border}`, borderRadius:8,
                  padding:"10px 12px", fontSize:14, color:t.textPrimary, outline:"none",
                  width:"100%", boxSizing:"border-box", cursor:"pointer" }}>
                <option value="">Selecione...</option>
                {specialties.map(sp=><option key={sp} value={sp}>{sp}</option>)}
              </select>
            </div>
          )}

          {/* ── Tipo de serviço ── */}
          {productTypes.length > 0 && (
            <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
              <label style={{ fontSize:12, fontWeight:600, color:t.textFaint }}>Tipo de serviço</label>
              <select value={productTypeId} onChange={e=>setProductTypeId(e.target.value)}
                style={{ background:t.bgInput, border:`1px solid ${t.border}`, borderRadius:8,
                  padding:"10px 12px", fontSize:14, color:t.textPrimary, outline:"none",
                  width:"100%", boxSizing:"border-box", cursor:"pointer" }}>
                <option value="">Sem tipo definido</option>
                {productTypes.map(p=>(
                  <option key={p.id} value={p.id}>
                    {p.name}{p.price ? ` — ${formatCurrency(p.price)}` : ""}
                    {p.sessions_in_package ? ` (pacote ${p.sessions_in_package}x)` : ""}
                  </option>
                ))}
              </select>
              {/* Preview do serviço selecionado */}
              {selectedProduct && (
                <div style={{ background:t.bgCard, borderRadius:8, padding:"10px 14px",
                  border:`1px solid ${t.accent}33`, display:"flex", gap:16, flexWrap:"wrap" }}>
                  {selectedProduct.price != null && (
                    <div>
                      <span style={{ fontSize:11, color:t.textFaint, display:"block" }}>Valor</span>
                      <span style={{ fontSize:14, fontWeight:700, color:t.accent }}>{formatCurrency(selectedProduct.price)}</span>
                    </div>
                  )}
                  {selectedProduct.sessions_in_package && (
                    <div>
                      <span style={{ fontSize:11, color:t.textFaint, display:"block" }}>Pacote</span>
                      <span style={{ fontSize:14, fontWeight:700, color:t.textPrimary }}>{selectedProduct.sessions_in_package} sessões</span>
                    </div>
                  )}
                  {selectedProduct.description && (
                    <div style={{ width:"100%" }}>
                      <span style={{ fontSize:12, color:t.textGhost }}>{selectedProduct.description}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Status */}
          <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
            <label style={{ fontSize:12, fontWeight:600, color:t.textFaint }}>Status</label>
            <select value={status} onChange={e=>setStatus(e.target.value)}
              style={{ background:t.bgInput, border:`1px solid ${t.border}`, borderRadius:8,
                padding:"10px 12px", fontSize:14, color:t.textPrimary, outline:"none",
                width:"100%", boxSizing:"border-box", cursor:"pointer" }}>
              {Object.entries(STATUS_CONFIG).map(([k,cfg])=><option key={k} value={k}>{cfg.label}</option>)}
            </select>
          </div>

          {/* ── Lançamento financeiro ── */}
          <div style={{ borderTop:`1px solid ${t.border}`, paddingTop:12 }}>
            <button
              onClick={() => setAddPayment(p => !p)}
              style={{
                display:"flex", alignItems:"center", gap:10, width:"100%",
                background: addPayment ? `${t.accent}12` : t.bgCard,
                border:`1px solid ${addPayment ? t.accent : t.border}`,
                borderRadius:10, padding:"10px 14px", cursor:"pointer",
                fontFamily:"inherit", transition:"all .15s",
              }}
            >
              <div style={{
                width:20, height:20, borderRadius:4, flexShrink:0,
                background: addPayment ? t.accent : "transparent",
                border:`2px solid ${addPayment ? t.accent : t.textDisabled}`,
                display:"flex", alignItems:"center", justifyContent:"center",
              }}>
                {addPayment && <span style={{ color:"#fff", fontSize:12, lineHeight:1 }}>✓</span>}
              </div>
              <div style={{ textAlign:"left" }}>
                <span style={{ fontSize:13, fontWeight:600, color: addPayment ? t.accent : t.textMuted, display:"block" }}>
                  Registrar cobrança agora
                </span>
                <span style={{ fontSize:11, color:t.textDisabled }}>
                  Cria um lançamento financeiro vinculado a este agendamento
                </span>
              </div>
            </button>
          </div>

          {addPayment && (
            <div style={{ display:"flex", flexDirection:"column", gap:14,
              padding:"16px", background:t.bgCard, borderRadius:10, border:`1px solid ${t.border}` }}>

              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                <div>
                  <label style={{ fontSize:12, fontWeight:600, color:t.textFaint, display:"block", marginBottom:6 }}>
                    Valor (R$) *
                  </label>
                  <Input type="number" placeholder="0,00" value={payAmount}
                    onChange={e=>setPayAmount(e.target.value)} min="0" step="0.01" />
                </div>
                <div>
                  <label style={{ fontSize:12, fontWeight:600, color:t.textFaint, display:"block", marginBottom:6 }}>
                    Desconto (R$)
                  </label>
                  <Input type="number" placeholder="0,00" value={payDiscount}
                    onChange={e=>setPayDiscount(e.target.value)} min="0" step="0.01" />
                </div>
              </div>

              {payAmount && (
                <div style={{ background:t.bgInset, borderRadius:8, padding:"8px 14px",
                  display:"flex", justifyContent:"space-between" }}>
                  <span style={{ fontSize:13, color:t.textGhost }}>Total</span>
                  <span style={{ fontSize:15, fontWeight:800, color:t.successText }}>
                    {formatCurrency(finalAmount)}
                  </span>
                </div>
              )}

              <div>
                <label style={{ fontSize:12, fontWeight:600, color:t.textFaint, display:"block", marginBottom:6 }}>
                  Forma de pagamento
                </label>
                <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                  {Object.entries(PAYMENT_METHODS).map(([k,v]) => (
                    <button key={k} onClick={()=>setPayMethod(k)} style={{
                      padding:"6px 12px", borderRadius:8, fontSize:12, fontWeight:600,
                      cursor:"pointer", fontFamily:"inherit", transition:"all .12s",
                      background: payMethod===k ? t.accent : t.bgInset,
                      border:`1px solid ${payMethod===k ? t.accent : t.border}`,
                      color: payMethod===k ? "#fff" : t.textMuted,
                    }}>{v}</button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ fontSize:12, fontWeight:600, color:t.textFaint, display:"block", marginBottom:6 }}>
                  Status do pagamento
                </label>
                <div style={{ display:"flex", gap:8 }}>
                  {["pending","paid"].map(s => {
                    const labels = { pending:"Pendente", paid:"Pago agora" }
                    const colors = { pending:"#f59e0b", paid:"#22c55e" }
                    const active = payStatus === s
                    return (
                      <button key={s} onClick={()=>setPayStatus(s)} style={{
                        flex:1, padding:"8px", borderRadius:8, fontSize:13, fontWeight:700,
                        cursor:"pointer", fontFamily:"inherit",
                        background: active ? colors[s]+"18" : t.bgInset,
                        border:`1px solid ${active ? colors[s] : t.border}`,
                        color: active ? colors[s] : t.textMuted,
                      }}>{labels[s]}</button>
                    )
                  })}
                </div>
              </div>

              <div>
                <label style={{ fontSize:12, fontWeight:600, color:t.textFaint, display:"block", marginBottom:6 }}>
                  Descrição
                </label>
                <Input type="text" placeholder="Ex: Sessão de Pilates"
                  value={payDesc} onChange={e=>setPayDesc(e.target.value)} />
              </div>
            </div>
          )}

          {error && (
            <div style={{ background:t.errorBg, border:`1px solid ${t.errorBorder}`,
              color:t.errorText, borderRadius:8, padding:"10px 14px", fontSize:13 }}>
              {error}
            </div>
          )}
        </div>

        <div style={{ display:"flex", justifyContent:"flex-end", gap:10,
          padding:"16px 24px", borderTop:`1px solid ${t.border}`, flexShrink:0 }}>
          <Button onClick={onClose} variant="secondary">Cancelar</Button>
          <Button onClick={handleSave} disabled={loading} loading={loading}>
            {loading ? "Salvando..." : isEditing ? "Salvar" : addPayment ? "Agendar + Lançar" : "Agendar"}
          </Button>
        </div>
      </div>
    </MotionModal>
  )
}

// ─── CalendarView ─────────────────────────────────────────────────────────────

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
        <Button onClick={()=>setCurrent(new Date(year,month-1,1))} variant="secondary" style={{ padding:"6px 14px", fontSize:18 }}>‹</Button>
        <span style={{ fontSize:16, fontWeight:700, color:t.textPrimary }}>{MONTHS_PT[month]} {year}</span>
        <Button onClick={()=>setCurrent(new Date(year,month+1,1))} variant="secondary" style={{ padding:"6px 14px", fontSize:18 }}>›</Button>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:4 }}>
        {DAYS_PT.map(d=><div key={d} style={{ fontSize:11, fontWeight:700, color:t.textGhost, textAlign:"center", padding:"4px 0 8px", textTransform:"uppercase" }}>{d}</div>)}
        {cells.map((day,i) => {
          if (!day) return <div key={`e-${i}`} />
          const appts   = getApptsByDay(day)
          const isToday = isSameDay(new Date(year,month,day), today)
          return (
            <div key={day}
              style={{ minHeight:72, background:t.bgInset, borderRadius:8, padding:"6px 8px", cursor:appts.length?"pointer":"default", border:isToday?`1px solid ${t.accent}`:"1px solid transparent" }}
              onClick={()=>appts.length&&onDayClick(new Date(year,month,day),appts)}>
              <span style={{ fontSize:13, fontWeight:isToday?800:500, color:isToday?t.accent:t.textBody }}>{day}</span>
              <div style={{ marginTop:4, display:"flex", flexDirection:"column", gap:2 }}>
                {appts.slice(0,3).map(a=>{
                  const cfg=STATUS_CONFIG[a.status]??{color:"#64748b"}
                  return <div key={a.id} style={{ fontSize:10, fontWeight:600, color:cfg.color, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>• {formatTime(a.datetime)}</div>
                })}
                {appts.length>3&&<div style={{fontSize:10,color:t.textGhost}}>+{appts.length-3} mais</div>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Appointments (página principal) ─────────────────────────────────────────

export default function Appointments() {
  const { t }                       = useTheme()
  const { clinicId, clinic }        = useAuth()
  const { isAdmin }                 = usePermissions()
  const isMobile                    = useIsMobile()

  // Dados
  const [appointments, setAppointments] = useState([])
  const [patientMap,   setPatientMap]   = useState({})
  const [staffMap,     setStaffMap]     = useState({})
  const [staffList,    setStaffList]    = useState([])
  const [productTypes, setProductTypes] = useState([])
  const [fetching,     setFetching]     = useState(true)

  // UI
  const [view,           setView]           = useState("day")   // "day" | "list" | "calendar"
  const [showModal,      setShowModal]      = useState(false)
  const [toast,          setToast]          = useState(null)
  const [selectedDate,   setSelectedDate]   = useState(new Date())
  const [selectedDay,    setSelectedDay]    = useState(null)
  const [filterStatus,   setFilterStatus]   = useState("all")
  const [filterSpecialty,setFilterSpecialty]= useState("all")
  const [query,          setQuery]          = useState("")
  const [remoteAppts,    setRemoteAppts]    = useState(null)
  const [searching,      setSearching]      = useState(false)
  const [changingStatus, setChangingStatus] = useState(null)

  // Modal de turma pós-agendamento
  const [groupModal, setGroupModal] = useState(null) // { patient }

  // Modal de edição de agendamento
  const [editModal, setEditModal] = useState(false)
  const [editingAppt, setEditingAppt] = useState(null)

  const searchTimeout = useRef(null)

  // ── Carrega dados ──
  useEffect(() => {
    if (!clinicId) return
    loadAll()
  }, [clinicId])

  async function loadAll() {
    setFetching(true)
    const [apptRes, patientRes, staffRes, productRes] = await Promise.all([
      supabase.from("appointments").select("*")
        .eq("clinic_id", clinicId).is("deleted_at", null)
        .order("datetime", { ascending: false }).limit(500),
      supabase.from("patients").select("id,name,phone")
        .eq("clinic_id", clinicId).is("deleted_at", null),
      supabase.from("staff").select("id,name")
        .eq("clinic_id", clinicId).is("deleted_at", null),
      supabase.from("product_types").select("id,name,price,sessions_in_package,description,specialty")
        .eq("clinic_id", clinicId).eq("active", true).is("deleted_at", null).order("name"),
    ])

    setAppointments(apptRes.data ?? [])
    setPatientMap(Object.fromEntries((patientRes.data ?? []).map(p=>[p.id,p])))
    const sMap = Object.fromEntries((staffRes.data ?? []).map(s=>[s.id,s]))
    setStaffMap(sMap)
    setStaffList(staffRes.data ?? [])
    setProductTypes(productRes.data ?? [])
    setFetching(false)
  }

  function showToast(message, type="success") {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }

  // ── Busca remota ──
  function handleQueryChange(q) {
    setQuery(q)
    clearTimeout(searchTimeout.current)
    if (!q.trim()) { setRemoteAppts(null); return }
    setSearching(true)
    searchTimeout.current = setTimeout(async () => {
      const { data } = await supabase.from("appointments").select("*")
        .eq("clinic_id", clinicId).is("deleted_at", null)
        .order("datetime", { ascending:false }).limit(200)
      setRemoteAppts(data ?? [])
      setSearching(false)
    }, 400)
  }

  // ── Status change ──
  async function handleStatusChange(id, newStatus) {
    setChangingStatus(id)
    await supabase.from("appointments").update({ status: newStatus, updated_at: new Date().toISOString() }).eq("id", id)
    setAppointments(prev => prev.map(a => a.id===id ? {...a, status:newStatus} : a))
    setChangingStatus(null)
  }

  // ── Delete ──
  async function handleDelete(id) {
    if (!window.confirm("Remover este agendamento?")) return
    await supabase.from("appointments").update({ deleted_at: new Date().toISOString() }).eq("id", id)
    setAppointments(prev => prev.filter(a => a.id !== id))
    showToast("Agendamento removido")
  }

  // ── Salvar novo agendamento → abre modal de turma ──
  function handleSaved(patientName, apptId, patientObj) {
    setShowModal(false)
    loadAll()
    showToast(`Agendamento de ${patientName} criado!`)
    // Abre modal de turma após pequeno delay (UX: toast aparece primeiro)
    setTimeout(() => setGroupModal({ patient: patientObj }), 400)
  }

  // ── Editar agendamento ──
  function handleEditClick(appt) {
    setEditingAppt(appt)
    setEditModal(true)
  }

  function handleEdited(patientName, apptId) {
    setEditModal(false)
    setEditingAppt(null)
    loadAll()
    showToast(`Agendamento de ${patientName} atualizado!`)
  }

  // ── Filtros ──
  const base = remoteAppts ?? appointments
  const filteredByStatus = filterStatus === "all" ? base : base.filter(a => a.status === filterStatus)
  const filteredWithSpecialty = filterSpecialty === "all"
    ? filteredByStatus
    : filteredByStatus.filter(a => a.specialty === filterSpecialty)

  const displayed = query.trim()
    ? filteredWithSpecialty.filter(a => {
        const q = query.toLowerCase()
        const patient = patientMap[a.client_id]
        const staff   = staffMap[a.staff_id]
        if (patient?.name?.toLowerCase().includes(q)) return true
        if (staff?.name?.toLowerCase().includes(q)) return true
        const dateStr = formatDateTime(a.datetime)
        if (dateStr.includes(q)) return true
        const cfg = STATUS_CONFIG[a.status]
        if (cfg?.label?.toLowerCase().includes(q)) return true
        return false
      })
    : filteredWithSpecialty

  // ── Styles ──
  const s = {
    header:      { display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20, gap:12, flexWrap:"wrap" },
    title:       { fontSize:isMobile?20:24, fontWeight:800, color:t.textPrimary, margin:0 },
    filterCount: { fontSize:11, opacity:.7 },
    listCard:    { background:t.bgCard, borderRadius:12, padding:isMobile?12:20, overflowX:"auto" },
    table:       { width:"100%", borderCollapse:"collapse" },
    th:          { padding:"10px 14px", textAlign:"left", fontSize:12, fontWeight:700, color:t.textFaint, borderBottom:`1px solid ${t.border}`, whiteSpace:"nowrap" },
    td:          { padding:"12px 14px", borderBottom:`1px solid ${t.bgInset}`, verticalAlign:"middle" },
    tr:          { transition:"background .1s" },
    patientName: { fontWeight:700, color:t.textPrimary, fontSize:14, display:"block" },
    patientPhone:{ fontSize:12, color:t.textGhost, display:"block" },
    tdMain:      { fontWeight:600, color:t.textBody, fontSize:14 },
    tdMuted:     { color:t.textGhost, fontSize:13 },
  }

  return (
    <AppLayout>
      <Toast toast={toast} t={t} />

      {/* Modal de novo agendamento */}
      {showModal && (
        <AppointmentModal
          onClose={() => setShowModal(false)}
          onSave={handleSaved}
          staffList={staffList}
          clinicId={clinicId}
          specialties={clinic?.specialties ?? []}
          productTypes={productTypes}
        />
      )}

      {/* Modal de atribuição a turma */}
      {groupModal && (
        <GroupAssignModal
          patient={groupModal.patient}
          clinicId={clinicId}
          onClose={() => setGroupModal(null)}
        />
      )}

      {/* Modal de edição de agendamento */}
      {editModal && (
        <AppointmentModal
          onClose={() => { setEditModal(false); setEditingAppt(null) }}
          onSave={handleEdited}
          staffList={staffList}
          clinicId={clinicId}
          specialties={clinic?.specialties ?? []}
          productTypes={productTypes}
          initialData={editingAppt}
          patientMap={patientMap}
        />
      )}

      <div style={{ maxWidth:1100, margin:"0 auto" }}>
        {/* ── Header ── */}
        <div style={s.header}>
          <div>
            <h1 style={s.title}>Agenda</h1>
            <p style={{ fontSize:13, color:t.textFaint, margin:"4px 0 0" }}>
              {appointments.length} agendamento{appointments.length !== 1 ? "s" : ""} no total
            </p>
          </div>
          <div style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"wrap" }}>
            {/* Toggle de view */}
            <div style={{ display:"flex", background:t.bgCard, border:`1px solid ${t.border}`, borderRadius:10, padding:3, gap:2 }}>
              {[["day","📅 Dia"],["list","☰ Lista"],["calendar","🗓 Mês"]].map(([v,label])=>(
                <button key={v} onClick={()=>setView(v)} style={{
                  padding:"6px 14px", borderRadius:8, fontSize:13, fontWeight:600,
                  cursor:"pointer", fontFamily:"inherit", transition:"all .15s",
                  background: view===v ? t.accent : "transparent",
                  border: "none",
                  color: view===v ? "#fff" : t.textMuted,
                }}>{label}</button>
              ))}
            </div>
            <Button onClick={() => setShowModal(true)}>+ Novo agendamento</Button>
          </div>
        </div>

        {/* ── Views ── */}
        {view === "day" ? (
          <DayView
            appointments={appointments}
            patientMap={patientMap}
            staffMap={staffMap}
            onStatusChange={handleStatusChange}
            onDelete={handleDelete}
            onEdit={handleEditClick}
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
            isMobile={isMobile}
            isAdmin={isAdmin}
          />
        ) : view === "list" ? (
          <>
            {/* Filtros de status */}
            <div style={{ display:"flex", gap:8, marginBottom:12, overflowX:"auto", flexWrap:isMobile?"nowrap":"wrap", paddingBottom:isMobile?4:0 }}>
              <button onClick={()=>setFilterStatus("all")} style={{
                flexShrink:0, padding:"6px 14px", fontSize:13, fontWeight:600, cursor:"pointer",
                borderRadius:8, fontFamily:"inherit",
                color: filterStatus==="all" ? t.accent : t.textFaint,
                background: filterStatus==="all" ? t.bgCard : "transparent",
                border: `1px solid ${filterStatus==="all" ? t.accent : t.border}`,
                transition:"all .15s",
              }}>
                Todos <span style={s.filterCount}>{appointments.length}</span>
              </button>
              {Object.entries(STATUS_CONFIG).map(([key,cfg])=>{
                const count = appointments.filter(a=>a.status===key).length
                const isActive = filterStatus===key
                return (
                  <button key={key} onClick={()=>setFilterStatus(key)} style={{
                    flexShrink:0, padding:"6px 14px", fontSize:13, fontWeight:600, cursor:"pointer",
                    borderRadius:8, fontFamily:"inherit", transition:"all .15s",
                    color: isActive ? cfg.color : t.textFaint,
                    background: isActive ? cfg.bg : "transparent",
                    border: `1px solid ${isActive ? cfg.border : t.border}`,
                  }}>
                    {cfg.label} <span style={s.filterCount}>{count}</span>
                  </button>
                )
              })}
            </div>

            {/* Filtro especialidade */}
            {Array.isArray(clinic?.specialties) && clinic.specialties.length > 0 && (
              <div style={{ marginBottom:12 }}>
                <select value={filterSpecialty} onChange={e=>setFilterSpecialty(e.target.value)} style={{ background:t.bgInset, border:`1px solid ${t.border}`, borderRadius:8, padding:"8px 12px", fontSize:13, color:t.textPrimary, cursor:"pointer", outline:"none" }}>
                  <option value="all">Todas especialidades</option>
                  {clinic.specialties.map(sp=><option key={sp} value={sp}>{sp}</option>)}
                </select>
              </div>
            )}

            {/* Busca */}
            <div style={{ position:"relative", marginBottom:16 }}>
              <span style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", fontSize:14, color:t.textGhost, pointerEvents:"none" }}>🔍</span>
              <Input type="text" placeholder="Buscar por paciente, data, status ou profissional..."
                value={query} onChange={e=>handleQueryChange(e.target.value)} style={{ paddingLeft:36 }} />
              {searching && <span style={{ position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",fontSize:11,color:t.textGhost }}>buscando...</span>}
              {query && !searching && (
                <button onClick={()=>{setQuery("");setRemoteAppts(null)}} style={{ position:"absolute",right:8,top:"50%",transform:"translateY(-50%)",background:"transparent",border:"none",color:t.textGhost,cursor:"pointer",fontSize:16 }}>✕</button>
              )}
            </div>

            <div style={s.listCard}>
              {fetching ? (
                <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                  {[1,2,3,4].map(i=><div key={i} className="skeleton-shimmer" style={{ height:52 }}/>)}
                </div>
              ) : displayed.length === 0 ? (
                <div style={{ textAlign:"center", padding:"48px 0", display:"flex", flexDirection:"column", alignItems:"center", gap:8 }}>
                  <span style={{ fontSize:36 }}>📅</span>
                  <p style={{ fontSize:15, color:t.textGhost, margin:0, fontWeight:600 }}>Nenhum agendamento encontrado</p>
                  <p style={{ fontSize:13, color:t.borderStrong, margin:0 }}>
                    {filterStatus!=="all"?"Tente outro filtro ou ":""}clique em "+ Novo agendamento" para começar.
                  </p>
                </div>
              ) : isMobile ? (
                <MotionList style={{ display:"flex", flexDirection:"column", gap:10 }}>
                  {displayed.map(a=>(
                    <MotionItem key={a.id}>
                      <div style={{ background:t.bgInset, borderRadius:10, padding:"14px 16px", display:"flex", flexDirection:"column", gap:8 }}>
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                          <span style={{ fontWeight:700, color:t.textPrimary, fontSize:15 }}>{patientMap[a.client_id]?.name ?? "—"}</span>
                          <StatusBadge status={a.status} />
                        </div>
                        <span style={{ fontSize:13, color:t.textGhost }}>{formatDateTime(a.datetime)}</span>
                        {staffMap[a.staff_id] && <span style={{ fontSize:13, color:t.textGhost }}>👤 {staffMap[a.staff_id].name}</span>}
                        <div style={{ display:"flex", gap:8, marginTop:4 }}>
                          <select value={a.status} disabled={changingStatus===a.id} onChange={e=>handleStatusChange(a.id,e.target.value)}
                            style={{ background:t.bgInset, border:`1px solid ${t.border}`, borderRadius:6, padding:"4px 8px", fontSize:12, fontWeight:700, cursor:"pointer", outline:"none", flex:1, color:STATUS_CONFIG[a.status]?.color??"#64748b", opacity:changingStatus===a.id?0.5:1 }}>
                            {Object.entries(STATUS_CONFIG).map(([k,cfg])=><option key={k} value={k}>{cfg.label}</option>)}
                          </select>
                          <Button onClick={() => handleEditClick(a)} size="sm" variant="ghost">Editar</Button>
                          <Button onClick={()=>handleDelete(a.id)} size="sm" variant="ghost">Remover</Button>
                        </div>
                      </div>
                    </MotionItem>
                  ))}
                </MotionList>
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
                    {displayed.map(a=>(
                      <tr key={a.id} style={s.tr}>
                        <td style={s.td}>
                          <span style={s.patientName}>{patientMap[a.client_id]?.name ?? "—"}</span>
                          {patientMap[a.client_id]?.phone && <span style={s.patientPhone}>{patientMap[a.client_id].phone}</span>}
                        </td>
                        <td style={s.td}><span style={s.tdMain}>{formatDateTime(a.datetime)}</span></td>
                        <td style={s.td}><span style={s.tdMuted}>{staffMap[a.staff_id]?.name ?? "—"}</span></td>
                        <td style={s.td}>
                          <select value={a.status} disabled={changingStatus===a.id} onChange={e=>handleStatusChange(a.id,e.target.value)}
                            style={{ background:t.bgInset, border:`1px solid ${t.border}`, borderRadius:6, padding:"4px 8px", fontSize:12, fontWeight:700, cursor:"pointer", outline:"none", color:STATUS_CONFIG[a.status]?.color??"#64748b", opacity:changingStatus===a.id?0.5:1 }}>
                            {Object.entries(STATUS_CONFIG).map(([k,cfg])=><option key={k} value={k}>{cfg.label}</option>)}
                          </select>
                        </td>
                        <td style={{ ...s.td, textAlign:"right" }}>
                          <Button onClick={() => handleEditClick(a)} size="sm" variant="ghost">Editar</Button>
                          <Button onClick={()=>handleDelete(a.id)} size="sm" variant="ghost" style={{ marginLeft: 4 }}>Remover</Button>
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
