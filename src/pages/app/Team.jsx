import { useState, useEffect } from "react"
import { MotionToast, MotionList } from "../../components/ui/MotionComponents"
import { supabase } from "../../supabaseClient"
import { useAuth } from "../../context/AuthContext"
import { useTheme } from "../../context/ThemeContext"
import AppLayout from "../AppLayout"
import { Button, Input } from "../../components/ui"
import { PLAN_CONFIG } from "../../hooks/usePlanLimits"

const ROLE_CONFIG = {
  admin:          { label: "Admin",          color: "#8b5cf6" },
  dentist:        { label: "Dentista",       color: "#3b82f6" },
  receptionist:   { label: "Recepcionista",  color: "#22c55e" },
  physiotherapist:{ label: "Fisioterapeuta", color: "#f59e0b" },
  psychologist:   { label: "Psicólogo",      color: "#ec4899" },
  nutritionist:   { label: "Nutricionista",  color: "#14b8a6" },
  other:          { label: "Outro",          color: "#64748b" },
}

const DAYS_PT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]

// ─── SVG Icons ────────────────────────────────────────────────────────────────
const IconWhatsApp = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
  </svg>
)
const IconCopy = ({ color }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
  </svg>
)
const IconEmail = ({ color }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
    <polyline points="22,6 12,13 2,6"/>
  </svg>
)
const IconClock = ({ color }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
)
const IconPlus = ({ color }) => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
)
const IconTrash = ({ color }) => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/>
  </svg>
)

function RoleBadge({ role }) {
  const cfg = ROLE_CONFIG[role] ?? ROLE_CONFIG.other
  return (
    <span style={{ fontSize:11, fontWeight:700, color:cfg.color,
      background:cfg.color+"18", border:`1px solid ${cfg.color}33`,
      borderRadius:99, padding:"3px 10px" }}>
      {cfg.label}
    </span>
  )
}

function Toast({ toast }) {
  const { t } = useTheme()
  if (!toast) return null
  return (
    <div style={{ position:"fixed", bottom:24, right:24, zIndex:999, border:"1px solid",
      borderRadius:10, padding:"12px 20px", fontSize:14, fontWeight:600,
      boxShadow:"0 8px 24px rgba(0,0,0,0.2)", fontFamily:"'DM Sans','Segoe UI',sans-serif",
      background: toast.type==="success"?t.successBg:toast.type==="error"?t.errorBg:t.bgCard,
      borderColor: toast.type==="success"?t.successBorder:toast.type==="error"?t.errorBorder:t.border,
      color: toast.type==="success"?t.successText:toast.type==="error"?t.errorText:t.textBody,
    }}>
      {toast.type==="success"?"✓":toast.type==="error"?"✕":"ℹ"} {toast.msg}
    </div>
  )
}

