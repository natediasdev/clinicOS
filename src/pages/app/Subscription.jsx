import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { motion } from "framer-motion"
import { supabase } from "../../supabaseClient"
import { useAuth } from "../../context/AuthContext"
import { useTheme } from "../../context/ThemeContext"
import { PLAN_PRICES } from "../../hooks/usePlanLimits"
import { Button, Card } from "../../components/ui"
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

      <header style={{
        padding: "16px 24px",
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
          fontWeight: 600,
        }}>
          ← Voltar
        </Link>
        <span style={{ fontSize: 18, fontWeight: 800, color: t.textPrimary, letterSpacing: "-0.5px" }}>
          Clinic<span style={{ color: t.accent }}>OS</span>
        </span>
        <div style={{ width: 60 }} />
      </header>

      <div style={{ 
        maxWidth: 480, 
        margin: "0 auto", 
        padding: "32px 24px" 
      }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <h1 style={{
            fontSize: 28,
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

        <div style={{
          display: "flex",
          gap: 8,
          justifyContent: "center",
          marginBottom: 24,
        }}>
          {BILLING_CYCLES.map((cycle) => (
            <button
              key={cycle.id}
              onClick={() => setSelectedCycle(cycle.id)}
              style={{
                padding: "10px 16px",
                borderRadius: 8,
                border: "1px solid",
                borderColor: selectedCycle === cycle.id ? t.accent : t.border,
                background: selectedCycle === cycle.id ? t.accent : "transparent",
                color: selectedCycle === cycle.id ? "#fff" : t.textSecondary,
                fontWeight: 600,
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              {cycle.label}
              {cycle.discount > 0 && (
                <span style={{ marginLeft: 4, fontSize: 11, opacity: 0.8 }}>
                  -{cycle.discount}%
                </span>
              )}
            </button>
          ))}
        </div>

        <Card padding="24px" borderTop={t.accent}>
          <div style={{ textAlign: "center", marginBottom: 20, paddingBottom: 20, borderBottom: `1px solid ${t.border}` }}>
            <div style={{
              fontSize: 12,
              fontWeight: 700,
              color: t.accent,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              marginBottom: 8,
            }}>
              Plano Pro
            </div>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: 4 }}>
              <span style={{ fontSize: 40, fontWeight: 800, color: t.textPrimary }}>
                R$ {monthlyEquivalent}
              </span>
              <span style={{ color: t.textFaint, fontSize: 16 }}>/mês</span>
            </div>
            {selectedCycle !== "monthly" && (
              <div style={{ fontSize: 13, color: t.textFaint, marginTop: 4 }}>
                R$ {currentPrice} total por {selectedCycle === "quarterly" ? "3 meses" : "6 meses"}
              </div>
            )}
          </div>

          <ul style={{ listStyle: "none", padding: 0, margin: "0 0 20px" }}>
            {FEATURES.map((feature, i) => (
              <li key={i} style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "8px 0",
                color: t.textSecondary,
                fontSize: 14,
              }}>
                <span style={{ color: "#22c55e", fontSize: 14 }}>✓</span>
                {feature.text}
              </li>
            ))}
          </ul>

          <Button
            onClick={handleSubscribe}
            disabled={loading}
            loading={loading}
            fullWidth
            style={{ marginBottom: 10 }}
          >
            Assinar agora
          </Button>

          <Button
            onClick={handleStartTrial}
            disabled={loading}
            variant="secondary"
            fullWidth
          >
            Experimentar grátis (14 dias)
          </Button>
        </Card>

        <p style={{
          textAlign: "center",
          marginTop: 20,
          color: t.textFaint,
          fontSize: 12,
        }}>
          Pagamento seguro via Mercado Pago. Cancele a qualquer momento.
        </p>
      </div>
    </div>
  )
}