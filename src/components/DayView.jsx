/**
 * DayView.jsx
 * Agenda visual do dia — blocos por horário, status colorido, navegação por data.
 *
 * Props:
 *   appointments    — array de agendamentos
 *   patientMap      — { [client_id]: { name, phone } }
 *   staffMap        — { [staff_id]: { name } }
 *   onStatusChange(id, newStatus)
 *   onDelete(id)
 *   onEdit(appt)
 *   selectedDate    — Date object
 *   onDateChange(Date)
 *   isMobile
 *   isAdmin         — booleano: admin vê staff atribuído em destaque
 */

import { useState, useMemo } from "react"
import { useTheme } from "../context/ThemeContext"
import { getStatusConfig } from "../config/statusColors"

// ─── Constantes base — expandidas dinamicamente ───────────────────────────────
const DEFAULT_HOUR_START = 7
const DEFAULT_HOUR_END   = 20 // exclusive, ou seja exibe até 19:xx

const DAYS_PT   = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"]
const MONTHS_PT = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho",
                   "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"]

// Cores por especialidade — complementam a cor de status
const SPECIALTY_COLORS = {
  fisioterapia: { color: "#3b82f6", label: "Fisio"    },
  pilates:      { color: "#8b5cf6", label: "Pilates"  },
  odontologia:  { color: "#06b6d4", label: "Odonto"   },
  psicologia:   { color: "#ec4899", label: "Psico"    },
  nutricao:     { color: "#22c55e", label: "Nutri"    },
  estetica:     { color: "#f59e0b", label: "Estética" },
  geral:        { color: "#64748b", label: "Geral"    },
}

function getSpecialtyStyle(specialty) {
  if (!specialty) return null
  const key = specialty.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim()
  return SPECIALTY_COLORS[key] ?? { color: "#64748b", label: specialty }
}

// Todos os status possíveis para as pills
const STATUS_OPTIONS = ["scheduled", "completed", "cancelled", "no_show"]

function formatHour(h) { return `${String(h).padStart(2,"0")}:00` }
function formatTime(iso) {
  if (!iso) return "--"
  return new Date(iso).toLocaleTimeString("pt-BR", { hour:"2-digit", minute:"2-digit" })
}
function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() &&
         a.getMonth()    === b.getMonth()    &&
         a.getDate()     === b.getDate()
}

// ─── WeekStrip ────────────────────────────────────────────────────────────────
function WeekStrip({ selectedDate, onDateChange, appointments, t }) {
  const today  = new Date()
  const dow    = selectedDate.getDay()
  const monday = new Date(selectedDate)
  monday.setDate(selectedDate.getDate() - (dow === 0 ? 6 : dow - 1))

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d
  })

  return (
    <div style={{ display:"flex", alignItems:"center", gap:4, padding:"12px 0", overflowX:"auto" }}>
      <button
        onClick={() => { const d = new Date(selectedDate); d.setDate(d.getDate()-7); onDateChange(d) }}
        style={{ background:"transparent", border:`1px solid ${t.border}`, color:t.textMuted,
                 borderRadius:8, width:32, height:32, cursor:"pointer", flexShrink:0, fontSize:16 }}>
        ‹
      </button>

      {days.map(d => {
        const isSelected = isSameDay(d, selectedDate)
        const isToday    = isSameDay(d, today)
        const count      = appointments.filter(a => isSameDay(new Date(a.datetime), d)).length

        return (
          <button key={d.toISOString()} onClick={() => onDateChange(d)} style={{
            flex:1, minWidth:44, height:64,
            display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:3,
            background: isSelected ? t.accent : isToday ? `${t.accent}18` : "transparent",
            border: `1px solid ${isSelected ? t.accent : isToday ? `${t.accent}44` : t.border}`,
            borderRadius:10, cursor:"pointer", transition:"all .15s",
          }}>
            <span style={{ fontSize:10, fontWeight:600, textTransform:"uppercase", letterSpacing:".04em",
                           color: isSelected ? "#fff" : t.textFaint }}>
              {DAYS_PT[d.getDay()]}
            </span>
            <span style={{ fontSize:16, fontWeight:800,
                           color: isSelected ? "#fff" : isToday ? t.accent : t.textPrimary }}>
              {d.getDate()}
            </span>
            {count > 0 && (
              <span style={{
                width:18, height:14, borderRadius:99,
                background: isSelected ? "rgba(255,255,255,0.3)" : `${t.accent}30`,
                color: isSelected ? "#fff" : t.accent,
                fontSize:9, fontWeight:700,
                display:"flex", alignItems:"center", justifyContent:"center",
              }}>
                {count}
              </span>
            )}
          </button>
        )
      })}

      <button
        onClick={() => { const d = new Date(selectedDate); d.setDate(d.getDate()+7); onDateChange(d) }}
        style={{ background:"transparent", border:`1px solid ${t.border}`, color:t.textMuted,
                 borderRadius:8, width:32, height:32, cursor:"pointer", flexShrink:0, fontSize:16 }}>
        ›
      </button>
    </div>
  )
}

