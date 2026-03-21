import { useState, useEffect } from "react"
import { MotionToast } from "../../components/ui/MotionComponents"
import { useParams, useNavigate } from "react-router-dom"
import { supabase } from "../../supabaseClient"
import { useAuth } from "../../context/AuthContext"
import { useTheme } from "../../context/ThemeContext"
import AppLayout from "../AppLayout"
import { Button, Input, Card } from "../../components/ui"
import { STATUS_COLORS } from "../../config/statusColors"

// ─── Tabs ─────────────────────────────────────────────────────────────────────
const TABS = [
  { id: "overview",     label: "Dados",        icon: "👤" },
  { id: "notes",        label: "Anotações",    icon: "📝" },
  { id: "history",      label: "Consultas",    icon: "📅" },
  { id: "attachments",  label: "Anexos",       icon: "📎" },
]

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ toast }) {
  const { t } = useTheme()
  const ok = toast?.type === "success"
  return (
    <MotionToast toast={toast}>
      <div style={{ borderRadius:10, padding:"12px 20px",
        fontSize:14, fontWeight:600, boxShadow:"0 8px 24px rgba(0,0,0,0.3)",
        background: ok ? t.successBg : t.errorBg,
        border: `1px solid ${ok ? t.successBorder : t.errorBorder}`,
        color: ok ? t.successText : t.errorText,
      }}>
        {ok ? "✓" : "✕"} {toast?.msg}
      </div>
    </MotionToast>
  )
}

// ─── Tab: Dados gerais ────────────────────────────────────────────────────────
function TabOverview({ patient, clinicId, t, isMobile }) {
  const [record, setRecord] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null)
  const [form, setForm] = useState({
    cpf:"", birth_date:"", gender:"", address:"",
    emergency_contact:"", emergency_phone:"",
    allergies:"", medications:"", medical_history:""
  })

  function showToast(msg, type="success") { setToast({msg,type}); setTimeout(()=>setToast(null),3000) }
  function set(k, v) { setForm(f=>({...f,[k]:v})) }

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from("patient_records").select("*").eq("patient_id", patient.id).maybeSingle()
      if (data) { setRecord(data); setForm({ cpf:data.cpf??"", birth_date:data.birth_date??"", gender:data.gender??"", address:data.address??"", emergency_contact:data.emergency_contact??"", emergency_phone:data.emergency_phone??"", allergies:data.allergies??"", medications:data.medications??"", medical_history:data.medical_history??"" }) }
      setLoading(false)
    }
    load()
  }, [patient.id])

  async function handleSave() {
    setSaving(true)
    const payload = { ...form, patient_id: patient.id, clinic_id: clinicId, updated_at: new Date().toISOString() }
    let error
    if (record) {
      ({ error } = await supabase.from("patient_records").update(payload).eq("id", record.id))
    } else {
      const res = await supabase.from("patient_records").insert([payload]).select().single()
      error = res.error
      if (!error) setRecord(res.data)
    }
    setSaving(false)
    if (error) showToast(error.message, "error")
    else showToast("Dados salvos com sucesso!")
  }

  const col2 = { display:"grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap:14 }

  if (loading) return <div style={{ display:"flex",flexDirection:"column",gap:8 }}>{[1,2,3,4].map(i=><div key={i} className="skeleton-shimmer" style={{ height:48 }}/>)}</div>

  return (
    <>
      <Toast toast={toast} />
      <div style={{ display:"flex", flexDirection:"column", gap:20 }}>

        {/* Dados pessoais */}
        <Section title="Dados pessoais" t={t}>
          <div style={col2}>
            {[["CPF","text","000.000.000-00","cpf"],["Data de nascimento","date","","birth_date"]].map(([lbl,type,ph,key])=>(
              <Field key={key} label={lbl} t={t}>
                <Input type={type} placeholder={ph} value={form[key]} onChange={e=>set(key,e.target.value)} />
              </Field>
            ))}
            <Field label="Gênero" t={t}>
              <select value={form.gender} onChange={e=>set("gender",e.target.value)} style={{ background:t.bgInput, border:`1px solid ${t.border}`, borderRadius:8, padding:"10px 12px", fontSize:14, color:t.textPrimary, outline:"none", width:"100%", boxSizing:"border-box", cursor:"pointer" }}>
                <option value="">Não informado</option>
                {["Masculino","Feminino","Não-binário","Outro"].map(g=><option key={g} value={g}>{g}</option>)}
              </select>
            </Field>
            <Field label="Endereço" t={t}>
              <Input type="text" placeholder="Rua, número, bairro" value={form.address} onChange={e=>set("address",e.target.value)} />
            </Field>
          </div>
        </Section>

        {/* Contato de emergência */}
        <Section title="Contato de emergência" t={t}>
          <div style={col2}>
            {[["Nome","text","Nome do contato","emergency_contact"],["Telefone","text","(00) 00000-0000","emergency_phone"]].map(([lbl,type,ph,key])=>(
              <Field key={key} label={lbl} t={t}>
                <Input type={type} placeholder={ph} value={form[key]} onChange={e=>set(key,e.target.value)} />
              </Field>
            ))}
          </div>
        </Section>

        {/* Saúde */}
        <Section title="Saúde" t={t}>
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            {[["Alergias","Ex: Penicilina, Látex...","allergies"],["Medicamentos em uso","Ex: Losartana 50mg...","medications"],["Histórico médico","Cirurgias, doenças crônicas, observações...","medical_history"]].map(([lbl,ph,key])=>(
              <Field key={key} label={lbl} t={t}>
                <textarea placeholder={ph} value={form[key]} onChange={e=>set(key,e.target.value)} rows={3}
                  style={{ background:t.bgInput, border:`1px solid ${t.border}`, borderRadius:8, padding:"10px 12px", fontSize:14, color:t.textPrimary, outline:"none", width:"100%", boxSizing:"border-box", resize:"vertical", lineHeight:1.6 }}
                  onFocus={e=>e.target.style.borderColor=t.accent} onBlur={e=>e.target.style.borderColor=t.border} />
              </Field>
            ))}
          </div>
        </Section>

        <Button onClick={handleSave} disabled={saving} loading={saving} fullWidth={isMobile} style={{ alignSelf:"flex-start", width: isMobile?"100%":"auto" }}>
          {saving ? "Salvando..." : "Salvar dados"}
        </Button>
      </div>
    </>
  )
}

