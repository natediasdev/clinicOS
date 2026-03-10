import { useState } from "react"
import { supabase } from "../../supabaseClient"
import { useAuth } from "../../context/AuthContext"
import { useNavigate } from "react-router-dom"

const STEPS = [
  {
    id: "clinic",
    icon: "🏥",
    title: "Dê um nome à sua clínica",
    desc: "Este nome aparecerá no sistema e será visto pela sua equipe.",
  },
  {
    id: "patient",
    icon: "🦷",
    title: "Adicione seu primeiro paciente",
    desc: "Cadastre um paciente para começar a usar o sistema.",
  },
  {
    id: "appointment",
    icon: "📅",
    title: "Faça seu primeiro agendamento",
    desc: "Agende uma consulta para o paciente que você acabou de cadastrar.",
  },
  {
    id: "done",
    icon: "🎉",
    title: "Tudo pronto!",
    desc: "Sua clínica está configurada. Bem-vindo ao ClinicOS.",
  },
]

// ─── Step 1: Nome da clínica ──────────────────────────────────────────────────

function StepClinic({ onNext }) {
  const { clinicId, refreshClinic } = useAuth()
  const [name, setName] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit() {
    if (!name.trim()) return
    setLoading(true)
    const { error } = await supabase
      .from("clinics")
      .update({ name: name.trim(), updated_at: new Date().toISOString() })
      .eq("id", clinicId)
    setLoading(false)
    if (error) { setError(error.message); return }
    await refreshClinic()
    onNext()
  }

  return (
    <div style={s.stepBody}>
      <div style={s.field}>
        <label style={s.label}>Nome da clínica *</label>
        <input
          type="text"
          placeholder="Ex: Clínica Odonto Saúde"
          value={name}
          autoFocus
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          style={s.input}
          onFocus={(e) => (e.target.style.borderColor = "#3b82f6")}
          onBlur={(e) => (e.target.style.borderColor = "#1e293b")}
        />
      </div>
      {error && <div style={s.errorBox}>{error}</div>}
      <button
        onClick={handleSubmit}
        disabled={loading || !name.trim()}
        style={loading || !name.trim() ? { ...s.btnPrimary, opacity: 0.5 } : s.btnPrimary}
      >
        {loading ? "Salvando..." : "Continuar →"}
      </button>
    </div>
  )
}

// ─── Step 2: Primeiro paciente ────────────────────────────────────────────────

function StepPatient({ onNext, onSkip }) {
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [saved, setSaved] = useState(null) // paciente salvo para passar ao step 3

  async function handleSubmit() {
    if (!name.trim()) return
    setLoading(true)
    const { data, error } = await supabase
      .from("patients")
      .insert([{ name: name.trim(), phone: phone.trim() || null, email: email.trim() || null }])
      .select()
      .single()
    setLoading(false)
    if (error) { setError(error.message); return }
    setSaved(data)
    onNext(data)
  }

  return (
    <div style={s.stepBody}>
      <div style={s.fieldsRow}>
        <div style={s.field}>
          <label style={s.label}>Nome *</label>
          <input type="text" placeholder="Nome completo" value={name}
            onChange={(e) => setName(e.target.value)} style={s.input}
            onFocus={(e) => (e.target.style.borderColor = "#3b82f6")}
            onBlur={(e) => (e.target.style.borderColor = "#1e293b")} />
        </div>
        <div style={s.field}>
          <label style={s.label}>Telefone</label>
          <input type="text" placeholder="(00) 00000-0000" value={phone}
            onChange={(e) => setPhone(e.target.value)} style={s.input}
            onFocus={(e) => (e.target.style.borderColor = "#3b82f6")}
            onBlur={(e) => (e.target.style.borderColor = "#1e293b")} />
        </div>
      </div>
      <div style={s.field}>
        <label style={s.label}>E-mail</label>
        <input type="email" placeholder="paciente@email.com" value={email}
          onChange={(e) => setEmail(e.target.value)} style={s.input}
          onFocus={(e) => (e.target.style.borderColor = "#3b82f6")}
          onBlur={(e) => (e.target.style.borderColor = "#1e293b")} />
      </div>
      {error && <div style={s.errorBox}>{error}</div>}
      <div style={s.btnRow}>
        <button onClick={onSkip} style={s.btnGhost}>Pular por agora</button>
        <button
          onClick={handleSubmit}
          disabled={loading || !name.trim()}
          style={loading || !name.trim() ? { ...s.btnPrimary, opacity: 0.5 } : s.btnPrimary}
        >
          {loading ? "Salvando..." : "Adicionar e continuar →"}
        </button>
      </div>
    </div>
  )
}

