import { useState, useEffect } from "react"
import { supabase } from "../../supabaseClient"
import { Link, useNavigate } from "react-router-dom"

export default function ResetPassword() {
  const navigate = useNavigate()
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [done, setDone] = useState(false)
  const [validSession, setValidSession] = useState(false)
  const [checking, setChecking] = useState(true)

  // O Supabase injeta o token na URL como hash — precisamos capturar a sessão
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

  if (checking) return null

  return (
    <div style={s.page}>
      <div style={s.card}>
        <Link to="/" style={s.logo}>
          Clinic<span style={s.logoAccent}>OS</span>
        </Link>

        {done ? (
          <>
            <div style={s.successIcon}>✓</div>
            <h1 style={s.title}>Senha atualizada!</h1>
            <p style={s.sub}>Redirecionando para o dashboard...</p>
          </>
        ) : !validSession ? (
          <>
            <div style={s.errorIcon}>⚠️</div>
            <h1 style={s.title}>Link inválido ou expirado</h1>
            <p style={s.sub}>
              Este link de recuperação expirou ou já foi utilizado.
              Solicite um novo link abaixo.
            </p>
            <Link to="/forgot-password" style={{ width: "100%" }}>
              <button style={s.btn}>Solicitar novo link</button>
            </Link>
          </>
        ) : (
          <>
            <h1 style={s.title}>Nova senha</h1>
            <p style={s.sub}>Escolha uma senha segura para sua conta.</p>

            <form onSubmit={handleSubmit} style={s.form}>
              <div style={s.field}>
                <label style={s.label}>Nova senha</label>
                <input
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={s.input}
                  onFocus={(e) => (e.target.style.borderColor = "#3b82f6")}
                  onBlur={(e) => (e.target.style.borderColor = "#1e293b")}
                />
              </div>

              <div style={s.field}>
                <label style={s.label}>Confirmar senha</label>
                <input
                  type="password"
                  placeholder="Repita a senha"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  style={s.input}
                  onFocus={(e) => (e.target.style.borderColor = "#3b82f6")}
                  onBlur={(e) => (e.target.style.borderColor = "#1e293b")}
                />
              </div>

              {/* Indicador de força de senha */}
              {password.length > 0 && (
                <div style={s.strengthWrap}>
                  <div style={s.strengthTrack}>
                    <div style={{
                      ...s.strengthFill,
                      width: password.length >= 10 ? "100%" : password.length >= 6 ? "60%" : "25%",
                      background: password.length >= 10 ? "#22c55e" : password.length >= 6 ? "#f59e0b" : "#ef4444",
                    }} />
                  </div>
                  <span style={{ ...s.strengthLabel, color: password.length >= 10 ? "#22c55e" : password.length >= 6 ? "#f59e0b" : "#ef4444" }}>
                    {password.length >= 10 ? "Forte" : password.length >= 6 ? "Média" : "Fraca"}
                  </span>
                </div>
              )}

              {error && <div style={s.errorBox}>{error}</div>}

              <button
                type="submit"
                disabled={loading || !password || !confirm}
                style={loading || !password || !confirm ? { ...s.btn, opacity: 0.5 } : s.btn}
              >
                {loading ? "Salvando..." : "Salvar nova senha"}
              </button>
            </form>
          </>
        )}

        <Link to="/login" style={s.backLink}>
          ← Voltar para o login
        </Link>
      </div>
    </div>
  )
}

const s = {
  page: {
    minHeight: "100vh",
    background: "#0a1120",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
    padding: "24px",
  },
  card: {
    background: "#0f172a",
    border: "1px solid #1e293b",
    borderRadius: 16,
    padding: "48px 40px",
    width: "100%",
    maxWidth: 420,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  logo: {
    fontSize: 22,
    fontWeight: 800,
    color: "#f8fafc",
    textDecoration: "none",
    letterSpacing: "-0.5px",
    marginBottom: 32,
  },
  logoAccent: { color: "#3b82f6" },
  successIcon: {
    width: 48, height: 48, borderRadius: "50%",
    background: "#052e16", border: "1px solid #166534",
    color: "#22c55e", fontSize: 20, fontWeight: 800,
    display: "flex", alignItems: "center", justifyContent: "center",
    marginBottom: 16,
  },
  errorIcon: { fontSize: 36, marginBottom: 16 },
  title: {
    fontSize: 24,
    fontWeight: 800,
    color: "#f8fafc",
    margin: "0 0 8px",
    letterSpacing: "-0.5px",
    textAlign: "center",
  },
  sub: {
    fontSize: 14,
    color: "#475569",
    margin: "0 0 32px",
    textAlign: "center",
    lineHeight: 1.6,
  },
  form: {
    width: "100%",
    display: "flex",
    flexDirection: "column",
    gap: 20,
  },
  field: { display: "flex", flexDirection: "column", gap: 6 },
  label: { fontSize: 13, fontWeight: 600, color: "#94a3b8" },
  input: {
    background: "#1e293b",
    border: "1px solid #1e293b",
    borderRadius: 8,
    padding: "11px 14px",
    fontSize: 14,
    color: "#f1f5f9",
    outline: "none",
    transition: "border-color 0.2s",
    width: "100%",
    boxSizing: "border-box",
  },
  strengthWrap: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginTop: -8,
  },
  strengthTrack: {
    flex: 1,
    height: 4,
    background: "#1e293b",
    borderRadius: 99,
    overflow: "hidden",
  },
  strengthFill: {
    height: "100%",
    borderRadius: 99,
    transition: "width 0.3s, background 0.3s",
  },
  strengthLabel: {
    fontSize: 11,
    fontWeight: 700,
    width: 36,
    textAlign: "right",
  },
  errorBox: {
    background: "#450a0a",
    border: "1px solid #7f1d1d",
    color: "#fca5a5",
    borderRadius: 8,
    padding: "10px 14px",
    fontSize: 13,
  },
  btn: {
    background: "#3b82f6",
    border: "none",
    borderRadius: 8,
    padding: "13px",
    fontSize: 15,
    fontWeight: 700,
    color: "#fff",
    cursor: "pointer",
    width: "100%",
    marginTop: 4,
  },
  backLink: {
    fontSize: 13,
    color: "#334155",
    textDecoration: "none",
    marginTop: 20,
  },
}
