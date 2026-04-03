import { useState, useEffect } from "react"
import { useNavigate, Link } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { supabase } from "../../supabaseClient"
import { useAuth } from "../../context/AuthContext"
import { useTheme } from "../../context/ThemeContext"
import { PLAN_PRICES } from "../../hooks/usePlanLimits"
import { Button } from "../../components/ui"
import { MotionToast } from "../../components/ui/MotionComponents"

const BILLING_CYCLES = [
  { id: "monthly",    label: "Mensal",     discount: 0,  months: 1 },
  { id: "quarterly",  label: "Trimestral", discount: 10, months: 3 },
  { id: "semiannual", label: "Semestral",  discount: 15, months: 6 },
]

const FEATURES = [
  { text: "Pacientes ilimitados"  },
  { text: "Equipe completa"       },
  { text: "Prontuário eletrônico" },
  { text: "Financeiro completo"   },
  { text: "Dashboard avançado"    },
  { text: "Suporte prioritário"   },
]

const CYCLE_LABEL = { monthly: "Mensal", quarterly: "Trimestral", semiannual: "Semestral" }

function LoadingState({ t }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "64px 0", gap: 16 }}>
      <div style={{ width: 36, height: 36, border: `3px solid ${t.border}`, borderTopColor: t.accent, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      <p style={{ fontSize: 14, color: t.textGhost, margin: 0 }}>Verificando sua assinatura...</p>
    </div>
  )
}

