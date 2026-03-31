import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "../../supabaseClient"
import { useTheme } from "../../context/ThemeContext"
import { Button, Input } from "../../components/ui"
import { MotionToast } from "../../components/ui/MotionComponents"

export default function Register() {
  const { t } = useTheme()
  const navigate = useNavigate()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState(null)
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)

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
          data: { name: name.trim() }
        }
      })

      if (authError) {
        if (authError.message.includes("already been registered")) {
          showToast("Este e-mail já está cadastrado. Faça login ou recupere sua senha.", "error")
        } else {
          showToast(authError.message, "error")
        }
        setLoading(false)
        return
      }

      if (!authData.user) {
        showToast("Erro ao criar conta. Tente novamente.", "error")
        setLoading(false)
        return
      }

      const userId = authData.user.id
      await new Promise(r => setTimeout(r, 1000))

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("clinic_id")
        .eq("id", userId)
        .single()

      if (profileError || !profile?.clinic_id) {
        const { data: newClinic, error: clinicError } = await supabase
          .from("clinics")
          .insert([{ name: name.trim() + " Clínica" }])
          .select()
          .single()

        if (clinicError) {
          showToast("Erro ao criar clínica. Tente novamente.", "error")
          setLoading(false)
          return
        }

        await supabase
          .from("profiles")
          .update({ clinic_id: newClinic.id })
          .eq("id", userId)
      }

      showToast("Conta criada! Redirecionando...")
      setTimeout(() => navigate("/onboarding"), 1500)

    } catch (err) {
      showToast("Erro inesperado. Tente novamente.", "error")
    }

    setLoading(false)
  }

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
          border: "1px solid",
          borderRadius: 10,
          padding: "12px 20px",
          fontSize: 14,
          fontWeight: 600,
          boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
          background: toast?.type === "success" ? t.successBg : t.errorBg,
          borderColor: toast?.type === "success" ? t.successBorder : t.errorBorder,
          color: toast?.type === "success" ? t.successText : t.errorText,
          position: "fixed",
          bottom: 24,
          right: 24,
          zIndex: 999,
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
          <div style={{
            fontSize: 28,
            fontWeight: 800,
            color: t.textPrimary,
            letterSpacing: "-0.5px",
            marginBottom: 8,
          }}>
            Clinic<span style={{ color: t.accent }}>OS</span>
          </div>
          <p style={{ color: t.textFaint, fontSize: 14, margin: 0 }}>
            Crie sua conta para começar
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: t.textMuted }}>
              Nome completo
            </label>
            <Input
              type="text"
              placeholder="Seu nome"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: t.textMuted }}>
              E-mail
            </label>
            <Input
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: t.textMuted }}>
              Senha
            </label>
            <Input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: t.textMuted }}>
              Confirmar senha
            </label>
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

        <div style={{
          marginTop: 24,
          textAlign: "center",
          fontSize: 14,
          color: t.textFaint,
        }}>
          Já tem uma conta?{" "}
          <a
            href="/login"
            style={{
              color: t.accent,
              textDecoration: "none",
              fontWeight: 600,
            }}
          >
            Fazer login
          </a>
        </div>
      </div>
    </div>
  )
}
