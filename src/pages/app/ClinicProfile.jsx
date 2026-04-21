import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { MotionToast } from "../../components/ui/MotionComponents"
import { supabase } from "../../supabaseClient"
import { useAuth } from "../../context/AuthContext"
import { usePermissions } from "../../hooks/usePermissions"
import { useTheme } from "../../context/ThemeContext"
import AppLayout from "../AppLayout"
import { Button, Input, Card } from "../../components/ui"
import WhatsAppCard from "../../components/WhatsAppCard"

const DEFAULT_SPECIALTIES = [
  { id: "fisioterapia", label: "Fisioterapia", icon: "🦴" },
  { id: "pilates",      label: "Pilates",      icon: "🧘" },
  { id: "odontologia",  label: "Odontologia",  icon: "🦷" },
  { id: "psicologia",   label: "Psicologia",   icon: "🧠" },
  { id: "nutricao",     label: "Nutrição",      icon: "🥗" },
  { id: "estetica",     label: "Estética",      icon: "✨" },
  { id: "geral",        label: "Clínica Geral", icon: "🏥" },
]

// Dados corretos dos planos — Free: 20 pacientes / 1 staff | Pro: ilimitado
const PLAN_CONFIG = {
  free: {
    label:       "Free",
    color:       "#64748b",
    desc:        "Até 20 pacientes · 1 usuário",
    patientLimit: 20,
    staffLimit:   1,
  },
  pro: {
    label:       "Pro",
    color:       "#3b82f6",
    desc:        "Pacientes ilimitados · Equipe ilimitada",
    patientLimit: null,
    staffLimit:   null,
  },
}

function PlanBadge({ plan, color }) {
  return (
    <span style={{
      fontSize: 11, fontWeight: 700,
      border: `1px solid ${color}44`,
      borderRadius: 99, padding: "3px 10px",
      textTransform: "uppercase", color,
    }}>
      {plan}
    </span>
  )
}