// ─── Tab: Anotações clínicas ──────────────────────────────────────────────────
function TabNotes({ patient, clinicId, user, t, isMobile }) {
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [text, setText] = useState("")
  const [title, setTitle] = useState("")
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null)

  function showToast(msg, type="success") { setToast({msg,type}); setTimeout(()=>setToast(null),3000) }

  async function fetchNotes() {
    const { data } = await supabase.from("clinical_notes").select("*").eq("patient_id", patient.id).is("deleted_at", null).order("created_at", { ascending:false })
    setNotes(data ?? [])
    setLoading(false)
  }

  async function handleSave() {
    if (!text.trim()) return
    setSaving(true)
    const { error } = await supabase.from("clinical_notes").insert([{
      patient_id: patient.id, clinic_id: clinicId,
      author_id: user.id, author_name: user.email,
      title: title.trim() || null, content: text.trim(),
    }])
    setSaving(false)
    if (error) showToast(error.message, "error")
    else { setText(""); setTitle(""); fetchNotes(); showToast("Anotação salva!") }
  }

  async function handleDelete(id) {
    await supabase.from("clinical_notes").update({ deleted_at: new Date().toISOString() }).eq("id", id)
    fetchNotes()
    showToast("Anotação removida.", "error")
  }

  useEffect(() => { fetchNotes() }, [patient.id])

  return (
    <>
      <Toast toast={toast} />
      <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
        <Section title="Nova anotação" t={t}>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            <Input type="text" placeholder="Título (opcional)" value={title} onChange={e=>setTitle(e.target.value)} />
            <textarea placeholder="Descreva a evolução clínica, observações, procedimentos realizados..." value={text} onChange={e=>setText(e.target.value)} rows={5}
              style={{ background:t.bgInput, border:`1px solid ${t.border}`, borderRadius:8, padding:"10px 12px", fontSize:14, color:t.textPrimary, outline:"none", width:"100%", boxSizing:"border-box", resize:"vertical", lineHeight:1.6 }}
              onFocus={e=>e.target.style.borderColor=t.accent} onBlur={e=>e.target.style.borderColor=t.border} />
            <Button onClick={handleSave} disabled={saving||!text.trim()} loading={saving} fullWidth={isMobile} style={{ alignSelf: isMobile?"auto":"flex-start", width: isMobile?"100%":"auto" }}>
              {saving ? "Salvando..." : "＋ Salvar anotação"}
            </Button>
          </div>
        </Section>

        {loading ? (
          <div style={{ display:"flex",flexDirection:"column",gap:8 }}>{[1,2].map(i=><div key={i} className="skeleton-shimmer" style={{ height:80 }}/>)}</div>
        ) : notes.length === 0 ? (
          <EmptyState icon="📝" title="Nenhuma anotação ainda" sub="Use o formulário acima para registrar a primeira evolução." t={t} />
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {notes.map(n => (
              <div key={n.id} style={{ background:t.bgCard, borderRadius:10, padding:"16px", borderLeft:`3px solid ${t.accent}` }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8, gap:8 }}>
                  <div>
                    {n.title && <span style={{ fontWeight:700, color:t.textPrimary, fontSize:14, display:"block" }}>{n.title}</span>}
                    <span style={{ fontSize:12, color:t.textGhost }}>
                      {new Date(n.created_at).toLocaleString("pt-BR",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"})}
                      {n.author_name && ` · ${n.author_name}`}
                    </span>
                  </div>
                  <Button onClick={()=>handleDelete(n.id)} size="sm" variant="ghost">Remover</Button>
                </div>
                <p style={{ fontSize:14, color:t.textBody, lineHeight:1.7, margin:0, whiteSpace:"pre-wrap" }}>{n.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}

// ─── Tab: Histórico de consultas ──────────────────────────────────────────────
function TabHistory({ patient, t }) {
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)

  const STATUS = STATUS_COLORS

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from("appointments").select("*").eq("client_id", patient.id).is("deleted_at", null).order("datetime", { ascending:false })
      setAppointments(data ?? [])
      setLoading(false)
    }
    load()
  }, [patient.id])

  if (loading) return <div style={{ display:"flex",flexDirection:"column",gap:8 }}>{[1,2,3].map(i=><div key={i} className="skeleton-shimmer" style={{ height:56 }}/>)}</div>

  if (appointments.length === 0) return <EmptyState icon="📅" title="Nenhuma consulta registrada" sub="As consultas agendadas para este paciente aparecerão aqui." t={t} />

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
      {appointments.map(a => {
        const st = STATUS[a.status] ?? STATUS.scheduled
        return (
          <div key={a.id} style={{ background:t.bgCard, borderRadius:10, padding:"14px 16px", display:"flex", justifyContent:"space-between", alignItems:"center", gap:12 }}>
            <div style={{ display:"flex", flexDirection:"column", gap:3 }}>
              <span style={{ fontWeight:600, color:t.textPrimary, fontSize:14 }}>
                {new Date(a.datetime).toLocaleString("pt-BR",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"})}
              </span>
              {a.notes && <span style={{ fontSize:12, color:t.textGhost }}>{a.notes}</span>}
            </div>
            <span style={{ fontSize:11, fontWeight:700, padding:"3px 10px", borderRadius:99, color:st.color, background:st.color+"18", border:`1px solid ${st.color}33`, flexShrink:0 }}>{st.label}</span>
          </div>
        )
      })}
    </div>
  )
}

// ─── Tab: Anexos ──────────────────────────────────────────────────────────────
function TabAttachments({ patient, clinicId, user, t, isMobile }) {
  const [attachments, setAttachments] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [toast, setToast] = useState(null)

  function showToast(msg, type="success") { setToast({msg,type}); setTimeout(()=>setToast(null),3000) }

  async function fetchAttachments() {
    const { data } = await supabase.from("patient_attachments").select("*").eq("patient_id", patient.id).is("deleted_at", null).order("created_at", { ascending:false })
    setAttachments(data ?? [])
    setLoading(false)
  }

  async function handleUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const ext = file.name.split(".").pop()
    const path = `${clinicId}/${patient.id}/${Date.now()}.${ext}`
    const { error: uploadError } = await supabase.storage.from("patient-attachments").upload(path, file)
    if (uploadError) { showToast(uploadError.message, "error"); setUploading(false); return }
    const { error: dbError } = await supabase.from("patient_attachments").insert([{
      patient_id: patient.id, clinic_id: clinicId, uploaded_by: user.id,
      file_name: file.name, file_type: file.type, file_size: file.size, storage_path: path,
    }])
    setUploading(false)
    if (dbError) showToast(dbError.message, "error")
    else { fetchAttachments(); showToast("Arquivo enviado!") }
    e.target.value = ""
  }

  async function handleDelete(attachment) {
    await supabase.storage.from("patient-attachments").remove([attachment.storage_path])
    await supabase.from("patient_attachments").update({ deleted_at: new Date().toISOString() }).eq("id", attachment.id)
    fetchAttachments()
    showToast("Arquivo removido.", "error")
  }

  async function handleDownload(attachment) {
    const { data } = await supabase.storage.from("patient-attachments").createSignedUrl(attachment.storage_path, 60)
    if (data?.signedUrl) window.open(data.signedUrl, "_blank")
  }

  function formatSize(bytes) {
    if (!bytes) return "—"
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024*1024) return `${(bytes/1024).toFixed(1)} KB`
    return `${(bytes/(1024*1024)).toFixed(1)} MB`
  }

  function fileIcon(type) {
    if (!type) return "📄"
    if (type.startsWith("image/")) return "🖼️"
    if (type === "application/pdf") return "📋"
    if (type.includes("word")) return "📝"
    return "📄"
  }

  useEffect(() => { fetchAttachments() }, [patient.id])

  return (
    <>
      <Toast toast={toast} />
      <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
        <div style={{ background:t.bgCard, borderRadius:10, padding:"20px", border:`2px dashed ${t.border}`, textAlign:"center" }}>
          <span style={{ fontSize:32, display:"block", marginBottom:8 }}>📎</span>
          <p style={{ fontSize:14, color:t.textMuted, margin:"0 0 12px", fontWeight:600 }}>Enviar arquivo</p>
          <p style={{ fontSize:12, color:t.textGhost, margin:"0 0 16px" }}>Imagens, PDFs, documentos — máx. 10MB</p>
          <label style={{ background:t.accent, border:"none", borderRadius:8, padding:"10px 24px", fontSize:14, fontWeight:700, color:"#fff", cursor:"pointer", display:"inline-block", opacity:uploading?0.6:1 }}>
            {uploading ? "Enviando..." : "Escolher arquivo"}
            <input type="file" onChange={handleUpload} disabled={uploading} style={{ display:"none" }} accept="image/*,.pdf,.doc,.docx" />
          </label>
        </div>

        {loading ? (
          <div style={{ display:"flex",flexDirection:"column",gap:8 }}>{[1,2].map(i=><div key={i} className="skeleton-shimmer" style={{ height:56 }}/>)}</div>
        ) : attachments.length === 0 ? (
          <EmptyState icon="📂" title="Nenhum arquivo ainda" sub="Envie imagens, raio-x ou documentos do paciente." t={t} />
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {attachments.map(a => (
              <div key={a.id} style={{ background:t.bgCard, borderRadius:10, padding:"12px 16px", display:"flex", alignItems:"center", gap:12 }}>
                <span style={{ fontSize:24, flexShrink:0 }}>{fileIcon(a.file_type)}</span>
                <div style={{ flex:1, minWidth:0 }}>
                  <span style={{ fontWeight:600, color:t.textPrimary, fontSize:14, display:"block", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{a.file_name}</span>
                  <span style={{ fontSize:12, color:t.textGhost }}>{formatSize(a.file_size)} · {new Date(a.created_at).toLocaleDateString("pt-BR")}</span>
                </div>
                <div style={{ display:"flex", gap:6, flexShrink:0 }}>
                   <Button onClick={()=>handleDownload(a)} size="sm">↓</Button>
                   <Button onClick={()=>handleDelete(a)} size="sm" variant="ghost">✕</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}

// ─── Helpers de UI ────────────────────────────────────────────────────────────
function Section({ title, children, t }) {
  return (
    <div style={{ background:t.bgCard, borderRadius:12, padding:"20px" }}>
      <h3 style={{ fontSize:12, fontWeight:700, color:t.textMuted, textTransform:"uppercase", letterSpacing:"0.08em", margin:"0 0 16px" }}>{title}</h3>
      {children}
    </div>
  )
}

function Field({ label, children, t }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
      <label style={{ fontSize:12, fontWeight:600, color:t.textFaint }}>{label}</label>
      {children}
    </div>
  )
}

function EmptyState({ icon, title, sub, t }) {
  return (
    <div style={{ textAlign:"center", padding:"40px 0", display:"flex", flexDirection:"column", alignItems:"center", gap:8 }}>
      <span style={{ fontSize:36 }}>{icon}</span>
      <p style={{ fontSize:15, color:t.textGhost, margin:0, fontWeight:600 }}>{title}</p>
      <p style={{ fontSize:13, color:t.textDisabled, margin:0 }}>{sub}</p>
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function PatientRecord() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { clinicId, user } = useAuth()
  const { t } = useTheme()
  const [patient, setPatient] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)

  useEffect(() => {
    function handleResize() { setIsMobile(window.innerWidth <= 768) }
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from("patients").select("*").eq("id", id).single()
      setPatient(data ?? null)
      setLoading(false)
    }
    load()
  }, [id])

  if (loading) return (
    <AppLayout>
      <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
        {[1,2,3].map(i=><div key={i} className="skeleton-shimmer" style={{ height:56 }}/>)}
      </div>
    </AppLayout>
  )

  if (!patient) return (
    <AppLayout>
      <div style={{ textAlign:"center", padding:"80px 0" }}>
        <span style={{ fontSize:48 }}>🔍</span>
        <p style={{ color:t.textGhost, fontSize:16, marginTop:12 }}>Paciente não encontrado.</p>
        <Button onClick={()=>navigate("/patients")} style={{ marginTop:16 }}>
          Voltar para pacientes
        </Button>
      </div>
    </AppLayout>
  )

  return (
    <AppLayout>
      <div style={{ color:t.textBody, fontFamily:"'DM Sans','Segoe UI',sans-serif", maxWidth:"100%" }}>

        {/* Header do paciente */}
        <div style={{ marginBottom:24 }}>
          <Button onClick={()=>navigate("/patients")} variant="ghost" style={{ padding:0, marginBottom:16 }}>
            ← Pacientes
          </Button>
          <div style={{ display:"flex", alignItems:"center", gap:16, flexWrap:"wrap" }}>
            <div style={{ width:52, height:52, borderRadius:"50%", background:t.accent+"22", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, fontWeight:800, color:t.accent, flexShrink:0 }}>
              {patient.name?.[0]?.toUpperCase() ?? "?"}
            </div>
            <div>
              <h1 style={{ fontSize: isMobile ? 20 : 26, fontWeight:800, margin:0, color:t.textPrimary, letterSpacing:"-0.5px" }}>{patient.name}</h1>
              <div style={{ display:"flex", gap:16, marginTop:4, flexWrap:"wrap" }}>
                {patient.phone && <span style={{ fontSize:13, color:t.textGhost }}>📱 {patient.phone}</span>}
                {patient.email && <span style={{ fontSize:13, color:t.textGhost }}>✉️ {patient.email}</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display:"flex", gap:4, marginBottom:20, overflowX:"auto", paddingBottom:4, borderBottom:`1px solid ${t.border}` }}>
          {TABS.map(tab => (
            <Button key={tab.id} onClick={()=>setActiveTab(tab.id)} variant={activeTab===tab.id ? "primary" : "ghost"} style={{
              background: activeTab===tab.id ? undefined : "transparent",
              border: activeTab===tab.id ? undefined : "1px solid transparent",
              padding: isMobile ? "8px 12px" : "8px 16px",
              fontWeight: activeTab===tab.id ? 700 : 500,
              color: activeTab===tab.id ? undefined : t.textFaint,
              flexShrink:0,
            }}>
              <span>{tab.icon}</span>
              {tab.label}
            </Button>
          ))}
        </div>

        {/* Conteúdo da tab */}
        {activeTab === "overview"    && <TabOverview    patient={patient} clinicId={clinicId} t={t} isMobile={isMobile} />}
        {activeTab === "notes"       && <TabNotes       patient={patient} clinicId={clinicId} user={user} t={t} isMobile={isMobile} />}
        {activeTab === "history"     && <TabHistory     patient={patient} t={t} />}
        {activeTab === "attachments" && <TabAttachments patient={patient} clinicId={clinicId} user={user} t={t} isMobile={isMobile} />}
      </div>
    </AppLayout>
  )
}
