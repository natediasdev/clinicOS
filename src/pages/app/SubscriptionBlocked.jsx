import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
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

const CYCLE_LABEL = { monthly: "Mensal", quarterly: "Trimestral", semiannual: "Semestral" }

export default function SubscriptionBlocked() {
  const { t } = useTheme()
  const navigate = useNavigate()
  const { clinicId } = useAuth()

  const [selectedCycle,       setSelectedCycle]       = useState("monthly")
  const [loading,             setLoading]             = useState(false)
  const [checking,            setChecking]            = useState(true)
  const [pendingSubscription, setPendingSubscription] = useState(null)
  const [toast,               setToast]               = useState(null)

  function showToast(msg, type = "success") {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 4000)
  }

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
      setChecking(false)
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
    showToast("Cancelado. Escolha um novo plano.")
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

  const currentPrice      = PLAN_PRICES.pro[selectedCycle]
  const monthlyEquivalent = selectedCycle === "monthly"
    ? PLAN_PRICES.pro.monthly
    : Math.round(PLAN_PRICES.pro[selectedCycle] / (selectedCycle === "quarterly" ? 3 : 6))
  const selectedData = BILLING_CYCLES.find(c => c.id === selectedCycle)

  return (
    <div style={{ minHeight: "100vh", background: t.bgPage, fontFamily: "'DM Sans','Segoe UI',sans-serif", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
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

      <div style={{ width: "100%", maxWidth: 440 }}>
        <AnimatePresence mode="wait">

          {/* Loading */}
          {checking && (
            <motion.div key="checking" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ textAlign: "center", padding: "48px 0" }}>
              <div style={{ width: 36, height: 36, border: `3px solid ${t.border}`, borderTopColor: t.accent, borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} />
              <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
              <p style={{ fontSize: 14, color: t.textGhost, margin: 0 }}>Verificando assinatura...</p>
            </motion.div>
          )}

          {/* Tem pending — oferece retomada */}
          {!checking && pendingSubscription && (
            <motion.div key="pending" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div style={{ textAlign: "center", marginBottom: 28 }}>
                <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#f59e0b15", border: "1px solid #f59e0b33", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, margin: "0 auto 16px" }}>⏳</div>
                <h1 style={{ fontSize: 24, fontWeight: 800, color: t.textPrimary, margin: "0 0 8px", letterSpacing: "-0.5px" }}>Pagamento pendente</h1>
                <p style={{ fontSize: 14, color: t.textFaint, margin: 0, lineHeight: 1.6 }}>
                  Você iniciou um checkout mas não finalizou o pagamento. Complete para ativar o acesso Pro.
                </p>
              </div>

              <div style={{ background: t.bgCard, border: `1px solid #f59e0b44`, borderRadius: 16, padding: "24px", marginBottom: 16 }}>
                <div style={{ background: t.bgInset, borderRadius: 10, padding: "12px 16px", marginBottom: 20, display: "flex", justifyContent: "space-between", border: `1px solid ${t.border}` }}>
                  <div>
                    <span style={{ fontSize: 11, color: t.textGhost, display: "block", marginBottom: 2 }}>Plano</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: t.textPrimary }}>Pro · {CYCLE_LABEL[pendingSubscription.billing_cycle]}</span>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span style={{ fontSize: 11, color: t.textGhost, display: "block", marginBottom: 2 }}>Valor</span>
                    <span style={{ fontSize: 15, fontWeight: 800, color: t.accent }}>
                      R$ {PLAN_PRICES.pro[pendingSubscription.billing_cycle]}{pendingSubscription.billing_cycle === "monthly" ? "/mês" : " total"}
                    </span>
                  </div>
                </div>

                <Button onClick={handleResume} disabled={loading} loading={loading} fullWidth style={{ marginBottom: 10 }}>
                  Continuar pagamento →
                </Button>
                <Button onClick={handleCancelPending} disabled={loading} variant="ghost" fullWidth>
                  Cancelar e assinar outro plano
                </Button>
              </div>
            </motion.div>
          )}

          {/* Sem pending — formulário de nova assinatura */}
          {!checking && !pendingSubscription && (
            <motion.div key="form" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div style={{ textAlign: "center", marginBottom: 28 }}>
                <div style={{ width: 64, height: 64, borderRadius: "50%", background: t.errorBg, border: `1px solid ${t.errorBorder}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, margin: "0 auto 16px" }}>🔒</div>
                <h1 style={{ fontSize: 24, fontWeight: 800, color: t.textPrimary, margin: "0 0 8px", letterSpacing: "-0.5px" }}>Acesso bloqueado</h1>
                <p style={{ fontSize: 14, color: t.textFaint, margin: 0, lineHeight: 1.6 }}>
                  Sua assinatura está inativa. Renove para continuar usando o ClinicOS Pro.
                </p>
              </div>

              {/* Seletor de ciclo */}
              <div style={{ display: "flex", gap: 6, marginBottom: 20, background: t.bgInset, borderRadius: 12, padding: 5, border: `1px solid ${t.border}` }}>
                {BILLING_CYCLES.map((cycle) => (
                  <button key={cycle.id} onClick={() => setSelectedCycle(cycle.id)} style={{
                    flex: 1, padding: "9px 6px", borderRadius: 8, border: "none",
                    background: selectedCycle === cycle.id ? t.bgCard : "transparent",
                    color: selectedCycle === cycle.id ? t.textPrimary : t.textFaint,
                    fontWeight: selectedCycle === cycle.id ? 700 : 500,
                    fontSize: 13, cursor: "pointer", fontFamily: "inherit",
                    boxShadow: selectedCycle === cycle.id ? "0 1px 4px rgba(0,0,0,0.12)" : "none",
                    transition: "all .15s",
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

              {/* Card preço */}
              <div style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderTop: `2px solid ${t.accent}`, borderRadius: 16, padding: "20px 24px", marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: selectedCycle !== "monthly" ? 8 : 0 }}>
                  <div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: t.accent, textTransform: "uppercase", letterSpacing: "0.8px" }}>Plano Pro</span>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginTop: 6 }}>
                      <span style={{ fontSize: 36, fontWeight: 800, color: t.textPrimary, letterSpacing: "-1px", lineHeight: 1 }}>R$ {monthlyEquivalent}</span>
                      <span style={{ fontSize: 13, color: t.textGhost }}>/mês</span>
                    </div>
                  </div>
                  {selectedData.discount > 0 && (
                    <div style={{ background: "#22c55e15", border: "1px solid #22c55e30", borderRadius: 8, padding: "6px 10px", textAlign: "center", marginTop: 4 }}>
                      <span style={{ fontSize: 16, fontWeight: 800, color: "#22c55e", display: "block" }}>-{selectedData.discount}%</span>
                      <span style={{ fontSize: 10, color: "#22c55e99", fontWeight: 600 }}>desconto</span>
                    </div>
                  )}
                </div>
                {selectedCycle !== "monthly" && (
                  <p style={{ fontSize: 13, color: t.textGhost, margin: 0 }}>
                    Total de <strong style={{ color: t.textBody }}>R$ {currentPrice}</strong> a cada {selectedData.months} meses
                  </p>
                )}
              </div>

              <Button onClick={handleSubscribe} disabled={loading} loading={loading} fullWidth>
                Reativar assinatura · R$ {currentPrice}{selectedCycle === "monthly" ? "/mês" : ""}
              </Button>
              <p style={{ textAlign: "center", marginTop: 12, color: t.textDisabled, fontSize: 11 }}>
                Pagamento seguro via Mercado Pago
              </p>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  )
}
