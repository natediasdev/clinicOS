/**
 * WhatsAppCard.jsx
 * Card de gerenciamento da instância WhatsApp para usar dentro do ClinicProfile.
 *
 * Props:
 *   isAdmin — boolean (default false). Apenas admins veem o card completo.
 */

import { useEffect, useState, useCallback } from "react"
import { useTheme } from "../context/ThemeContext"
import { useAuth } from "../context/AuthContext"
import { supabase } from "../supabaseClient"

function QRCodeDisplay({ code, t }) {
  if (!code) return null
  const isBase64 = code.startsWith("data:image")
  const qrUrl = isBase64
    ? code
    : `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(code)}`

  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", gap: 12,
      padding: "20px", background: t.bgInset, borderRadius: 12,
      border: `1px solid ${t.border}`,
    }}>
      <p style={{ fontSize: 13, color: t.textBody, margin: 0, textAlign: "center" }}>
        Abra o WhatsApp no celular →{" "}
        <strong>Dispositivos conectados</strong> →{" "}
        <strong>Conectar dispositivo</strong>
      </p>
      <div style={{
        background: "#fff", padding: 12, borderRadius: 10,
        boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
      }}>
        <img src={qrUrl} alt="QR Code WhatsApp" width={200} height={200}
          style={{ display: "block" }} />
      </div>
      <p style={{ fontSize: 11, color: t.textGhost, margin: 0 }}>
        O QR Code expira em ~60 segundos. Se expirar, clique em "Gerar novo QR".
      </p>
    </div>
  )
}

function StatusDot({ state }) {
  const colors = {
    open:        "#22c55e",
    connecting:  "#f59e0b",
    close:       "#ef4444",
    not_created: "#64748b",
    loading:     "#3b82f6",
  }
  const color = colors[state] ?? "#64748b"
  const pulse = state === "open" || state === "connecting"

  return (
    <span style={{ position: "relative", display: "inline-flex", width: 10, height: 10, flexShrink: 0 }}>
      {pulse && (
        <span style={{
          position: "absolute", inset: 0, borderRadius: "50%",
          background: color, opacity: 0.4,
          animation: "ping 1.4s cubic-bezier(0,0,.2,1) infinite",
        }} />
      )}
      <span style={{ width: 10, height: 10, borderRadius: "50%", background: color, display: "block" }} />
      <style>{`@keyframes ping{75%,100%{transform:scale(1.8);opacity:0}}`}</style>
    </span>
  )
}

const STATE_LABELS = {
  open:        "Conectado",
  connecting:  "Aguardando QR Code",
  close:       "Desconectado",
  not_created: "Não configurado",
  loading:     "Verificando...",
}
const STATE_COLORS = {
  open:        "#22c55e",
  connecting:  "#f59e0b",
  close:       "#ef4444",
  not_created: "#64748b",
  loading:     "#3b82f6",
}

