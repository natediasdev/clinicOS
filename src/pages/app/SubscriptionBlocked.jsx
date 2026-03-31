import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
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
  "Pacientes ilimitados",
  "Equipe completa",
  "Prontuário eletrônico",
  "Financeiro completo",
  "Dashboard avanzado",
]

export default function SubscriptionBlocked() {
  const { t } = useTheme()
  const navigate = useNavigate()
  const { clinic, subscriptionActive, checkSubscriptionAccess } = useAuth()
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

  const currentPrice = PLAN_PRICES.pro[selectedCycle]
  const monthlyEquivalent = selectedCycle === "monthly" 
    ? PLAN_PRICES.pro.monthly 
    : Math.round(PLAN_PRICES.pro[selectedCycle] / (selectedCycle === "quarterly" ? 3 : 6))

  return (
    <div style={{
      minHeight: "100vh",
      background: t.bgPage,
      padding: "40px 20px",
      fontFamily: "'DM Sans','Segoe UI',sans-serif",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
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

      <div style={{ maxWidth: 480, width: "100%" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{
            width: 64,
            height: 64,
            borderRadius: "50%",
            background: "#fef2f2",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 16px",
          }}>
            <span style={{ fontSize: 32 }}>🔒</span>
          </div>
          <h1 style={{
            fontSize: 28,
            fontWeight: 800,
            color: t.textPrimary,
            marginBottom: 8,
          }}>
            Pagamento requerido
          </h1>
          <p style={{ color: t.textFaint, fontSize: 14 }}>
            Sua assinatura foi cancelada ou está inativa. Renove para continuar usando o ClinicOS Pro.
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
                padding: "8px 16px",
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
                <span style={{ marginLeft: 4, fontSize: 11, opacity: 0.8 }}>-{cycle.discount}%</span>
              )}
            </button>
          ))}
        </div>

        <div style={{
          background: t.bgCard,
          borderRadius: 16,
          border: `1px solid ${t.border}`,
          padding: 24,
          marginBottom: 24,
        }}>
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: t.accent, textTransform: "uppercase" }}>
              Plano Pro
            </div>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: 4 }}>
              <span style={{ fontSize: 36, fontWeight: 800, color: t.textPrimary }}>
                R$ {monthlyEquivalent}
              </span>
              <span style={{ color: t.textFaint, fontSize: 14 }}>/mês</span>
            </div>
            {selectedCycle !== "monthly" && (
              <div style={{ fontSize: 13, color: t.textFaint, marginTop: 4 }}>
                R$ {currentPrice} total por {selectedCycle === "quarterly" ? "3 meses" : "6 meses"}
              </div>
            )}
          </div>

          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {FEATURES.map((feature, i) => (
              <li key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", color: t.textSecondary, fontSize: 13 }}>
                <span style={{ color: "#22c55e" }}>✓</span> {feature}
              </li>
            ))}
          </ul>
        </div>

        <Button
          onClick={handleSubscribe}
          disabled={loading}
          loading={loading}
          fullWidth
        >
          Assinar agora
        </Button>

        <p style={{ textAlign: "center", marginTop: 16, color: t.textFaint, fontSize: 12 }}>
          Pagamento seguro via Mercado Pago
        </p>
      </div>
    </div>
  )
}