export default function ClinicProfile() {
  const { clinic, clinicId, user, refreshClinic } = useAuth()
  const { isAdmin } = usePermissions()
  const { t } = useTheme()

  const [name,                setName]                = useState("")
  const [phone,               setPhone]               = useState("")
  const [email,               setEmail]               = useState("")
  const [selectedSpecialties, setSelectedSpecialties] = useState([])
  const [loading,             setLoading]             = useState(false)
  const [toast,               setToast]               = useState(null)
  const [stats,               setStats]               = useState({ patients: null, appointments: null })
  const [subscription,        setSubscription]        = useState(null)
  const [isMobile,            setIsMobile]            = useState(window.innerWidth <= 768)

  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth <= 768)
    window.addEventListener("resize", fn)
    return () => window.removeEventListener("resize", fn)
  }, [])

  // Preenche os campos quando clinic carrega
  useEffect(() => {
    if (!clinic) return
    setName(clinic.name ?? "")
    setPhone(clinic.phone ?? "")
    // E-mail unificado: usa clinic.email se existir, senão sender_email, senão vazio
    setEmail(clinic.email ?? clinic.sender_email ?? "")
    setSelectedSpecialties(Array.isArray(clinic.specialties) ? clinic.specialties : [])
  }, [clinic])

  // Stats + subscription em paralelo
  useEffect(() => {
    if (!clinicId) return
    async function fetchData() {
      const [pR, aR, subR] = await Promise.all([
        supabase.from("patients").select("id", { count:"exact", head:true })
          .eq("clinic_id", clinicId).is("deleted_at", null),
        supabase.from("appointments").select("id", { count:"exact", head:true })
          .eq("clinic_id", clinicId).is("deleted_at", null),
        supabase.from("subscriptions").select("status, billing_cycle, current_period_end, trial_end")
          .eq("clinic_id", clinicId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ])
      setStats({ patients: pR.count ?? 0, appointments: aR.count ?? 0 })
      setSubscription(subR.data ?? null)
    }
    fetchData()
  }, [clinicId])

  function showToast(msg, type = "success") {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  function toggleSpecialty(label) {
    setSelectedSpecialties(prev =>
      prev.includes(label) ? prev.filter(s => s !== label) : [...prev, label]
    )
  }

  async function handleSave(e) {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)

    // E-mail único gravado em ambos os campos (email e sender_email)
    const emailVal = email.trim() || null
    const { error } = await supabase.from("clinics").update({
      name:         name.trim(),
      phone:        phone.trim() || null,
      email:        emailVal,
      sender_email: emailVal,      // mantém sender_email sincronizado
      specialties:  selectedSpecialties,
      updated_at:   new Date().toISOString(),
    }).eq("id", clinicId)

    setLoading(false)
    if (error) showToast(error.message, "error")
    else { await refreshClinic(); showToast("Perfil atualizado!") }
  }

  const plan      = PLAN_CONFIG[clinic?.plan] ?? PLAN_CONFIG.free
  const createdAt = clinic?.created_at
    ? new Date(clinic.created_at).toLocaleDateString("pt-BR", { day:"2-digit", month:"long", year:"numeric" })
    : "—"

  // Label do status da subscription
  const SUB_STATUS_LABEL = {
    active:    { label: "Ativa",     color: "#22c55e" },
    trial:     { label: "Trial",     color: "#3b82f6" },
    pending:   { label: "Pendente",  color: "#f59e0b" },
    cancelled: { label: "Cancelada", color: "#ef4444" },
    past_due:  { label: "Vencida",   color: "#ef4444" },
  }
  const subStatus = subscription ? (SUB_STATUS_LABEL[subscription.status] ?? { label: subscription.status, color: t.textGhost }) : null

  return (
    <AppLayout>
      <MotionToast toast={toast}>
        <div style={{
          border: "1px solid", borderRadius: 10, padding: "12px 20px",
          fontSize: 14, fontWeight: 600, boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
          background:   toast?.type === "success" ? t.successBg    : t.errorBg,
          borderColor:  toast?.type === "success" ? t.successBorder : t.errorBorder,
          color:        toast?.type === "success" ? t.successText   : t.errorText,
        }}>
          {toast?.type === "success" ? "✓" : "✕"} {toast?.msg}
        </div>
      </MotionToast>

      <div style={{ color: t.textBody, fontFamily: "'DM Sans','Segoe UI',sans-serif" }}>
        <header style={{ marginBottom: isMobile ? 16 : 32 }}>
          <h1 style={{ fontSize: isMobile ? 22 : 28, fontWeight: 800, margin: 0, color: t.textPrimary, letterSpacing: "-0.5px" }}>
            Perfil da Clínica
          </h1>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: t.textFaint }}>
            Gerencie as informações da sua clínica
          </p>
        </header>

        <div style={{ display:"grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 320px", gap: 20, alignItems: "start" }}>

          {/* ── Formulário principal ── */}
          <Card padding={isMobile ? "16px" : "28px 24px"}>
            <h2 style={{ fontSize: 13, fontWeight: 700, color: t.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 20px" }}>
              Informações gerais
            </h2>
            <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 18 }}>

              {/* Nome */}
              <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                <label style={{ fontSize:13, fontWeight:600, color:t.textMuted }}>Nome da clínica *</label>
                <Input type="text" placeholder="Ex: Clínica Fisiolates" value={name} onChange={e => setName(e.target.value)} required />
              </div>

              {/* Telefone */}
              <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                <label style={{ fontSize:13, fontWeight:600, color:t.textMuted }}>Telefone</label>
                <Input type="text" placeholder="(00) 00000-0000" value={phone} onChange={e => setPhone(e.target.value)} />
              </div>

              {/* E-mail unificado */}
              <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                <label style={{ fontSize:13, fontWeight:600, color:t.textMuted }}>E-mail da clínica</label>
                <Input
                  type="email"
                  placeholder="contato@clinica.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
                <span style={{ fontSize:11, color:t.textDisabled, lineHeight:1.5 }}>
                  Usado como e-mail de contato e para envio automático de cobranças e lembretes.
                </span>
              </div>

              {/* E-mail do admin — somente leitura */}
              <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                <label style={{ fontSize:13, fontWeight:600, color:t.textMuted }}>E-mail do administrador</label>
                <Input type="text" value={user?.email ?? ""} disabled style={{ opacity:0.5, cursor:"not-allowed" }} />
                <span style={{ fontSize:11, color:t.textDisabled }}>
                  E-mail da sua conta. Não pode ser alterado aqui.
                </span>
              </div>

              {/* Especialidades */}
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                <label style={{ fontSize:13, fontWeight:600, color:t.textMuted }}>
                  Especialidades
                </label>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(2, 1fr)", gap:8 }}>
                  {DEFAULT_SPECIALTIES.map(sp => {
                    const active = selectedSpecialties.includes(sp.label)
                    return (
                      <button
                        key={sp.id}
                        type="button"
                        onClick={() => toggleSpecialty(sp.label)}
                        style={{
                          display:"flex", alignItems:"center", gap:8, padding:"10px 12px",
                          background: active ? `${t.accent}18` : t.bgInset,
                          border: `1px solid ${active ? t.accent : t.border}`,
                          borderRadius:8, cursor:"pointer", transition:"all .15s",
                        }}
                      >
                        <span style={{ fontSize:16 }}>{sp.icon}</span>
                        <span style={{ fontSize:12, fontWeight:600, color: active ? t.accent : t.textMuted }}>
                          {sp.label}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              <Button type="submit" disabled={loading || !name.trim()} loading={loading} fullWidth>
                {loading ? "Salvando..." : "Salvar alterações"}
              </Button>
            </form>
          </Card>

          {/* ── Painel lateral ── */}
          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

            {/* Card de plano */}
            <Card padding={isMobile ? 16 : 24} borderTop={plan.color}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
                <span style={{ fontSize:13, fontWeight:700, color:t.textMuted, textTransform:"uppercase", letterSpacing:"0.08em" }}>
                  Plano atual
                </span>
                <PlanBadge plan={plan.label} color={plan.color} />
              </div>

              <p style={{ fontSize:13, color:t.textGhost, margin:"0 0 12px" }}>{plan.desc}</p>

              {/* Status da subscription */}
              {subStatus && (
                <div style={{
                  display:"flex", justifyContent:"space-between", alignItems:"center",
                  padding:"8px 12px", borderRadius:8,
                  background: `${subStatus.color}10`,
                  border: `1px solid ${subStatus.color}30`,
                  marginBottom:12,
                }}>
                  <span style={{ fontSize:12, color:t.textGhost }}>Assinatura</span>
                  <span style={{ fontSize:12, fontWeight:700, color:subStatus.color }}>
                    {subStatus.label}
                  </span>
                </div>
              )}

              {/* Vencimento se tiver subscription ativa ou trial */}
              {subscription?.current_period_end && (subscription.status === "active" || subscription.status === "trial") && (
                <div style={{ fontSize:12, color:t.textDisabled, marginBottom:12 }}>
                  {subscription.status === "trial" ? "Trial até" : "Próxima cobrança"}{": "}
                  <strong style={{ color:t.textFaint }}>
                    {new Date(subscription.current_period_end).toLocaleDateString("pt-BR")}
                  </strong>
                </div>
              )}

              <div style={{ height:1, background:t.bgInset, margin:"4px 0 14px" }} />
              <Link to="/subscription" style={{ textDecoration:"none" }}>
                <Button variant="secondary" fullWidth>
                  {clinic?.plan === "pro" ? "Gerenciar assinatura →" : "Fazer upgrade →"}
                </Button>
              </Link>
            </Card>

            {/* Card de resumo */}
            <Card padding={isMobile ? 16 : 24}>
              <span style={{ fontSize:13, fontWeight:700, color:t.textMuted, textTransform:"uppercase", letterSpacing:"0.08em", display:"block", marginBottom:16 }}>
                Resumo
              </span>

              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:16 }}>
                {[
                  ["Pacientes",     stats.patients,     plan.patientLimit],
                  ["Agendamentos",  stats.appointments, null],
                ].map(([lbl, val, limit]) => (
                  <div key={lbl} style={{ background:t.bgInset, borderRadius:8, padding:"12px", display:"flex", flexDirection:"column", gap:4 }}>
                    <span style={{ fontSize:26, fontWeight:800, color:t.textPrimary, letterSpacing:"-0.5px" }}>
                      {val === null
                        ? <span className="skeleton-shimmer" style={{ display:"inline-block", width:36, height:24, verticalAlign:"middle" }}/>
                        : val}
                    </span>
                    <span style={{ fontSize:11, color:t.textGhost }}>{lbl}</span>
                    {limit !== null && val !== null && (
                      <div style={{ marginTop:4 }}>
                        <div style={{ height:3, background:t.border, borderRadius:99, overflow:"hidden" }}>
                          <div style={{
                            height:"100%", borderRadius:99, transition:"width .4s",
                            width: `${Math.min((val / limit) * 100, 100)}%`,
                            background: val >= limit ? "#ef4444" : t.accent,
                          }}/>
                        </div>
                        <span style={{ fontSize:10, color:t.textDisabled, marginTop:3, display:"block" }}>
                          {val} de {limit}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div style={{ height:1, background:t.bgInset, margin:"4px 0 12px" }} />
              {[
                ["Criada em",   createdAt],
                ["ID da clínica", clinicId ?? "—"],
              ].map(([lbl, val]) => (
                <div key={lbl} style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", padding:"4px 0", gap:8 }}>
                  <span style={{ fontSize:12, color:t.textGhost, flexShrink:0 }}>{lbl}</span>
                  <span style={{
                    fontSize:12, color:t.textFaint, fontWeight:600, textAlign:"right", wordBreak:"break-all",
                    fontFamily: lbl.includes("ID") ? "monospace" : undefined,
                  }}>
                    {val}
                  </span>
                </div>
              ))}
            </Card>

            {/* ── Card WhatsApp ── */}
            <WhatsAppCard isAdmin={isAdmin} />

          </div>
        </div>
      </div>
    </AppLayout>
  )
}
