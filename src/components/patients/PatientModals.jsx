import { useState } from "react"
import { MotionModal } from "../ui/MotionComponents"
import { supabase } from "../../supabaseClient"
import { useTheme } from "../../context/ThemeContext"
import { Button, Input } from "../ui"

// Modais de paciente compartilhados entre a página Pacientes e o Dashboard
// (ações rápidas). Extraídos de pages/app/Patients.jsx.

export function PatientModal({ onClose, onSave, clinicId, specialties, checkPatientLimit }) {
  const { t } = useTheme()
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [specialty, setSpecialty] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleSave() {
    if (!name.trim()) { setError("Nome é obrigatório"); return }
    setError(null); setLoading(true)
    
    if (checkPatientLimit) {
      const check = await checkPatientLimit()
      if (!check.allowed) { setError(check.message); setLoading(false); return }
    }
    
    const { error } = await supabase.from("patients").insert([{
      name: name.trim(),
      phone: phone.trim() || null,
      email: email.trim() || null,
      specialty: specialty || null,
      clinic_id: clinicId
    }])
    setLoading(false)
    if (error) { setError(error.message); return }
    onSave(name)
  }

  return (
    <MotionModal open={true} onClose={onClose} maxWidth={480}>
      <div style={{ background: t.bgInset, border: `1px solid ${t.border}`, borderRadius: 16, width: "100%", maxWidth: 480, display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px", borderBottom: `1px solid ${t.border}` }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: t.textPrimary, margin: 0 }}>Novo paciente</h2>
          <button style={{ background: "transparent", border: "none", color: t.textGhost, fontSize: 18, cursor: "pointer" }} onClick={onClose}>✕</button>
        </div>

        <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: t.textFaint }}>Nome *</label>
            <Input type="text" placeholder="Nome completo" value={name} onChange={e => setName(e.target.value)} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: t.textFaint }}>Telefone</label>
              <Input type="text" placeholder="(00) 00000-0000" value={phone} onChange={e => setPhone(e.target.value)} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: t.textFaint }}>E-mail</label>
              <Input type="email" placeholder="paciente@email.com" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
          </div>

          {specialties && specialties.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: t.textFaint }}>Especialidade</label>
              <select value={specialty} onChange={e => setSpecialty(e.target.value)} style={{ background: t.bgInput, border: `1px solid ${t.border}`, borderRadius: 8, padding: "10px 12px", fontSize: 14, color: t.textPrimary, outline: "none", width: "100%", boxSizing: "border-box", cursor: "pointer" }}>
                <option value="">Selecione...</option>
                {specialties.map(sp => <option key={sp} value={sp}>{sp}</option>)}
              </select>
            </div>
          )}

          {error && <div style={{ background: t.errorBg, border: `1px solid ${t.errorBorder}`, color: t.errorText, borderRadius: 8, padding: "10px 14px", fontSize: 13 }}>{error}</div>}
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, padding: "16px 24px", borderTop: `1px solid ${t.border}` }}>
          <Button onClick={onClose} variant="secondary">Cancelar</Button>
          <Button onClick={handleSave} disabled={loading} loading={loading}>
            {loading ? "Salvando..." : "Adicionar"}
          </Button>
        </div>
      </div>
    </MotionModal>
  )
}


export function EditPatientModal({ onClose, onSave, patient, specialties }) {
  const { t } = useTheme()
  const [name,     setName]     = useState(patient.name ?? "")
  const [phone,    setPhone]    = useState(patient.phone ?? "")
  const [email,    setEmail]    = useState(patient.email ?? "")
  const [specialty,setSpecialty]= useState(patient.specialty ?? "")
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState(null)

  async function handleSave() {
    if (!name.trim()) { setError("Nome é obrigatório"); return }
    setError(null); setLoading(true)
    const { error } = await supabase.from("patients").update({
      name: name.trim(), phone: phone.trim()||null,
      email: email.trim()||null, specialty: specialty||null,
    }).eq("id", patient.id)
    setLoading(false)
    if (error) { setError(error.message); return }
    onSave()
  }

  return (
    <MotionModal open={true} onClose={onClose} maxWidth={480}>
      <div style={{ background:t.bgInset, border:`1px solid ${t.border}`, borderRadius:16, width:"100%", maxWidth:480, display:"flex", flexDirection:"column" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"20px 24px", borderBottom:`1px solid ${t.border}` }}>
          <h2 style={{ fontSize:16, fontWeight:700, color:t.textPrimary, margin:0 }}>Editar paciente</h2>
          <button style={{ background:"transparent", border:"none", color:t.textGhost, fontSize:18, cursor:"pointer" }} onClick={onClose}>✕</button>
        </div>
        <div style={{ padding:24, display:"flex", flexDirection:"column", gap:16 }}>
          <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
            <label style={{ fontSize:12, fontWeight:600, color:t.textFaint }}>Nome *</label>
            <Input type="text" placeholder="Nome completo" value={name} onChange={e=>setName(e.target.value)} />
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
              <label style={{ fontSize:12, fontWeight:600, color:t.textFaint }}>Telefone</label>
              <Input type="text" placeholder="(00) 00000-0000" value={phone} onChange={e=>setPhone(e.target.value)} />
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
              <label style={{ fontSize:12, fontWeight:600, color:t.textFaint }}>E-mail</label>
              <Input type="email" placeholder="paciente@email.com" value={email} onChange={e=>setEmail(e.target.value)} />
            </div>
          </div>
          {specialties && specialties.length > 0 && (
            <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
              <label style={{ fontSize:12, fontWeight:600, color:t.textFaint }}>Especialidade</label>
              <select value={specialty} onChange={e=>setSpecialty(e.target.value)} style={{ background:t.bgInput, border:`1px solid ${t.border}`, borderRadius:8, padding:"10px 12px", fontSize:14, color:t.textPrimary, outline:"none", width:"100%", boxSizing:"border-box", cursor:"pointer" }}>
                <option value="">Selecione...</option>
                {specialties.map(sp=><option key={sp} value={sp}>{sp}</option>)}
              </select>
            </div>
          )}
          {error && <div style={{ background:t.errorBg, border:`1px solid ${t.errorBorder}`, color:t.errorText, borderRadius:8, padding:"10px 14px", fontSize:13 }}>{error}</div>}
        </div>
        <div style={{ display:"flex", justifyContent:"flex-end", gap:10, padding:"16px 24px", borderTop:`1px solid ${t.border}` }}>
          <Button onClick={onClose} variant="secondary">Cancelar</Button>
          <Button onClick={handleSave} disabled={loading} loading={loading}>
            {loading ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </div>
    </MotionModal>
  )
}
