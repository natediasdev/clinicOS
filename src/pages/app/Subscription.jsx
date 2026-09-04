import { Link } from "react-router-dom"
import { motion } from "framer-motion"
import { useAuth } from "../../context/AuthContext"
import { useTheme } from "../../context/ThemeContext"
import { usePlanLimits } from "../../hooks/usePlanLimits"

const SUPPORT_EMAIL = "nathanzzred@gmail.com"

export default function Subscription() {
  const { t } = useTheme()
  const { clinic } = useAuth()
  const { isOnTrial, getTrialDaysRemaining } = usePlanLimits()

  const onTrial     = isOnTrial()
  const daysLeft     = getTrialDaysRemaining()
  const isActivePro  = clinic?.plan === "pro" && !onTrial

  return (
    <div style={{ minHeight: "100vh", background: t.bgPage, fontFamily: "'DM Sans','Segoe UI',sans-serif" }}>
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
        </span>
        <div style={{ width: 80 }} />
      </header>

      <div style={{ maxWidth: 440, margin: "0 auto", padding: "48px 20px 60px" }}>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}
          style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 16, padding: "28px 24px", textAlign: "center" }}>

          <div style={{ width: 56, height: 56, borderRadius: "50%", margin: "0 auto 16px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24,
            background: isActivePro ? "#22c55e15" : onTrial ? "#3b82f615" : "#64748b15",
            border: `1px solid ${isActivePro ? "#22c55e33" : onTrial ? "#3b82f633" : "#64748b33"}` }}>
            {isActivePro ? "✓" : onTrial ? "🕐" : "ℹ️"}
          </div>

          <h1 style={{ fontSize: 20, fontWeight: 800, color: t.textPrimary, margin: "0 0 8px" }}>
            {isActivePro ? "Assinatura ativa" : onTrial ? "Período de teste" : "Sem plano ativo"}
          </h1>

          <p style={{ fontSize: 14, color: t.textFaint, margin: "0 0 20px", lineHeight: 1.6 }}>
            {isActivePro
              ? "Seu acesso ao ClinicOS Pro está liberado."
              : onTrial
              ? `Restam ${daysLeft} dia${daysLeft !== 1 ? "s" : ""} de teste gratuito. Ao final, entraremos em contato para ativar sua assinatura.`
              : "Sua conta ainda não tem um plano ativo. Fale com a gente para liberar o acesso."}
          </p>

          <div style={{ background: t.bgInset, borderRadius: 10, padding: "12px 16px", border: `1px solid ${t.border}` }}>
            <span style={{ fontSize: 11, color: t.textGhost, display: "block", marginBottom: 4 }}>Dúvidas sobre sua assinatura?</span>
            <a href={`mailto:${SUPPORT_EMAIL}`} style={{ color: t.accent, fontWeight: 700, fontSize: 13, textDecoration: "none" }}>
              {SUPPORT_EMAIL}
            </a>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