// ─── Step 3: Primeiro agendamento ─────────────────────────────────────────────

function StepAppointment({ onNext, onSkip, patient, clinicId }) {
  const [datetime, setDatetime] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit() {
    if (!datetime || !patient) return
    setLoading(true)
    const { error } = await supabase
      .from("appointments")
      .insert([{ clinic_id: clinicId, client_id: patient.id, datetime, status: "scheduled" }])
    setLoading(false)
    if (error) { setError(error.message); return }
    onNext()
  }

  return (
    <div style={s.stepBody}>
      {patient && (
        <div style={s.patientChip}>
          <span style={s.patientChipDot} />
          Agendando para: <strong style={{ color: "#f1f5f9" }}>{patient.name}</strong>
        </div>
      )}
      {!patient && (
        <div style={s.infoBox}>
          Você pulou o cadastro de paciente. Poderá agendar normalmente pela página de Agendamentos.
        </div>
      )}
      <div style={s.field}>
        <label style={s.label}>Data e hora *</label>
        <input
          type="datetime-local"
          value={datetime}
          onChange={(e) => setDatetime(e.target.value)}
          style={s.input}
          disabled={!patient}
          onFocus={(e) => (e.target.style.borderColor = "#3b82f6")}
          onBlur={(e) => (e.target.style.borderColor = "#1e293b")}
        />
      </div>
      {error && <div style={s.errorBox}>{error}</div>}
      <div style={s.btnRow}>
        <button onClick={onSkip} style={s.btnGhost}>Pular por agora</button>
        <button
          onClick={handleSubmit}
          disabled={loading || !datetime || !patient}
          style={loading || !datetime || !patient ? { ...s.btnPrimary, opacity: 0.5 } : s.btnPrimary}
        >
          {loading ? "Salvando..." : "Agendar e continuar →"}
        </button>
      </div>
    </div>
  )
}

// ─── Step 4: Conclusão ────────────────────────────────────────────────────────

function StepDone({ onFinish }) {
  return (
    <div style={s.stepBody}>
      <div style={s.doneGrid}>
        {[
          { icon: "🦷", label: "Pacientes", path: "/patients" },
          { icon: "📅", label: "Agendamentos", path: "/appointments" },
          { icon: "📊", label: "Dashboard", path: "/dashboard" },
          { icon: "⚙️", label: "Minha Clínica", path: "/profile" },
        ].map((item) => (
          <div key={item.label} style={s.doneCard}>
            <span style={s.doneIcon}>{item.icon}</span>
            <span style={s.doneLabel}>{item.label}</span>
          </div>
        ))}
      </div>
      <button onClick={onFinish} style={s.btnPrimary}>
        Ir para o Dashboard →
      </button>
    </div>
  )
}

// ─── Onboarding principal ─────────────────────────────────────────────────────

