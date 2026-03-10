import { useEffect, useState } from "react"
import { supabase } from "../../supabaseClient"
import AppLayout from "../AppLayout"
import { useTheme } from "../../context/ThemeContext"
import { useAuth } from "../../context/AuthContext"
import { usePermissions } from "../../hooks/usePermissions"
import { usePlanLimits } from "../../hooks/usePlanLimits"

function Toast({ toast }) {
  const { t } = useTheme()
  const { clinicId } = useAuth()
  if (!toast) return null
  return (
    <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 999, border: "1px solid", borderRadius: 10, padding: "12px 20px", fontSize: 14, fontWeight: 600, boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
      background: toast.type === "success" ? t.successBg : t.errorBg,
      borderColor: toast.type === "success" ? t.successBorder : t.errorBorder,
      color: toast.type === "success" ? t.successText : t.errorText,
    }}>
      {toast.type === "success" ? "✓" : "✕"} {toast.msg}
    </div>
  )
}

export default function Patients() {
  const { t } = useTheme()
  const { clinicId } = useAuth()
  const permissions = usePermissions()
  const { checkPatientLimit } = usePlanLimits()
  const [patients, setPatients] = useState([])
  const [name, setName] = useState(""); const [phone, setPhone] = useState(""); const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false); const [fetching, setFetching] = useState(true)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [error, setError] = useState(null); const [toast, setToast] = useState(null)
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)

  useEffect(() => {
    function handleResize() { setIsMobile(window.innerWidth <= 768) }
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  function showToast(msg, type="success") { setToast({msg,type}); setTimeout(()=>setToast(null),3000) }

  async function fetchPatients() {
    setFetching(true)
    const { data, error } = await supabase.from("patients").select("*").is("deleted_at",null).order("created_at",{ascending:false})
    if (!error) setPatients(data); else setError(error.message)
    setFetching(false)
  }

  async function addPatient() {
    if (!name.trim()) return
    setError(null)
    const check = await checkPatientLimit()
    if (!check.allowed) { setError(check.message); return }
    setLoading(true)
    const { error } = await supabase.from("patients").insert([{name, phone, email, clinic_id: clinicId}])
    if (!error) { setName(""); setPhone(""); setEmail(""); fetchPatients(); showToast(`${name} adicionado!`) }
    else setError(error.message)
    setLoading(false)
  }

  async function deletePatient(id) {
    const { error } = await supabase.from("patients").update({deleted_at: new Date().toISOString()}).eq("id",id)
    if (!error) { setDeleteConfirm(null); fetchPatients(); showToast("Paciente removido.","error") }
    else setError(error.message)
  }

  useEffect(() => { fetchPatients() }, [])

  const inp = { background: t.bgInput, border: `1px solid ${t.border}`, borderRadius: 8, padding: "10px 12px", fontSize: 14, color: t.textPrimary, outline: "none", transition: "border-color 0.2s", width: "100%", boxSizing: "border-box" }

  return (
    <AppLayout>
      <Toast toast={toast} />
      <div style={{ color: t.textBody, fontFamily: "'DM Sans','Segoe UI',sans-serif" }}>
        <header style={{ marginBottom: isMobile ? 16 : 32 }}>
          <h1 style={{ fontSize: isMobile ? 22 : 28, fontWeight: 800, margin: 0, color: t.textPrimary, letterSpacing: "-0.5px" }}>Pacientes</h1>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: t.textFaint }}>Gerencie os pacientes da clínica</p>
        </header>

        <div style={{ background: t.bgCard, borderRadius: 12, padding: isMobile ? "16px" : "24px", marginBottom: 20 }}>
          <h2 style={{ fontSize: 13, fontWeight: 700, color: t.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 16px" }}>Novo paciente</h2>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr auto", gap: 14, alignItems: "end" }}>
            {[["Nome *","text","Nome completo",name,setName],["Telefone","text","(00) 00000-0000",phone,setPhone],["E-mail","email","paciente@email.com",email,setEmail]].map(([lbl,type,ph,val,setter])=>(
              <div key={lbl} style={{ display:"flex",flexDirection:"column",gap:6 }}>
                <label style={{ fontSize:12,fontWeight:600,color:t.textFaint }}>{lbl}</label>
                <input type={type} placeholder={ph} value={val} onChange={e=>setter(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addPatient()} style={inp}
                  onFocus={e=>e.target.style.borderColor=t.accent} onBlur={e=>e.target.style.borderColor=t.border} />
              </div>
            ))}
            <button onClick={addPatient} disabled={loading||!name.trim()} style={{ background:t.accent,border:"none",borderRadius:8,padding:"10px 20px",fontSize:14,fontWeight:700,color:"#fff",cursor:"pointer",whiteSpace:"nowrap",opacity:loading||!name.trim()?0.5:1, marginTop: isMobile ? 4 : 0 }}>
              {loading ? "Salvando..." : "+ Adicionar"}
            </button>
          </div>
          {error && <div style={{ background:t.errorBg,border:`1px solid ${t.errorBorder}`,color:t.errorText,borderRadius:8,padding:"10px 14px",fontSize:13,marginTop:14 }}>{error}</div>}
        </div>

        <div style={{ background: t.bgCard, borderRadius: 12, padding: isMobile ? "16px" : "24px" }}>
          <h2 style={{ fontSize:13,fontWeight:700,color:t.textMuted,textTransform:"uppercase",letterSpacing:"0.08em",margin:"0 0 16px",display:"flex",alignItems:"center",gap:10 }}>
            Pacientes cadastrados
            {!fetching && <span style={{ background:t.bgInset,color:t.accent,fontSize:12,fontWeight:700,padding:"2px 10px",borderRadius:99 }}>{patients.length}</span>}
          </h2>

          {fetching ? (
            <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
              {[1,2,3].map(i=><div key={i} className="skeleton-shimmer" style={{ height:48 }}/>)}
            </div>
          ) : patients.length === 0 ? (
            <div style={{ textAlign:"center",padding:"48px 0",display:"flex",flexDirection:"column",alignItems:"center",gap:8 }}>
              <span style={{ fontSize:36 }}>🦷</span>
              <p style={{ fontSize:15,color:t.textGhost,margin:0,fontWeight:600 }}>Nenhum paciente cadastrado ainda.</p>
              <p style={{ fontSize:13,color:t.textDisabled,margin:0 }}>Use o formulário acima para adicionar o primeiro.</p>
            </div>
          ) : isMobile ? (
            // Cards para mobile
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {patients.map(p => (
                <div key={p.id} style={{ background: t.bgInset, borderRadius: 10, padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 3, flex: 1, minWidth: 0 }}>
                    <span style={{ fontWeight: 700, color: t.textPrimary, fontSize: 15 }}>{p.name}</span>
                    {p.phone && <span style={{ fontSize: 13, color: t.textGhost }}>{p.phone}</span>}
                    {p.email && <span style={{ fontSize: 12, color: t.textGhost, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.email}</span>}
                  </div>
                  <div style={{ marginLeft: 12, flexShrink: 0 }}>
                    {deleteConfirm === p.id ? (
                      <span style={{ display:"flex",alignItems:"center",gap:6 }}>
                        <button onClick={()=>deletePatient(p.id)} style={{ background:t.errorBg,border:"none",color:t.errorText,borderRadius:6,padding:"6px 10px",fontSize:12,fontWeight:700,cursor:"pointer" }}>Sim</button>
                        <button onClick={()=>setDeleteConfirm(null)} style={{ background:t.bgCard,border:`1px solid ${t.border}`,color:t.textMuted,borderRadius:6,padding:"6px 10px",fontSize:12,cursor:"pointer" }}>Não</button>
                      </span>
                    ) : permissions.canDeletePatients ? (
                      <button onClick={()=>setDeleteConfirm(p.id)} style={{ background:"transparent",border:`1px solid ${t.borderStrong}`,color:t.textFaint,borderRadius:6,padding:"6px 12px",fontSize:12,cursor:"pointer" }}>Excluir</button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // Tabela para desktop
            <table style={{ width:"100%",borderCollapse:"collapse" }}>
              <thead>
                <tr>
                  {["Nome","Telefone","E-mail",""].map((h,i)=>(
                    <th key={i} style={{ fontSize:11,fontWeight:700,color:t.textGhost,textTransform:"uppercase",letterSpacing:"0.08em",padding:"0 12px 12px",textAlign:i===3?"right":"left",borderBottom:`1px solid ${t.bgInset}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {patients.map(p=>(
                  <tr key={p.id} style={{ borderBottom:`1px solid ${t.bgInset}` }}>
                    <td style={{ padding:"14px 12px",fontSize:14 }}><span style={{ fontWeight:600,color:t.textPrimary }}>{p.name}</span></td>
                    <td style={{ padding:"14px 12px",fontSize:14,color:t.textGhost }}>{p.phone||"—"}</td>
                    <td style={{ padding:"14px 12px",fontSize:14,color:t.textGhost }}>{p.email||"—"}</td>
                    <td style={{ padding:"14px 12px",textAlign:"right" }}>
                      {deleteConfirm===p.id ? (
                        <span style={{ display:"flex",alignItems:"center",gap:8,justifyContent:"flex-end" }}>
                          <span style={{ fontSize:12,color:t.errorText }}>Confirmar?</span>
                          <button onClick={()=>deletePatient(p.id)} style={{ background:t.errorBg,border:"none",color:t.errorText,borderRadius:6,padding:"5px 12px",fontSize:12,fontWeight:700,cursor:"pointer" }}>Sim</button>
                          <button onClick={()=>setDeleteConfirm(null)} style={{ background:t.bgCard,border:`1px solid ${t.border}`,color:t.textMuted,borderRadius:6,padding:"5px 12px",fontSize:12,cursor:"pointer" }}>Não</button>
                        </span>
                      ) : permissions.canDeletePatients ? (
                        <button onClick={()=>setDeleteConfirm(p.id)} style={{ background:"transparent",border:`1px solid ${t.borderStrong}`,color:t.textFaint,borderRadius:6,padding:"5px 14px",fontSize:12,cursor:"pointer" }}>Excluir</button>
                      ) : <span style={{ fontSize:12,color:t.textDisabled }}>—</span>}
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