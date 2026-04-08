/**
 * ProductTypes.jsx
 * Gerenciamento de tipos de produto (consultas/sessões) e pacotes.
 *
 * Tabela esperada: product_types
 *   id, clinic_id, name, description, price, specialty,
 *   sessions_in_package (int — null = avulso, >1 = pacote),
 *   active (bool), deleted_at, created_at
 */

import { useEffect, useState } from "react"
import { useTheme } from "../../context/ThemeContext"
import { useAuth } from "../../context/AuthContext"
import { supabase } from "../../supabaseClient"
import AppLayout from "../AppLayout"
import { Button, Input } from "../../components/ui"
import { MotionModal, MotionList, MotionItem, MotionToast } from "../../components/ui/MotionComponents"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(v) {
  return new Intl.NumberFormat("pt-BR", { style:"currency", currency:"BRL" }).format(v ?? 0)
}

function Toast({ toast }) {
  const { t } = useTheme()
  const ok = toast?.type === "success"
  return (
    <MotionToast toast={toast}>
      <div style={{
        background: ok ? t.successBg : t.errorBg,
        border: `1px solid ${ok ? t.successBorder : t.errorBorder}`,
        color: ok ? t.successText : t.errorText,
        borderRadius:10, padding:"12px 20px", fontSize:14, fontWeight:600,
        fontFamily:"'DM Sans','Segoe UI',sans-serif", boxShadow:"0 8px 24px rgba(0,0,0,0.4)",
      }}>
        {ok ? "✓" : "✕"} {toast?.message}
      </div>
    </MotionToast>
  )
}

// ─── ServiceModal — criar / editar tipo de serviço ────────────────────────────