export default function WhatsAppCard({ isAdmin = false }) {
  const { t }                               = useTheme()
  const { clinicId, clinic, refreshClinic } = useAuth()

  const [state,        setState]        = useState("loading")
  const [qrCode,       setQrCode]       = useState(null)
  const [showQr,       setShowQr]       = useState(false)
  const [loadingAct,   setLoadingAct]   = useState(null)
  const [error,        setError]        = useState(null)
  const [buttonsOn,    setButtonsOn]    = useState(clinic?.whatsapp_buttons_enabled ?? false)
  const [savingToggle, setSavingToggle] = useState(false)

  // ── callInstance — action corretamente passada no body ──────────────────────
  const callInstance = useCallback(async (action, extra = {}) => {
    const { data: sessionData } = await supabase.auth.getSession()
    const token = sessionData?.session?.access_token ?? ""

    const { data, error } = await supabase.functions.invoke("whatsapp-instance", {
      body: { action, clinic_id: clinicId, ...extra },
      headers: { Authorization: `Bearer ${token}` },
    })
    if (error) throw error
    return data
  }, [clinicId])

  // ── checkStatus ─────────────────────────────────────────────────────────────
  const checkStatus = useCallback(async () => {
    setState("loading")
    setError(null)
    try {
      const data = await callInstance("status")
      const newState = data.state ?? "close"
      setState(newState)
      if (newState === "open") { setShowQr(false); setQrCode(null) }
    } catch {
      setError("Não foi possível verificar o status.")
      setState("close")
    }
  }, [callInstance])

  useEffect(() => {
    if (clinicId) checkStatus()
  }, [clinicId])

  // Polling a cada 4s enquanto conectando (aguardando escaneamento do QR)
  useEffect(() => {
    if (state !== "connecting") return
    const interval = setInterval(checkStatus, 4000)
    return () => clearInterval(interval)
  }, [state, checkStatus])

  // ── handleCreate — após criar, busca QR automaticamente ─────────────────────
  async function handleCreate() {
    setLoadingAct("create"); setError(null)
    try {
      const data = await callInstance("create")
      await refreshClinic()
      if (data.exists) {
        setState(data.state ?? "close")
      } else {
        // Instância criada — busca QR imediatamente
        setState("connecting")
        await handleQrCode()
      }
    } catch {
      setError("Erro ao criar instância.")
    } finally {
      setLoadingAct(null)
    }
  }

  // ── handleQrCode ─────────────────────────────────────────────────────────────
  async function handleQrCode() {
    setLoadingAct("qrcode"); setError(null)
    try {
      const data = await callInstance("qrcode")
      if (data?.qrcode) {
        setQrCode(data.qrcode)
        setShowQr(true)
        setState("connecting")
      } else {
        setError("Não foi possível gerar o QR Code. Tente novamente.")
      }
    } catch {
      setError("Erro ao gerar QR Code.")
    } finally {
      setLoadingAct(null)
    }
  }

  // ── handleLogout ─────────────────────────────────────────────────────────────
  async function handleLogout() {
    if (!window.confirm("Desconectar o WhatsApp desta instância?")) return
    setLoadingAct("logout"); setError(null)
    try {
      await callInstance("logout")
      setShowQr(false); setQrCode(null)
      setState("close")
    } catch {
      setError("Erro ao desconectar.")
    } finally {
      setLoadingAct(null)
    }
  }

  // ── handleToggleButtons ──────────────────────────────────────────────────────
  async function handleToggleButtons(val) {
    setButtonsOn(val); setSavingToggle(true)
    await supabase.from("clinics")
      .update({ whatsapp_buttons_enabled: val })
      .eq("id", clinicId)
    setSavingToggle(false)
  }

  // Não exibe nada para staff
  if (!isAdmin) return null

  const isOpen       = state === "open"
  const isConnecting = state === "connecting"
  const isNotCreated = state === "not_created"
  const stateColor   = STATE_COLORS[state] ?? "#64748b"

  return (
    <div style={{
      background: t.bgCard, border: `1px solid ${t.border}`,
      borderRadius: 14, padding: 24, display: "flex", flexDirection: "column", gap: 20,
    }}>

      {/* ── Header ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10, flexShrink: 0,
            background: "#25d36618", display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#25d366">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
          </div>
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: t.textPrimary, margin: 0 }}>
              WhatsApp
            </h3>
            <p style={{ fontSize: 12, color: t.textFaint, margin: 0 }}>Evolution API</p>
          </div>
        </div>

        <div style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: "5px 12px", borderRadius: 99,
          background: `${stateColor}14`, border: `1px solid ${stateColor}33`,
        }}>
          <StatusDot state={state} />
          <span style={{ fontSize: 12, fontWeight: 700, color: stateColor }}>
            {STATE_LABELS[state] ?? state}
          </span>
        </div>
      </div>

      {/* ── Banner: aguardando escaneamento do QR ── */}
      {isConnecting && !showQr && (
        <div style={{
          background: "#f59e0b10", border: "1px solid #f59e0b33",
          borderRadius: 10, padding: "14px 16px",
          display: "flex", gap: 12, alignItems: "flex-start",
        }}>
          <span style={{ fontSize: 20, flexShrink: 0 }}>📱</span>
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: "#f59e0b", margin: "0 0 4px" }}>
              Instância criada — aguardando conexão
            </p>
            <p style={{ fontSize: 12, color: t.textGhost, margin: 0, lineHeight: 1.5 }}>
              Clique em <strong style={{ color: t.textBody }}>"Conectar via QR Code"</strong> para
              gerar o código e escanear com o WhatsApp do celular da clínica.
            </p>
          </div>
        </div>
      )}

      {/* ── Banner: conectando com QR visível ── */}
      {isConnecting && showQr && (
        <div style={{
          background: "#f59e0b10", border: "1px solid #f59e0b33",
          borderRadius: 8, padding: "10px 14px",
          display: "flex", gap: 8, alignItems: "center",
        }}>
          <span style={{ fontSize: 14 }}>⏳</span>
          <p style={{ fontSize: 12, color: "#f59e0b", margin: 0, fontWeight: 600 }}>
            Aguardando escaneamento... O status atualiza automaticamente.
          </p>
        </div>
      )}

      {/* ── Erro ── */}
      {error && (
        <div style={{
          background: t.errorBg, border: `1px solid ${t.errorBorder}`,
          color: t.errorText, borderRadius: 8, padding: "10px 14px", fontSize: 13,
        }}>
          {error}
        </div>
      )}

      {/* ── QR Code ── */}
      {showQr && qrCode && <QRCodeDisplay code={qrCode} t={t} />}

      {/* ── Ações ── */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {isNotCreated && (
          <ActionButton onClick={handleCreate} loading={loadingAct === "create"} color={t.accent} t={t}>
            Configurar WhatsApp
          </ActionButton>
        )}

        {!isNotCreated && !isOpen && (
          <ActionButton onClick={handleQrCode} loading={loadingAct === "qrcode"} color={t.accent} t={t}>
            {showQr ? "Gerar novo QR" : "Conectar via QR Code"}
          </ActionButton>
        )}

        {!isNotCreated && (
          <ActionButton onClick={checkStatus} loading={state === "loading"} color={t.accent} t={t} variant="secondary">
            Atualizar status
          </ActionButton>
        )}

        {isOpen && (
          <ActionButton onClick={handleLogout} loading={loadingAct === "logout"} color="#ef4444" t={t} variant="secondary">
            Desconectar
          </ActionButton>
        )}
      </div>

      {/* ── Toggle confirmação com botões ── */}
      {!isNotCreated && (
        <div style={{ borderTop: `1px solid ${t.border}`, paddingTop: 16 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: t.textBody, margin: "0 0 2px" }}>
                Confirmação interativa com botões
              </p>
              <p style={{ fontSize: 12, color: t.textGhost, margin: 0 }}>
                Paciente recebe botões "Confirmar" e "Cancelar" no lembrete 24h.
                Recomendado para clínicas com pacientes jovens.
              </p>
            </div>
            <button
              onClick={() => !savingToggle && handleToggleButtons(!buttonsOn)}
              style={{
                width: 44, height: 24, borderRadius: 99, flexShrink: 0,
                background: buttonsOn ? "#25d366" : t.bgInset,
                border: `1px solid ${buttonsOn ? "#25d366" : t.border}`,
                cursor: savingToggle ? "wait" : "pointer",
                position: "relative", transition: "background .2s, border .2s",
              }}
            >
              <span style={{
                position: "absolute", top: 3,
                left: buttonsOn ? 22 : 3,
                width: 16, height: 16, borderRadius: "50%",
                background: "#fff", transition: "left .2s",
                boxShadow: "0 1px 3px rgba(0,0,0,0.25)",
              }} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function ActionButton({ children, onClick, loading, color, t, variant = "primary" }) {
  const isPrimary = variant === "primary"
  return (
    <button onClick={onClick} disabled={loading} style={{
      padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600,
      cursor: loading ? "wait" : "pointer", fontFamily: "inherit",
      transition: "all .15s", opacity: loading ? 0.6 : 1,
      background: isPrimary ? color : "transparent",
      border: `1px solid ${color}`,
      color: isPrimary ? "#fff" : color,
    }}>
      {loading ? "..." : children}
    </button>
  )
}
