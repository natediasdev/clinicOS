import { useEffect, useRef, useState } from "react"
import { MotionModal } from "../ui/MotionComponents"
import { useTheme } from "../../context/ThemeContext"
import { supabase } from "../../supabaseClient"
import { Button, Input } from "../ui"
import { STATUS_COLORS } from "../../config/statusColors"

// Modal de agendamento (criar/editar), compartilhado entre a Agenda e o
// Dashboard (ações rápidas). Extraído de pages/app/Appointments.jsx.

const APPOINTMENT_STATUSES = ["scheduled", "completed", "cancelled", "no_show"]
const STATUS_CONFIG = Object.fromEntries(APPOINTMENT_STATUSES.map(k => [k, STATUS_COLORS[k]]))

function formatCurrency(v) { return new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(v ?? 0) }

// timestamptz chega em UTC ("...T17:00:00+00:00"); o <input datetime-local>
// espera hora LOCAL. Antes o código fazia slice(0,16) do UTC e, ao salvar,
// o horário andava +3h a cada edição.
function toLocalInput(iso) {
  const d = new Date(iso)
  if (isNaN(d)) return ""
  const p = (n) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`
}

// ─── PatientSearchInput ───────────────────────────────────────────────────────

function PatientSearchInput({ value, onSelect, clinicId }) {
  const { t } = useTheme()
  const [query, setQuery]     = useState(value?.name ?? "")
  const [results, setResults] = useState([])
  const [open, setOpen]       = useState(false)
  const ref = useRef()

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
export default function AppointmentModal({ onClose, onSave, staffList, clinicId, specialties, productTypes = [], initialData = null, patientMap = {} }) {
  const { t } = useTheme()
  
  // Flag de modo edição
  const isEditing = !!initialData?.id

  // Agendamento
  const [patient,   setPatient]   = useState(() => (initialData?.client_id && patientMap[initialData.client_id]) || null)
  const [staffId,   setStaffId]   = useState(initialData?.staff_id || "")
  const [datetime,  setDatetime]  = useState(() => initialData?.datetime ? toLocalInput(initialData.datetime) : "")
  const [status,    setStatus]    = useState(initialData?.status || "scheduled")
  const [specialty, setSpecialty] = useState(initialData?.specialty || "")
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState(null)

  // Tipo de serviço selecionado
  const [productTypeId, setProductTypeId] = useState(initialData?.product_type_id || "")
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
  }, [onClose])

  // Ao escolher o tipo de serviço (só ao escolher — não ao abrir uma edição),
  // preenche valor e descrição do lançamento. Antes isso era um efeito que
  // também disparava na edição e marcava "adicionar lançamento" sozinho.
  function handleProductChange(id) {
    setProductTypeId(id)
    const prod = productTypes.find(p => p.id === id)
    if (prod) {
      setPayAmount(String(prod.price ?? ""))
      setPayDesc(prod.name)
      if (prod.price) setAddPayment(true)
    }
  }

  // Fallback sem tipo de serviço: descrição pela especialidade.
  function handleSpecialtyChange(value) {
    setSpecialty(value)
    if (value && !payDesc && !selectedProduct) setPayDesc(`Consulta - ${value}`)
  }

  async function handleSave() {
    if (!patient)  { setError("Selecione um paciente"); return }
    if (!datetime) { setError("Informe a data e hora"); return }
    const apptYear = new Date(datetime).getFullYear()
    const nowYear  = new Date().getFullYear()
    if (apptYear < nowYear - 1 || apptYear > nowYear + 2) {
      setError("Data do agendamento parece incorreta — confira o ano"); return
    }
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

    // 3. Envia confirmação WhatsApp (silencioso - não bloqueia criação)
    if (patient.phone) {
      supabase.functions.invoke("send-whatsapp", {
        body: { type: "confirmation", appointment_id: appt.id }
      }).then(({ data, error }) => {
        if (error) console.error("WhatsApp error:", error.message)
        else if (data?.sent > 0) console.log("WhatsApp confirmation sent")
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
              <select value={specialty} onChange={e=>handleSpecialtyChange(e.target.value)}
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
              <select value={productTypeId} onChange={e=>handleProductChange(e.target.value)}
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

