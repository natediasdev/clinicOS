import { useState } from "react"
import { useAuth } from "../../context/AuthContext"
import { useNavigate, Link } from "react-router-dom"
import ParticleBackground from "../../components/ParticleBackground"

function getColors() {
  return { bg:"#080f1a", card:"#0f172a", border:"#1e293b", input:"#1a2744", textP:"#f8fafc", textM:"#475569", textL:"#94a3b8" }
}

export default function Login() {
  const { login } = useAuth()
  const navigate  = useNavigate()
  const c         = getColors()

  const [email,    setEmail]    = useState("")
  const [password, setPassword] = useState("")
  const [error,    setError]    = useState(null)
  const [loading,  setLoading]  = useState(false)
  const [accepted, setAccepted] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault(); setError(null); setLoading(true)
    const { error } = await login(email, password)
    setLoading(false)
    if (error) setError(error.message); else navigate("/dashboard")
  }

  const inp = {
    background: c.input, border:`1px solid ${c.border}`, borderRadius:8,
    padding:"11px 14px", fontSize:14, color:c.textP, outline:"none",
    transition:"border-color 0.2s", width:"100%", boxSizing:"border-box",
  }

  return (
    <div style={{
      minHeight:"100vh", background:c.bg,
      display:"flex", alignItems:"center", justifyContent:"center",
      fontFamily:"'DM Sans','Segoe UI',sans-serif", padding:24,
      position:"relative", overflow:"hidden",
    }}>
      {/* Background Canvas animado */}
      <ParticleBackground color="#3b82f6" count={55} speed={0.35} opacity={0.13}/>

      {/* Glow central suave */}
      <div style={{
        position:"absolute", width:600, height:600, borderRadius:"50%",
        background:"radial-gradient(circle, rgba(59,130,246,0.07) 0%, transparent 70%)",
        top:"50%", left:"50%", transform:"translate(-50%,-50%)",
        pointerEvents:"none",
      }}/>

      {/* Card */}
      <div style={{
        background:"rgba(15,23,42,0.9)", border:`1px solid rgba(30,41,59,0.8)`,
        borderRadius:16, padding:"48px 40px", width:"100%", maxWidth:420,
        display:"flex", flexDirection:"column", alignItems:"center",
        backdropFilter:"blur(12px)",
        boxShadow:"0 24px 64px rgba(0,0,0,0.5), 0 0 0 1px rgba(59,130,246,0.05)",
        position:"relative", zIndex:1,
      }}>

        {/* Logo */}
        <Link to="/" style={{ textDecoration:"none", marginBottom:32 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{
              width:40, height:40,
              background:"linear-gradient(135deg,#0f1f3d,#1a2d50)",
              borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center",
              border:"1px solid rgba(59,130,246,0.2)",
              boxShadow:"0 0 20px rgba(59,130,246,0.1)",
            }}>
              <span style={{ fontSize:16, fontWeight:900, color:"#f8fafc" }}>C<span style={{ color:"#3b82f6" }}>O</span></span>
            </div>
            <span style={{ fontSize:20, fontWeight:800, color:c.textP, letterSpacing:"-0.5px" }}>
              Clinic<span style={{ color:"#3b82f6" }}>OS</span>
            </span>
          </div>
        </Link>

        <h1 style={{ fontSize:22, fontWeight:800, color:c.textP, margin:"0 0 8px", letterSpacing:"-0.5px", textAlign:"center" }}>
          Bem-vindo de volta
        </h1>
        <p style={{ fontSize:14, color:c.textM, margin:"0 0 32px", textAlign:"center" }}>
          Entre na sua conta para continuar
        </p>

        <form onSubmit={handleLogin} style={{ width:"100%", display:"flex", flexDirection:"column", gap:20 }}>
          <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
            <label style={{ fontSize:13, fontWeight:600, color:c.textL }}>E-mail</label>
            <input type="email" placeholder="seuemail@clinica.com" value={email}
              onChange={e=>setEmail(e.target.value)} required style={inp}
              onFocus={e=>e.target.style.borderColor="#3b82f6"}
              onBlur={e=>e.target.style.borderColor=c.border}/>
          </div>

          <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <label style={{ fontSize:13, fontWeight:600, color:c.textL }}>Senha</label>
              <Link to="/forgot-password" style={{ fontSize:12, color:c.textM, textDecoration:"none", fontWeight:500 }}>
                Esqueci a senha
              </Link>
            </div>
            <input type="password" placeholder="••••••••" value={password}
              onChange={e=>setPassword(e.target.value)} required style={inp}
              onFocus={e=>e.target.style.borderColor="#3b82f6"}
              onBlur={e=>e.target.style.borderColor=c.border}/>
          </div>

          {/* Aceite dos termos */}
          <div style={{ display:"flex", alignItems:"flex-start", gap:10 }}>
            <input type="checkbox" id="terms" checked={accepted} onChange={e=>setAccepted(e.target.checked)}
              style={{ marginTop:3, accentColor:"#3b82f6", flexShrink:0, cursor:"pointer" }}/>
            <label htmlFor="terms" style={{ fontSize:12, color:c.textL, lineHeight:1.6, cursor:"pointer" }}>
              Ao entrar, você concorda com os{" "}
              <Link to="/terms" style={{ color:"#3b82f6", textDecoration:"none", fontWeight:600 }}>Termos de Uso</Link>
              {" "}e a{" "}
              <Link to="/privacy" style={{ color:"#3b82f6", textDecoration:"none", fontWeight:600 }}>Política de Privacidade</Link>
            </label>
          </div>

          {error && (
            <div style={{ background:"#450a0a", border:"1px solid #7f1d1d", color:"#fca5a5", borderRadius:8, padding:"10px 14px", fontSize:13 }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading||!accepted} style={{
            background:"#3b82f6", border:"none", borderRadius:8, padding:13,
            fontSize:15, fontWeight:700, color:"#fff", cursor:"pointer",
            width:"100%", marginTop:4, opacity:loading||!accepted?0.5:1,
            transition:"all .2s", boxShadow:"0 4px 16px rgba(59,130,246,0.25)",
          }}>
            {loading ? "Entrando..." : "Entrar →"}
          </button>
        </form>

        <p style={{ fontSize:13, color:c.textM, marginTop:28, textAlign:"center" }}>
          Não tem conta?{" "}
          <Link to="/register" style={{ color:"#3b82f6", fontWeight:600, textDecoration:"none" }}>
            Criar conta grátis
          </Link>
        </p>
        <Link to="/" style={{ fontSize:13, color:c.textM, textDecoration:"none", marginTop:12, opacity:0.5 }}>
          ← Voltar para o início
        </Link>
      </div>
    </div>
  )
}
