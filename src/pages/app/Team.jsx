import { useState, useEffect } from "react"
import { supabase } from "../../supabaseClient"
import { useAuth } from "../../context/AuthContext"
import { useTheme } from "../../context/ThemeContext"
import AppLayout from "../AppLayout"

const ROLE_CONFIG = {
  admin:          { label: "Admin",          color: "#8b5cf6" },
  dentist:        { label: "Dentista",       color: "#3b82f6" },
  receptionist:   { label: "Recepcionista",  color: "#22c55e" },
  physiotherapist:{ label: "Fisioterapeuta", color: "#f59e0b" },
  psychologist:   { label: "Psicólogo",      color: "#ec4899" },
  nutritionist:   { label: "Nutricionista",  color: "#14b8a6" },
  other:          { label: "Outro",          color: "#64748b" },
}

function RoleBadge({ role }) {
  const cfg = ROLE_CONFIG[role] ?? ROLE_CONFIG.other
  return (
    <span style={{ fontSize: 11, fontWeight: 700, color: cfg.color, background: cfg.color + "18", border: `1px solid ${cfg.color}33`, borderRadius: 99, padding: "3px 10px" }}>
      {cfg.label}
    </span>
  )
}

function Toast({ toast }) {
  const { t } = useTheme()
  if (!toast) return null
  return (
    <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 999, border: "1px solid", borderRadius: 10, padding: "12px 20px", fontSize: 14, fontWeight: 600, boxShadow: "0 8px 24px rgba(0,0,0,0.2)", fontFamily: "'DM Sans','Segoe UI',sans-serif",
      background: toast.type === "success" ? t.successBg : toast.type === "error" ? t.errorBg : t.infoBg,
      borderColor: toast.type === "success" ? t.successBorder : toast.type === "error" ? t.errorBorder : t.infoBorder,
      color: toast.type === "success" ? t.successText : toast.type === "error" ? t.errorText : t.infoText,
    }}>
      {toast.type === "success" ? "✓" : toast.type === "error" ? "✕" : "✉️"} {toast.msg}
    </div>
  )
}

