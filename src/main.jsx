import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'

// ─── Loading screen + Scrollbar global ───────────────────────────────────────
// Injetada diretamente no DOM antes do React montar.
// Cobre o flash de tela preta enquanto o bundle carrega.
// Removida com fade out suave no primeiro requestAnimationFrame após mount.

const CSS = `
  @keyframes _co_ring{to{transform:rotate(360deg)}}
  @keyframes _co_pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.4;transform:scale(.92)}}
  @keyframes _co_bar{0%{width:0}70%{width:85%}100%{width:92%}}
  @keyframes _co_dot{0%,80%,100%{transform:scale(0);opacity:0}40%{transform:scale(1);opacity:1}}
  @keyframes _co_in{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
  #co-splash{
    position:fixed;inset:0;background:#080f1a;
    display:flex;flex-direction:column;align-items:center;justify-content:center;
    z-index:99999;font-family:'DM Sans','Segoe UI',sans-serif;
  }
  #co-splash.out{animation:_co_out .4s ease forwards}
  @keyframes _co_out{to{opacity:0;pointer-events:none}}
  .co-rw{position:relative;width:80px;height:80px;margin-bottom:28px}
  .co-ring{
    position:absolute;inset:-8px;
    border:2px solid transparent;
    border-top-color:#1976D2;
    border-right-color:rgba(25,118,210,0.25);
    border-radius:50%;
    animation:_co_ring 1.2s linear infinite
  }
  .co-sym{
    width:80px;height:80px;
    display:flex;align-items:center;justify-content:center;
  }
  .co-sym svg{width:80px;height:80px}
  .co-name{font-size:20px;font-weight:800;color:#f1f5f9;letter-spacing:-.5px;animation:_co_in .5s ease .1s both;margin-bottom:6px}
  .co-msg{font-size:13px;color:#475569;font-weight:500;animation:_co_in .5s ease .2s both;margin-bottom:28px}
  .co-bt{width:180px;height:3px;background:rgba(30,41,59,.8);border-radius:99px;overflow:hidden;animation:_co_in .5s ease .3s both;margin-bottom:20px}
  .co-bf{height:100%;background:linear-gradient(90deg,#1565C0,#1976D2,#42A5F5);border-radius:99px;animation:_co_bar 2s ease-out forwards}
  .co-ds{display:flex;gap:6px;animation:_co_in .5s ease .4s both}
  .co-d{width:6px;height:6px;background:#1976D2;border-radius:50%;animation:_co_dot 1.4s ease-in-out infinite}
`

// SVG do símbolo isolado (C + pulso, sem fundo)
const SYMBOL_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" fill="none">
  <path d="M 54.58 27.56 A 20.62 20.62 0 1 0 54.58 52.44 L 54.58 47.47 A 15.64 15.64 0 1 1 54.58 32.53 Z" fill="white"/>
  <polyline points="54.58,40.0 58.49,40.0 60.62,33.6 63.47,47.11 65.96,33.6 68.8,46.4 70.58,40.0 77.69,40.0"
    fill="none" stroke="white" stroke-width="1.24" stroke-linecap="round" stroke-linejoin="round" opacity="0.9"/>
</svg>`

function mountSplash() {
  const s = document.createElement("style")
  s.textContent = CSS
  document.head.appendChild(s)

  const el = document.createElement("div")
  el.id = "co-splash"
  el.innerHTML = `
    <div class="co-rw">
      <div class="co-ring"></div>
      <div class="co-sym">${SYMBOL_SVG}</div>
    </div>
    <div class="co-name">Clinic<span style="color:#1976D2">OS</span></div>
    <div class="co-msg">Iniciando...</div>
    <div class="co-bt"><div class="co-bf"></div></div>
    <div class="co-ds">
      <div class="co-d" style="animation-delay:0s"></div>
      <div class="co-d" style="animation-delay:.16s"></div>
      <div class="co-d" style="animation-delay:.32s"></div>
    </div>
  `
  document.body.appendChild(el)
  return el
}

function removeSplash(el) {
  if (!el) return
  el.classList.add("out")
  setTimeout(() => el?.remove(), 420)
}

const splash = mountSplash()

// ─── React ────────────────────────────────────────────────────────────────────

ReactDOM.createRoot(document.getElementById('root')).render(
  <ThemeProvider>
    <AuthProvider>
      <App />
    </AuthProvider>
  </ThemeProvider>
)

// Remove splash depois do React pintar o primeiro frame
requestAnimationFrame(() => requestAnimationFrame(() => removeSplash(splash)))
