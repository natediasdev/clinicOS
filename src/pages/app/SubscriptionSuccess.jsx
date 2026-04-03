import { useState, useEffect, useRef } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { supabase } from "../../supabaseClient"
import { useAuth } from "../../context/AuthContext"
import { useTheme } from "../../context/ThemeContext"
import { Button } from "../../components/ui"

const FEATURES_UNLOCKED = [
  { icon: "👥", text: "Equipe ilimitada"       },
  { icon: "📋", text: "Prontuário eletrônico"  },
  { icon: "💰", text: "Financeiro completo"    },
  { icon: "📊", text: "Dashboard avançado"     },
  { icon: "∞",  text: "Pacientes ilimitados"   },
  { icon: "🎧", text: "Suporte prioritário"    },
]

// Confete simples via CSS
function Confetti() {
  const pieces = Array.from({ length: 28 }, (_, i) => i)
  const colors = ["#3b82f6", "#8b5cf6", "#22c55e", "#f59e0b", "#ec4899", "#06b6d4"]
  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", overflow: "hidden", zIndex: 50 }}>
      <style>{`
        @keyframes confettiFall {
          0%   { transform: translateY(-20px) rotate(0deg);   opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
      {pieces.map(i => (
        <div key={i} style={{
          position: "absolute",
          left: `${Math.random() * 100}%`,
          top: -16,
          width: Math.random() > 0.5 ? 8 : 10,
          height: Math.random() > 0.5 ? 8 : 14,
          borderRadius: Math.random() > 0.5 ? "50%" : 2,
          background: colors[i % colors.length],
          animation: `confettiFall ${1.8 + Math.random() * 2}s ease-in ${Math.random() * 1.2}s forwards`,
          opacity: 0,
        }} />
      ))}
    </div>
  )
}

// Estados da tela
const STATE = { CHECKING: "checking", CONFIRMED: "confirmed", PENDING: "pending", ERROR: "error" }

export default function SubscriptionSuccess() {
  const { t }        = useTheme()
  const navigate     = useNavigate()
  const [params]     = useSearchParams()
  const { refreshClinic, clinicId } = useAuth()

  const [state,       setState]       = useState(STATE.CHECKING)
  const [countdown,   setCountdown]   = useState(5)
  const [pollCount,   setPollCount]   = useState(0)
  const pollRef   = useRef(null)
  const timerRef  = useRef(null)

  const MAX_POLLS = 10 // tenta por ~30s antes de desistir

  // Polling: verifica se o webhook já ativou o plano
  useEffect(() => {
    if (!clinicId) return

    async function checkStatus() {
      const { data: sub } = await supabase
        .from("subscriptions")
        .select("status")
        .eq("clinic_id", clinicId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()

      const { data: clinic } = await supabase
        .from("clinics")
        .select("plan")
        .eq("id", clinicId)
        .single()

      if (clinic?.plan === "pro" && sub?.status === "active") {
        clearInterval(pollRef.current)
        await refreshClinic()
        setState(STATE.CONFIRMED)
      } else {
        setPollCount(n => {
          if (n + 1 >= MAX_POLLS) {
            clearInterval(pollRef.current)
            // Webhook pode demorar — mostra estado "aguardando" em vez de erro
            setState(STATE.PENDING)
          }
          return n + 1
        })
      }
    }

    checkStatus()
    pollRef.current = setInterval(checkStatus, 3000)
    return () => clearInterval(pollRef.current)
  }, [clinicId])

  // Countdown para redirecionar após confirmação
  useEffect(() => {
    if (state !== STATE.CONFIRMED) return
    timerRef.current = setInterval(() => {
      setCountdown(n => {
        if (n <= 1) {
          clearInterval(timerRef.current)
          navigate("/dashboard")
          return 0
        }
        return n - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [state])

  return (
    <div style={{
      minHeight: "100vh", background: t.bgPage,
      fontFamily: "'DM Sans','Segoe UI',sans-serif",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 24,
    }}>
      {state === STATE.CONFIRMED && <Confetti />}

      <div style={{ width: "100%", maxWidth: 440 }}>
        <AnimatePresence mode="wait">

          {/* ── Verificando ── */}
          {state === STATE.CHECKING && (
            <motion.div key="checking" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
              <div style={{ width: 64, height: 64, border: `4px solid ${t.border}`, borderTopColor: t.accent, borderRadius: "50%", animation: "spin 0.9s linear infinite" }} />
              <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
              <div>
                <h2 style={{ fontSize: 22, fontWeight: 800, color: t.textPrimary, margin: "0 0 8px" }}>Confirmando pagamento...</h2>
                <p style={{ fontSize: 14, color: t.textGhost, margin: 0 }}>Aguardando confirmação do Mercado Pago.</p>
              </div>
              <div style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 10, padding: "12px 20px", fontSize: 13, color: t.textFaint }}>
                Tentativa {pollCount + 1} de {MAX_POLLS}...
              </div>
            </motion.div>
          )}

          {/* ── Confirmado ── */}
          {state === STATE.CONFIRMED && (
            <motion.div key="confirmed" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, ease: "easeOut" }}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0 }}>

              {/* Ícone de sucesso */}
              <motion.div
                initial={{ scale: 0, rotate: -30 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 20, delay: 0.1 }}
                style={{
                  width: 80, height: 80, borderRadius: "50%",
                  background: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 36, marginBottom: 24,
                  boxShadow: "0 0 40px #22c55e40",
                }}
              >
                ✓
              </motion.div>

              <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                style={{ fontSize: 28, fontWeight: 800, color: t.textPrimary, margin: "0 0 10px", letterSpacing: "-0.5px", textAlign: "center" }}>
                Bem-vindo ao Pro! 🎉
              </motion.h1>
              <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }}
                style={{ fontSize: 15, color: t.textFaint, margin: "0 0 32px", textAlign: "center", lineHeight: 1.6 }}>
                Sua assinatura foi ativada com sucesso.<br />Todos os recursos estão desbloqueados.
              </motion.p>

              {/* Grid de features desbloqueadas */}
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.38 }}
                style={{
                  background: t.bgCard, border: `1px solid ${t.border}`,
                  borderTop: "2px solid #22c55e",
                  borderRadius: 16, padding: "20px 24px", width: "100%", marginBottom: 24,
                }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: t.textGhost, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 16px" }}>
                  Recursos desbloqueados
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 8px" }}>
                  {FEATURES_UNLOCKED.map((f, i) => (
                    <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 + i * 0.05 }}
                      style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 14 }}>{f.icon}</span>
                      <span style={{ fontSize: 13, color: t.textSecondary }}>{f.text}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
                style={{ width: "100%", display: "flex", flexDirection: "column", gap: 12, alignItems: "center" }}>
                <Button onClick={() => navigate("/dashboard")} fullWidth>
                  Ir para o Dashboard →
                </Button>
                <p style={{ fontSize: 13, color: t.textDisabled, margin: 0 }}>
                  Redirecionando automaticamente em <strong style={{ color: t.textFaint }}>{countdown}s</strong>
                </p>
              </motion.div>
            </motion.div>
          )}

          {/* ── Aguardando webhook (pode demorar) ── */}
          {state === STATE.PENDING && (
            <motion.div key="pending" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>

              <div style={{
                width: 72, height: 72, borderRadius: "50%",
                background: "#f59e0b18", border: "1px solid #f59e0b44",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32,
              }}>⏳</div>

              <div style={{ textAlign: "center" }}>
                <h2 style={{ fontSize: 22, fontWeight: 800, color: t.textPrimary, margin: "0 0 10px" }}>Pagamento em processamento</h2>
                <p style={{ fontSize: 14, color: t.textGhost, margin: "0 0 8px", lineHeight: 1.6 }}>
                  O Mercado Pago está processando seu pagamento. Isso pode levar alguns minutos.
                </p>
                <p style={{ fontSize: 13, color: t.textFaint, margin: 0 }}>
                  Seu acesso Pro será ativado assim que o pagamento for confirmado.
                </p>
              </div>

              <div style={{
                background: t.bgCard, border: `1px solid ${t.border}`,
                borderRadius: 12, padding: "16px 20px", width: "100%",
                fontSize: 13, color: t.textGhost, lineHeight: 1.7,
              }}>
                📩 <strong style={{ color: t.textBody }}>Você receberá um e-mail</strong> quando a confirmação chegar.<br />
                Se já pagou, o acesso será liberado em instantes.
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%" }}>
                <Button onClick={() => { setState(STATE.CHECKING); setPollCount(0) }} variant="secondary" fullWidth>
                  Verificar novamente
                </Button>
                <Button onClick={() => navigate("/dashboard")} variant="ghost" fullWidth>
                  Ir para o Dashboard
                </Button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  )
}