function ServiceModal({ service, onClose, onSave, clinicId, specialties }) {
  const { t } = useTheme()
  const isEdit = !!service

  const [name,              setName]              = useState(service?.name ?? "")
  const [description,       setDescription]       = useState(service?.description ?? "")
  const [price,             setPrice]             = useState(service?.price != null ? String(service.price) : "")
  const [specialty,         setSpecialty]         = useState(service?.specialty ?? "")
  const [isPackage,         setIsPackage]         = useState(!!(service?.sessions_in_package))
  const [sessionCount,      setSessionCount]      = useState(service?.sessions_in_package ? String(service.sessions_in_package) : "10")
  const [active,            setActive]            = useState(service?.active ?? true)
  const [loading,           setLoading]           = useState(false)
  const [error,             setError]             = useState(null)

  useEffect(() => {
    const fn = e => { if (e.key === "Escape") onClose() }
    window.addEventListener("keydown", fn)
    return () => window.removeEventListener("keydown", fn)
  }, [])

  async function handleSave() {
    if (!name.trim()) { setError("Nome obrigatório"); return }
    if (price && isNaN(parseFloat(price))) { setError("Preço inválido"); return }
    if (isPackage && (!sessionCount || parseInt(sessionCount) < 2)) {
      setError("Pacote precisa ter ao menos 2 sessões"); return
    }

    setError(null); setLoading(true)

    const payload = {
      clinic_id:           clinicId,
      name:                name.trim(),
      description:         description.trim() || null,
      price:               price ? parseFloat(price) : null,
      specialty:           specialty || null,
      sessions_in_package: isPackage ? parseInt(sessionCount) : null,
      active,
    }

    let err
    if (isEdit) {
      const res = await supabase.from("product_types")
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq("id", service.id)
      err = res.error
    } else {
      const res = await supabase.from("product_types").insert([payload])
      err = res.error
    }

    setLoading(false)
    if (err) { setError(err.message); return }
    onSave()
  }

  return (
    <MotionModal open={true} onClose={onClose} maxWidth={480}>
      <div style={{
        background:t.bgInset, border:`1px solid ${t.border}`, borderRadius:16,
        width:"100%", maxWidth:480, display:"flex", flexDirection:"column", maxHeight:"90vh",
      }}>
        {/* Header */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
          padding:"18px 24px", borderBottom:`1px solid ${t.border}`, flexShrink:0 }}>
          <h2 style={{ fontSize:16, fontWeight:700, color:t.textPrimary, margin:0 }}>
            {isEdit ? "Editar serviço" : "Novo tipo de serviço"}
          </h2>
          <button style={{ background:"transparent", border:"none", color:t.textGhost, fontSize:18, cursor:"pointer" }} onClick={onClose}>✕</button>
        </div>

        <div style={{ padding:24, display:"flex", flexDirection:"column", gap:16, overflowY:"auto", flex:1 }}>

          {/* Nome */}
          <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
            <label style={{ fontSize:12, fontWeight:600, color:t.textFaint }}>Nome *</label>
            <Input placeholder="Ex: Sessão de Pilates, Consulta Fisio..." value={name} onChange={e=>setName(e.target.value)} />
          </div>

          {/* Descrição */}
          <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
            <label style={{ fontSize:12, fontWeight:600, color:t.textFaint }}>Descrição</label>
            <Input placeholder="Detalhes opcionais sobre o serviço..." value={description} onChange={e=>setDescription(e.target.value)} />
          </div>

          {/* Especialidade */}
          {specialties?.length > 0 && (
            <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
              <label style={{ fontSize:12, fontWeight:600, color:t.textFaint }}>Especialidade</label>
              <select value={specialty} onChange={e=>setSpecialty(e.target.value)}
                style={{ background:t.bgInput, border:`1px solid ${t.border}`, borderRadius:8,
                  padding:"10px 12px", fontSize:14, color:t.textPrimary, outline:"none",
                  width:"100%", boxSizing:"border-box", cursor:"pointer" }}>
                <option value="">Todas / Nenhuma</option>
                {specialties.map(sp=><option key={sp} value={sp}>{sp}</option>)}
              </select>
            </div>
          )}

          {/* ── Toggle: avulso vs pacote ── */}
          <div style={{ borderTop:`1px solid ${t.border}`, paddingTop:14, display:"flex", flexDirection:"column", gap:10 }}>
            <label style={{ fontSize:12, fontWeight:600, color:t.textFaint }}>Tipo de cobrança</label>

            <div style={{ display:"flex", gap:8 }}>
              {/* Avulso */}
              <button onClick={() => setIsPackage(false)} style={{
                flex:1, padding:"12px", borderRadius:10, cursor:"pointer", fontFamily:"inherit",
                transition:"all .15s", textAlign:"left",
                background: !isPackage ? `${t.accent}12` : t.bgCard,
                border: `1px solid ${!isPackage ? t.accent : t.border}`,
              }}>
                <span style={{ fontSize:13, fontWeight:700, color:!isPackage ? t.accent : t.textMuted, display:"block" }}>
                  💳 Avulso
                </span>
                <span style={{ fontSize:11, color:t.textDisabled }}>
                  Uma sessão por vez
                </span>
              </button>

              {/* Pacote */}
              <button onClick={() => setIsPackage(true)} style={{
                flex:1, padding:"12px", borderRadius:10, cursor:"pointer", fontFamily:"inherit",
                transition:"all .15s", textAlign:"left",
                background: isPackage ? `${t.accent}12` : t.bgCard,
                border: `1px solid ${isPackage ? t.accent : t.border}`,
              }}>
                <span style={{ fontSize:13, fontWeight:700, color:isPackage ? t.accent : t.textMuted, display:"block" }}>
                  📦 Pacote
                </span>
                <span style={{ fontSize:11, color:t.textDisabled }}>
                  N sessões pré-pagas
                </span>
              </button>
            </div>

            {/* Qtd sessões (só se pacote) */}
            {isPackage && (
              <div style={{ display:"flex", alignItems:"center", gap:10, background:t.bgCard, borderRadius:10, padding:"12px 16px", border:`1px solid ${t.border}` }}>
                <span style={{ fontSize:13, color:t.textBody, whiteSpace:"nowrap" }}>Número de sessões no pacote:</span>
                <Input
                  type="number" min="2" max="100" step="1"
                  value={sessionCount}
                  onChange={e => setSessionCount(e.target.value)}
                  style={{ width:80, textAlign:"center" }}
                />
              </div>
            )}
          </div>

          {/* Preço */}
          <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
            <label style={{ fontSize:12, fontWeight:600, color:t.textFaint }}>
              {isPackage ? `Valor do pacote (${sessionCount || "N"} sessões)` : "Valor por sessão"} (R$)
            </label>
            <Input type="number" placeholder="0,00" value={price}
              onChange={e=>setPrice(e.target.value)} min="0" step="0.01" />
            {/* Preview por sessão quando é pacote */}
            {isPackage && price && parseInt(sessionCount) >= 2 && (
              <span style={{ fontSize:12, color:t.textGhost }}>
                ≈ {formatCurrency(parseFloat(price) / parseInt(sessionCount))} por sessão
              </span>
            )}
          </div>

          {/* Ativo */}
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <button onClick={() => setActive(v => !v)} style={{
              width:36, height:20, borderRadius:99, border:"none", cursor:"pointer",
              background: active ? t.accent : t.bgCard,
              border: `1px solid ${active ? t.accent : t.border}`,
              position:"relative", transition:"background .2s",
              flexShrink:0,
            }}>
              <span style={{
                position:"absolute", top:2, left: active ? 18 : 2,
                width:14, height:14, borderRadius:"50%",
                background:"#fff", transition:"left .2s",
                boxShadow:"0 1px 3px rgba(0,0,0,0.3)",
              }} />
            </button>
            <span style={{ fontSize:13, color:t.textBody }}>
              {active ? "Ativo — aparece no modal de agendamento" : "Inativo — oculto no agendamento"}
            </span>
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
          <Button onClick={onClose} variant="secondary">Cancelar</Button>
          <Button onClick={handleSave} disabled={loading} loading={loading}>
            {loading ? "Salvando..." : isEdit ? "Salvar alterações" : "Criar serviço"}
          </Button>
        </div>
      </div>
    </MotionModal>
  )
}

