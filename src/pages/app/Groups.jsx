import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { supabase } from "../../supabaseClient"
import { useAuth } from "../../context/AuthContext"
import { useTheme } from "../../context/ThemeContext"
import AppLayout from "../AppLayout"
import { Button, Input } from "../../components/ui"
import { MotionModal, MotionToast } from "../../components/ui/MotionComponents"

const DAYS_PT = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"]

function useIsMobile() {
  const [v, setV] = useState(window.innerWidth <= 768)
  useEffect(() => {
    const fn = () => setV(window.innerWidth <= 768)
    window.addEventListener("resize", fn); return () => window.removeEventListener("resize", fn)
  }, [])
  return v
}

// ─── Modal: criar/editar turma ────────────────────────────────────────────────
function GroupModal({ onClose, onSave, clinicId, staffList, specialties, editData = null }) {
  const { t } = useTheme()
  const isEdit = !!editData

  const [name,        setName]        = useState(editData?.name ?? "")
  const [specialty,   setSpecialty]   = useState(editData?.specialty ?? "")
  const [description, setDescription] = useState(editData?.description ?? "")
  const [staffId,     setStaffId]     = useState(editData?.staff_id ?? "")
  const [weekdays,    setWeekdays]    = useState(editData?.weekdays ?? [])
  const [startTime,   setStartTime]   = useState(editData?.start_time?.slice(0,5) ?? "08:00")
  const [endTime,     setEndTime]     = useState(editData?.end_time?.slice(0,5)   ?? "09:00")
  const [maxCapacity, setMaxCapacity] = useState(editData?.max_capacity ?? 10)
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState(null)

  function toggleDay(d) {
    setWeekdays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d].sort())
  }

  async function handleSave() {
    if (!name.trim()) { setError("Nome é obrigatório"); return }
    setError(null); setLoading(true)

    const payload = {
      clinic_id:    clinicId,
      name:         name.trim(),
      specialty:    specialty || null,
      description:  description.trim() || null,
      staff_id:     staffId || null,
      weekdays,
      start_time:   startTime + ":00",
      end_time:     endTime   + ":00",
      max_capacity: parseInt(maxCapacity) || 10,
      updated_at:   new Date().toISOString(),
    }

    let err
    if (isEdit) {
      ({ error: err } = await supabase.from("groups").update(payload).eq("id", editData.id))
    } else {
      ({ error: err } = await supabase.from("groups").insert([payload]))
    }

    setLoading(false)
    if (err) { setError(err.message); return }
    onSave()
  }

  return (
    <MotionModal open={true} onClose={onClose} maxWidth={520}>
      <div style={{ background:t.bgSidebar, border:`1px solid ${t.border}`, borderRadius:16,
        width:"100%", maxWidth:520, display:"flex", flexDirection:"column", maxHeight:"88vh" }}>

        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
          padding:"18px 24px", borderBottom:`1px solid ${t.border}`, flexShrink:0 }}>
          <h2 style={{ fontSize:16, fontWeight:700, color:t.textPrimary, margin:0 }}>
            {isEdit ? "Editar turma" : "Nova turma"}
          </h2>
          <button onClick={onClose} style={{ background:"transparent", border:"none",
            color:t.textGhost, fontSize:20, cursor:"pointer" }}>✕</button>
        </div>

        <div style={{ padding:24, display:"flex", flexDirection:"column", gap:16,
          overflowY:"auto", flex:1 }}>

          <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
            <label style={{ fontSize:12, fontWeight:600, color:t.textFaint }}>Nome da turma *</label>
            <Input type="text" placeholder="Ex: Pilates Manhã, Turma B" value={name}
              onChange={e => setName(e.target.value)} />
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            {specialties?.length > 0 && (
              <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                <label style={{ fontSize:12, fontWeight:600, color:t.textFaint }}>Especialidade</label>
                <select value={specialty} onChange={e => setSpecialty(e.target.value)}
                  style={{ background:t.bgInput, border:`1px solid ${t.border}`, borderRadius:8,
                    padding:"10px 12px", fontSize:14, color:t.textPrimary, outline:"none",
                    width:"100%", boxSizing:"border-box", cursor:"pointer", fontFamily:"inherit" }}>
                  <option value="">Geral</option>
                  {specialties.map(sp => <option key={sp} value={sp.toLowerCase()}>{sp}</option>)}
                </select>
              </div>
            )}
            <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
              <label style={{ fontSize:12, fontWeight:600, color:t.textFaint }}>Professor</label>
              <select value={staffId} onChange={e => setStaffId(e.target.value)}
                style={{ background:t.bgInput, border:`1px solid ${t.border}`, borderRadius:8,
                  padding:"10px 12px", fontSize:14, color:t.textPrimary, outline:"none",
                  width:"100%", boxSizing:"border-box", cursor:"pointer", fontFamily:"inherit" }}>
                <option value="">Sem responsável</option>
                {staffList.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            <label style={{ fontSize:12, fontWeight:600, color:t.textFaint }}>Dias da semana</label>
            <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
              {DAYS_PT.map((d, i) => {
                const active = weekdays.includes(i)
                return (
                  <button key={i} onClick={() => toggleDay(i)} style={{
                    padding:"6px 12px", borderRadius:8, fontSize:12, fontWeight:700,
                    cursor:"pointer", fontFamily:"inherit", transition:"all .12s",
                    background: active ? t.accent : t.bgCard,
                    border: `1px solid ${active ? t.accent : t.border}`,
                    color: active ? "#fff" : t.textFaint,
                  }}>{d}</button>
                )
              })}
            </div>
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12 }}>
            <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
              <label style={{ fontSize:12, fontWeight:600, color:t.textFaint }}>Início</label>
              <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)}
                style={{ background:t.bgInput, border:`1px solid ${t.border}`, borderRadius:8,
                  padding:"10px 12px", fontSize:14, color:t.textPrimary, outline:"none",
                  width:"100%", boxSizing:"border-box", fontFamily:"inherit" }} />
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
              <label style={{ fontSize:12, fontWeight:600, color:t.textFaint }}>Fim</label>
              <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)}
                style={{ background:t.bgInput, border:`1px solid ${t.border}`, borderRadius:8,
                  padding:"10px 12px", fontSize:14, color:t.textPrimary, outline:"none",
                  width:"100%", boxSizing:"border-box", fontFamily:"inherit" }} />
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
              <label style={{ fontSize:12, fontWeight:600, color:t.textFaint }}>Capacidade</label>
              <Input type="number" min="1" max="100" value={maxCapacity}
                onChange={e => setMaxCapacity(e.target.value)} />
            </div>
          </div>

          <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
            <label style={{ fontSize:12, fontWeight:600, color:t.textFaint }}>Descrição</label>
            <textarea placeholder="Observações sobre a turma..." value={description}
              onChange={e => setDescription(e.target.value)} rows={2}
              style={{ background:t.bgInput, border:`1px solid ${t.border}`, borderRadius:8,
                padding:"10px 12px", fontSize:14, color:t.textPrimary, outline:"none",
                width:"100%", boxSizing:"border-box", resize:"vertical", lineHeight:1.5,
                fontFamily:"inherit" }}
              onFocus={e => e.target.style.borderColor = t.accent}
              onBlur={e  => e.target.style.borderColor = t.border}
            />
          </div>

          {error && (
            <div style={{ background:t.errorBg, border:`1px solid ${t.errorBorder}`,
              color:t.errorText, borderRadius:8, padding:"10px 14px", fontSize:13 }}>
              {error}
            </div>
          )}
        </div>

        <div style={{ display:"flex", justifyContent:"flex-end", gap:10,
          padding:"16px 24px", borderTop:`1px solid ${t.border}`, flexShrink:0 }}>
          <Button onClick={onClose} variant="ghost">Cancelar</Button>
          <Button onClick={handleSave} disabled={loading} loading={loading}>
            {loading ? "Salvando..." : isEdit ? "Salvar" : "Criar turma"}
          </Button>
        </div>
      </div>
    </MotionModal>
  )
}

