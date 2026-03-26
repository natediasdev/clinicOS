import { useState } from "react"
import { supabase } from "../../supabaseClient"
import { useAuth } from "../../context/AuthContext"
import { useTheme } from "../../context/ThemeContext"
import { useNavigate } from "react-router-dom"
import { Button, Input, Badge } from "../../components/ui"

const SPECIALTIES = [
  { id: "fisioterapia", label: "Fisioterapia", icon: "🦴" },
  { id: "pilates", label: "Pilates", icon: "🧘" },
  { id: "odontologia", label: "Odontologia", icon: "🦷" },
  { id: "psicologia", label: "Psicologia", icon: "🧠" },
  { id: "nutricao", label: "Nutrição", icon: "🥗" },
  { id: "estetica", label: "Estética", icon: "✨" },
  { id: "geral", label: "Clínica Geral", icon: "🏥" },
]

const STEPS = [
  { id:"clinic",      icon:"🏥", title:"Dê um nome à sua clínica",       desc:"Este nome aparecerá no sistema e será visto pela sua equipe." },
  { id:"patient",     icon:"🦷", title:"Adicione seu primeiro paciente",  desc:"Cadastre um paciente para começar a usar o sistema." },
  { id:"appointment", icon:"📅", title:"Faça seu primeiro agendamento",   desc:"Agende uma consulta para o paciente que você acabou de cadastrar." },
  { id:"done",        icon:"🎉", title:"Tudo pronto!",                    desc:"Sua clínica está configurada. Bem-vindo ao ClinicOS." },
]

function StepClinic({ onNext, t }) {
  const { clinicId, refreshClinic } = useAuth()
  const [name, setName]       = useState("")
  const [specialty, setSpecialty] = useState("geral")
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)

  async function handleSubmit() {
    if (!name.trim()) return
    setLoading(true)
    const { error } = await supabase.from("clinics").update({ name:name.trim(), specialty, updated_at:new Date().toISOString() }).eq("id",clinicId)
    setLoading(false)
    if (error) { setError(error.message); return }
    await refreshClinic()
    onNext()
  }

  return (
    <div style={stepBody}>
        <div style={field}>
          <label style={{ fontSize:13, fontWeight:600, color:t.textMuted }}>Nome da clínica *</label>
          <Input 
            type="text" 
            placeholder="Ex: Clínica Odonto Saúde" 
            value={name} 
            autoFocus
            onChange={e=>setName(e.target.value)} 
            onKeyDown={e=>e.key==="Enter"&&handleSubmit()}
          />
        </div>
        <div style={field}>
          <label style={{ fontSize:13, fontWeight:600, color:t.textMuted }}>Especialidade da clínica</label>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(2, 1fr)", gap:8 }}>
            {SPECIALTIES.map(sp=>(
              <button
                key={sp.id}
                onClick={()=>setSpecialty(sp.id)}
                style={{
                  display:"flex", alignItems:"center", gap:10, padding:"12px 14px",
                  background: specialty===sp.id ? `${t.accent}18` : t.bgInset,
                  border: `1px solid ${specialty===sp.id ? t.accent : t.border}`,
                  borderRadius:10, cursor:"pointer", transition:"all .15s",
                }}
              >
                <span style={{ fontSize:18 }}>{sp.icon}</span>
                <span style={{ fontSize:13, fontWeight:600, color: specialty===sp.id ? t.accent : t.textMuted }}>{sp.label}</span>
              </button>
            ))}
          </div>
        </div>
      {error && <div style={errBox(t)}>{error}</div>}
      <Button 
        onClick={handleSubmit} 
        disabled={loading||!name.trim()} 
        variant="primary" 
        loading={loading}
        fullWidth
      >
        {loading ? "Salvando..." : "Continuar →"}
      </Button>
    </div>
  )
}

