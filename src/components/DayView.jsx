/**
 * DayView.jsx
 * Agenda visual do dia — blocos por horário, status colorido, navegação por data.
 * Usado dentro da página Appointments como terceiro modo de visualização.
 *
 * Props:
 *   appointments  — array de agendamentos do dia selecionado
 *   patientMap    — { [client_id]: { name, phone } }
 *   staffMap      — { [staff_id]: { name } }
 *   onStatusChange(id, newStatus)
 *   onDelete(id)
 *   selectedDate  — Date object
 *   onDateChange(Date)
 *   isMobile
 */

import { useTheme } from "../context/ThemeContext"
import { getStatusConfig } from "../config/statusColors"

const HOUR_START = 7
const HOUR_END   = 20
const HOURS = Array.from({ length: HOUR_END - HOUR_START }, (_, i) => HOUR_START + i)

const DAYS_PT   = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"]
const MONTHS_PT = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"]

function formatHour(h) {
  return `${String(h).padStart(2,"0")}:00`
}

function getHourFromDate(iso) {
  return new Date(iso).getHours()
}

function getMinuteFromDate(iso) {
  return new Date(iso).getMinutes()
}

function formatTime(iso) {
  if (!iso) return "--"
  return new Date(iso).toLocaleTimeString("pt-BR", { hour:"2-digit", minute:"2-digit" })
}

function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() &&
         a.getMonth()    === b.getMonth()    &&
         a.getDate()     === b.getDate()
}

// ─── WeekStrip — barra de dias da semana ──────────────────────────────────────
function WeekStrip({ selectedDate, onDateChange, appointments, t }) {
  const today = new Date()

  // Semana da data selecionada (seg → dom)
  const dow     = selectedDate.getDay()
  const monday  = new Date(selectedDate)
  monday.setDate(selectedDate.getDate() - (dow === 0 ? 6 : dow - 1))

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d
  })

  function apptCountForDay(d) {
    return appointments.filter(a => isSameDay(new Date(a.datetime), d)).length
  }

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 4,
      padding: "12px 0", overflowX: "auto",
    }}>
      {/* Seta anterior */}
      <button onClick={() => { const d = new Date(selectedDate); d.setDate(d.getDate()-7); onDateChange(d) }}
        style={{ background:"transparent", border:`1px solid ${t.border}`, color:t.textMuted, borderRadius:8,
                 width:32, height:32, cursor:"pointer", flexShrink:0, fontSize:16 }}>
        ‹
      </button>

      {days.map(d => {
        const isSelected = isSameDay(d, selectedDate)
        const isToday    = isSameDay(d, today)
        const count      = apptCountForDay(d)

        return (
          <button key={d.toISOString()} onClick={() => onDateChange(d)} style={{
            flex: 1, minWidth: 44, height: 64,
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3,
            background: isSelected ? t.accent : isToday ? `${t.accent}18` : "transparent",
            border: `1px solid ${isSelected ? t.accent : isToday ? `${t.accent}44` : t.border}`,
            borderRadius: 10, cursor: "pointer", transition: "all .15s",
          }}>
            <span style={{ fontSize: 10, fontWeight: 600, color: isSelected ? "#fff" : t.textFaint,
                           textTransform: "uppercase", letterSpacing: ".04em" }}>
              {DAYS_PT[d.getDay()]}
            </span>
            <span style={{ fontSize: 16, fontWeight: 800,
                           color: isSelected ? "#fff" : isToday ? t.accent : t.textPrimary }}>
              {d.getDate()}
            </span>
            {count > 0 && (
              <span style={{
                width: 18, height: 14, borderRadius: 99,
                background: isSelected ? "rgba(255,255,255,0.3)" : `${t.accent}30`,
                color: isSelected ? "#fff" : t.accent,
                fontSize: 9, fontWeight: 700,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {count}
              </span>
            )}
          </button>
        )
      })}

      {/* Seta próxima */}
      <button onClick={() => { const d = new Date(selectedDate); d.setDate(d.getDate()+7); onDateChange(d) }}
        style={{ background:"transparent", border:`1px solid ${t.border}`, color:t.textMuted, borderRadius:8,
                 width:32, height:32, cursor:"pointer", flexShrink:0, fontSize:16 }}>
        ›
      </button>
    </div>
  )
}