// ─── Modal: gerenciar alunos da turma ─────────────────────────────────────────
function GroupMembersModal({ group, clinicId, onClose, t }) {
  const [members,  setMembers]  = useState([])
  const [patients, setPatients] = useState([])
  const [search,   setSearch]   = useState("")
  const [results,  setResults]  = useState([])
  const [loading,  setLoading]  = useState(true)
  const [adding,   setAdding]   = useState(false)

  useEffect(() => {
    async function load() {
      const { data: mem } = await supabase
        .from("patient_groups")
        .select("id, patient_id, notes, joined_at, patient:patients(id, name, phone, specialty)")
        .eq("group_id", group.id).is("deleted_at", null)
      setMembers(mem ?? [])
      setLoading(false)
    }
    load()
  }, [group.id])

  async function searchPatients(q) {
    setSearch(q)
    if (q.length < 2) { setResults([]); return }
    const { data } = await supabase.from("patients")
      .select("id, name, phone, specialty")
      .eq("clinic_id", clinicId).is("deleted_at", null)
      .ilike("name", `%${q}%`).limit(6)
    // Remove já adicionados
    const memberIds = new Set(members.map(m => m.patient_id))
    setResults((data ?? []).filter(p => !memberIds.has(p.id)))
  }

  async function addPatient(patient) {
    setAdding(true)
    const { error } = await supabase.from("patient_groups").insert([{
      clinic_id: clinicId, patient_id: patient.id, group_id: group.id,
    }])
    if (!error) {
      setMembers(prev => [...prev, {
        id: Date.now(), patient_id: patient.id,
        patient, joined_at: new Date().toISOString()
      }])
      setSearch(""); setResults([])
    }
    setAdding(false)
  }

  async function removePatient(membershipId) {
    await supabase.from("patient_groups")
      .update({ deleted_at: new Date().toISOString() }).eq("id", membershipId)
    setMembers(prev => prev.filter(m => m.id !== membershipId))
  }

  const occupation = Math.round((members.length / group.max_capacity) * 100)
  const barColor = occupation >= 90 ? "#ef4444" : occupation >= 70 ? "#f59e0b" : "#22c55e"

  return (
    <MotionModal open={true} onClose={onClose} maxWidth={520}>
      <div style={{ background:t.bgSidebar, border:`1px solid ${t.border}`, borderRadius:16,
        width:"100%", maxWidth:520, display:"flex", flexDirection:"column", maxHeight:"88vh" }}>

        <div style={{ padding:"20px 24px", borderBottom:`1px solid ${t.border}`, flexShrink:0 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
            <div>
              <h2 style={{ fontSize:16, fontWeight:700, color:t.textPrimary, margin:"0 0 4px" }}>
                {group.name}
              </h2>
              <span style={{ fontSize:12, color:t.textGhost }}>
                {members.length} de {group.max_capacity} alunos
              </span>
            </div>
            <button onClick={onClose} style={{ background:"transparent", border:"none",
              color:t.textGhost, fontSize:20, cursor:"pointer" }}>✕</button>
          </div>
          {/* Barra de ocupação */}
          <div style={{ marginTop:10, height:5, background:t.bgInset, borderRadius:99, overflow:"hidden" }}>
            <div style={{ height:"100%", borderRadius:99, background:barColor,
              width:`${Math.min(occupation, 100)}%`, transition:"width .4s" }}/>
          </div>
        </div>

        <div style={{ padding:"16px 24px", borderBottom:`1px solid ${t.border}`, flexShrink:0 }}>
          <label style={{ fontSize:12, fontWeight:600, color:t.textFaint, display:"block", marginBottom:6 }}>
            Adicionar aluno
          </label>
          <div style={{ position:"relative" }}>
            <Input type="text" placeholder="Buscar paciente pelo nome..."
              value={search} onChange={e => searchPatients(e.target.value)} />
            {results.length > 0 && (
              <div style={{ position:"absolute", top:"calc(100% + 4px)", left:0, right:0, zIndex:50,
                background:t.bgCard, border:`1px solid ${t.border}`, borderRadius:8,
                overflow:"hidden", boxShadow:"0 8px 24px rgba(0,0,0,0.3)" }}>
                {results.map(p => (
                  <div key={p.id}
                    onMouseDown={() => addPatient(p)}
                    style={{ padding:"10px 14px", cursor:"pointer", display:"flex",
                      justifyContent:"space-between", alignItems:"center",
                      borderBottom:`1px solid ${t.bgInset}` }}>
                    <div>
                      <span style={{ fontSize:14, fontWeight:600, color:t.textPrimary,
                        display:"block" }}>{p.name}</span>
                      {p.specialty && (
                        <span style={{ fontSize:11, color:t.textGhost }}>{p.specialty}</span>
                      )}
                    </div>
                    <span style={{ fontSize:12, color:t.accent, fontWeight:600 }}>+ Adicionar</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          {members.length >= group.max_capacity && (
            <p style={{ fontSize:11, color:t.errorText, margin:"6px 0 0" }}>
              ⚠️ Turma no limite de capacidade ({group.max_capacity} alunos)
            </p>
          )}
        </div>

        <div style={{ overflowY:"auto", flex:1 }}>
          {loading ? (
            <div style={{ padding:24, display:"flex", flexDirection:"column", gap:8 }}>
              {[1,2,3].map(i => <div key={i} className="skeleton-shimmer" style={{ height:48 }}/>)}
            </div>
          ) : members.length === 0 ? (
            <div style={{ padding:"48px 24px", textAlign:"center" }}>
              <span style={{ fontSize:32, display:"block", marginBottom:8 }}>👥</span>
              <p style={{ fontSize:14, color:t.textGhost, margin:0 }}>
                Nenhum aluno nesta turma ainda.
              </p>
            </div>
          ) : (
            <div style={{ padding:"12px 24px", display:"flex", flexDirection:"column", gap:8 }}>
              {members.map(m => {
                const p = m.patient
                return (
                  <div key={m.id} style={{ display:"flex", alignItems:"center", gap:12,
                    padding:"10px 0", borderBottom:`1px solid ${t.bgInset}` }}>
                    <div style={{ width:36, height:36, borderRadius:"50%", flexShrink:0,
                      background:`${t.accent}22`, display:"flex", alignItems:"center",
                      justifyContent:"center", fontSize:14, fontWeight:700, color:t.accent }}>
                      {p?.name?.[0]?.toUpperCase() ?? "?"}
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <span style={{ fontSize:14, fontWeight:600, color:t.textPrimary,
                        display:"block" }}>{p?.name ?? "—"}</span>
                      {p?.phone && (
                        <span style={{ fontSize:12, color:t.textGhost }}>{p.phone}</span>
                      )}
                    </div>
                    {p?.specialty && (
                      <span style={{ fontSize:11, color:t.textFaint, background:t.bgInset,
                        borderRadius:6, padding:"2px 8px" }}>{p.specialty}</span>
                    )}
                    <button onClick={() => removePatient(m.id)} style={{
                      background:"transparent", border:`1px solid ${t.border}`,
                      color:t.textGhost, borderRadius:6, padding:"4px 8px",
                      cursor:"pointer", fontSize:12, flexShrink:0,
                    }}>Remover</button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </MotionModal>
  )
}

// ─── Card de turma ────────────────────────────────────────────────────────────
function GroupCard({ group, staffMap, onEdit, onManage, onDelete, t }) {
  const occupation = group._memberCount ?? 0
  const pct        = Math.round((occupation / group.max_capacity) * 100)
  const barColor   = pct >= 90 ? "#ef4444" : pct >= 70 ? "#f59e0b" : "#22c55e"

  const daysLabel = (group.weekdays ?? [])
    .map((d) => DAYS_PT[d]).join(", ") || "Sem dia definido"

  const timeLabel = group.start_time && group.end_time
    ? `${group.start_time.slice(0,5)} – ${group.end_time.slice(0,5)}`
    : "Horário não definido"

  const staff = group.staff_id ? staffMap[group.staff_id] : null

  return (
    <div style={{ background:t.bgCard, border:`1px solid ${t.border}`, borderRadius:12,
      padding:"18px 20px" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start",
        marginBottom:12, gap:12 }}>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
            <h3 style={{ fontSize:15, fontWeight:700, color:t.textPrimary, margin:0 }}>
              {group.name}
            </h3>
            {group.specialty && (
              <span style={{ fontSize:11, fontWeight:700, color:t.accent,
                background:`${t.accent}18`, border:`1px solid ${t.accent}33`,
                borderRadius:99, padding:"2px 8px" }}>
                {group.specialty}
              </span>
            )}
          </div>
          <div style={{ display:"flex", gap:16, marginTop:6, flexWrap:"wrap" }}>
            <span style={{ fontSize:12, color:t.textGhost }}>📅 {daysLabel}</span>
            <span style={{ fontSize:12, color:t.textGhost }}>⏰ {timeLabel}</span>
            {staff && <span style={{ fontSize:12, color:t.textGhost }}>👤 {staff.name}</span>}
          </div>
          {group.description && (
            <p style={{ fontSize:12, color:t.textDisabled, margin:"6px 0 0" }}>{group.description}</p>
          )}
        </div>
        <div style={{ display:"flex", gap:6, flexShrink:0 }}>
          <button onClick={() => onEdit(group)} style={{ background:"transparent",
            border:`1px solid ${t.border}`, color:t.textGhost, borderRadius:8,
            padding:"5px 10px", fontSize:12, cursor:"pointer", fontFamily:"inherit" }}>
            Editar
          </button>
          <button onClick={() => onDelete(group.id)} style={{ background:"transparent",
            border:`1px solid ${t.border}`, color:t.textGhost, borderRadius:8,
            padding:"5px 10px", fontSize:12, cursor:"pointer", fontFamily:"inherit" }}>
            ✕
          </button>
        </div>
      </div>

      {/* Ocupação */}
      <div style={{ marginBottom:12 }}>
        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
          <span style={{ fontSize:11, color:t.textGhost }}>{occupation} alunos</span>
          <span style={{ fontSize:11, color:t.textGhost }}>máx. {group.max_capacity}</span>
        </div>
        <div style={{ height:5, background:t.bgInset, borderRadius:99, overflow:"hidden" }}>
          <div style={{ height:"100%", borderRadius:99, background:barColor,
            width:`${Math.min(pct, 100)}%`, transition:"width .4s" }}/>
        </div>
      </div>

      <Button onClick={() => onManage(group)} variant="secondary" fullWidth
        style={{ fontSize:13 }}>
        Gerenciar alunos ({occupation}/{group.max_capacity})
      </Button>
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function Groups() {
  const { clinicId, clinic } = useAuth()
  const { t }    = useTheme()
  const isMobile = useIsMobile()

  const [groups,      setGroups]      = useState([])
  const [staffList,   setStaffList]   = useState([])
  const [fetching,    setFetching]    = useState(true)
  const [showCreate,  setShowCreate]  = useState(false)
  const [editGroup,   setEditGroup]   = useState(null)
  const [manageGroup, setManageGroup] = useState(null)
  const [toast,       setToast]       = useState(null)

  const staffMap = Object.fromEntries(staffList.map(s => [s.id, s]))
  const specialties = Array.isArray(clinic?.specialties) ? clinic.specialties : []

  function showToast(msg, type = "success") {
    setToast({ msg, type }); setTimeout(() => setToast(null), 3000)
  }

  async function fetchGroups() {
    setFetching(true)
    const { data: grps } = await supabase
      .from("groups")
      .select("*")
      .eq("clinic_id", clinicId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })

    // Busca contagem de alunos por turma
    const groupIds = (grps ?? []).map(g => g.id)
    let countMap = {}
    if (groupIds.length > 0) {
      const { data: counts } = await supabase
        .from("patient_groups")
        .select("group_id")
        .in("group_id", groupIds)
        .is("deleted_at", null)
      counts?.forEach((c) => { countMap[c.group_id] = (countMap[c.group_id] || 0) + 1 })
    }

    setGroups((grps ?? []).map(g => ({ ...g, _memberCount: countMap[g.id] ?? 0 })))
    setFetching(false)
  }

  async function fetchStaff() {
    const { data } = await supabase.from("staff").select("id,name")
      .eq("clinic_id", clinicId).is("deleted_at", null)
    setStaffList(data ?? [])
  }

  async function deleteGroup(id) {
    await supabase.from("groups").update({ deleted_at: new Date().toISOString() }).eq("id", id)
    setGroups(prev => prev.filter(g => g.id !== id))
    showToast("Turma removida.", "error")
  }

  useEffect(() => {
    if (clinicId) { fetchGroups(); fetchStaff() }
  }, [clinicId])

  return (
    <AppLayout>
      <MotionToast toast={toast}>
        <div style={{ border:"1px solid", borderRadius:10, padding:"12px 20px",
          fontSize:14, fontWeight:600, boxShadow:"0 8px 24px rgba(0,0,0,0.2)",
          background: toast?.type==="success"?t.successBg:t.errorBg,
          borderColor: toast?.type==="success"?t.successBorder:t.errorBorder,
          color: toast?.type==="success"?t.successText:t.errorText,
        }}>
          {toast?.type==="success"?"✓":"✕"} {toast?.msg}
        </div>
      </MotionToast>

      {(showCreate || editGroup) && (
        <GroupModal
          clinicId={clinicId}
          staffList={staffList}
          specialties={specialties}
          editData={editGroup}
          onClose={() => { setShowCreate(false); setEditGroup(null) }}
          onSave={() => {
            setShowCreate(false); setEditGroup(null)
            fetchGroups()
            showToast(editGroup ? "Turma atualizada!" : "Turma criada!")
          }}
        />
      )}

      {manageGroup && (
        <GroupMembersModal
          group={manageGroup}
          clinicId={clinicId}
          onClose={() => { setManageGroup(null); fetchGroups() }}
          t={t}
        />
      )}

      <div style={{ color:t.textBody, fontFamily:"'DM Sans','Segoe UI',sans-serif" }}>
        <header style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start",
          marginBottom: isMobile ? 16 : 32, gap:16, flexWrap:"wrap" }}>
          <div>
            <h1 style={{ fontSize: isMobile?22:28, fontWeight:800, margin:0,
              color:t.textPrimary, letterSpacing:"-0.5px" }}>Turmas</h1>
            <p style={{ margin:"4px 0 0", fontSize:13, color:t.textFaint }}>
              Gerencie turmas e grupos de pacientes
            </p>
          </div>
          <Button onClick={() => setShowCreate(true)}>+ Nova turma</Button>
        </header>

        {fetching ? (
          <div style={{ display:"grid", gridTemplateColumns: isMobile?"1fr":"repeat(2,1fr)", gap:16 }}>
            {[1,2,3].map(i => <div key={i} className="skeleton-shimmer" style={{ height:160 }}/>)}
          </div>
        ) : groups.length === 0 ? (
          <div style={{ background:t.bgCard, borderRadius:12, padding:"64px 24px",
            textAlign:"center", display:"flex", flexDirection:"column", alignItems:"center", gap:12 }}>
            <span style={{ fontSize:48 }}>🧘</span>
            <p style={{ fontSize:16, color:t.textGhost, margin:0, fontWeight:600 }}>
              Nenhuma turma criada ainda
            </p>
            <p style={{ fontSize:13, color:t.textDisabled, margin:0 }}>
              Crie turmas para organizar grupos de pacientes por horário e especialidade
            </p>
            <Button onClick={() => setShowCreate(true)} style={{ marginTop:8 }}>
              Criar primeira turma
            </Button>
          </div>
        ) : (
          <div style={{ display:"grid",
            gridTemplateColumns: isMobile ? "1fr" : groups.length === 1 ? "1fr" : "repeat(2,1fr)",
            gap:16 }}>
            {groups.map(g => (
              <GroupCard key={g.id} group={g} staffMap={staffMap} t={t}
                onEdit={setEditGroup}
                onManage={setManageGroup}
                onDelete={deleteGroup}
              />
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