function StepPatient({ onNext, onSkip, t }) {
  const [name, setName]       = useState("")
  const [phone, setPhone]     = useState("")
  const [email, setEmail]     = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)

  async function handleSubmit() {
    if (!name.trim()) return
    setLoading(true)
    const { data, error } = await supabase.from("patients").insert([{ name:name.trim(), phone:phone.trim()||null, email:email.trim()||null }]).select().single()
    setLoading(false)
    if (error) { setError(error.message); return }
    onNext(data)
  }

  return (
    <div style={stepBody}>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
        <div style={field}>
          <label style={{ fontSize:13, fontWeight:600, color:t.textMuted }}>Nome *</label>
          <Input 
            type="text" 
            placeholder="Nome completo" 
            value={name} 
            onChange={e=>setName(e.target.value)}
          />
        </div>
        <div style={field}>
          <label style={{ fontSize:13, fontWeight:600, color:t.textMuted }}>Telefone</label>
          <Input 
            type="text" 
            placeholder="(00) 00000-0000" 
            value={phone} 
            onChange={e=>setPhone(e.target.value)}
          />
        </div>
      </div>
      <div style={field}>
        <label style={{ fontSize:13, fontWeight:600, color:t.textMuted }}>E-mail</label>
        <Input 
          type="email" 
          placeholder="paciente@email.com" 
          value={email} 
          onChange={e=>setEmail(e.target.value)}
        />
      </div>
      {error && <div style={errBox(t)}>{error}</div>}
      <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
        <Button onClick={onSkip} variant="ghost">Pular por agora</Button>
        <Button 
          onClick={handleSubmit} 
          disabled={loading||!name.trim()} 
          variant="primary" 
          loading={loading}
        >
          {loading ? "Salvando..." : "Adicionar e continuar →"}
        </Button>
      </div>
    </div>
  )
}

function StepAppointment({ onNext, onSkip, patient, clinicId, t }) {
  const [datetime, setDatetime] = useState("")
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState(null)

  async function handleSubmit() {
    if (!datetime||!patient) return
    setLoading(true)
    const { error } = await supabase.from("appointments").insert([{ clinic_id:clinicId, client_id:patient.id, datetime, status:"scheduled" }])
    setLoading(false)
    if (error) { setError(error.message); return }
    onNext()
  }

  return (
    <div style={stepBody}>
      {patient && (
        <div style={{ background:t.successBg, border:`1px solid ${t.successBorder}`, color:t.successText, borderRadius:8, padding:"8px 14px", fontSize:13, display:"flex", alignItems:"center", gap:8 }}>
          <span style={{ width:8, height:8, borderRadius:"50%", background:t.successText, flexShrink:0, display:"inline-block" }}/>
          Agendando para: <strong style={{ color:t.textPrimary }}>{patient.name}</strong>
        </div>
      )}
      {!patient && (
        <div style={{ background:t.infoBg, border:`1px solid ${t.infoBorder}`, color:t.infoText, borderRadius:8, padding:"10px 14px", fontSize:13 }}>
          Você pulou o cadastro de paciente. Poderá agendar normalmente pela página de Agendamentos.
        </div>
      )}
      <div style={field}>
        <label style={{ fontSize:13, fontWeight:600, color:t.textMuted }}>Data e hora *</label>
        <Input 
          type="datetime-local" 
          value={datetime} 
          disabled={!patient}
          onChange={e=>setDatetime(e.target.value)}
        />
      </div>
      {error && <div style={errBox(t)}>{error}</div>}
      <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
        <Button onClick={onSkip} variant="ghost">Pular por agora</Button>
        <Button 
          onClick={handleSubmit} 
          disabled={loading||!datetime||!patient} 
          variant="primary" 
          loading={loading}
        >
          {loading ? "Salvando..." : "Agendar e continuar →"}
        </Button>
      </div>
    </div>
  )
}

function StepDone({ onFinish, t }) {
  return (
    <div style={stepBody}>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:8 }}>
        {[{icon:"🦷",label:"Pacientes"},{icon:"📅",label:"Agendamentos"},{icon:"📊",label:"Dashboard"},{icon:"⚙️",label:"Minha Clínica"}].map(item=>(
          <div key={item.label} style={{ background:t.bgInset, border:`1px solid ${t.border}`, borderRadius:10, padding:"16px", display:"flex", flexDirection:"column", alignItems:"center", gap:8 }}>
            <span style={{ fontSize:26 }}>{item.icon}</span>
            <span style={{ fontSize:13, fontWeight:600, color:t.textMuted }}>{item.label}</span>
          </div>
        ))}
      </div>
      <Button onClick={onFinish} variant="primary" fullWidth>Ir para o Dashboard →</Button>
    </div>
  )
}

