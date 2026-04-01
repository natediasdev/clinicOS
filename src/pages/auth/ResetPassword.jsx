import { useState, useEffect } from "react"
import { supabase } from "../../supabaseClient"
import { Link, useNavigate } from "react-router-dom"
import { useTheme } from "../../context/ThemeContext"

export default function ResetPassword() {
  const { t } = useTheme()
  const navigate = useNavigate()
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [done, setDone] = useState(false)
  const [validSession, setValidSession] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data?.session) setValidSession(true)
      setChecking(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setValidSession(true)
    })

    return () => listener?.subscription?.unsubscribe()
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)

    if (password.length < 6) {
      setError("A senha deve ter no mínimo 6 caracteres.")
      return
    }
    if (password !== confirm) {
      setError("As senhas não coincidem.")
      return
    }

    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)

    if (error) setError(error.message)
    else {
      setDone(true)
      setTimeout(() => navigate("/dashboard"), 2500)
    }
  }

  const inp = {
    background: t.bgInput,
    border: `1px solid ${t.border}`,
    borderRadius: 8,
    padding: "11px 14px",
    fontSize: 14,
    color: t.textPrimary,
    outline: "none",
    transition: "border-color 0.2s",
    width: "100%",
    boxSizing: "border-box",
  }

  const btn = {
    background: t.accent,
    border: "none",
    borderRadius: 8,
    padding: "13px",
    fontSize: 15,
    fontWeight: 700,
    color: "#fff",
    cursor: "pointer",
    width: "100%",
    marginTop: 4,
  }

  if (checking) return null

  return (
    <div style={{
      minHeight: "100vh",
      background: t.bgPage,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
      padding: "24px",
    }}>
      <div style={{
        background: t.bgCard,
        border: `1px solid ${t.border}`,
        borderRadius: 16,
        padding: "48px 40px",
        width: "100%",
        maxWidth: 420,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}>
        <Link to="/" style={{ fontSize: 22, fontWeight: 800, color: t.textPrimary, textDecoration: "none", letterSpacing: "-0.5px", marginBottom: 32 }}>
          Clinic<span style={{ color: t.accent }}>OS</span>
        </Link>

        {done ? (
          <>
            <div style={{ width: 48, height: 48, borderRadius: "50%", background: t.successBg, border: `1px solid ${t.successBorder}`, color: t.successText, fontSize: 20, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>✓</div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: t.textPrimary, margin: "0 0 8px", letterSpacing: "-0.5px", textAlign: "center" }}>Senha atualizada!</h1>
            <p style={{ fontSize: 14, color: t.textFaint, margin: "0 0 32px", textAlign: "center", lineHeight: 1.6 }}>Redirecionando para o dashboard...</p>
          </>
        ) : !validSession ? (
          <>
            <div style={{ fontSize: 36, marginBottom: 16 }}>⚠️</div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: t.textPrimary, margin: "0 0 8px", letterSpacing: "-0.5px", textAlign: "center" }}>Link inválido ou expirado</h1>
            <p style={{ fontSize: 14, color: t.textFaint, margin: "0 0 32px", textAlign: "center", lineHeight: 1.6 }}>
              Este link de recuperação expirou ou já foi utilizado. Solicite um novo link abaixo.
            </p>
            <Link to="/forgot-password" style={{ width: "100%" }}>
              <button style={btn}>Solicitar novo link</button>
            </Link>
          </>
        ) : (
          <>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: t.textPrimary, margin: "0 0 8px", letterSpacing: "-0.5px", textAlign: "center" }}>Nova senha</h1>
            <p style={{ fontSize: 14, color: t.textFaint, margin: "0 0 32px", textAlign: "center", lineHeight: 1.6 }}>Escolha uma senha segura para sua conta.</p>

            <form onSubmit={handleSubmit} style={{ width: "100%", display: "flex", flexDirection: "column", gap: 20 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: t.textMuted }}>Nova senha</label>
                <input type="password" placeholder="Mínimo 6 caracteres" value={password} onChange={(e) => setPassword(e.target.value)} required style={inp}
                  onFocus={(e) => (e.target.style.borderColor = t.accent)}
                  onBlur={(e) => (e.target.style.borderColor = t.border)} />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: t.textMuted }}>Confirmar senha</label>
                <input type="password" placeholder="Repita a senha" value={confirm} onChange={(e) => setConfirm(e.target.value)} required style={inp}
                  onFocus={(e) => (e.target.style.borderColor = t.accent)}
                  onBlur={(e) => (e.target.style.borderColor = t.border)} />
              </div>

              {/* Indicador de força de senha */}
              {password.length > 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: -8 }}>
                  <div style={{ flex: 1, height: 4, background: t.bgInset, borderRadius: 99, overflow: "hidden" }}>
                    <div style={{
                      height: "100%", borderRadius: 99, transition: "width 0.3s, background 0.3s",
                      width: password.length >= 10 ? "100%" : password.length >= 6 ? "60%" : "25%",
                      background: password.length >= 10 ? "#22c55e" : password.length >= 6 ? "#f59e0b" : "#ef4444",
                    }} />
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, width: 36, textAlign: "right", color: password.length >= 10 ? "#22c55e" : password.length >= 6 ? "#f59e0b" : "#ef4444" }}>
                    {password.length >= 10 ? "Forte" : password.length >= 6 ? "Média" : "Fraca"}
                  </span>
                </div>
              )}

              {error && (
                <div style={{ background: t.errorBg, border: `1px solid ${t.errorBorder}`, color: t.errorText, borderRadius: 8, padding: "10px 14px", fontSize: 13 }}>
                  {error}
                </div>
              )}

              <button type="submit" disabled={loading || !password || !confirm} style={{ ...btn, opacity: loading || !password || !confirm ? 0.5 : 1 }}>
                {loading ? "Salvando..." : "Salvar nova senha"}
              </button>
            </form>
          </>
        )}

        <Link to="/login" style={{ fontSize: 13, color: t.textFaint, textDecoration: "none", marginTop: 20 }}>
          ← Voltar para o login
        </Link>
      </div>
    </div>
  )
}
