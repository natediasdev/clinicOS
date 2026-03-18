import { useState, useEffect } from "react"
import { supabase } from "../../supabaseClient"
import { useAuth } from "../../context/AuthContext"
import { useTheme } from "../../context/ThemeContext"
import AppLayout from "../AppLayout"
import { Button, Input, Card } from "../../components/ui"

const PLAN_CONFIG = {
  free:    { label: "Free",    color: "#64748b", desc: "Até 50 pacientes · 1 usuário" },
  pro:     { label: "Pro",     color: "#3b82f6", desc: "Pacientes ilimitados · Até 5 usuários" },
  clinica: { label: "Clínica", color: "#8b5cf6", desc: "Usuários ilimitados · Todos os recursos" },
}

export default function ClinicProfile() {
  const { clinic, clinicId, user, refreshClinic } = useAuth()
  const { t } = useTheme()
  const [name, setName] = useState(""); const [phone, setPhone] = useState(""); const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false); const [toast, setToast] = useState(null)
  const [stats, setStats] = useState({ patients: null, appointments: null })
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)

  useEffect(() => {
    function handleResize() { setIsMobile(window.innerWidth <= 768) }
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  useEffect(() => { if (clinic) { setName(clinic.name??""); setPhone(clinic.phone??""); setEmail(clinic.email??"") } }, [clinic])

  useEffect(() => {
    if (!clinicId) return
    async function fetchStats() {
      const [pR, aR] = await Promise.all([
        supabase.from("patients").select("id",{count:"exact",head:true}).is("deleted_at",null),
        supabase.from("appointments").select("id",{count:"exact",head:true}).is("deleted_at",null),
      ])
      setStats({ patients: pR.count??0, appointments: aR.count??0 })
    }
    fetchStats()
  }, [clinicId])

  function showToast(msg, type="success") { setToast({msg,type}); setTimeout(()=>setToast(null),3000) }

  async function handleSave(e) {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    const { error } = await supabase.from("clinics").update({ name:name.trim(), phone:phone.trim()||null, email:email.trim()||null, updated_at: new Date().toISOString() }).eq("id",clinicId)
    setLoading(false)
    if (error) showToast(error.message,"error")
    else { await refreshClinic(); showToast("Perfil da clínica atualizado!") }
  }

  const plan = PLAN_CONFIG[clinic?.plan] ?? PLAN_CONFIG.free
  const createdAt = clinic?.created_at ? new Date(clinic.created_at).toLocaleDateString("pt-BR",{day:"2-digit",month:"long",year:"numeric"}) : "—"

  return (
    <AppLayout>
      {toast && (
        <div style={{ position:"fixed",bottom:24,right:24,zIndex:999,border:"1px solid",borderRadius:10,padding:"12px 20px",fontSize:14,fontWeight:600,boxShadow:"0 8px 24px rgba(0,0,0,0.2)",
          background: toast.type==="success"?t.successBg:t.errorBg,
          borderColor: toast.type==="success"?t.successBorder:t.errorBorder,
          color: toast.type==="success"?t.successText:t.errorText,
        }}>
          {toast.type==="success"?"✓":"✕"} {toast.msg}
        </div>
      )}

      <div style={{ color:t.textBody, fontFamily:"'DM Sans','Segoe UI',sans-serif" }}>
        <header style={{ marginBottom: isMobile ? 16 : 32 }}>
          <h1 style={{ fontSize: isMobile ? 22 : 28, fontWeight:800, margin:0, color:t.textPrimary, letterSpacing:"-0.5px" }}>Perfil da Clínica</h1>
          <p style={{ margin:"4px 0 0",fontSize:13,color:t.textFaint }}>Gerencie as informações da sua clínica</p>
        </header>

        <div style={{ display:"grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 340px", gap:20, alignItems:"start" }}>
          <Card padding={isMobile ? "16px" : "28px 24px"}>
            <h2 style={{ fontSize:13,fontWeight:700,color:t.textMuted,textTransform:"uppercase",letterSpacing:"0.08em",margin:"0 0 20px" }}>Informações gerais</h2>
            <form onSubmit={handleSave} style={{ display:"flex",flexDirection:"column",gap:18 }}>
              {[["Nome da clínica *","text","Ex: Clínica Odonto Saúde",name,setName],["Telefone","text","(00) 00000-0000",phone,setPhone],["E-mail de contato","email","contato@clinica.com",email,setEmail]].map(([lbl,type,ph,val,setter])=>(
                <div key={lbl} style={{ display:"flex",flexDirection:"column",gap:6 }}>
                  <label style={{ fontSize:13,fontWeight:600,color:t.textMuted }}>{lbl}</label>
                  <Input type={type} placeholder={ph} value={val} onChange={e=>setter(e.target.value)} required={lbl.includes("*")} />
                </div>
              ))}
              <div style={{ display:"flex",flexDirection:"column",gap:6 }}>
                <label style={{ fontSize:13,fontWeight:600,color:t.textMuted }}>E-mail do administrador</label>
                <Input type="text" value={user?.email??""} disabled style={{ opacity:0.5,cursor:"not-allowed" }} />
                <span style={{ fontSize:11,color:t.textDisabled }}>Este é o e-mail da sua conta. Não pode ser alterado aqui.</span>
              </div>
              <Button type="submit" disabled={loading||!name.trim()} loading={loading} fullWidth>
                {loading ? "Salvando..." : "Salvar alterações"}
              </Button>
            </form>
          </Card>

          <div style={{ display:"flex",flexDirection:"column",gap:16 }}>
            <Card padding={isMobile ? 16 : 24} borderTop={plan.color}>
              <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8 }}>
                <span style={{ fontSize:13,fontWeight:700,color:t.textMuted,textTransform:"uppercase",letterSpacing:"0.08em" }}>Plano atual</span>
                <span style={{ fontSize:11,fontWeight:700,border:`1px solid ${plan.color}44`,borderRadius:99,padding:"3px 10px",textTransform:"uppercase",color:plan.color }}>{plan.label}</span>
              </div>
              <p style={{ fontSize:13,color:t.textGhost,margin:"0 0 4px" }}>{plan.desc}</p>
              {clinic?.staff_limit && <p style={{ fontSize:12,color:t.textDisabled,margin:0 }}>Limite de staff: {clinic.staff_limit} usuários</p>}
              <div style={{ height:1,background:t.bgInset,margin:"16px 0" }} />
              <a href="https://instagram.com/clinicos" target="_blank" rel="noopener noreferrer" style={{ textDecoration:"none" }}>
                <Button variant="secondary" fullWidth>Fazer upgrade →</Button>
              </a>
            </Card>

            <Card padding={isMobile ? 16 : 24}>
              <span style={{ fontSize:13,fontWeight:700,color:t.textMuted,textTransform:"uppercase",letterSpacing:"0.08em",display:"block",marginBottom:16 }}>Resumo da clínica</span>
              <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16 }}>
                {[["Pacientes",stats.patients],["Agendamentos",stats.appointments]].map(([lbl,val])=>(
                  <div key={lbl} style={{ background:t.bgInset,borderRadius:8,padding:"14px 12px",display:"flex",flexDirection:"column",gap:4 }}>
                    <span style={{ fontSize:28,fontWeight:800,color:t.textPrimary,letterSpacing:"-0.5px" }}>
                      {val===null ? <span className="skeleton-shimmer" style={{ display:"inline-block",width:40,height:28,verticalAlign:"middle" }}/> : val}
                    </span>
                    <span style={{ fontSize:11,color:t.textGhost }}>{lbl}</span>
                  </div>
                ))}
              </div>
              <div style={{ height:1,background:t.bgInset,margin:"4px 0 12px" }} />
              {[["Clínica criada em",createdAt],["ID da clínica",clinicId??"—"]].map(([lbl,val])=>(
                <div key={lbl} style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",padding:"4px 0",gap:8 }}>
                  <span style={{ fontSize:12,color:t.textGhost,flexShrink:0 }}>{lbl}</span>
                  <span style={{ fontSize:12,color:t.textFaint,fontWeight:600,fontFamily:lbl.includes("ID")?"monospace":undefined,wordBreak:"break-all",textAlign:"right" }}>{val}</span>
                </div>
              ))}
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
