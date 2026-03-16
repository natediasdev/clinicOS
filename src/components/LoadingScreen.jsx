/**
 * LoadingScreen.jsx
 * Tela de carregamento animada do ClinicOS.
 * Usada em: App.jsx (PrivateRoute, PublicRoute, OnboardingRoute, App)
 * Zero dependências externas — CSS puro via <style> injetado.
 */

const STYLES = `
  @keyframes cos-pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50%       { opacity: 0.4; transform: scale(0.92); }
  }
  @keyframes cos-bar {
    0%   { width: 0%; opacity: 1; }
    70%  { width: 85%; opacity: 1; }
    100% { width: 92%; opacity: 0.7; }
  }
  @keyframes cos-dot {
    0%, 80%, 100% { transform: scale(0); opacity: 0; }
    40%           { transform: scale(1); opacity: 1; }
  }
  @keyframes cos-fadein {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes cos-ring {
    0%   { transform: rotate(0deg);   }
    100% { transform: rotate(360deg); }
  }
  @keyframes cos-glow {
    0%, 100% { box-shadow: 0 0 20px rgba(59,130,246,0.15); }
    50%       { box-shadow: 0 0 40px rgba(59,130,246,0.35), 0 0 80px rgba(59,130,246,0.1); }
  }
`

let stylesInjected = false
function injectStyles() {
  if (stylesInjected) return
  const el = document.createElement("style")
  el.textContent = STYLES
  document.head.appendChild(el)
  stylesInjected = true
}

export default function LoadingScreen({ message = "Carregando..." }) {
  injectStyles()

  return (
    <div style={{
      position: "fixed", inset: 0,
      background: "#080f1a",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      gap: 0, zIndex: 9999,
      fontFamily: "'DM Sans','Segoe UI',sans-serif",
    }}>

      {/* Anel giratório ao redor do logo */}
      <div style={{ position: "relative", width: 80, height: 80, marginBottom: 28 }}>
        {/* Anel externo */}
        <div style={{
          position: "absolute", inset: -6,
          border: "2px solid transparent",
          borderTopColor: "#3b82f6",
          borderRightColor: "rgba(59,130,246,0.3)",
          borderRadius: "50%",
          animation: "cos-ring 1.2s linear infinite",
        }} />
        {/* Logo box */}
        <div style={{
          width: 80, height: 80,
          background: "linear-gradient(135deg, #0f1f3d, #1a2d50)",
          borderRadius: 20,
          display: "flex", alignItems: "center", justifyContent: "center",
          border: "1px solid rgba(59,130,246,0.2)",
          animation: "cos-glow 2.4s ease-in-out infinite",
        }}>
          <span style={{
            fontSize: 28, fontWeight: 900, letterSpacing: "-1px",
            color: "#f8fafc",
            animation: "cos-pulse 2.4s ease-in-out infinite",
            userSelect: "none",
          }}>
            C<span style={{ color: "#3b82f6" }}>O</span>
          </span>
        </div>
      </div>

      {/* Nome do produto */}
      <div style={{
        animation: "cos-fadein 0.5s ease both",
        animationDelay: "0.1s",
        marginBottom: 6,
      }}>
        <span style={{ fontSize: 20, fontWeight: 800, color: "#f1f5f9", letterSpacing: "-0.5px" }}>
          Clinic<span style={{ color: "#3b82f6" }}>OS</span>
        </span>
      </div>

      {/* Mensagem */}
      <div style={{
        animation: "cos-fadein 0.5s ease both",
        animationDelay: "0.2s",
        marginBottom: 28,
      }}>
        <span style={{ fontSize: 13, color: "#475569", fontWeight: 500 }}>
          {message}
        </span>
      </div>

      {/* Barra de progresso */}
      <div style={{
        width: 180, height: 3,
        background: "rgba(30,41,59,0.8)",
        borderRadius: 99, overflow: "hidden",
        animation: "cos-fadein 0.5s ease both",
        animationDelay: "0.3s",
        marginBottom: 20,
      }}>
        <div style={{
          height: "100%",
          background: "linear-gradient(90deg, #1d4ed8, #3b82f6, #60a5fa)",
          borderRadius: 99,
          animation: "cos-bar 2s ease-out forwards",
        }} />
      </div>

      {/* Dots */}
      <div style={{
        display: "flex", gap: 6,
        animation: "cos-fadein 0.5s ease both",
        animationDelay: "0.4s",
      }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            width: 6, height: 6,
            background: "#3b82f6",
            borderRadius: "50%",
            animation: `cos-dot 1.4s ease-in-out infinite`,
            animationDelay: `${i * 0.16}s`,
          }} />
        ))}
      </div>
    </div>
  )
}
