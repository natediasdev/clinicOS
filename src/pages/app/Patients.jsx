import { useEffect, useState } from "react"
import { MotionToast, MotionList, MotionItem } from "../../components/ui/MotionComponents"
import { useNavigate } from "react-router-dom"
import { supabase } from "../../supabaseClient"
import AppLayout from "../AppLayout"
import { useTheme } from "../../context/ThemeContext"
import { useAuth } from "../../context/AuthContext"
import { usePermissions } from "../../hooks/usePermissions"
import { usePlanLimits } from "../../hooks/usePlanLimits"
import { usePagination, useDebouncedValue } from "../../hooks/usePagination"
import { useDeleteFlow } from "../../hooks/useConfirm"
import { Button, SearchInput, Pagination } from "../../components/ui"
import { PatientModal, EditPatientModal } from "../../components/patients/PatientModals"

function useIsMobile() {
  const [v, setV] = useState(window.innerWidth <= 768)
  useEffect(() => {
    const fn = () => setV(window.innerWidth <= 768)
    window.addEventListener("resize", fn)
    return () => window.removeEventListener("resize", fn)
  }, [])
  return v
}

function Toast({ toast }) {
  const { t } = useTheme()
  const ok = toast?.type === "success"
  return (
    <MotionToast toast={toast}>
      <div style={{ border:"1px solid", borderRadius:10, padding:"12px 20px", fontSize:14, fontWeight:600, boxShadow:"0 8px 24px rgba(0,0,0,0.2)",
        background: ok ? t.successBg : t.errorBg,
        borderColor: ok ? t.successBorder : t.errorBorder,
        color: ok ? t.successText : t.errorText,
      }}>
        {ok ? "✓" : "✕"} {toast?.msg}
      </div>
    </MotionToast>
  )
}

// Termo entra numa string de filtro do PostgREST: vírgula/parênteses quebravam
// a busca e % _ viravam curinga.
function sanitizeTerm(q) { return q.replace(/[,()*%_\\]/g, " ").trim() }

