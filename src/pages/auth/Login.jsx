import { useState } from "react"
import { useAuth } from "../../context/AuthContext"
import { useNavigate, Link } from "react-router-dom"

// Login está fora do ThemeProvider — usa preferência do sistema
function getColors() {
  const dark = window.matchMedia("(prefers-color-scheme: dark)").matches
  return dark
    ? { bg:"#0a1120", card:"#0f172a", border:"#1e293b", input:"#1e293b", textP:"#f8fafc", textM:"#475569", textL:"#94a3b8" }
    : { bg:"#f1f5f9", card:"#ffffff", border:"#e2e8f0", input:"#f8fafc", textP:"#0f172a", textM:"#64748b", textL:"#475569" }
}

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const c = getColors()
  const [email, setEmail] = useState(""); const [password, setPassword] = useState("")
  const [error, setError] = useState(null); const [loading, setLoading] = useState(false)
  const [accepted, setAccepted] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault(); setError(null); setLoading(true)
    const { error } = await login(email, password)
    setLoading(false)
    if (error) setError(error.message); else navigate("/dashboard")
  }

  const inp = { background:c.input, border:`1px solid ${c.border}`, borderRadius:8, padding:"11px 14px", fontSize:14, color:c.textP, outline:"none", transition:"border-color 0.2s", width:"100%", boxSizing:"border-box" }

  return (
    <div style={{ minHeight:"100vh", width:"100%", background:c.bg, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'DM Sans','Segoe UI',sans-serif", padding:"16px", boxSizing:"border-box" }}>
      <div style={{ background:c.card, border:`1px solid ${c.border}`, borderRadius:16, padding:"40px 24px", width:"100%", maxWidth:420, display:"flex", flexDirection:"column", alignItems:"center", boxSizing:"border-box" }}>
        <Link to="/" style={{ fontSize:22, fontWeight:800, color:c.textP, textDecoration:"none", letterSpacing:"-0.5px", marginBottom:32 }}>
          Clinic<span style={{ color:"#3b82f6" }}>OS</span>
        </Link>
        <h1 style={{ fontSize:22, fontWeight:800, color:c.textP, margin:"0 0 8px", letterSpacing:"-0.5px", textAlign:"center" }}>Bem-vindo de volta</h1>
        <p style={{ fontSize:14, color:c.textM, margin:"0 0 32px", textAlign:"center" }}>Entre na sua conta para continuar</p>

        <form onSubmit={handleLogin} style={{ width:"100%", display:"flex", flexDirection:"column", gap:20 }}>
          <div style={{ display:"flex",flexDirection:"column",gap:6 }}>
            <label style={{ fontSize:13,fontWeight:600,color:c.textL }}>E-mail</label>
            <input type="email" placeholder="seuemail@clinica.com" value={email} onChange={e=>setEmail(e.target.value)} required style={inp}
              onFocus={e=>e.target.style.borderColor="#3b82f6"} onBlur={e=>e.target.style.borderColor=c.border} />
          </div>
          <div style={{ display:"flex",flexDirection:"column",gap:6 }}>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
              <label style={{ fontSize:13,fontWeight:600,color:c.textL }}>Senha</label>
              <Link to="/forgot-password" style={{ fontSize:12,color:c.textM,textDecoration:"none",fontWeight:500 }}>Esqueci a senha</Link>
            </div>
            <input type="password" placeholder="••••••••" value={password} onChange={e=>setPassword(e.target.value)} required style={inp}
              onFocus={e=>e.target.style.borderColor="#3b82f6"} onBlur={e=>e.target.style.borderColor=c.border} />
          </div>

          <div style={{ display:"flex", alignItems:"flex-start", gap:10 }}>
            <input type="checkbox" id="terms" checked={accepted} onChange={e=>setAccepted(e.target.checked)}
              style={{ marginTop:3, accentColor:"#3b82f6", flexShrink:0, cursor:"pointer" }} />
            <label htmlFor="terms" style={{ fontSize:12, color:c.textL, lineHeight:1.6, cursor:"pointer" }}>
              Ao entrar, você concorda com os{" "}
              <Link to="/terms" style={{ color:"#3b82f6", textDecoration:"none", fontWeight:600 }}>Termos de Uso</Link>
              {" "}e a{" "}
              <Link to="/privacy" style={{ color:"#3b82f6", textDecoration:"none", fontWeight:600 }}>Política de Privacidade</Link>
            </label>
          </div>
          {error && <div style={{ background:"#450a0a",border:"1px solid #7f1d1d",color:"#fca5a5",borderRadius:8,padding:"10px 14px",fontSize:13 }}>{error}</div>}
          <button type="submit" disabled={loading || !accepted} style={{ background:"#3b82f6",border:"none",borderRadius:8,padding:13,fontSize:15,fontWeight:700,color:"#fff",cursor:"pointer",width:"100%",marginTop:4,opacity:loading?0.6:1 }}>
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <p style={{ fontSize:13,color:c.textM,marginTop:28,textAlign:"center" }}>
          Não tem conta?{" "}<Link to="/register" style={{ color:"#3b82f6",fontWeight:600,textDecoration:"none" }}>Criar conta grátis</Link>
        </p>
        <Link to="/" style={{ fontSize:13,color:c.textM,textDecoration:"none",marginTop:12,opacity:0.6 }}>← Voltar para o início</Link>
      </div>
    </div>
  )
}