export default function Onboarding() {
  const { user, clinicId, refreshOnboarding } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [firstPatient, setFirstPatient] = useState(null)

  async function completeOnboarding() {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ onboarding_completed: true })
        .eq("id", user.id)
      if (error) console.error("Erro ao completar onboarding:", error)
      await refreshOnboarding()
    } catch (e) {
      console.error("Exceção no onboarding:", e)
    } finally {
      navigate("/dashboard")
    }
  }

  const current = STEPS[step]

  return (
    <div style={s.page}>
      <div style={s.card}>
        {/* Logo */}
        <div style={s.logo}>
          Clinic<span style={s.logoAccent}>OS</span>
        </div>

        {/* Progress */}
        <div style={s.progressWrap}>
          {STEPS.map((st, i) => (
            <div key={st.id} style={s.progressStep}>
              <div style={{
                ...s.progressDot,
                background: i < step ? "#3b82f6" : i === step ? "#3b82f6" : "#1e293b",
                border: i === step ? "2px solid #60a5fa" : "2px solid transparent",
                transform: i === step ? "scale(1.2)" : "scale(1)",
              }}>
                {i < step ? "✓" : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div style={{
                  ...s.progressLine,
                  background: i < step ? "#3b82f6" : "#1e293b",
                }} />
              )}
            </div>
          ))}
        </div>

        {/* Step content */}
        <div style={s.stepHeader}>
          <span style={s.stepIcon}>{current.icon}</span>
          <h1 style={s.stepTitle}>{current.title}</h1>
          <p style={s.stepDesc}>{current.desc}</p>
        </div>

        {step === 0 && <StepClinic onNext={() => setStep(1)} />}
        {step === 1 && (
          <StepPatient
            onNext={(patient) => { setFirstPatient(patient); setStep(2) }}
            onSkip={() => { setFirstPatient(null); setStep(3) }}
          />
        )}
        {step === 2 && (
          <StepAppointment
            patient={firstPatient}
            onNext={() => setStep(3)}
            onSkip={() => setStep(3)}
            clinicId={clinicId}
          />
        )}
        {step === 3 && <StepDone onFinish={completeOnboarding} />}
      </div>
    </div>
  )
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const s = {
  page: {
    minHeight: "100vh",
    width: "100%",
    background: window.matchMedia("(prefers-color-scheme: dark)").matches ? "#0a1120" : "#f1f5f9",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
    padding: "16px",
    boxSizing: "border-box",
  },
  card: {
    background: window.matchMedia("(prefers-color-scheme: dark)").matches ? "#0f172a" : "#ffffff",
    border: window.matchMedia("(prefers-color-scheme: dark)").matches ? "1px solid #1e293b" : "1px solid #e2e8f0",
    borderRadius: 20,
    padding: "36px 24px",
    width: "100%",
    maxWidth: 520,
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  logo: {
    fontSize: 22,
    fontWeight: 800,
    color: "#f8fafc",
    letterSpacing: "-0.5px",
    marginBottom: 36,
  },
  logoAccent: { color: "#3b82f6" },

  // Progress
  progressWrap: {
    display: "flex",
    alignItems: "center",
    marginBottom: 40,
    width: "100%",
    justifyContent: "center",
  },
  progressStep: { display: "flex", alignItems: "center" },
  progressDot: {
    width: 32, height: 32,
    borderRadius: "50%",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 12, fontWeight: 700, color: "#fff",
    transition: "all 0.3s",
    flexShrink: 0,
  },
  progressLine: {
    width: 48, height: 2,
    margin: "0 4px",
    transition: "background 0.3s",
  },

  // Step header
  stepHeader: { textAlign: "center", marginBottom: 28, width: "100%" },
  stepIcon: { fontSize: 40, display: "block", marginBottom: 12 },
  stepTitle: {
    fontSize: 22, fontWeight: 800, color: "#f8fafc",
    margin: "0 0 8px", letterSpacing: "-0.5px",
  },
  stepDesc: { fontSize: 14, color: "#475569", margin: 0, lineHeight: 1.6 },

  // Step body
  stepBody: { width: "100%", display: "flex", flexDirection: "column", gap: 16 },
  fieldsRow: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
  field: { display: "flex", flexDirection: "column", gap: 6 },
  label: { fontSize: 13, fontWeight: 600, color: "#94a3b8" },
  input: {
    background: "#1e293b", border: "1px solid #1e293b",
    borderRadius: 8, padding: "11px 14px",
    fontSize: 14, color: "#f1f5f9", outline: "none",
    transition: "border-color 0.2s", width: "100%", boxSizing: "border-box",
  },
  errorBox: {
    background: "#450a0a", border: "1px solid #7f1d1d",
    color: "#fca5a5", borderRadius: 8, padding: "10px 14px", fontSize: 13,
  },
  infoBox: {
    background: "#0c1f3a", border: "1px solid #1d4ed8",
    color: "#93c5fd", borderRadius: 8, padding: "10px 14px", fontSize: 13,
  },
  patientChip: {
    background: "#052e16", border: "1px solid #166534",
    color: "#86efac", borderRadius: 8, padding: "8px 14px",
    fontSize: 13, display: "flex", alignItems: "center", gap: 8,
  },
  patientChipDot: {
    width: 8, height: 8, borderRadius: "50%", background: "#22c55e", flexShrink: 0,
  },
  btnRow: { display: "flex", gap: 10, justifyContent: "flex-end" },
  btnPrimary: {
    background: "#3b82f6", border: "none", borderRadius: 8,
    padding: "13px 24px", fontSize: 15, fontWeight: 700,
    color: "#fff", cursor: "pointer", width: "100%",
  },
  btnGhost: {
    background: "transparent", border: "1px solid #1e293b",
    color: "#475569", borderRadius: 8, padding: "13px 20px",
    fontSize: 14, cursor: "pointer",
  },

  // Done step
  doneGrid: {
    display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 8,
  },
  doneCard: {
    background: "#1e293b", borderRadius: 10, padding: "16px",
    display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
  },
  doneIcon: { fontSize: 28 },
  doneLabel: { fontSize: 13, fontWeight: 600, color: "#94a3b8" },
}