export default function Patients() {
  const { t } = useTheme()
  const { clinicId, clinic } = useAuth()
  const permissions = usePermissions()
  const { checkPatientLimit } = usePlanLimits()
  const navigate = useNavigate()
  const isMobile = useIsMobile()

  const [toast, setToast] = useState(null)
  const [query, setQuery] = useState("")
  const [filterSpecialty, setFilterSpecialty] = useState("all")
  const [showModal, setShowModal] = useState(false)
  const [editPatient, setEditPatient] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)

  function showToast(msg, type="success") { setToast({msg,type}); setTimeout(()=>setToast(null),3000) }
  const reload = () => setRefreshKey(k => k + 1)

  // ── Paginação no servidor ─────────────────────────────────────────────────
  // A busca e o filtro agora são aplicados no banco, então a lista pagina o
  // resultado inteiro (antes: select(*) sem paginação, teto de 1000 linhas).
  const debounced = useDebouncedValue(query.trim(), 300)
  const filterKey = `${debounced}|${filterSpecialty}`
  const { page, pageSize, setPage, setPageSize } = usePagination("clinicos-patients-page-size", filterKey)
  const requestKey = `${clinicId}|${filterKey}|${page}|${pageSize}|${refreshKey}`
  const [result, setResult] = useState({ key:null, rows:[], total:0, error:null })

  useEffect(() => {
    if (!clinicId) return
    let cancelled = false
    ;(async () => {
      const from = (page - 1) * pageSize
      let req = supabase.from("patients").select("*", { count:"exact" })
        .eq("clinic_id", clinicId).is("deleted_at", null)
      if (filterSpecialty !== "all") req = req.eq("specialty", filterSpecialty)
      const term = sanitizeTerm(debounced)
      if (term) {
        req = req.or(`name.ilike.%${term}%,phone.ilike.%${term}%,email.ilike.%${term}%,cpf.ilike.%${term}%`)
          .order("name").order("id")
      } else {
        req = req.order("created_at", { ascending:false }).order("id")
      }
      const { data, count, error } = await req.range(from, from + pageSize - 1)
      if (cancelled) return
      if (error) { setResult({ key:requestKey, rows:[], total:0, error:error.message }); return }
      // Última página ficou vazia (ex.: removeu o único item dela): volta uma página.
      if ((data ?? []).length === 0 && (count ?? 0) > 0 && page > 1) {
        setPage(Math.ceil(count / pageSize)); return
      }
      setResult({ key:requestKey, rows:data ?? [], total:count ?? 0, error:null })
    })()
    return () => { cancelled = true }
  }, [clinicId, debounced, filterSpecialty, page, pageSize, refreshKey, requestKey, setPage])

  const fetching = result.key !== requestKey
  const firstLoad = fetching && result.key === null
  const displayed = result.rows
  const allSpecialties = Array.isArray(clinic?.specialties) ? clinic.specialties : []

  // ── Exclusão (fluxo único: confirmar → soft delete → aviso → recarregar) ──
  const [removeItem, deleteDialog] = useDeleteFlow({ showToast })
  function handleDelete(p) {
    removeItem({
      table:"patients", id:p.id, clinicId,
      title:"Remover paciente", label:`o paciente ${p.name}`,
      successMessage:"Paciente removido.", onDone:reload,
    })
  }

  function handleSaved(patientName) {
    setShowModal(false)
    reload()
    showToast(`${patientName} adicionado!`)
  }

  const rowBtn = { background:"transparent", border:`1px solid ${t.border}`, color:t.textGhost, borderRadius:6, padding:"5px 10px", fontSize:12, cursor:"pointer", fontFamily:"inherit" }
  const delBtn = { ...rowBtn, border:`1px solid ${t.borderStrong}`, color:t.errorText }

  return (
    <AppLayout>
      <Toast toast={toast} />
      {deleteDialog}

      {showModal && (
        <PatientModal onClose={()=>setShowModal(false)} onSave={handleSaved} clinicId={clinicId} specialties={allSpecialties} checkPatientLimit={checkPatientLimit} />
      )}
      {editPatient && (
        <EditPatientModal onClose={()=>setEditPatient(null)} onSave={()=>{ setEditPatient(null); reload(); showToast("Paciente atualizado!") }} patient={editPatient} specialties={allSpecialties} />
      )}

      <div style={{ color:t.textBody, fontFamily:"'DM Sans','Segoe UI',sans-serif" }}>
        <header style={{ marginBottom: isMobile ? 16 : 32, display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:16, flexWrap:"wrap" }}>
          <div>
            <h1 style={{ fontSize:isMobile?22:28, fontWeight:800, margin:0, color:t.textPrimary, letterSpacing:"-0.5px" }}>Pacientes</h1>
            <p style={{ margin:"4px 0 0", fontSize:13, color:t.textFaint }}>Gerencie os pacientes da clínica</p>
          </div>
          {permissions.canCreatePatients && <Button onClick={()=>setShowModal(true)}>+ Novo paciente</Button>}
        </header>

        {/* Lista + busca */}
        <div style={{ background:t.bgCard, borderRadius:12, padding:isMobile?"16px":"24px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16, gap:12, flexWrap:"wrap" }}>
            <h2 style={{ fontSize:13, fontWeight:700, color:t.textMuted, textTransform:"uppercase", letterSpacing:"0.08em", margin:0, display:"flex", alignItems:"center", gap:10 }}>
              Pacientes cadastrados
              {!firstLoad && <span style={{ background:t.bgInset,color:t.accent,fontSize:12,fontWeight:700,padding:"2px 10px",borderRadius:99 }}>{result.total}</span>}
            </h2>
            <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
              {allSpecialties.length > 0 && (
                <select value={filterSpecialty} onChange={e=>setFilterSpecialty(e.target.value)} style={{ background:t.bgInset, border:`1px solid ${t.border}`, borderRadius:8, padding:"8px 12px", fontSize:13, color:t.textPrimary, cursor:"pointer", outline:"none" }}>
                  <option value="all">Todas especialidades</option>
                  {allSpecialties.map(sp => <option key={sp} value={sp}>{sp}</option>)}
                </select>
              )}
              <SearchInput
                value={query}
                onChange={setQuery}
                loading={fetching && !firstLoad && !!debounced}
                placeholder="Buscar nome, telefone, e-mail ou CPF..."
                wrapperStyle={{ flex:isMobile?"1":"unset", minWidth:isMobile?"100%":260 }}
              />
            </div>
          </div>

          {result.error && (
            <div style={{ background:t.errorBg, border:`1px solid ${t.errorBorder}`, color:t.errorText, borderRadius:8, padding:"10px 14px", fontSize:13, marginBottom:12 }}>
              ⚠️ {result.error}
            </div>
          )}

          {firstLoad ? (
            <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
              {[1,2,3].map(i=><div key={i} className="skeleton-shimmer" style={{ height:48 }}/>)}
            </div>
          ) : displayed.length === 0 ? (
            <div style={{ textAlign:"center",padding:"48px 0",display:"flex",flexDirection:"column",alignItems:"center",gap:8 }}>
              <span style={{ fontSize:36 }}>{debounced ? "🔍" : "🦷"}</span>
              <p style={{ fontSize:15,color:t.textGhost,margin:0,fontWeight:600 }}>
                {debounced ? `Nenhum paciente encontrado para "${debounced}"` : "Nenhum paciente cadastrado ainda."}
              </p>
              {!debounced && permissions.canCreatePatients && <p style={{ fontSize:13,color:t.textDisabled,margin:0 }}>Clique em "+ Novo paciente" para adicionar o primeiro.</p>}
            </div>
          ) : (
            <div style={{ opacity: fetching ? 0.6 : 1, transition:"opacity .15s" }}>
              {isMobile ? (
                <MotionList style={{ display:"flex",flexDirection:"column",gap:10 }}>
                  {displayed.map(p=>(
                    <MotionItem key={p.id}><div style={{ background:t.bgInset, borderRadius:10, padding:"14px 16px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                      <div style={{ display:"flex",flexDirection:"column",gap:3,flex:1,minWidth:0 }}>
                        <span onClick={()=>navigate(`/patients/${p.id}`)} style={{ fontWeight:700,color:t.accent,fontSize:15,cursor:"pointer" }}>{p.name}</span>
                        {p.phone && <span style={{ fontSize:13,color:t.textGhost }}>{p.phone}</span>}
                        {p.email && <span style={{ fontSize:12,color:t.textGhost,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{p.email}</span>}
                        {p.specialty && <span style={{ fontSize:12,color:t.textFaint,background:t.bgCard,borderRadius:4,padding:"2px 6px",display:"inline-block",marginTop:4 }}>{p.specialty}</span>}
                      </div>
                      <div style={{ marginLeft:12,flexShrink:0,display:"flex",flexDirection:"column",gap:6 }}>
                        {permissions.canEditPatients && <button onClick={()=>setEditPatient(p)} style={rowBtn}>Editar</button>}
                        {permissions.canDeletePatients && <button onClick={()=>handleDelete(p)} style={delBtn}>Excluir</button>}
                      </div>
                    </div></MotionItem>
                  ))}
                </MotionList>
              ) : (
                <table style={{ width:"100%",borderCollapse:"collapse" }}>
                  <thead>
                    <tr>
                      {["Nome","Telefone","E-mail","Especialidade",""].map((h,i)=>(
                        <th key={i} style={{ fontSize:11,fontWeight:700,color:t.textGhost,textTransform:"uppercase",letterSpacing:"0.08em",padding:"0 12px 12px",textAlign:i===4?"right":"left",borderBottom:`1px solid ${t.bgInset}` }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {displayed.map(p=>(
                      <tr key={p.id} style={{ borderBottom:`1px solid ${t.bgInset}` }}>
                        <td style={{ padding:"14px 12px",fontSize:14 }}>
                          <span onClick={()=>navigate(`/patients/${p.id}`)} style={{ fontWeight:600,color:t.accent,cursor:"pointer" }}>{p.name}</span>
                        </td>
                        <td style={{ padding:"14px 12px",fontSize:14,color:t.textGhost }}>{p.phone||"—"}</td>
                        <td style={{ padding:"14px 12px",fontSize:14,color:t.textGhost }}>{p.email||"—"}</td>
                        <td style={{ padding:"14px 12px",fontSize:14,color:t.textFaint }}>{p.specialty||"—"}</td>
                        <td style={{ padding:"14px 12px",textAlign:"right" }}>
                          <div style={{ display:"flex", gap:6, justifyContent:"flex-end", alignItems:"center" }}>
                            {permissions.canEditPatients && <button onClick={()=>setEditPatient(p)} style={rowBtn}>Editar</button>}
                            {permissions.canDeletePatients && <button onClick={()=>handleDelete(p)} style={delBtn}>Excluir</button>}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {!firstLoad && result.total > 0 && (
            <Pagination page={page} pageSize={pageSize} total={result.total} loading={fetching}
              onPageChange={setPage} onPageSizeChange={setPageSize} />
          )}
        </div>
      </div>
    </AppLayout>
  )
}
