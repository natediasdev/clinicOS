import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "../../supabaseClient"
import { useTheme } from "../../context/ThemeContext"
import { PLAN_PRICES } from "../../hooks/usePlanLimits"
import { Button, Input } from "../../components/ui"
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
  "Dashboard avançado",
]

export default function Register() {
  const { t } = useTheme()
  const navigate = useNavigate()
  const [step, setStep] = useState("register")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [selectedCycle, setSelectedCycle] = useState("monthly")
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState(null)
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)
  const [newClinicId, setNewClinicId] = useState(null)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768)
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  function showToast(msg, type = "success") {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 4000)
  }

  async function handleRegister() {
    if (!name.trim()) { showToast("Nome é obrigatório", "error"); return }
    if (!email.trim()) { showToast("E-mail é obrigatório", "error"); return }
    if (password.length < 6) { showToast("Senha deve ter pelo menos 6 caracteres", "error"); return }
    if (password !== confirmPassword) { showToast("As senhas não coincidem", "error"); return }

    setLoading(true)

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { name: name.trim() },
          emailRedirectTo: window.location.origin + "/login",
        },
      })

      if (authError) {
        showToast(
          authError.message.includes("already been registered")
            ? "Este e-mail já está cadastrado. Faça login ou recupere sua senha."
            : authError.message,
          "error"
        )
        setLoading(false)
        return
      }

      if (!authData.user) {
        showToast("Erro ao criar conta. Tente novamente.", "error")
        setLoading(false)
        return
      }

      // Email confirmado imediatamente (email confirmation desativado no Supabase)
      if (authData.user.email_confirmed_at || authData.session) {
        // Aguarda trigger handle_new_user criar a clínica (pode levar ~500ms)
        await new Promise(r => setTimeout(r, 800))

        const { data: profile } = await supabase
          .from("profiles")
          .select("clinic_id")
          .eq("id", authData.user.id)
          .single()

        if (profile?.clinic_id) {
          setNewClinicId(profile.clinic_id)
          showToast("Conta criada! Escolha seu plano...")
          setStep("plan-select")
        } else {
          showToast("Conta criada! Redirecionando...")
          setTimeout(() => navigate("/onboarding"), 1500)
        }
      } else {
        // Email confirmation ativado — usuário precisa confirmar antes de pagar
        showToast("Conta criada! Confirme seu e-mail para continuar.")
        setTimeout(() => navigate("/login"), 2000)
      }

    } catch (err) {
      console.error("Register error:", err)
      showToast("Erro inesperado. Tente novamente.", "error")
    }

    setLoading(false)
  }

  async function handleStartTrial() {
    if (!newClinicId) return
    setLoading(true)

    try {
      const trialEnd = new Date()
      trialEnd.setDate(trialEnd.getDate() + 14)

      const { error } = await supabase
        .from("clinics")
        .update({ plan: "pro", trial_end: trialEnd.toISOString() })
        .eq("id", newClinicId)

      if (error) throw error

      await supabase.from("subscriptions").insert({
        clinic_id: newClinicId,
        billing_cycle: "monthly",
        status: "trial",
        trial_end: trialEnd.toISOString(),
        current_period_end: trialEnd.toISOString(),
      })

      showToast("Período de teste ativado! 14 dias gratuitos.")
      setTimeout(() => navigate("/onboarding"), 1500)

    } catch (err) {
      console.error("Start trial error:", err)
      showToast(err.message || "Erro ao iniciar teste", "error")
    }

    setLoading(false)
  }

  async function handleSubscribe() {
    if (!newClinicId) return
    setLoading(true)

    try {
      // Garante que a sessão atual está ativa antes de invocar a edge function
      const { data: sessionData } = await supabase.auth.getSession()
      if (!sessionData?.session) {
        showToast("Sessão expirada. Faça login novamente.", "error")
        setLoading(false)
        return
      }

      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: {
          clinic_id: newClinicId,
          billing_cycle: selectedCycle,
        },
      })

      if (error) {
        // Tenta extrair mensagem de erro da edge function
        const detail = error?.context?.json?.error || error?.message || "Erro ao criar checkout"
        throw new Error(detail)
      }

      if (data?.initPoint) {
        window.location.href = data.initPoint
      } else {
        showToast("Checkout criado mas sem URL de pagamento. Contate o suporte.", "error")
      }
    } catch (err) {
      console.error("Subscribe error:", err)
      showToast(err.message || "Erro ao processar assinatura", "error")
    }

    setLoading(false)
  }

  const currentPrice = PLAN_PRICES.pro[selectedCycle]
  const monthlyEquivalent =
    selectedCycle === "monthly"
      ? PLAN_PRICES.pro.monthly
      : Math.round(PLAN_PRICES.pro[selectedCycle] / (selectedCycle === "quarterly" ? 3 : 6))

  // ── Step: seleção de plano ─────────────────────────────────────────────────
  if (step === "plan-select") {
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

        <div style={{ maxWidth: 480, width: "100%" }}>
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: t.textPrimary, marginBottom: 8 }}>
              Escolha seu plano
            </h1>
            <p style={{ color: t.textFaint, fontSize: 14 }}>
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
                  padding: "8px 16px", borderRadius: 8, border: "1px solid",
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
          <div style={{
            background: t.bgCard, borderRadius: 16,
            border: `1px solid ${t.border}`, padding: 24, marginBottom: 24,
          }}>
            <div style={{ textAlign: "center", marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: t.accent, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Plano Pro
              </div>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: 4 }}>
                <span style={{ fontSize: 36, fontWeight: 800, color: t.textPrimary }}>R$ {monthlyEquivalent}</span>
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

          <Button onClick={handleSubscribe} disabled={loading} loading={loading} fullWidth style={{ marginBottom: 10 }}>
            Assinar agora
          </Button>

          <Button onClick={handleStartTrial} disabled={loading} variant="secondary" fullWidth>
            Experimentar grátis (14 dias)
          </Button>

          <p style={{ textAlign: "center", marginTop: 16, color: t.textFaint, fontSize: 12 }}>
            Pagamento seguro via Mercado Pago. Cancele a qualquer momento.
          </p>
        </div>
      </div>
    )
  }

  // ── Step: cadastro ────────────────────────────────────────────────────────
  return (
    <div style={{
      minHeight: "100vh",
      background: t.bgPage,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 24,
      fontFamily: "'DM Sans','Segoe UI',sans-serif",
    }}>
      <MotionToast toast={toast}>
        <div style={{
          border: "1px solid", borderRadius: 10, padding: "12px 20px",
          fontSize: 14, fontWeight: 600, boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
          background: toast?.type === "success" ? t.successBg : t.errorBg,
          borderColor: toast?.type === "success" ? t.successBorder : t.errorBorder,
          color: toast?.type === "success" ? t.successText : t.errorText,
          position: "fixed", bottom: 24, right: 24, zIndex: 999,
        }}>
          {toast?.type === "success" ? "✓" : "✕"} {toast?.msg}
        </div>
      </MotionToast>

      <div style={{
        width: "100%",
        maxWidth: isMobile ? "100%" : 420,
        background: t.bgCard,
        borderRadius: 16,
        padding: isMobile ? 24 : 40,
        border: `1px solid ${t.border}`,
      }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: t.textPrimary, letterSpacing: "-0.5px", marginBottom: 8 }}>
            Clinic<span style={{ color: t.accent }}>OS</span>
          </div>
          <p style={{ color: t.textFaint, fontSize: 14, margin: 0 }}>
            Crie sua conta para começar
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: t.textMuted }}>Nome completo</label>
            <Input type="text" placeholder="Seu nome" value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: t.textMuted }}>E-mail</label>
            <Input type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: t.textMuted }}>Senha</label>
            <Input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: t.textMuted }}>Confirmar senha</label>
            <Input
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleRegister()}
            />
          </div>

          <Button
            onClick={handleRegister}
            disabled={loading || !name.trim() || !email.trim() || !password}
            loading={loading}
            fullWidth
            style={{ marginTop: 8 }}
          >
            {loading ? "Criando conta..." : "Criar conta"}
          </Button>
        </div>

        <div style={{ marginTop: 24, textAlign: "center", fontSize: 14, color: t.textFaint }}>
          Já tem uma conta?{" "}
          <a href="/login" style={{ color: t.accent, textDecoration: "none", fontWeight: 600 }}>
            Fazer login
          </a>
        </div>
      </div>
    </div>
  )
}