// ─── ServiceCard ──────────────────────────────────────────────────────────────

function ServiceCard({ service, onEdit, onDelete, t }) {
  const isPackage = service.sessions_in_package > 1

  return (
    <div style={{
      background:t.bgCard, border:`1px solid ${t.border}`, borderRadius:12,
      padding:"18px 20px", display:"flex", alignItems:"center", gap:16,
      opacity: service.active ? 1 : 0.55,
    }}>
      {/* Ícone */}
      <div style={{
        width:44, height:44, borderRadius:12, flexShrink:0,
        background: isPackage ? `${t.accent}18` : `#8b5cf618`,
        display:"flex", alignItems:"center", justifyContent:"center",
        fontSize:20,
      }}>
        {isPackage ? "📦" : "💳"}
      </div>

      {/* Info */}
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:3 }}>
          <span style={{ fontSize:15, fontWeight:700, color:t.textPrimary, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
            {service.name}
          </span>
          {!service.active && (
            <span style={{ fontSize:10, fontWeight:700, padding:"2px 7px", borderRadius:99,
              background:t.bgInset, color:t.textDisabled, border:`1px solid ${t.border}`, flexShrink:0 }}>
              INATIVO
            </span>
          )}
          {service.specialty && (
            <span style={{ fontSize:10, fontWeight:700, padding:"2px 7px", borderRadius:99,
              background:`${t.accent}18`, color:t.accent, border:`1px solid ${t.accent}33`, flexShrink:0 }}>
              {service.specialty}
            </span>
          )}
        </div>
        <div style={{ display:"flex", gap:16, flexWrap:"wrap" }}>
          {service.price != null && (
            <span style={{ fontSize:14, fontWeight:800, color:t.accent }}>
              {formatCurrency(service.price)}
              {isPackage && <span style={{ fontSize:11, fontWeight:500, color:t.textGhost }}> / pacote</span>}
            </span>
          )}
          {isPackage && (
            <span style={{ fontSize:13, color:t.textGhost }}>
              {service.sessions_in_package} sessões
              {service.price && ` · ${formatCurrency(service.price / service.sessions_in_package)}/sessão`}
            </span>
          )}
          {service.description && (
            <span style={{ fontSize:12, color:t.textGhost, width:"100%", marginTop:2 }}>
              {service.description}
            </span>
          )}
        </div>
      </div>

      {/* Ações */}
      <div style={{ display:"flex", gap:6, flexShrink:0 }}>
        <button onClick={() => onEdit(service)} style={{
          background:"transparent", border:`1px solid ${t.border}`,
          color:t.textFaint, borderRadius:8, padding:"7px 12px",
          fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"inherit",
        }}>
          Editar
        </button>
        <button onClick={() => onDelete(service.id)} style={{
          background:"transparent", border:`1px solid ${t.border}`,
          color:t.textFaint, borderRadius:8, padding:"7px 10px",
          fontSize:12, cursor:"pointer",
        }}>
          ✕
        </button>
      </div>
    </div>
  )
}

// ─── ServiceTypes (página) ────────────────────────────────────────────────────

