import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { motion } from "framer-motion"
import { supabase } from "../../supabaseClient"
import { useAuth } from "../../context/AuthContext"
import { useTheme } from "../../context/ThemeContext"
import { PLAN_PRICES } from "../../hooks/usePlanLimits"
import { Button } from "../../components/ui"
import { MotionToast } from "../../components/ui/MotionComponents"

const BILLING_CYCLES = [
  { id: "monthly", label: "Mensal", discount: 0 },
  { id: "quarterly", label: "Trimestral", discount: 10 },
  { id: "semiannual", label: "Semestral", discount: 15 },
]

const FEATURES = [
  { icon: "👥", text: "Pacientes ilimitados" },
  { icon: "👨‍⚕️", text: "Equipe completa" },
  { icon: "📋", text: "Prontuário eletrônico" },
  { icon: "💰", text: "Financeiro completo" },
  { icon: "📊", text: "Dashboard avançado" },
  { icon: "🎧", text: "Suporte prioritário" },
]

export default function Subscription() {
  const { t } = useTheme()
  const navigate = useNavigate()
  const { clinic, refreshClinic } = useAuth()
  const [selectedCycle, setSelectedCycle] = useState("monthly")
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState(null)
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)

  function showToast(msg, type = "success") {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 4000)
  }

  async function handleSubscribe() {
    if (!clinic?.id) {
      showToast("Clínica não encontrada", "error")
      return
    }

    setLoading(true)

    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: {
          clinic_id: clinic.id,
          billing_cycle: selectedCycle,
        },
      })

      if (error) throw error

      if (data?.initPoint) {
        window.location.href = data.initPoint
      } else {
        showToast("Erro ao criar checkout", "error")
      }
    } catch (err) {
      console.error("Subscribe error:", err)
      showToast(err.message || "Erro ao processar assinatura", "error")
    }

    setLoading(false)
  }

  async function handleStartTrial() {
    if (!clinic?.id) {
      showToast("Clínica não encontrada", "error")
      return
    }

    setLoading(true)

    try {
      const trialEnd = new Date()
      trialEnd.setDate(trialEnd.getDate() + 14)

      const { error } = await supabase
        .from("clinics")
        .update({
          plan: "pro",
          trial_end: trialEnd.toISOString(),
        })
        .eq("id", clinic.id)

      if (error) throw error

      const { error: subError } = await supabase
        .from("subscriptions")
        .insert({
          clinic_id: clinic.id,
          billing_cycle: "monthly",
          status: "trial",
          trial_end: trialEnd.toISOString(),
          current_period_end: trialEnd.toISOString(),
        })

      if (subError) {
        console.error("Trial subscription error:", subError)
      }

      await refreshClinic()
      showToast("Período de teste ativado! 14 dias gratuitos.")
      setTimeout(() => navigate("/app/dashboard"), 1500)

    } catch (err) {
      console.error("Start trial error:", err)
      showToast(err.message || "Erro ao iniciar teste", "error")
    }

    setLoading(false)
  }

  const currentPrice = PLAN_PRICES.pro[selectedCycle]
  const monthlyEquivalent = selectedCycle === "monthly" 
    ? PLAN_PRICES.pro.monthly 
    : Math.round(PLAN_PRICES.pro[selectedCycle] / (selectedCycle === "quarterly" ? 3 : 6))

  return (
    <div style={{
      minHeight: "100vh",
      background: t.bgPage,
      fontFamily: "'DM Sans','Segoe UI',sans-serif",
    }}>
      <MotionToast toast={toast}>
        <div style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          padding: "12px 20px",
          borderRadius: 10,
          border: "1px solid",
          background: toast?.type === "success" ? t.successBg : t.errorBg,
          borderColor: toast?.type === "success" ? t.successBorder : t.errorBorder,
          color: toast?.type === "success" ? t.successText : t.errorText,
          fontWeight: 600,
          fontSize: 14,
          zIndex: 999,
        }}>
          {toast?.type === "success" ? "✓" : "✕"} {toast?.msg}
        </div>
      </MotionToast>

      {/* Header */}
      <header style={{
        padding: isMobile ? "16px 20px" : "20px 32px",
        borderBottom: `1px solid ${t.border}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: t.bgCard,
      }}>
        <Link to="/app/dashboard" style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          textDecoration: "none",
          color: t.textSecondary,
          fontSize: 14,
          fontWeight: 500,
        }}>
          <span style={{ fontSize: 18 }}>←</span>
          Voltar
        </Link>
        <span style={{ fontSize: 18, fontWeight: 800, color: t.textPrimary, letterSpacing: "-0.5px" }}>
          Clinic<span style={{ color: t.accent }}>OS</span>
        </span>
        <div style={{ width: 60 }} />
      </header>

      <div style={{ 
        maxWidth: 520, 
        margin: "0 auto", 
        padding: isMobile ? "32px 20px" : "48px 32px" 
      }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              style={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 20px",
                fontSize: 28,
              }}
            >
              ✨
            </motion.div>
            <h1 style={{
              fontSize: isMobile ? 24 : 32,
              fontWeight: 800,
              color: t.textPrimary,
              marginBottom: 8,
            }}>
              Escolha seu plano
            </h1>
            <p style={{ color: t.textFaint, fontSize: 15 }}>
              Experimente 14 dias gratuitos ou assine agora
            </p>
          </div>

          {/* Billing Cycle Selector */}
          <div style={{
            display: "flex",
            gap: 10,
            justifyContent: "center",
            marginBottom: 28,
            flexWrap: "wrap",
          }}>
            {BILLING_CYCLES.map((cycle, index) => (
              <motion.button
                key={cycle.id}
                onClick={() => setSelectedCycle(cycle.id)}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                style={{
                  padding: "12px 20px",
                  borderRadius: 10,
                  border: "1px solid",
                  borderColor: selectedCycle === cycle.id ? t.accent : t.border,
                  background: selectedCycle === cycle.id ? t.accent : "transparent",
                  color: selectedCycle === cycle.id ? "#fff" : t.textSecondary,
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                {cycle.label}
                {cycle.discount > 0 && (
                  <span style={{ marginLeft: 6, fontSize: 11, opacity: 0.8 }}>
                    -{cycle.discount}%
                  </span>
                )}
              </motion.button>
            ))}
          </div>

          {/* Plan Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            style={{
              background: t.bgCard,
              borderRadius: 20,
              border: `1px solid ${t.border}`,
              padding: isMobile ? 24 : 32,
              boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
            }}>
            {/* Plan Header */}
            <div style={{
              textAlign: "center",
              marginBottom: 24,
              paddingBottom: 24,
              borderBottom: `1px solid ${t.border}`,
            }}>
              <div style={{
                display: "inline-block",
                background: "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
                color: "#fff",
                fontSize: 11,
                fontWeight: 700,
                padding: "4px 12px",
                borderRadius: 99,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                marginBottom: 12,
              }}>
                Plano Pro
              </div>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: 4 }}>
                <span style={{ fontSize: 48, fontWeight: 800, color: t.textPrimary }}>
                  R$ {monthlyEquivalent}
                </span>
                <span style={{ color: t.textFaint, fontSize: 18 }}>/mês</span>
              </div>
              {selectedCycle !== "monthly" && (
                <div style={{ fontSize: 14, color: t.textFaint, marginTop: 6 }}>
                  R$ {currentPrice} total por {selectedCycle === "quarterly" ? "3 meses" : "6 meses"}
                </div>
              )}
            </div>

            {/* Features */}
            <ul style={{ listStyle: "none", padding: 0, margin: "0 0 24px" }}>
              {FEATURES.map((feature, i) => (
                <motion.li 
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + (i * 0.05) }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "10px 0",
                    color: t.textSecondary,
                    fontSize: 14,
                  }}
                >
                  <span style={{ 
                    width: 28, 
                    height: 28, 
                    borderRadius: 8, 
                    background: t.bgInset,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 14,
                  }}>
                    {feature.icon}
                  </span>
                  {feature.text}
                </motion.li>
              ))}
            </ul>

            {/* Buttons */}
            <Button
              onClick={handleSubscribe}
              disabled={loading}
              loading={loading}
              fullWidth
              style={{ marginBottom: 10, height: 48 }}
            >
              Assinar agora
            </Button>

            <Button
              onClick={handleStartTrial}
              disabled={loading}
              variant="secondary"
              fullWidth
              style={{ height: 48 }}
            >
              Experimentar grátis (14 dias)
            </Button>
          </motion.div>

          <p style={{
            textAlign: "center",
            marginTop: 24,
            color: t.textFaint,
            fontSize: 12,
          }}>
            Pagamento seguro via Mercado Pago. Cancele a qualquer momento.
          </p>
        </motion.div>
      </div>
    </div>
  )
}