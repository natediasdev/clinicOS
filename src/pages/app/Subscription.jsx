import { useState, useEffect } from "react"
import { useNavigate, Link } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { supabase } from "../../supabaseClient"
import { useAuth } from "../../context/AuthContext"
import { useTheme } from "../../context/ThemeContext"
import { PLAN_PRICES } from "../../hooks/usePlanLimits"
import { Button, Card } from "../../components/ui"
import { MotionToast } from "../../components/ui/MotionComponents"

const BILLING_CYCLES = [
  { id: "monthly",    label: "Mensal",     discount: 0  },
  { id: "quarterly",  label: "Trimestral", discount: 10 },
  { id: "semiannual", label: "Semestral",  discount: 15 },
]

const FEATURES = [
  { icon: "👥", text: "Pacientes ilimitados"  },
  { icon: "👨‍⚕️", text: "Equipe completa"       },
  { icon: "📋", text: "Prontuário eletrônico" },
  { icon: "💰", text: "Financeiro completo"   },
  { icon: "📊", text: "Dashboard avançado"    },
  { icon: "🎧", text: "Suporte prioritário"   },
]

// ── Modal de checkout pendente ───────────────────────────────────────────────

function PendingCheckoutModal({ subscription, onResume, onCancel, loading, t }) {
  const cycleLabel = {
    monthly:    "Mensal",
    quarterly:  "Trimestral",
    semiannual: "Semestral",
  }[subscription.billing_cycle] ?? subscription.billing_cycle

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: "fixed", inset: 0, zIndex: 200,
        background: "rgba(0,0,0,0.7)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 24,
      }}
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 16 }}
        animate={{ scale: 1,    opacity: 1, y: 0  }}
        exit={{    scale: 0.92, opacity: 0, y: 16 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        style={{
          background: t.bgCard, border: `1px solid ${t.border}`,
          borderRadius: 16, padding: "32px 28px",
          width: "100%", maxWidth: 420,
          fontFamily: "'DM Sans','Segoe UI',sans-serif",
        }}
      >
        {/* Ícone */}
        <div style={{
          width: 52, height: 52, borderRadius: "50%",
          background: "#f59e0b18", border: "1px solid #f59e0b44",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 24, margin: "0 auto 20px",
        }}>
          ⏳
        </div>

        <h2 style={{ fontSize: 20, fontWeight: 800, color: t.textPrimary, textAlign: "center", margin: "0 0 10px", letterSpacing: "-0.5px" }}>
          Você tem um pagamento pendente
        </h2>
        <p style={{ fontSize: 14, color: t.textFaint, textAlign: "center", margin: "0 0 24px", lineHeight: 1.6 }}>
          Você iniciou uma assinatura <strong style={{ color: t.textBody }}>{cycleLabel}</strong> mas não concluiu o pagamento.
          Deseja retomar de onde parou?
        </p>

        <div style={{ background: t.bgInset, borderRadius: 10, padding: "12px 16px", marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 13, color: t.textGhost }}>Plano Pro · {cycleLabel}</span>
          <span style={{ fontSize: 15, fontWeight: 700, color: t.textPrimary }}>
            R$ {PLAN_PRICES.pro[subscription.billing_cycle]}{subscription.billing_cycle !== "monthly" ? " total" : "/mês"}
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <Button onClick={onResume} disabled={loading} loading={loading} fullWidth>
            Retomar pagamento →
          </Button>
          <Button onClick={onCancel} disabled={loading} variant="ghost" fullWidth>
            Cancelar e escolher outro plano
          </Button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ── Página principal ─────────────────────────────────────────────────────────

export default function Subscription() {
  const { t } = useTheme()
  const navigate = useNavigate()
  const { clinic, clinicId, refreshClinic } = useAuth()
  const [selectedCycle, setSelectedCycle] = useState("monthly")
  const [loading, setLoading] = useState(false)
  const [checkingPending, setCheckingPending] = useState(true)
  const [pendingSubscription, setPendingSubscription] = useState(null)
  const [toast, setToast] = useState(null)

  function showToast(msg, type = "success") {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 4000)
  }

  // Verifica se existe um checkout pendente ao carregar
  useEffect(() => {
    if (!clinicId) return
    async function checkPending() {
      const { data } = await supabase
        .from("subscriptions")
        .select("id, billing_cycle, status, mercadopago_preapproval_id, created_at")
        .eq("clinic_id", clinicId)
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()

      if (data?.mercadopago_preapproval_id) {
        setPendingSubscription(data)
      }
      setCheckingPending(false)
    }
    checkPending()
  }, [clinicId])

  // Retoma checkout pendente — busca o init_point atual do MP
  async function handleResume() {
    if (!pendingSubscription?.mercadopago_preapproval_id) return
    setLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke("get-checkout-url", {
        body: { preapproval_id: pendingSubscription.mercadopago_preapproval_id },
      })

      if (error || !data?.initPoint) {
        // Fallback: busca direto via fetch se edge function não existir ainda
        showToast("Redirecionando para o pagamento...", "success")
        // O init_point do MP tem formato fixo por preapproval_id
        window.location.href = `https://www.mercadopago.com.br/subscriptions/checkout?preapproval_id=${pendingSubscription.mercadopago_preapproval_id}`
        return
      }
      window.location.href = data.initPoint
    } catch {
      window.location.href = `https://www.mercadopago.com.br/subscriptions/checkout?preapproval_id=${pendingSubscription.mercadopago_preapproval_id}`
    }
    setLoading(false)
  }

  // Cancela o checkout pendente no banco (não precisa cancelar no MP — status pending não cobra)
  async function handleCancelPending() {
    if (!pendingSubscription) return
    setLoading(true)
    try {
      await supabase
        .from("subscriptions")
        .update({ status: "cancelled", updated_at: new Date().toISOString() })
        .eq("id", pendingSubscription.id)

      setPendingSubscription(null)
      showToast("Pagamento anterior cancelado. Escolha um novo plano.")
    } catch (err) {
      showToast("Erro ao cancelar. Tente novamente.", "error")
    }
    setLoading(false)
  }

  async function handleSubscribe() {
    setLoading(true)
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      if (!sessionData?.session) {
        showToast("Sessão expirada. Faça login novamente.", "error")
        setLoading(false)
        return
      }

      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { billing_cycle: selectedCycle },
      })

      if (error) {
        const detail = error?.context?.json?.error || error?.message || "Erro ao criar checkout"
        throw new Error(detail)
      }

      if (data?.initPoint) {
        window.location.href = data.initPoint
      } else {
        showToast("Checkout criado mas sem URL. Contate o suporte.", "error")
      }
    } catch (err) {
      console.error("Subscribe error:", err)
      showToast(err.message || "Erro ao processar assinatura", "error")
    }
    setLoading(false)
  }

  async function handleStartTrial() {
    setLoading(true)
    try {
      const trialEnd = new Date()
      trialEnd.setDate(trialEnd.getDate() + 14)

      const { error } = await supabase
        .from("clinics")
        .update({ plan: "pro", trial_end: trialEnd.toISOString() })
        .eq("id", clinicId)

      if (error) throw error

      await supabase.from("subscriptions").insert({
        clinic_id: clinicId,
        billing_cycle: "monthly",
        status: "trial",
        trial_end: trialEnd.toISOString(),
        current_period_end: trialEnd.toISOString(),
      })

      await refreshClinic()
      showToast("Período de teste ativado! 14 dias gratuitos.")
      setTimeout(() => navigate("/dashboard"), 1500)
    } catch (err) {
      showToast(err.message || "Erro ao iniciar teste", "error")
    }
    setLoading(false)
  }

  const currentPrice      = PLAN_PRICES.pro[selectedCycle]
  const monthlyEquivalent = selectedCycle === "monthly"
    ? PLAN_PRICES.pro.monthly
    : Math.round(PLAN_PRICES.pro[selectedCycle] / (selectedCycle === "quarterly" ? 3 : 6))

  return (
    <div style={{ minHeight: "100vh", background: t.bgPage, fontFamily: "'DM Sans','Segoe UI',sans-serif" }}>

      {/* Toast */}
      <MotionToast toast={toast}>
        <div style={{
          position: "fixed", bottom: 24, right: 24,
          padding: "12px 20px", borderRadius: 10, border: "1px solid",
          background: toast?.type === "success" ? t.successBg : t.errorBg,
          borderColor: toast?.type === "success" ? t.successBorder : t.errorBorder,
          color: toast?.type === "success" ? t.successText : t.errorText,
          fontWeight: 600, fontSize: 14, zIndex: 999,
        }}>
          {toast?.type === "success" ? "✓" : "✕"} {toast?.msg}
        </div>
      </MotionToast>

      {/* Modal de checkout pendente */}
      <AnimatePresence>
        {!checkingPending && pendingSubscription && (
          <PendingCheckoutModal
            subscription={pendingSubscription}
            onResume={handleResume}
            onCancel={handleCancelPending}
            loading={loading}
            t={t}
          />
        )}
      </AnimatePresence>

      {/* Header */}
      <header style={{
        padding: "16px 24px", borderBottom: `1px solid ${t.border}`,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: t.bgCard,
      }}>
        <Link to="/dashboard" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none", color: t.textSecondary, fontSize: 14, fontWeight: 600 }}>
          ← Voltar
        </Link>
        <span style={{ fontSize: 18, fontWeight: 800, color: t.textPrimary, letterSpacing: "-0.5px" }}>
          Clinic<span style={{ color: t.accent }}>OS</span>
        </span>
        <div style={{ width: 60 }} />
      </header>

      <div style={{ maxWidth: 480, margin: "0 auto", padding: "32px 24px" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: t.textPrimary, marginBottom: 8 }}>
            Escolha seu plano
          </h1>
          <p style={{ color: t.textFaint, fontSize: 15 }}>
            Experimente 14 dias gratuitos ou assine agora
          </p>
        </div>

        {/* Seletor de ciclo */}
        <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 24 }}>
          {BILLING_CYCLES.map((cycle) => (
            <button
              key={cycle.id}
              onClick={() => setSelectedCycle(cycle.id)}
              style={{
                padding: "10px 16px", borderRadius: 8, border: "1px solid",
                borderColor: selectedCycle === cycle.id ? t.accent : t.border,
                background: selectedCycle === cycle.id ? t.accent : "transparent",
                color: selectedCycle === cycle.id ? "#fff" : t.textSecondary,
                fontWeight: 600, fontSize: 13, cursor: "pointer",
              }}
            >
              {cycle.label}
              {cycle.discount > 0 && (
                <span style={{ marginLeft: 4, fontSize: 11, opacity: 0.8 }}>-{cycle.discount}%</span>
              )}
            </button>
          ))}
        </div>

        {/* Card de preço */}
        <Card padding="24px" borderTop={t.accent}>
          <div style={{ textAlign: "center", marginBottom: 20, paddingBottom: 20, borderBottom: `1px solid ${t.border}` }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: t.accent, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>
              Plano Pro
            </div>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: 4 }}>
              <span style={{ fontSize: 40, fontWeight: 800, color: t.textPrimary }}>R$ {monthlyEquivalent}</span>
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
              <li key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", color: t.textSecondary, fontSize: 14 }}>
                <span style={{ color: "#22c55e", fontSize: 14 }}>✓</span>
                {feature.text}
              </li>
            ))}
          </ul>

          <Button onClick={handleSubscribe} disabled={loading} loading={loading} fullWidth style={{ marginBottom: 10 }}>
            Assinar agora
          </Button>
          <Button onClick={handleStartTrial} disabled={loading} variant="secondary" fullWidth>
            Experimentar grátis (14 dias)
          </Button>
        </Card>

        <p style={{ textAlign: "center", marginTop: 20, color: t.textFaint, fontSize: 12 }}>
          Pagamento seguro via Mercado Pago. Cancele a qualquer momento.
        </p>
      </div>
    </div>
  )
}