export default function Onboarding() {
  const { t } = useTheme()
  const { user, clinicId, refreshOnboarding } = useAuth()
  const navigate = useNavigate()
  const [step, setStep]               = useState(0)
  const [firstPatient, setFirstPatient] = useState(null)

  async function completeOnboarding() {
    try {
      const { error } = await supabase.from("profiles").update({ onboarding_completed:true }).eq("id",user.id)
      if (error) console.error("Erro ao completar onboarding:", error)
      await refreshOnboarding()
    } catch(e) { console.error("Exceção no onboarding:", e) }
    finally { navigate("/dashboard") }
  }

  const current = STEPS[step]

  return (
    <div style={{ minHeight:"100vh", background:t.bgPage, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'DM Sans','Segoe UI',sans-serif", padding:24 }}>
      <div style={{ background:t.bgCard, border:`1px solid ${t.border}`, borderRadius:20, padding:"48px 40px", width:"100%", maxWidth:520, display:"flex", flexDirection:"column", alignItems:"center" }}>

        {/* Logo */}
        <div style={{ fontSize:22, fontWeight:800, color:t.textPrimary, letterSpacing:"-0.5px", marginBottom:36 }}>
          Clinic<span style={{ color:t.accent }}>OS</span>
        </div>

        {/* Progress */}
        <div style={{ display:"flex", alignItems:"center", marginBottom:40, width:"100%", justifyContent:"center" }}>
          {STEPS.map((st,i)=>(
            <div key={st.id} style={{ display:"flex", alignItems:"center" }}>
              <div style={{
                width:32, height:32, borderRadius:"50%",
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:12, fontWeight:700, color:"#fff",
                background: i<=step ? t.accent : t.bgInset,
                border: i===step ? `2px solid #60a5fa` : `2px solid ${t.border}`,
                transform: i===step ? "scale(1.2)" : "scale(1)",
                transition:"all .3s",
                flexShrink:0,
              }}>
                {i<step ? "✓" : i+1}
              </div>
              {i<STEPS.length-1 && (
                <div style={{ width:48, height:2, margin:"0 4px", background:i<step? t.accent : t.border, transition:"background .3s" }}/>
              )}
            </div>
          ))}
        </div>

        {/* Step header */}
        <div style={{ textAlign:"center", marginBottom:28, width:"100%" }}>
          <span style={{ fontSize:40, display:"block", marginBottom:12 }}>{current.icon}</span>
          <h1 style={{ fontSize:22, fontWeight:800, color:t.textPrimary, margin:"0 0 8px", letterSpacing:"-0.5px" }}>{current.title}</h1>
          <p style={{ fontSize:14, color:t.textFaint, margin:0, lineHeight:1.6 }}>{current.desc}</p>
        </div>

        {step===0 && <StepClinic t={t} onNext={()=>setStep(1)}/>}
        {step===1 && <StepPatient t={t} onNext={p=>{setFirstPatient(p);setStep(2)}} onSkip={()=>{setFirstPatient(null);setStep(3)}}/>}
        {step===2 && <StepAppointment t={t} patient={firstPatient} onNext={()=>setStep(3)} onSkip={()=>setStep(3)} clinicId={clinicId}/>}
        {step===3 && <StepDone t={t} onFinish={completeOnboarding}/>}
      </div>
    </div>
  )
}

// ─── Helpers de estilo reativos ao tema ───────────────────────────────────────
const stepBody  = { width:"100%", display:"flex", flexDirection:"column", gap:16 }
const field     = { display:"flex", flexDirection:"column", gap:6 }
const errBox    = (t) => ({ background:t.errorBg, border:`1px solid ${t.errorBorder}`, color:t.errorText, borderRadius:8, padding:"10px 14px", fontSize:13 })