// ─── StatusPills — troca de status com pills clicáveis ────────────────────────
function StatusPills({ currentStatus, apptId, onStatusChange, changing, t }) {
  return (
    <div style={{ display:"flex", gap:5, flexWrap:"wrap", marginTop:10 }}>
      {STATUS_OPTIONS.map(s => {
        const cfg       = getStatusConfig(s)
        const isActive  = s === currentStatus
        const isLoading = changing === apptId && !isActive

        return (
          <button
            key={s}
            disabled={isActive || isLoading}
            onClick={e => { e.stopPropagation(); onStatusChange(apptId, s) }}
            style={{
              padding: "5px 12px",
              borderRadius: 99,
              fontSize: 12,
              fontWeight: 700,
              cursor: isActive ? "default" : "pointer",
              fontFamily: "inherit",
              transition: "all .15s",
              border: `1px solid ${isActive ? cfg.color : t.border}`,
              background: isActive ? cfg.bg : "transparent",
              color: isActive ? cfg.color : t.textFaint,
              opacity: isLoading ? 0.4 : 1,
              transform: isActive ? "scale(1.04)" : "scale(1)",
            }}
          >
            {cfg.label}
          </button>
        )
      })}
    </div>
  )
}

// ─── AppointmentBlock ─────────────────────────────────────────────────────────
function AppointmentBlock({ appt, patientMap, staffMap, onStatusChange, onDelete, onEdit, isAdmin, changingStatus, t }) {
  const cfg       = getStatusConfig(appt.status)
  const patient   = patientMap[appt.client_id]
  const staff     = staffMap?.[appt.staff_id]
  const spStyle   = getSpecialtyStyle(appt.specialty)

  return (
    <div style={{
      background: `${cfg.color}10`,
      border: `1px solid ${cfg.color}40`,
      borderLeft: `4px solid ${cfg.color}`,
      borderRadius: "0 10px 10px 0",
      padding: "12px 14px",
      display: "flex", flexDirection: "column", gap: 0,
    }}>
      {/* Linha 1 — paciente + badge especialidade + botão excluir */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:8 }}>
        <div style={{ flex:1, minWidth:0 }}>
          <span style={{ fontSize:14, fontWeight:700, color:t.textPrimary,
                         display:"block", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
            {patient?.name ?? "Paciente não encontrado"}
          </span>
          {patient?.phone && (
            <span style={{ fontSize:11, color:t.textFaint, display:"block", marginTop:1 }}>
              {patient.phone}
            </span>
          )}
        </div>

        <div style={{ display:"flex", alignItems:"center", gap:6, flexShrink:0 }}>
          {/* Badge especialidade */}
          {spStyle && (
            <span style={{
              fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:99,
              color: spStyle.color,
              background: `${spStyle.color}18`,
              border: `1px solid ${spStyle.color}33`,
              letterSpacing: ".04em",
            }}>
              {spStyle.label}
            </span>
          )}

          {/* Botão editar */}
          <button
            onClick={e => { e.stopPropagation(); onEdit?.(appt) }}
            style={{
              background:"transparent", border:`1px solid ${t.border}`,
              color: t.textFaint, borderRadius:6,
              width:24, height:24, fontSize:12,
              cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center",
              flexShrink:0,
            }}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>

          {/* Botão excluir */}
          <button
            onClick={e => { e.stopPropagation(); onDelete(appt.id) }}
            style={{
              background:"transparent", border:`1px solid ${t.border}`,
              color: t.textFaint, borderRadius:6,
              width:24, height:24, fontSize:12,
              cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center",
              flexShrink:0,
            }}
          >
            ✕
          </button>
        </div>
      </div>

      {/* Linha 2 — staff (só para admin) */}
      {isAdmin && staff && (
        <div style={{
          display:"flex", alignItems:"center", gap:7, marginTop:8,
          paddingTop:8, borderTop:`1px solid ${cfg.color}20`,
        }}>
          <div style={{
            width:22, height:22, borderRadius:"50%", flexShrink:0,
            background: `${t.accent}22`,
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:11, fontWeight:800, color:t.accent,
          }}>
            {staff.name?.[0]?.toUpperCase() ?? "?"}
          </div>
          <span style={{ fontSize:12, fontWeight:600, color:t.textBody }}>
            {staff.name}
          </span>
        </div>
      )}

      {/* Linha 3 — pills de status */}
      <StatusPills
        currentStatus={appt.status}
        apptId={appt.id}
        onStatusChange={onStatusChange}
        changing={changingStatus}
        t={t}
      />
    </div>
  )
}

// ─── DayView principal ────────────────────────────────────────────────────────
export default function DayView({
  appointments,
  patientMap,
  staffMap,
  onStatusChange,
  onDelete,
  onEdit,
  selectedDate,
  onDateChange,
  isMobile,
  isAdmin = true,
}) {
  const { t }  = useTheme()
  const today  = new Date()

  // Estado local de "mudando status" para feedback visual nas pills
  const [changingStatus, setChangingStatus] = useState(null)

  async function handleStatusChange(id, newStatus) {
    setChangingStatus(id)
    await onStatusChange(id, newStatus)
    setChangingStatus(null)
  }

  const dayAppts = appointments
    .filter(a => isSameDay(new Date(a.datetime), selectedDate))
    .sort((a, b) => new Date(a.datetime) - new Date(b.datetime))

  // ── Calcula intervalo de horas dinamicamente ──────────────────────────────
  // Sempre parte do DEFAULT_HOUR_START (7h) e expande conforme agendamentos.
  // Se houver agendamento fora do range padrão, inclui 1h de padding antes/depois.
  const { hourStart, hourEnd, hours } = useMemo(() => {
    if (dayAppts.length === 0) {
      const s = DEFAULT_HOUR_START
      const e = DEFAULT_HOUR_END
      return { hourStart: s, hourEnd: e, hours: Array.from({ length: e - s }, (_, i) => s + i) }
    }

    const apptHours = dayAppts.map(a => new Date(a.datetime).getHours())
    const minHour   = Math.min(...apptHours)
    const maxHour   = Math.max(...apptHours)

    // Padding de 1h antes e depois dos agendamentos, dentro dos limites sãos (0–23)
    const s = Math.max(0,  Math.min(minHour - 1, DEFAULT_HOUR_START))
    const e = Math.min(24, Math.max(maxHour + 2, DEFAULT_HOUR_END))  // +2 para exibir a hora cheia após o último

    return { hourStart: s, hourEnd: e, hours: Array.from({ length: e - s }, (_, i) => s + i) }
  }, [dayAppts])

  const counts = dayAppts.reduce((acc, a) => {
    acc[a.status] = (acc[a.status] || 0) + 1
    return acc
  }, {})

  const isToday = isSameDay(selectedDate, today)

  // Badge de expansão — só mostra se o range foi expandido além do padrão
  const isExpanded = hourStart < DEFAULT_HOUR_START || hourEnd > DEFAULT_HOUR_END

  return (
    <div style={{ fontFamily:"'DM Sans','Segoe UI',sans-serif" }}>

      {/* ── Cabeçalho + WeekStrip ── */}
      <div style={{ background:t.bgCard, borderRadius:12, padding:"16px 20px", marginBottom:12 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12, gap:12, flexWrap:"wrap" }}>
          <div>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <h2 style={{ fontSize:16, fontWeight:800, color:t.textPrimary, margin:0 }}>
                {isToday ? "Hoje" : DAYS_PT[selectedDate.getDay()]}{", "}
                {selectedDate.getDate()} de {MONTHS_PT[selectedDate.getMonth()]}
              </h2>
              {/* Badge sutil indicando range expandido */}
              {isExpanded && (
                <span style={{
                  fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:99,
                  background:`${t.accent}18`, color:t.accent, border:`1px solid ${t.accent}33`,
                }}>
                  {formatHour(hourStart)}–{formatHour(hourEnd - 1)}
                </span>
              )}
            </div>
            <p style={{ fontSize:12, color:t.textFaint, margin:"2px 0 0" }}>
              {dayAppts.length === 0
                ? "Nenhum agendamento"
                : `${dayAppts.length} agendamento${dayAppts.length !== 1 ? "s" : ""}`}
            </p>
          </div>

          {/* Contadores de status do dia */}
          <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
            {Object.entries(counts).map(([status, count]) => {
              const cfg = getStatusConfig(status)
              return (
                <span key={status} style={{
                  fontSize:11, fontWeight:700, padding:"3px 10px", borderRadius:99,
                  color:cfg.color, background:cfg.bg, border:`1px solid ${cfg.border}`,
                }}>
                  {cfg.label} {count}
                </span>
              )
            })}
          </div>
        </div>

        <WeekStrip
          selectedDate={selectedDate}
          onDateChange={onDateChange}
          appointments={appointments}
          t={t}
        />
      </div>

      {/* ── Grade de horários ── */}
      <div style={{ background:t.bgCard, borderRadius:12, overflow:"hidden" }}>
        {dayAppts.length === 0 && (
          <div style={{
            padding:"12px 20px", borderBottom:`1px solid ${t.bgInset}`,
            background:`${t.accent}08`,
          }}>
            <span style={{ fontSize:12, color:t.textFaint }}>
              Nenhum agendamento — clique em "+ Novo agendamento" para agendar
            </span>
          </div>
        )}

        {hours.map(hour => {
          const apptAtHour = dayAppts.filter(a => new Date(a.datetime).getHours() === hour)
          const hasAppt    = apptAtHour.length > 0
          const isPast     = isToday && hour < new Date().getHours()
          const isCurrent  = isToday && hour === new Date().getHours()

          return (
            <div key={hour} style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "48px 1fr" : "64px 1fr",
              borderBottom: `1px solid ${t.bgInset}`,
              minHeight: hasAppt ? "auto" : 52,
              background: isCurrent ? `${t.accent}06` : "transparent",
            }}>
              {/* Hora */}
              <div style={{
                padding: "14px 8px 14px 16px",
                borderRight: `1px solid ${t.bgInset}`,
                display:"flex", alignItems:"flex-start",
              }}>
                <span style={{
                  fontSize:12, fontWeight: isCurrent ? 700 : 500,
                  color: isCurrent ? t.accent : isPast ? t.textDisabled : t.textGhost,
                }}>
                  {formatHour(hour)}
                </span>
                {isCurrent && (
                  <span style={{ width:6, height:6, borderRadius:"50%", background:t.accent, marginLeft:4, marginTop:4, flexShrink:0 }}/>
                )}
              </div>

              {/* Agendamentos */}
              <div style={{
                padding: hasAppt ? "8px 12px" : "0 12px",
                display:"flex", flexDirection:"column", gap:8,
                opacity: isPast && !hasAppt ? 0.35 : 1,
              }}>
                {apptAtHour.map(appt => (
                  <div key={appt.id}>
                    <span style={{ fontSize:11, color:t.textFaint, marginBottom:4, display:"block", fontWeight:600 }}>
                      {formatTime(appt.datetime)}
                    </span>
                    <AppointmentBlock
                      appt={appt}
                      patientMap={patientMap}
                      staffMap={staffMap}
                      onStatusChange={handleStatusChange}
                      onDelete={onDelete}
                      onEdit={onEdit}
                      isAdmin={isAdmin}
                      changingStatus={changingStatus}
                      t={t}
                    />
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