// ─── AppointmentBlock — bloco de agendamento na grade ─────────────────────────
function AppointmentBlock({ appt, patientMap, staffMap, onStatusChange, onDelete, t }) {
  const cfg     = getStatusConfig(appt.status)
  const patient = patientMap[appt.client_id]
  const staff   = staffMap?.[appt.staff_id]

  return (
    <div style={{
      background: `${cfg.color}12`,
      border: `1px solid ${cfg.color}44`,
      borderLeft: `3px solid ${cfg.color}`,
      borderRadius: "0 8px 8px 0",
      padding: "8px 10px",
      display: "flex", flexDirection: "column", gap: 4,
      minHeight: 52,
    }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:6 }}>
        <div style={{ flex:1, minWidth:0 }}>
          <span style={{ fontSize:13, fontWeight:700, color:t.textPrimary,
                         display:"block", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
            {patient?.name ?? "Paciente não encontrado"}
          </span>
          {patient?.phone && (
            <span style={{ fontSize:11, color:t.textFaint }}>{patient.phone}</span>
          )}
          {staff && (
            <span style={{ fontSize:11, color:t.textGhost, display:"block", marginTop:1 }}>
              👤 {staff.name}
            </span>
          )}
        </div>

        <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:4, flexShrink:0 }}>
          <span style={{
            fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 99,
            color: cfg.color, background: cfg.bg,
            border: `1px solid ${cfg.border}`,
            textTransform: "uppercase", letterSpacing: ".04em",
          }}>
            {cfg.label}
          </span>
          <div style={{ display:"flex", gap:4 }}>
            <select
              value={appt.status}
              onChange={e => onStatusChange(appt.id, e.target.value)}
              onClick={e => e.stopPropagation()}
              style={{
                background: t.bgInset, border:`1px solid ${t.border}`, borderRadius:5,
                padding:"2px 4px", fontSize:10, color:t.textMuted, cursor:"pointer", outline:"none",
              }}
            >
              {["scheduled","completed","cancelled","no_show"].map(s => {
                const c = getStatusConfig(s)
                return <option key={s} value={s}>{c.label}</option>
              })}
            </select>
            <button
              onClick={e => { e.stopPropagation(); onDelete(appt.id) }}
              style={{
                background:"transparent", border:`1px solid ${t.border}`, color:t.textFaint,
                borderRadius:5, padding:"2px 6px", fontSize:10, cursor:"pointer",
              }}
            >
              ✕
            </button>
          </div>
        </div>
      </div>
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
  selectedDate,
  onDateChange,
  isMobile,
}) {
  const { t } = useTheme()
  const today  = new Date()

  // Filtra só os agendamentos do dia selecionado
  const dayAppts = appointments.filter(a =>
    isSameDay(new Date(a.datetime), selectedDate)
  ).sort((a, b) => new Date(a.datetime) - new Date(b.datetime))

  // Contadores de status
  const counts = dayAppts.reduce((acc, a) => {
    acc[a.status] = (acc[a.status] || 0) + 1
    return acc
  }, {})

  const isToday = isSameDay(selectedDate, today)

  return (
    <div style={{ fontFamily:"'DM Sans','Segoe UI',sans-serif" }}>

      {/* ── Cabeçalho da data ── */}
      <div style={{
        background: t.bgCard, borderRadius: 12, padding: "16px 20px", marginBottom: 12,
      }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
          <div>
            <h2 style={{ fontSize:16, fontWeight:800, color:t.textPrimary, margin:0 }}>
              {isToday ? "Hoje" : DAYS_PT[selectedDate.getDay()]}{", "}
              {selectedDate.getDate()} de {["Janeiro","Fevereiro","Março","Abril","Maio","Junho",
                "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"][selectedDate.getMonth()]}
            </h2>
            <p style={{ fontSize:12, color:t.textFaint, margin:"2px 0 0" }}>
              {dayAppts.length === 0
                ? "Nenhum agendamento"
                : `${dayAppts.length} agendamento${dayAppts.length !== 1 ? "s" : ""}`}
            </p>
          </div>

          {/* Status pills */}
          <div style={{ display:"flex", gap:6, flexWrap:"wrap", justifyContent:"flex-end" }}>
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

        {/* WeekStrip */}
        <WeekStrip
          selectedDate={selectedDate}
          onDateChange={onDateChange}
          appointments={appointments}
          t={t}
        />
      </div>

      {/* ── Grade de horários ── */}
      <div style={{ background: t.bgCard, borderRadius: 12, overflow: "hidden" }}>
        {dayAppts.length === 0 && (
          <div style={{
            padding: "14px 20px", borderBottom: `1px solid ${t.bgInset}`,
            display: "flex", alignItems: "center", gap: 8,
            background: `${t.accent}08`,
          }}>
            <span style={{ fontSize:12, color:t.textFaint }}>
              Nenhum agendamento neste dia — clique em "+ Novo agendamento" para agendar
            </span>
          </div>
        )}
        {HOURS.map(hour => {
            const apptAtHour = dayAppts.filter(a => getHourFromDate(a.datetime) === hour)
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
                {/* Coluna de hora */}
                <div style={{
                  padding: "14px 8px 14px 16px",
                  borderRight: `1px solid ${t.bgInset}`,
                  display: "flex", alignItems: "flex-start",
                }}>
                  <span style={{
                    fontSize: 12, fontWeight: isCurrent ? 700 : 500,
                    color: isCurrent ? t.accent : isPast ? t.textDisabled : t.textGhost,
                  }}>
                    {formatHour(hour)}
                  </span>
                  {isCurrent && (
                    <span style={{
                      width: 6, height: 6, borderRadius: "50%",
                      background: t.accent, marginLeft: 4, marginTop: 4, flexShrink: 0,
                    }}/>
                  )}
                </div>

                {/* Coluna de agendamentos */}
                <div style={{
                  padding: hasAppt ? "8px 12px" : "0 12px",
                  display: "flex", flexDirection: "column", gap: 6,
                  opacity: isPast && !hasAppt ? 0.4 : 1,
                }}>
                  {apptAtHour.map(appt => (
                    <div key={appt.id}>
                      <span style={{ fontSize:11, color:t.textFaint, marginBottom:3, display:"block" }}>
                        {formatTime(appt.datetime)}
                        {getMinuteFromDate(appt.datetime) > 0 && ""}
                      </span>
                      <AppointmentBlock
                        appt={appt}
                        patientMap={patientMap}
                        staffMap={staffMap}
                        onStatusChange={onStatusChange}
                        onDelete={onDelete}
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