// ─── AvailabilityEditor — horários de um membro ───────────────────────────────
function AvailabilityEditor({ member, clinicId, t }) {
  const [slots,   setSlots]   = useState([])
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from("availability")
        .select("*").eq("staff_id", member.id).is("deleted_at", null)
        .order("weekday")
      setSlots(data ?? [])
      setLoading(false)
    }
    load()
  }, [member.id])

  async function addSlot() {
    setSaving(true)
    const { data, error } = await supabase.from("availability").insert([{
      clinic_id:  clinicId,
      staff_id:   member.id,
      weekday:    1,         // segunda por padrão
      start_time: "08:00",
      end_time:   "17:00",
    }]).select().single()
    if (!error) setSlots(prev => [...prev, data])
    setSaving(false)
  }

  async function updateSlot(id, field, value) {
    setSlots(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s))
    await supabase.from("availability").update({ [field]: value, updated_at: new Date().toISOString() }).eq("id", id)
  }

  async function removeSlot(id) {
    await supabase.from("availability").update({ deleted_at: new Date().toISOString() }).eq("id", id)
    setSlots(prev => prev.filter(s => s.id !== id))
  }

  const select = (value, onChange, options) => (
    <select value={value} onChange={e => onChange(e.target.value)} style={{
      background:t.bgPage, border:`1px solid ${t.border}`, borderRadius:6,
      padding:"5px 8px", fontSize:12, color:t.textPrimary, cursor:"pointer",
      outline:"none", fontFamily:"inherit",
    }}>
      {options.map(([v,l]) => <option key={v} value={v}>{l}</option>)}
    </select>
  )

  if (loading) return <div style={{ fontSize:12, color:t.textGhost, padding:"8px 0" }}>Carregando horários...</div>

  return (
    <div style={{ marginTop:12, padding:"12px 14px", background:t.bgPage, borderRadius:10, border:`1px solid ${t.border}` }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
          <IconClock color={t.accent} />
          <span style={{ fontSize:12, fontWeight:700, color:t.textMuted, textTransform:"uppercase", letterSpacing:"0.06em" }}>
            Horários de atendimento
          </span>
        </div>
        <button onClick={addSlot} disabled={saving} style={{
          display:"flex", alignItems:"center", gap:5, background:t.bgCard,
          border:`1px solid ${t.border}`, borderRadius:6, padding:"5px 10px",
          fontSize:12, fontWeight:600, color:t.accent, cursor:"pointer", fontFamily:"inherit",
        }}>
          <IconPlus color={t.accent} /> Adicionar
        </button>
      </div>

      {slots.length === 0 ? (
        <p style={{ fontSize:12, color:t.textDisabled, margin:0 }}>
          Nenhum horário cadastrado. Clique em "Adicionar" para configurar.
        </p>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {slots.map(s => (
            <div key={s.id} style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
              {select(String(s.weekday), v => updateSlot(s.id, "weekday", parseInt(v)),
                DAYS_PT.map((d,i) => [String(i), d])
              )}
              <span style={{ fontSize:12, color:t.textGhost }}>das</span>
              <input type="time" value={s.start_time?.slice(0,5) ?? "08:00"}
                onChange={e => updateSlot(s.id, "start_time", e.target.value + ":00")}
                style={{ background:t.bgPage, border:`1px solid ${t.border}`, borderRadius:6,
                  padding:"5px 8px", fontSize:12, color:t.textPrimary, outline:"none", fontFamily:"inherit" }} />
              <span style={{ fontSize:12, color:t.textGhost }}>às</span>
              <input type="time" value={s.end_time?.slice(0,5) ?? "17:00"}
                onChange={e => updateSlot(s.id, "end_time", e.target.value + ":00")}
                style={{ background:t.bgPage, border:`1px solid ${t.border}`, borderRadius:6,
                  padding:"5px 8px", fontSize:12, color:t.textPrimary, outline:"none", fontFamily:"inherit" }} />
              <button onClick={() => removeSlot(s.id)} style={{
                background:"transparent", border:`1px solid ${t.border}`, color:t.textGhost,
                borderRadius:6, padding:"5px 7px", cursor:"pointer",
                display:"flex", alignItems:"center",
              }}>
                <IconTrash color={t.textGhost} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── InviteChannels — formas de compartilhar o convite ────────────────────────
function InviteChannels({ name, email, role, t, onEmailInvite, inviting }) {
  const [copied, setCopied] = useState(false)

  const loginUrl = `${window.location.origin}/login`
  const roleLabel = ROLE_CONFIG[role]?.label ?? role

  const whatsappMsg = encodeURIComponent(
    `Olá ${name}! Você foi adicionado à clínica como ${roleLabel}.\n\nAcesse o sistema pelo link:\n${loginUrl}\n\nSeu e-mail de acesso: ${email}\n\nQualquer dúvida é só chamar!`
  )

  function copyLink() {
    const msg = `Olá ${name}! Você foi adicionado como ${roleLabel}.\n\nAcesse: ${loginUrl}\nE-mail: ${email}`
    navigator.clipboard.writeText(msg)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!name || !email) return null

  return (
    <div style={{ marginTop:14, padding:"14px 16px", background:t.bgInset,
      borderRadius:10, border:`1px solid ${t.border}` }}>
      <p style={{ fontSize:12, fontWeight:700, color:t.textMuted, textTransform:"uppercase",
        letterSpacing:"0.06em", margin:"0 0 10px" }}>
        Enviar convite por
      </p>
      <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
        {/* Email */}
        <Button onClick={onEmailInvite} disabled={inviting} loading={inviting} size="sm" variant="secondary"
          style={{ display:"flex", alignItems:"center", gap:6 }}>
          <IconEmail color="currentColor" />
          E-mail
        </Button>

        {/* WhatsApp */}
        <a href={`https://wa.me/?text=${whatsappMsg}`} target="_blank" rel="noopener noreferrer"
          style={{ textDecoration:"none" }}>
          <button style={{
            display:"flex", alignItems:"center", gap:6,
            background:"#25D366", border:"none", color:"#fff",
            borderRadius:8, padding:"7px 14px", fontSize:13, fontWeight:600,
            cursor:"pointer", fontFamily:"inherit",
          }}>
            <IconWhatsApp size={14} /> WhatsApp
          </button>
        </a>

        {/* Copiar mensagem */}
        <button onClick={copyLink} style={{
          display:"flex", alignItems:"center", gap:6,
          background:"transparent", border:`1px solid ${t.border}`,
          color: copied ? t.accent : t.textMuted,
          borderRadius:8, padding:"7px 14px", fontSize:13, fontWeight:600,
          cursor:"pointer", fontFamily:"inherit", transition:"all .15s",
        }}>
          <IconCopy color={copied ? t.accent : t.textMuted} />
          {copied ? "Copiado!" : "Copiar mensagem"}
        </button>
      </div>
      <p style={{ fontSize:11, color:t.textDisabled, margin:"10px 0 0", lineHeight:1.5 }}>
        A mensagem inclui o link de acesso e o e-mail cadastrado.
      </p>
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function Team() {
  const { clinicId, clinic } = useAuth()
  const { t } = useTheme()

  const [members,         setMembers]         = useState([])
  const [fetching,        setFetching]        = useState(true)
  const [toast,           setToast]           = useState(null)
  const [removeConfirm,   setRemoveConfirm]   = useState(null)
  const [expandedHours,   setExpandedHours]   = useState(null)  // id do membro com horários abertos
  const [isMobile,        setIsMobile]        = useState(window.innerWidth <= 768)
  const [inviteEmail,     setInviteEmail]     = useState("")
  const [inviteRole,      setInviteRole]      = useState("physiotherapist")
  const [inviteName,      setInviteName]      = useState("")
  const [inviteSpecialty, setInviteSpecialty] = useState("")
  const [inviting,        setInviting]        = useState(false)
  const [inviteError,     setInviteError]     = useState(null)
  const [savedMember,     setSavedMember]     = useState(null)  // membro recém-adicionado para mostrar canais

  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth <= 768)
    window.addEventListener("resize", fn)
    return () => window.removeEventListener("resize", fn)
  }, [])

  function showToast(msg, type = "success") { setToast({ msg, type }); setTimeout(() => setToast(null), 4000) }

  async function fetchMembers() {
    setFetching(true)
    const { data } = await supabase.from("staff").select("*")
      .eq("clinic_id", clinicId).is("deleted_at", null).order("created_at", { ascending: false })
    setMembers(data ?? [])
    setFetching(false)
  }

  async function handleAddMember() {
    if (!inviteEmail.trim() || !inviteName.trim()) { setInviteError("Nome e e-mail são obrigatórios."); return }
    setInviteError(null); setInviting(true)

    const staffLimit = clinic?.staff_limit ?? (PLAN_CONFIG[clinic?.plan]?.staff_limit ?? 1)
    if (staffLimit !== null && members.length >= staffLimit) {
      setInviteError(`Limite de ${staffLimit} membro(s) atingido. Faça upgrade.`)
      setInviting(false); return
    }

    const { data: newMember, error } = await supabase.from("staff").insert([{
      clinic_id: clinicId,
      name:      inviteName.trim(),
      email:     inviteEmail.trim().toLowerCase(),
      role:      inviteRole,
      specialty: inviteSpecialty.trim() || null,
    }]).select().single()

    setInviting(false)
    if (error) { setInviteError(error.message); return }

    // Mostra canais de convite para o membro recém-adicionado
    setSavedMember(newMember)
    setInviteEmail(""); setInviteName(""); setInviteSpecialty(""); setInviteRole("physiotherapist")
    fetchMembers()
  }

  async function sendEmailInvite() {
    if (!savedMember) return
    setInviting(true)
    const { error } = await supabase.functions.invoke("invite-member", {
      body: { email: savedMember.email, name: savedMember.name, role: savedMember.role, clinic_id: clinicId }
    })
    setInviting(false)
    if (error) showToast("E-mail de convite falhou. Use WhatsApp ou copie a mensagem.", "info")
    else { showToast(`Convite enviado para ${savedMember.email}!`); setSavedMember(null) }
  }

  async function handleRemove(id) {
    const { error } = await supabase.from("staff").update({ deleted_at: new Date().toISOString() }).eq("id", id)
    if (!error) { setRemoveConfirm(null); fetchMembers(); showToast("Membro removido.", "error") }
  }

  useEffect(() => { if (clinicId) fetchMembers() }, [clinicId])

  const staffLimit = clinic?.staff_limit ?? (PLAN_CONFIG[clinic?.plan]?.staff_limit ?? 1)
  const atLimit    = staffLimit !== null && members.length >= staffLimit

  return (
    <AppLayout>
      <Toast toast={toast} />
      <div style={{ color:t.textBody, fontFamily:"'DM Sans','Segoe UI',sans-serif" }}>
        <header style={{ marginBottom: isMobile ? 16 : 32 }}>
          <h1 style={{ fontSize: isMobile?22:28, fontWeight:800, margin:0, color:t.textPrimary, letterSpacing:"-0.5px" }}>Equipe</h1>
          <p style={{ margin:"4px 0 0", fontSize:13, color:t.textFaint }}>Gerencie membros e horários de atendimento</p>
        </header>

        {/* Barra de uso */}
        <div style={{ background:t.bgCard, borderRadius:12, padding:"16px 20px", marginBottom:20,
          display:"flex", alignItems:"center", justifyContent:"space-between", gap:12, flexWrap:"wrap" }}>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <div style={{ width:40, height:40, borderRadius:10, background:`${t.accent}18`,
              display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>👥</div>
            <div>
              <span style={{ fontSize:14, fontWeight:600, color:t.textPrimary }}>
                {members.length} de {staffLimit === null || staffLimit === 999 ? "ilimitados" : staffLimit} membros
              </span>
              <p style={{ margin:"2px 0 0", fontSize:12, color:t.textFaint }}>Plano {clinic?.plan ?? "free"}</p>
            </div>
          </div>
          {staffLimit !== null && staffLimit !== 999 && (
            <div style={{ width: isMobile?"100%":160 }}>
              <div style={{ height:6, background:t.bgInset, borderRadius:99, overflow:"hidden" }}>
                <div style={{ height:"100%", borderRadius:99, transition:"width 0.4s",
                  width:`${Math.min((members.length/staffLimit)*100,100)}%`,
                  background: atLimit ? t.errorText : t.accent }}/>
              </div>
            </div>
          )}
        </div>

        {/* Formulário de adição */}
        <div style={{ background:t.bgCard, borderRadius:12, padding: isMobile?"16px":"24px", marginBottom:20 }}>
          <h2 style={{ fontSize:13, fontWeight:700, color:t.textMuted, textTransform:"uppercase",
            letterSpacing:"0.08em", margin:"0 0 16px" }}>Adicionar membro</h2>

          {atLimit && (
            <div style={{ background:t.errorBg, border:`1px solid ${t.errorBorder}`, color:t.errorText,
              borderRadius:8, padding:"10px 14px", fontSize:13, marginBottom:16 }}>
              Limite de membros atingido. Faça upgrade do plano para adicionar mais.
            </div>
          )}

          <div style={{ display:"grid", gridTemplateColumns: isMobile?"1fr":"1fr 1fr", gap:14 }}>
            {[["Nome *","text","Nome completo",inviteName,setInviteName],
              ["E-mail *","email","membro@clinica.com",inviteEmail,setInviteEmail]].map(([lbl,type,ph,val,setter]) => (
              <div key={lbl} style={{ display:"flex", flexDirection:"column", gap:6 }}>
                <label style={{ fontSize:12, fontWeight:600, color:t.textFaint }}>{lbl}</label>
                <Input type={type} placeholder={ph} value={val} onChange={e=>setter(e.target.value)} disabled={atLimit} />
              </div>
            ))}
            <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
              <label style={{ fontSize:12, fontWeight:600, color:t.textFaint }}>Função</label>
              <select value={inviteRole} onChange={e=>setInviteRole(e.target.value)} disabled={atLimit}
                style={{ background:t.bgInput, border:`1px solid ${t.border}`, borderRadius:8,
                  padding:"10px 12px", fontSize:14, color:t.textPrimary, outline:"none",
                  width:"100%", boxSizing:"border-box", cursor:"pointer", fontFamily:"inherit" }}>
                {Object.entries(ROLE_CONFIG).filter(([k]) => k !== "admin")
                  .map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
              <label style={{ fontSize:12, fontWeight:600, color:t.textFaint }}>Especialidade</label>
              <Input type="text" placeholder="Ex: Pilates Solo, Fisio Esportiva..."
                value={inviteSpecialty} onChange={e=>setInviteSpecialty(e.target.value)} disabled={atLimit} />
            </div>
          </div>

          {inviteError && (
            <div style={{ background:t.errorBg, border:`1px solid ${t.errorBorder}`, color:t.errorText,
              borderRadius:8, padding:"10px 14px", fontSize:13, marginTop:14 }}>
              {inviteError}
            </div>
          )}

          <Button
            onClick={handleAddMember}
            disabled={inviting || atLimit || !inviteEmail.trim() || !inviteName.trim()}
            loading={inviting} fullWidth={isMobile}
            style={{ marginTop:16 }}
          >
            {inviting ? "Adicionando..." : "Adicionar membro"}
          </Button>

          {/* Canais de convite após adicionar */}
          {savedMember && (
            <InviteChannels
              name={savedMember.name}
              email={savedMember.email}
              role={savedMember.role}
              t={t}
              onEmailInvite={sendEmailInvite}
              inviting={inviting}
            />
          )}
        </div>

        {/* Lista de membros */}
        <div style={{ background:t.bgCard, borderRadius:12, padding: isMobile?"16px":"24px" }}>
          <h2 style={{ fontSize:13, fontWeight:700, color:t.textMuted, textTransform:"uppercase",
            letterSpacing:"0.08em", margin:"0 0 16px", display:"flex", alignItems:"center", gap:10 }}>
            Membros
            {!fetching && (
              <span style={{ background:t.bgInset, color:t.accent, fontSize:12, fontWeight:700,
                padding:"2px 10px", borderRadius:99 }}>{members.length}</span>
            )}
          </h2>

          {fetching ? (
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {[1,2,3].map(i=><div key={i} className="skeleton-shimmer" style={{ height:56 }}/>)}
            </div>
          ) : members.length === 0 ? (
            <div style={{ textAlign:"center", padding:"48px 0", display:"flex", flexDirection:"column", alignItems:"center", gap:8 }}>
              <span style={{ fontSize:36 }}>👥</span>
              <p style={{ fontSize:15, color:t.textGhost, margin:0, fontWeight:600 }}>Nenhum membro ainda.</p>
              <p style={{ fontSize:13, color:t.textDisabled, margin:0 }}>Use o formulário acima para adicionar.</p>
            </div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              {members.map(m => {
                const roleColor = ROLE_CONFIG[m.role]?.color ?? "#64748b"
                const hoursOpen = expandedHours === m.id
                return (
                  <div key={m.id} style={{ background:t.bgInset, borderRadius:12, padding:"16px",
                    border:`1px solid ${t.border}` }}>
                    {/* Linha principal */}
                    <div style={{ display:"flex", alignItems:"center", gap:12, flexWrap:"wrap" }}>
                      {/* Avatar */}
                      <div style={{ width:40, height:40, borderRadius:"50%", flexShrink:0,
                        background:roleColor+"22", display:"flex", alignItems:"center",
                        justifyContent:"center", fontSize:15, fontWeight:800, color:roleColor }}>
                        {m.name?.[0]?.toUpperCase() ?? "?"}
                      </div>

                      {/* Info */}
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
                          <span style={{ fontWeight:700, color:t.textPrimary, fontSize:14 }}>{m.name}</span>
                          <RoleBadge role={m.role} />
                        </div>
                        <span style={{ fontSize:12, color:t.textGhost, display:"block", marginTop:2 }}>{m.email}</span>
                        {m.specialty && (
                          <span style={{ fontSize:11, color:t.textFaint, marginTop:2, display:"block" }}>
                            🔬 {m.specialty}
                          </span>
                        )}
                      </div>

                      {/* Ações */}
                      <div style={{ display:"flex", gap:6, flexShrink:0, alignItems:"center" }}>
                        {/* Botão horários */}
                        <button onClick={() => setExpandedHours(hoursOpen ? null : m.id)} style={{
                          display:"flex", alignItems:"center", gap:5,
                          background: hoursOpen ? `${t.accent}18` : "transparent",
                          border:`1px solid ${hoursOpen ? t.accent : t.border}`,
                          color: hoursOpen ? t.accent : t.textGhost,
                          borderRadius:8, padding:"6px 10px", fontSize:12,
                          cursor:"pointer", fontFamily:"inherit", fontWeight:600,
                        }}>
                          <IconClock color={hoursOpen ? t.accent : t.textGhost} />
                          {!isMobile && "Horários"}
                        </button>

                        {/* Remover */}
                        {removeConfirm === m.id ? (
                          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                            <span style={{ fontSize:12, color:t.errorText }}>Confirmar?</span>
                            <Button onClick={() => handleRemove(m.id)} size="sm"
                              style={{ background:t.errorBg, border:"none", color:t.errorText }}>Sim</Button>
                            <Button onClick={() => setRemoveConfirm(null)} size="sm" variant="secondary">Não</Button>
                          </div>
                        ) : (
                          <button onClick={() => setRemoveConfirm(m.id)} style={{
                            background:"transparent", border:`1px solid ${t.border}`,
                            color:t.textGhost, borderRadius:8, padding:"6px 8px",
                            cursor:"pointer", display:"flex", alignItems:"center",
                          }}>
                            <IconTrash color={t.textGhost} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Painel de horários — expansível */}
                    {hoursOpen && (
                      <AvailabilityEditor member={m} clinicId={clinicId} t={t} />
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