export default function Team() {
  const { clinicId, clinic } = useAuth()
  const { t } = useTheme()
  const [members, setMembers] = useState([])
  const [fetching, setFetching] = useState(true)
  const [toast, setToast] = useState(null)
  const [removeConfirm, setRemoveConfirm] = useState(null)

  // Invite form
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState("dentist")
  const [inviteName, setInviteName] = useState("")
  const [inviteSpecialty, setInviteSpecialty] = useState("")
  const [inviting, setInviting] = useState(false)
  const [inviteError, setInviteError] = useState(null)

  function showToast(msg, type = "success") {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 4000)
  }

  async function fetchMembers() {
    setFetching(true)
    const { data, error } = await supabase
      .from("staff")
      .select("*")
      .eq("clinic_id", clinicId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
    if (!error) setMembers(data ?? [])
    setFetching(false)
  }

  async function handleInvite() {
    if (!inviteEmail.trim() || !inviteName.trim()) {
      setInviteError("Nome e e-mail são obrigatórios.")
      return
    }
    setInviteError(null)
    setInviting(true)

    // Verifica limite do plano
    const staffLimit = clinic?.staff_limit ?? 1
    if (members.length >= staffLimit) {
      setInviteError(`Limite de ${staffLimit} membro(s) atingido no plano atual. Faça upgrade para adicionar mais.`)
      setInviting(false)
      return
    }

    // 1. Registra na tabela staff
    const { error: staffError } = await supabase
      .from("staff")
      .insert([{
        clinic_id: clinicId,
        name: inviteName.trim(),
        email: inviteEmail.trim().toLowerCase(),
        role: inviteRole,
        specialty: inviteSpecialty.trim() || null,
      }])

    if (staffError) {
      setInviteError(staffError.message)
      setInviting(false)
      return
    }

    // 2. Envia convite via Edge Function
    const { error: inviteError } = await supabase.functions.invoke("invite-member", {
      body: {
        email: inviteEmail.trim().toLowerCase(),
        name: inviteName.trim(),
        role: inviteRole,
        clinic_id: clinicId,
      },
    })

    setInviting(false)

    if (inviteError) {
      // Convite falhou mas staff foi criado — avisa mas não bloqueia
      showToast("Membro adicionado, mas o email de convite falhou. Envie o link manualmente.", "info")
    } else {
      showToast(`Convite enviado para ${inviteEmail}!`)
    }

    setInviteEmail("")
    setInviteName("")
    setInviteSpecialty("")
    setInviteRole("dentist")
    fetchMembers()
  }

  async function handleRemove(id) {
    const { error } = await supabase
      .from("staff")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id)
    if (!error) {
      setRemoveConfirm(null)
      fetchMembers()
      showToast("Membro removido da equipe.", "error")
    }
  }

  useEffect(() => { if (clinicId) fetchMembers() }, [clinicId])

  const inp = {
    background: t.bgInput, border: `1px solid ${t.border}`, borderRadius: 8,
    padding: "10px 12px", fontSize: 14, color: t.textPrimary, outline: "none",
    transition: "border-color 0.2s", width: "100%", boxSizing: "border-box",
  }

  const staffLimit = clinic?.staff_limit ?? 1
  const atLimit = members.length >= staffLimit

  return (
    <AppLayout>
      <Toast toast={toast} />
      <div style={{ color: t.textBody, fontFamily: "'DM Sans','Segoe UI',sans-serif" }}>

        {/* Header */}
        <header style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0, color: t.textPrimary, letterSpacing: "-0.5px" }}>Equipe</h1>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: t.textFaint }}>Gerencie os membros da sua clínica</p>
        </header>

        {/* Limite do plano */}
        <div style={{ background: t.bgCard, borderRadius: 12, padding: "16px 20px", marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 20 }}>👥</span>
            <div>
              <span style={{ fontSize: 14, fontWeight: 600, color: t.textPrimary }}>
                {members.length} de {staffLimit === 999 ? "ilimitados" : staffLimit} membros
              </span>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: t.textFaint }}>Plano {clinic?.plan ?? "free"}</p>
            </div>
          </div>
          {/* Barra de uso */}
          {staffLimit !== 999 && (
            <div style={{ width: 160 }}>
              <div style={{ height: 6, background: t.bgInset, borderRadius: 99, overflow: "hidden" }}>
                <div style={{
                  height: "100%", borderRadius: 99, transition: "width 0.4s",
                  width: `${Math.min((members.length / staffLimit) * 100, 100)}%`,
                  background: atLimit ? "#ef4444" : "#3b82f6",
                }} />
              </div>
            </div>
          )}
        </div>

        {/* Formulário de convite */}
        <div style={{ background: t.bgCard, borderRadius: 12, padding: "24px", marginBottom: 20 }}>
          <h2 style={{ fontSize: 13, fontWeight: 700, color: t.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 16px" }}>
            Convidar membro
          </h2>

          {atLimit && (
            <div style={{ background: t.errorBg, border: `1px solid ${t.errorBorder}`, color: t.errorText, borderRadius: 8, padding: "10px 14px", fontSize: 13, marginBottom: 16 }}>
              Limite de membros atingido. Faça upgrade do plano para adicionar mais.
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: t.textFaint }}>Nome *</label>
              <input type="text" placeholder="Nome completo" value={inviteName}
                onChange={e => setInviteName(e.target.value)} style={inp} disabled={atLimit}
                onFocus={e => e.target.style.borderColor = t.accent}
                onBlur={e => e.target.style.borderColor = t.border} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: t.textFaint }}>E-mail *</label>
              <input type="email" placeholder="membro@clinica.com" value={inviteEmail}
                onChange={e => setInviteEmail(e.target.value)} style={inp} disabled={atLimit}
                onFocus={e => e.target.style.borderColor = t.accent}
                onBlur={e => e.target.style.borderColor = t.border} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: t.textFaint }}>Função</label>
              <select value={inviteRole} onChange={e => setInviteRole(e.target.value)} disabled={atLimit}
                style={{ ...inp, cursor: "pointer" }}>
                {Object.entries(ROLE_CONFIG).filter(([k]) => k !== "admin").map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: t.textFaint }}>Especialidade</label>
              <input type="text" placeholder="Ex: Ortodontia, Clínica Geral..." value={inviteSpecialty}
                onChange={e => setInviteSpecialty(e.target.value)} style={inp} disabled={atLimit}
                onFocus={e => e.target.style.borderColor = t.accent}
                onBlur={e => e.target.style.borderColor = t.border} />
            </div>
          </div>

          {inviteError && (
            <div style={{ background: t.errorBg, border: `1px solid ${t.errorBorder}`, color: t.errorText, borderRadius: 8, padding: "10px 14px", fontSize: 13, marginTop: 14 }}>
              {inviteError}
            </div>
          )}

          <button onClick={handleInvite} disabled={inviting || atLimit || !inviteEmail.trim() || !inviteName.trim()}
            style={{ marginTop: 16, background: t.accent, border: "none", borderRadius: 8, padding: "11px 24px", fontSize: 14, fontWeight: 700, color: "#fff", cursor: "pointer",
              opacity: inviting || atLimit || !inviteEmail.trim() || !inviteName.trim() ? 0.5 : 1 }}>
            {inviting ? "Enviando convite..." : "✉️ Enviar convite"}
          </button>

          <p style={{ margin: "10px 0 0", fontSize: 12, color: t.textGhost }}>
            O membro receberá um email com link para definir a senha e acessar o sistema.
          </p>
        </div>

        {/* Lista de membros */}
        <div style={{ background: t.bgCard, borderRadius: 12, padding: "24px" }}>
          <h2 style={{ fontSize: 13, fontWeight: 700, color: t.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 16px", display: "flex", alignItems: "center", gap: 10 }}>
            Membros
            {!fetching && <span style={{ background: t.bgInset, color: t.accent, fontSize: 12, fontWeight: 700, padding: "2px 10px", borderRadius: 99 }}>{members.length}</span>}
          </h2>

          {fetching ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[1,2,3].map(i => <div key={i} className="skeleton-shimmer" style={{ height: 56 }} />)}
            </div>
          ) : members.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 36 }}>👥</span>
              <p style={{ fontSize: 15, color: t.textGhost, margin: 0, fontWeight: 600 }}>Nenhum membro na equipe ainda.</p>
              <p style={{ fontSize: 13, color: t.textDisabled, margin: 0 }}>Use o formulário acima para convidar o primeiro.</p>
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {["Membro", "Função", "Especialidade", "Adicionado em", ""].map((h, i) => (
                    <th key={i} style={{ fontSize: 11, fontWeight: 700, color: t.textGhost, textTransform: "uppercase", letterSpacing: "0.08em", padding: "0 12px 12px", textAlign: i === 4 ? "right" : "left", borderBottom: `1px solid ${t.bgInset}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {members.map(m => (
                  <tr key={m.id} style={{ borderBottom: `1px solid ${t.bgInset}` }}>
                    <td style={{ padding: "14px 12px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 34, height: 34, borderRadius: "50%", background: (ROLE_CONFIG[m.role]?.color ?? "#64748b") + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: ROLE_CONFIG[m.role]?.color ?? "#64748b", flexShrink: 0 }}>
                          {m.name?.[0]?.toUpperCase() ?? "?"}
                        </div>
                        <div>
                          <span style={{ fontWeight: 600, color: t.textPrimary, fontSize: 14, display: "block" }}>{m.name ?? "—"}</span>
                          <span style={{ fontSize: 12, color: t.textGhost }}>{m.email ?? "—"}</span>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "14px 12px" }}><RoleBadge role={m.role} /></td>
                    <td style={{ padding: "14px 12px", fontSize: 13, color: t.textGhost }}>{m.specialty ?? "—"}</td>
                    <td style={{ padding: "14px 12px", fontSize: 12, color: t.textGhost }}>
                      {m.created_at ? new Date(m.created_at).toLocaleDateString("pt-BR") : "—"}
                    </td>
                    <td style={{ padding: "14px 12px", textAlign: "right" }}>
                      {removeConfirm === m.id ? (
                        <span style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "flex-end" }}>
                          <span style={{ fontSize: 12, color: t.errorText }}>Confirmar?</span>
                          <button onClick={() => handleRemove(m.id)} style={{ background: t.errorBg, border: "none", color: t.errorText, borderRadius: 6, padding: "5px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Sim</button>
                          <button onClick={() => setRemoveConfirm(null)} style={{ background: t.bgCard, border: `1px solid ${t.border}`, color: t.textMuted, borderRadius: 6, padding: "5px 12px", fontSize: 12, cursor: "pointer" }}>Não</button>
                        </span>
                      ) : (
                        <button onClick={() => setRemoveConfirm(m.id)} style={{ background: "transparent", border: `1px solid ${t.borderStrong}`, color: t.textFaint, borderRadius: 6, padding: "5px 14px", fontSize: 12, cursor: "pointer" }}>
                          Remover
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AppLayout>
  )
}