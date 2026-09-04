import { motion } from "framer-motion"
import { useTheme } from "../../context/ThemeContext"
import { useAuth } from "../../context/AuthContext"

const SUPPORT_EMAIL = "nathanzzred@gmail.com"

export default function SubscriptionBlocked() {
  const { t } = useTheme()
  const { logout } = useAuth()

  return (
    <div style={{ minHeight: "100vh", background: t.bgPage, fontFamily: "'DM Sans','Segoe UI',sans-serif", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}
        style={{ width: "100%", maxWidth: 420, textAlign: "center" }}>

        <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#f59e0b15", border: "1px solid #f59e0b33", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, margin: "0 auto 20px" }}>⏳</div>

        <h1 style={{ fontSize: 22, fontWeight: 800, color: t.textPrimary, margin: "0 0 10px", letterSpacing: "-0.5px" }}>
          Aguardando liberação do acesso
        </h1>
        <p style={{ fontSize: 14, color: t.textFaint, margin: "0 0 28px", lineHeight: 1.6 }}>
          Seu período de teste terminou. Assim que a cobrança for confirmada, seu acesso é liberado novamente — normalmente em pouco tempo.
        </p>

        <div style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 16, padding: "20px 24px", marginBottom: 20 }}>
          <p style={{ fontSize: 13, color: t.textSecondary, margin: 0, lineHeight: 1.6 }}>
            Dúvidas sobre sua assinatura? Fale direto com a gente:
          </p>
          <a href={`mailto:${SUPPORT_EMAIL}`} style={{ display: "inline-block", marginTop: 10, color: t.accent, fontWeight: 700, fontSize: 14, textDecoration: "none" }}>
            {SUPPORT_EMAIL}
          </a>
        </div>

        <button onClick={logout} style={{ background: "transparent", border: "none", color: t.textFaint, fontSize: 13, fontWeight: 600, cursor: "pointer", textDecoration: "underline" }}>
          Sair da conta
        </button>
      </motion.div>
    </div>
  )
}