export default function ServiceTypes() {
  const { t }             = useTheme()
  const { clinicId, clinic } = useAuth()

  const [services, setServices] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [modal,    setModal]    = useState(null)   // null | "new" | service (object)
  const [toast,    setToast]    = useState(null)
  const [filter,   setFilter]   = useState("all")  // "all" | "active" | "package" | "single"

  useEffect(() => {
    if (clinicId) load()
  }, [clinicId])

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from("product_types")
      .select("*")
      .eq("clinic_id", clinicId)
      .is("deleted_at", null)
      .order("name")
    setServices(data ?? [])
    setLoading(false)
  }

  function showToast(message, type = "success") {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  async function handleDelete(id) {
    if (!window.confirm("Remover este tipo de serviço?")) return
    await supabase.from("product_types")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id)
    setServices(prev => prev.filter(s => s.id !== id))
    showToast("Serviço removido")
  }

  function handleSaved() {
    setModal(null)
    load()
    showToast(modal === "new" ? "Serviço criado!" : "Serviço atualizado!")
  }

  const filtered = services.filter(s => {
    if (filter === "active")  return s.active
    if (filter === "package") return s.sessions_in_package > 1
    if (filter === "single")  return !s.sessions_in_package || s.sessions_in_package <= 1
    return true
  })

  return (
    <AppLayout>
      <Toast toast={toast} />

      {modal && (
        <ServiceModal
          service={modal === "new" ? null : modal}
          onClose={() => setModal(null)}
          onSave={handleSaved}
          clinicId={clinicId}
          specialties={clinic?.specialties ?? []}
        />
      )}

      <div style={{ maxWidth:800, margin:"0 auto" }}>
        {/* Header */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:24, gap:12, flexWrap:"wrap" }}>
          <div>
            <h1 style={{ fontSize:24, fontWeight:800, color:t.textPrimary, margin:0 }}>
              Tipos de Serviço
            </h1>
            <p style={{ fontSize:13, color:t.textFaint, margin:"4px 0 0" }}>
              Cadastre consultas, sessões e pacotes para usar no agendamento
            </p>
          </div>
          <Button onClick={() => setModal("new")}>+ Novo serviço</Button>
        </div>

        {/* Filtros */}
        <div style={{ display:"flex", gap:8, marginBottom:16, flexWrap:"wrap" }}>
          {[
            ["all",     "Todos",    services.length],
            ["active",  "Ativos",   services.filter(s=>s.active).length],
            ["package", "Pacotes",  services.filter(s=>s.sessions_in_package>1).length],
            ["single",  "Avulsos",  services.filter(s=>!s.sessions_in_package||s.sessions_in_package<=1).length],
          ].map(([key, label, count]) => (
            <button key={key} onClick={() => setFilter(key)} style={{
              padding:"6px 14px", borderRadius:8, fontSize:13, fontWeight:600,
              cursor:"pointer", fontFamily:"inherit", transition:"all .15s",
              background: filter===key ? t.bgCard : "transparent",
              border: `1px solid ${filter===key ? t.accent : t.border}`,
              color: filter===key ? t.accent : t.textFaint,
            }}>
              {label} <span style={{ opacity:.6 }}>{count}</span>
            </button>
          ))}
        </div>

        {/* Lista */}
        {loading ? (
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {[1,2,3].map(i => <div key={i} className="skeleton-shimmer" style={{ height:80, borderRadius:12 }} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{
            background:t.bgCard, border:`1px solid ${t.border}`, borderRadius:12,
            padding:"48px 24px", textAlign:"center", display:"flex", flexDirection:"column", alignItems:"center", gap:10,
          }}>
            <span style={{ fontSize:40 }}>💼</span>
            <p style={{ fontSize:15, fontWeight:700, color:t.textGhost, margin:0 }}>
              {filter === "all" ? "Nenhum serviço cadastrado" : "Nenhum resultado"}
            </p>
            {filter === "all" && (
              <p style={{ fontSize:13, color:t.textDisabled, margin:0 }}>
                Crie tipos de serviço para usar no modal de agendamento e lançamento financeiro.
              </p>
            )}
            {filter === "all" && (
              <Button onClick={() => setModal("new")} style={{ marginTop:8 }}>+ Criar primeiro serviço</Button>
            )}
          </div>
        ) : (
          <MotionList style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {filtered.map(s => (
              <MotionItem key={s.id}>
                <ServiceCard
                  service={s}
                  onEdit={svc => setModal(svc)}
                  onDelete={handleDelete}
                  t={t}
                />
              </MotionItem>
            ))}
          </MotionList>
        )}

        {/* Info sobre pacotes */}
        {services.some(s => s.sessions_in_package > 1) && (
          <div style={{
            marginTop:24, background:`${t.accent}08`, border:`1px solid ${t.accent}22`,
            borderRadius:12, padding:"14px 18px", display:"flex", gap:12, alignItems:"flex-start",
          }}>
            <span style={{ fontSize:18, flexShrink:0 }}>ℹ️</span>
            <div>
              <p style={{ fontSize:13, fontWeight:600, color:t.textBody, margin:"0 0 4px" }}>
                Como funcionam os pacotes?
              </p>
              <p style={{ fontSize:12, color:t.textGhost, margin:0, lineHeight:1.6 }}>
                Ao agendar com um serviço de pacote, um lançamento financeiro único é criado com o valor total.
                As sessões do pacote vão sendo realizadas ao longo do tempo — o controle de saldo de sessões
                é feito pela clínica. Futuras versões incluirão controle automático de saldo por paciente.
              </p>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
