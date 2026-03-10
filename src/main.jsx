import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'

// Reset global + animações do loader
const resetStyle = document.createElement('style')
resetStyle.textContent = `
  *, *::before, *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }
  html, body, #root {
    width: 100%;
    max-width: 100%;
    min-height: 100vh;
    overflow-x: hidden;
    background: #0a1120;
    -webkit-tap-highlight-color: transparent;
    -webkit-text-size-adjust: 100%;
  }
  input, select, textarea, button {
    font-family: inherit;
  }

  @keyframes clinicos-pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50%       { opacity: 0.6; transform: scale(0.97); }
  }
  @keyframes clinicos-bar {
    0%   { width: 0%; opacity: 1; }
    80%  { width: 85%; opacity: 1; }
    100% { width: 100%; opacity: 0; }
  }
  @keyframes clinicos-fade-in {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes clinicos-dot {
    0%, 80%, 100% { transform: scale(0.5); opacity: 0.2; }
    40%           { transform: scale(1);   opacity: 1; }
  }
  @keyframes clinicos-glow {
    0%, 100% { opacity: 0.4; transform: scale(1); }
    50%       { opacity: 0.8; transform: scale(1.1); }
  }
`
document.head.appendChild(resetStyle)

// ── Loading screen injetada antes do React montar ──────────────────────────
const loaderEl = document.createElement('div')
loaderEl.id = 'clinicos-loader'
loaderEl.style.cssText = `
  position: fixed;
  inset: 0;
  background: #0a1120;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  font-family: 'DM Sans', 'Segoe UI', sans-serif;
`
loaderEl.innerHTML = `
  <div style="
    position: absolute;
    width: 500px; height: 500px;
    background: radial-gradient(circle, #3b82f614 0%, transparent 70%);
    border-radius: 50%;
    pointer-events: none;
    animation: clinicos-glow 3s ease-in-out infinite;
  "></div>

  <div style="
    animation: clinicos-fade-in 0.5s ease forwards, clinicos-pulse 2.8s ease-in-out 0.6s infinite;
    text-align: center;
    margin-bottom: 44px;
    position: relative;
  ">
    <div style="
      font-size: 40px;
      font-weight: 800;
      color: #f8fafc;
      letter-spacing: -1.5px;
      line-height: 1;
    ">
      Clinic<span style="color: #3b82f6;">OS</span>
    </div>
    <div style="
      font-size: 11px;
      color: #1e3a5f;
      margin-top: 8px;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      font-weight: 700;
    ">Gestão Clínica</div>
  </div>

  <div style="
    width: 140px; height: 2px;
    background: #0f172a;
    border-radius: 99px;
    overflow: hidden;
    margin-bottom: 32px;
    animation: clinicos-fade-in 0.5s ease 0.2s both;
  ">
    <div style="
      height: 100%;
      background: linear-gradient(90deg, #1d4ed8, #3b82f6, #93c5fd);
      border-radius: 99px;
      animation: clinicos-bar 1.8s ease-in-out 0.4s infinite;
    "></div>
  </div>

  <div style="
    display: flex; gap: 7px;
    animation: clinicos-fade-in 0.5s ease 0.3s both;
  ">
    <div style="width:5px;height:5px;background:#3b82f6;border-radius:50%;animation:clinicos-dot 1.3s ease 0s infinite;"></div>
    <div style="width:5px;height:5px;background:#3b82f6;border-radius:50%;animation:clinicos-dot 1.3s ease 0.2s infinite;"></div>
    <div style="width:5px;height:5px;background:#3b82f6;border-radius:50%;animation:clinicos-dot 1.3s ease 0.4s infinite;"></div>
  </div>
`
document.body.appendChild(loaderEl)

// Remove o loader com fade quando o React terminar de montar
function removeLoader() {
  const loader = document.getElementById('clinicos-loader')
  if (!loader) return
  loader.style.transition = 'opacity 0.4s ease'
  loader.style.opacity = '0'
  setTimeout(() => loader.remove(), 400)
}

ReactDOM.createRoot(document.getElementById('root')).render(
  
    <ThemeProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ThemeProvider>
  
)

// Remove o loader assim que o primeiro frame renderizar
requestAnimationFrame(() => requestAnimationFrame(removeLoader))
