import { useState } from "react"
import { supabase } from "../../supabaseClient"
import { Link } from "react-router-dom"

export default function ForgotPassword() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    setLoading(false)
    if (error) setError(error.message)
    else setSent(true)
  }

  return (
    <div style={s.page}>
      <div style={s.card}>
        <Link to="/" style={s.logo}>
          Clinic<span style={s.logoAccent}>OS</span>
        </Link>

        {sent ? (
          <>
            <div style={s.successIcon}>✉️</div>
            <h1 style={s.title}>Verifique seu e-mail</h1>
            <p style={s.sub}>
              Enviamos um link de recuperação para <strong style={{ color: "#cbd5e1" }}>{email}</strong>.
              Verifique sua caixa de entrada e a pasta de spam.
            </p>
            <Link to="/login" style={{ width: "100%", marginTop: 8 }}>
              <button style={s.btn}>Voltar para o login</button>
            </Link>
          </>
        ) : (
          <>
            <h1 style={s.title}>Recuperar senha</h1>
            <p style={s.sub}>
              Informe seu e-mail e enviaremos um link para criar uma nova senha.
            </p>

            <form onSubmit={handleSubmit} style={s.form}>
              <div style={s.field}>
                <label style={s.label}>E-mail</label>
                <input
                  type="email"
                  placeholder="seuemail@clinica.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={s.input}
                  onFocus={(e) => (e.target.style.borderColor = "#3b82f6")}
                  onBlur={(e) => (e.target.style.borderColor = "#1e293b")}
                />
              </div>

              {error && <div style={s.errorBox}>{error}</div>}

              <button
                type="submit"
                disabled={loading || !email}
                style={loading || !email ? { ...s.btn, opacity: 0.5 } : s.btn}
              >
                {loading ? "Enviando..." : "Enviar link de recuperação"}
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
  successIcon: { fontSize: 40, marginBottom: 16 },
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