function PendingBanner({ subscription, onResume, onCancel, loading, t }) {
  const label    = CYCLE_LABEL[subscription.billing_cycle] ?? subscription.billing_cycle
  const price    = PLAN_PRICES.pro[subscription.billing_cycle]
  const dateStr  = new Date(subscription.created_at).toLocaleString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
      <div style={{
        background: t.bgCard, border: `1px solid #f59e0b55`,
        borderRadius: 16, padding: "28px 24px", marginBottom: 16,
        position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", top: -48, right: -48, width: 160, height: 160, borderRadius: "50%", background: "radial-gradient(circle, #f59e0b12 0%, transparent 70%)", pointerEvents: "none" }} />

        <div style={{ display: "flex", gap: 14, marginBottom: 20 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0, background: "#f59e0b15", border: "1px solid #f59e0b33", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>⏳</div>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: t.textPrimary, margin: "0 0 4px" }}>Pagamento aguardando conclusão</h3>
            <p style={{ fontSize: 13, color: t.textGhost, margin: 0, lineHeight: 1.5 }}>
              Checkout iniciado em {dateStr} mas não finalizado.
            </p>
          </div>
        </div>

        <div style={{ background: t.bgInset, borderRadius: 10, padding: "12px 16px", marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center", border: `1px solid ${t.border}` }}>
          <div>
            <span style={{ fontSize: 11, color: t.textGhost, display: "block", marginBottom: 2 }}>Plano selecionado</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: t.textPrimary }}>Pro · {label}</span>
          </div>
          <div style={{ textAlign: "right" }}>
            <span style={{ fontSize: 11, color: t.textGhost, display: "block", marginBottom: 2 }}>Valor</span>
            <span style={{ fontSize: 15, fontWeight: 800, color: t.accent }}>
              R$ {price}{subscription.billing_cycle === "monthly" ? "/mês" : " total"}
            </span>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <Button onClick={onResume} disabled={loading} loading={loading} fullWidth>
            Continuar pagamento →
          </Button>
          <Button onClick={onCancel} disabled={loading} variant="ghost" fullWidth>
            Cancelar e escolher outro plano
          </Button>
        </div>
      </div>
      <p style={{ textAlign: "center", fontSize: 12, color: t.textDisabled }}>
        O Mercado Pago aguarda seu pagamento. Retome de onde parou.
      </p>
    </motion.div>
  )
}

function NewSubscriptionForm({ selectedCycle, setSelectedCycle, onSubscribe, onTrial, loading, t }) {
  const currentPrice      = PLAN_PRICES.pro[selectedCycle]
  const monthlyEquivalent = selectedCycle === "monthly"
    ? PLAN_PRICES.pro.monthly
    : Math.round(PLAN_PRICES.pro[selectedCycle] / (selectedCycle === "quarterly" ? 3 : 6))
  const selectedData = BILLING_CYCLES.find(c => c.id === selectedCycle)

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
      {/* Seletor de ciclo */}
      <div style={{ display: "flex", gap: 6, marginBottom: 24, background: t.bgInset, borderRadius: 12, padding: 5, border: `1px solid ${t.border}` }}>
        {BILLING_CYCLES.map((cycle) => (
          <button key={cycle.id} onClick={() => setSelectedCycle(cycle.id)} style={{
            flex: 1, padding: "10px 6px", borderRadius: 8, border: "none",
            background: selectedCycle === cycle.id ? t.bgCard : "transparent",
            color: selectedCycle === cycle.id ? t.textPrimary : t.textFaint,
            fontWeight: selectedCycle === cycle.id ? 700 : 500,
            fontSize: 13, cursor: "pointer", transition: "all .15s", fontFamily: "inherit",
            boxShadow: selectedCycle === cycle.id ? "0 1px 6px rgba(0,0,0,0.12)" : "none",
          }}>
            {cycle.label}
            {cycle.discount > 0 && (
              <span style={{ display: "block", fontSize: 10, fontWeight: 700, color: selectedCycle === cycle.id ? "#22c55e" : t.textDisabled, marginTop: 2 }}>
                -{cycle.discount}%
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Card de preço */}
      <div style={{
        background: t.bgCard, border: `1px solid ${t.border}`,
        borderTop: `2px solid ${t.accent}`,
        borderRadius: 16, overflow: "hidden", marginBottom: 16,
      }}>
        <div style={{ padding: "24px 24px 20px", borderBottom: `1px solid ${t.border}` }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
            <div>
              <span style={{ fontSize: 11, fontWeight: 700, color: t.accent, textTransform: "uppercase", letterSpacing: "0.8px" }}>Plano Pro</span>
              <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginTop: 8 }}>
                <span style={{ fontSize: 40, fontWeight: 800, color: t.textPrimary, letterSpacing: "-1px", lineHeight: 1 }}>
                  R$ {monthlyEquivalent}
                </span>
                <span style={{ fontSize: 14, color: t.textGhost }}>/mês</span>
              </div>
            </div>
            {selectedData.discount > 0 && (
              <div style={{ background: "#22c55e15", border: "1px solid #22c55e30", borderRadius: 8, padding: "8px 12px", textAlign: "center", marginTop: 4 }}>
                <span style={{ fontSize: 18, fontWeight: 800, color: "#22c55e", display: "block" }}>-{selectedData.discount}%</span>
                <span style={{ fontSize: 10, color: "#22c55e99", fontWeight: 600 }}>desconto</span>
              </div>
            )}
          </div>
          {selectedCycle !== "monthly" && (
            <p style={{ fontSize: 13, color: t.textGhost, margin: "10px 0 0" }}>
              Total de <strong style={{ color: t.textBody }}>R$ {currentPrice}</strong> cobrado a cada {selectedData.months} meses
            </p>
          )}
        </div>

        <div style={{ padding: "18px 24px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 8px" }}>
            {FEATURES.map((f, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ color: "#22c55e", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>✓</span>
                <span style={{ fontSize: 13, color: t.textSecondary }}>{f.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <Button onClick={onSubscribe} disabled={loading} loading={loading} fullWidth>
          Assinar agora · R$ {currentPrice}{selectedCycle === "monthly" ? "/mês" : ""}
        </Button>
        <Button onClick={onTrial} disabled={loading} variant="secondary" fullWidth>
          Experimentar grátis por 14 dias
        </Button>
      </div>

      <p style={{ textAlign: "center", marginTop: 14, color: t.textDisabled, fontSize: 11, lineHeight: 1.6 }}>
        Pagamento seguro via Mercado Pago · Cancele a qualquer momento
      </p>
    </motion.div>
  )
}

export default function Subscription() {
  const { t } = useTheme()
  const navigate = useNavigate()
  const { clinicId, refreshClinic } = useAuth()

  const [selectedCycle,       setSelectedCycle]       = useState("monthly")
  const [loading,             setLoading]             = useState(false)
  const [checkingPending,     setCheckingPending]     = useState(true)
  const [pendingSubscription, setPendingSubscription] = useState(null)
  const [toast,               setToast]               = useState(null)

  function showToast(msg, type = "success") {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 4000)
  }

  // Verifica pending ANTES de qualquer ação
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
      setPendingSubscription(data?.mercadopago_preapproval_id ? data : null)
      setCheckingPending(false)
    }
    checkPending()
  }, [clinicId])

  async function handleResume() {
    if (!pendingSubscription?.mercadopago_preapproval_id) return
    setLoading(true)
    window.location.href = `https://www.mercadopago.com.br/subscriptions/checkout?preapproval_id=${pendingSubscription.mercadopago_preapproval_id}`
  }

  async function handleCancelPending() {
    if (!pendingSubscription) return
    setLoading(true)
    await supabase
      .from("subscriptions")
      .update({ status: "cancelled", updated_at: new Date().toISOString() })
      .eq("id", pendingSubscription.id)
    setPendingSubscription(null)
    setLoading(false)
    showToast("Checkout anterior cancelado. Escolha um novo plano.")
  }

  async function handleSubscribe() {
    setLoading(true)
    try {
      const { data: sd } = await supabase.auth.getSession()
      if (!sd?.session) { showToast("Sessão expirada. Faça login novamente.", "error"); setLoading(false); return }

      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { billing_cycle: selectedCycle },
      })
      if (error) throw new Error(error?.context?.json?.error || error.message)
      if (data?.initPoint) window.location.href = data.initPoint
      else showToast("Erro ao obter URL de pagamento.", "error")
    } catch (err) {
      showToast(err.message || "Erro ao processar assinatura", "error")
    }
    setLoading(false)
  }

  async function handleStartTrial() {
    setLoading(true)
    try {
      const trialEnd = new Date()
      trialEnd.setDate(trialEnd.getDate() + 14)
      const { error } = await supabase.from("clinics").update({ plan: "pro", trial_end: trialEnd.toISOString() }).eq("id", clinicId)
      if (error) throw error
      await supabase.from("subscriptions").insert({ clinic_id: clinicId, billing_cycle: "monthly", status: "trial", trial_end: trialEnd.toISOString(), current_period_end: trialEnd.toISOString() })
      await refreshClinic()
      showToast("Período de teste ativado! 14 dias gratuitos.")
      setTimeout(() => navigate("/dashboard"), 1500)
    } catch (err) {
      showToast(err.message || "Erro ao iniciar teste", "error")
    }
    setLoading(false)
  }

  return (
    <div style={{ minHeight: "100vh", background: t.bgPage, fontFamily: "'DM Sans','Segoe UI',sans-serif" }}>
      <MotionToast toast={toast}>
        <div style={{
          position: "fixed", bottom: 24, right: 24, zIndex: 999,
          padding: "12px 20px", borderRadius: 10, border: "1px solid",
          background: toast?.type === "success" ? t.successBg : t.errorBg,
          borderColor: toast?.type === "success" ? t.successBorder : t.errorBorder,
          color: toast?.type === "success" ? t.successText : t.errorText,
          fontWeight: 600, fontSize: 14,
        }}>
          {toast?.type === "success" ? "✓" : "✕"} {toast?.msg}
        </div>
      </MotionToast>

      {/* Header contextual */}
      <header style={{
        height: 56, padding: "0 24px",
        borderBottom: `1px solid ${t.border}`,
        background: t.bgSidebar,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        position: "sticky", top: 0, zIndex: 10,
      }}>
        <Link to="/dashboard" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none", color: t.textFaint, fontSize: 13, fontWeight: 600 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          Dashboard
        </Link>
        <span style={{ fontSize: 16, fontWeight: 800, color: t.textPrimary, letterSpacing: "-0.5px" }}>
          Clinic<span style={{ color: t.accent }}>OS</span>
          <span style={{ fontSize: 10, fontWeight: 700, color: t.accent, background: `${t.accent}18`, border: `1px solid ${t.accent}33`, borderRadius: 6, padding: "2px 7px", marginLeft: 8, verticalAlign: "middle", textTransform: "uppercase", letterSpacing: "0.5px" }}>Pro</span>
        </span>
        <div style={{ width: 80 }} />
      </header>

      <div style={{ maxWidth: 460, margin: "0 auto", padding: "40px 20px 60px" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}
            style={{ fontSize: 26, fontWeight: 800, color: t.textPrimary, margin: "0 0 8px", letterSpacing: "-0.5px" }}>
            {checkingPending ? "Carregando..." : pendingSubscription ? "Finalize seu pagamento" : "Assine o ClinicOS Pro"}
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.07 }}
            style={{ fontSize: 14, color: t.textFaint, margin: 0 }}>
            {!checkingPending && (pendingSubscription
              ? "Você tem um checkout em andamento"
              : "Desbloqueie todos os recursos da plataforma")}
          </motion.p>
        </div>

        <AnimatePresence mode="wait">
          {checkingPending
            ? <LoadingState t={t} key="loading" />
            : pendingSubscription
              ? <PendingBanner key="pending" subscription={pendingSubscription} onResume={handleResume} onCancel={handleCancelPending} loading={loading} t={t} />
              : <NewSubscriptionForm key="form" selectedCycle={selectedCycle} setSelectedCycle={setSelectedCycle} onSubscribe={handleSubscribe} onTrial={handleStartTrial} loading={loading} t={t} />
          }
        </AnimatePresence>
      </div>
    </div>
  )
}
