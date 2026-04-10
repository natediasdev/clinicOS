/**
 * LoadingScreen.jsx
 * Tela de carregamento animada do ClinicOS.
 * Usada em: App.jsx (PrivateRoute, PublicRoute, OnboardingRoute, App)
 * Zero dependências externas — CSS puro via <style> injetado.
 */

const STYLES = `
  @keyframes cos-ring {
    to { transform: rotate(360deg); }
  }
  @keyframes cos-fadein {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes cos-breathe {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0.5; }
  }
`

const SYMBOL = (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" fill="none" style={{ width: 64, height: 64 }}>
    <path
      d="M 54.58 27.56 A 20.62 20.62 0 1 0 54.58 52.44 L 54.58 47.47 A 15.64 15.64 0 1 1 54.58 32.53 Z"
      fill="white"
    />
    <polyline
      points="54.58,40.0 58.49,40.0 60.62,33.6 63.47,47.11 65.96,33.6 68.8,46.4 70.58,40.0 77.69,40.0"
      fill="none" stroke="white" strokeWidth="1.24"
      strokeLinecap="round" strokeLinejoin="round" opacity="0.9"
    />
  </svg>
)

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
      gap: 20, zIndex: 9999,
      fontFamily: "'DM Sans','Segoe UI',sans-serif",
    }}>

      {/* Símbolo + anel */}
      <div style={{ position: "relative", width: 64, height: 64 }}>
        <div style={{
          position: "absolute", inset: -10,
          border: "1.5px solid transparent",
          borderTopColor: "#1976D2",
          borderRightColor: "rgba(25,118,210,0.2)",
          borderRadius: "50%",
          animation: "cos-ring 1.4s linear infinite",
        }} />
        <div style={{
          width: 64, height: 64,
          display: "flex", alignItems: "center", justifyContent: "center",
          animation: "cos-breathe 2.8s ease-in-out infinite",
        }}>
          {SYMBOL}
        </div>
      </div>

      {/* Nome + mensagem */}
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
        animation: "cos-fadein 0.4s ease 0.15s both",
      }}>
        <span style={{ fontSize: 18, fontWeight: 800, color: "#f1f5f9", letterSpacing: "-0.5px" }}>
          Clinic<span style={{ color: "#1976D2" }}>OS</span>
        </span>
        <span style={{ fontSize: 12, color: "#334155", fontWeight: 500 }}>
          {message}
        </span>
      </div>

    </div>
  )
}
