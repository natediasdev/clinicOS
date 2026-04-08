import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'

// ─── Loading screen + Scrollbar global ───────────────────────────────────────
// Injetada diretamente no DOM antes do React montar.
// Cobre o flash de tela preta enquanto o bundle carrega.
// Removida com fade out suave no primeiro requestAnimationFrame após mount.
//
// O scrollbar customizado é injetado aqui junto para garantir que
// esteja disponível desde o primeiro paint, antes do React hidratar.

const CSS = `
  @keyframes _co_ring{to{transform:rotate(360deg)}}
  @keyframes _co_pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.4;transform:scale(.92)}}
  @keyframes _co_bar{0%{width:0}70%{width:85%}100%{width:92%}}
  @keyframes _co_dot{0%,80%,100%{transform:scale(0);opacity:0}40%{transform:scale(1);opacity:1}}
  @keyframes _co_in{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
  @keyframes _co_glow{0%,100%{box-shadow:0 0 20px rgba(59,130,246,.15)}50%{box-shadow:0 0 40px rgba(59,130,246,.3),0 0 80px rgba(59,130,246,.08)}}
  #co-splash{
    position:fixed;inset:0;background:#080f1a;
    display:flex;flex-direction:column;align-items:center;justify-content:center;
    z-index:99999;font-family:'DM Sans','Segoe UI',sans-serif;
  }
  #co-splash.out{animation:_co_out .4s ease forwards}
  @keyframes _co_out{to{opacity:0;pointer-events:none}}
  .co-rw{position:relative;width:80px;height:80px;margin-bottom:28px}
  .co-ring{position:absolute;inset:-6px;border:2px solid transparent;border-top-color:#3b82f6;border-right-color:rgba(59,130,246,.25);border-radius:50%;animation:_co_ring 1.2s linear infinite}
  .co-box{width:80px;height:80px;background:linear-gradient(135deg,#0f1f3d,#1a2d50);border-radius:20px;display:flex;align-items:center;justify-content:center;border:1px solid rgba(59,130,246,.2);animation:_co_glow 2.4s ease-in-out infinite}
  .co-lt{font-size:28px;font-weight:900;letter-spacing:-1px;color:#f8fafc;animation:_co_pulse 2.4s ease-in-out infinite;user-select:none}
  .co-la{color:#3b82f6}
  .co-name{font-size:20px;font-weight:800;color:#f1f5f9;letter-spacing:-.5px;animation:_co_in .5s ease .1s both;margin-bottom:6px}
  .co-msg{font-size:13px;color:#475569;font-weight:500;animation:_co_in .5s ease .2s both;margin-bottom:28px}
  .co-bt{width:180px;height:3px;background:rgba(30,41,59,.8);border-radius:99px;overflow:hidden;animation:_co_in .5s ease .3s both;margin-bottom:20px}
  .co-bf{height:100%;background:linear-gradient(90deg,#1d4ed8,#3b82f6,#60a5fa);border-radius:99px;animation:_co_bar 2s ease-out forwards}
  .co-ds{display:flex;gap:6px;animation:_co_in .5s ease .4s both}
  .co-d{width:6px;height:6px;background:#3b82f6;border-radius:50%;animation:_co_dot 1.4s ease-in-out infinite}

  /* ─── Scrollbar customizada — tema escuro do ClinicOS ─────────────────────
     Largura ligeiramente maior (8px) para melhor usabilidade.
     Usa as mesmas cores do tema dark para consistência visual.
     Firefox usa scrollbar-width/color (valores aproximados).
  ──────────────────────────────────────────────────────────────────────────── */

  /* Webkit (Chrome, Edge, Safari, Opera) */
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  ::-webkit-scrollbar-track {
    background: #0d1829;           /* próximo de t.bgPage dark */
    border-radius: 99px;
  }
  ::-webkit-scrollbar-thumb {
    background: #1e3a5f;           /* azul-acinzentado sutil */
    border-radius: 99px;
    border: 2px solid #0d1829;     /* cria espaçamento visual com o track */
    transition: background .2s;
  }
  ::-webkit-scrollbar-thumb:hover {
    background: #2d5a9e;           /* t.accent mais claro no hover */
  }
  ::-webkit-scrollbar-corner {
    background: #0d1829;
  }

  /* Firefox */
  * {
    scrollbar-width: thin;
    scrollbar-color: #1e3a5f #0d1829;
  }
`

function mountSplash() {
  const s = document.createElement("style")
  s.textContent = CSS
  document.head.appendChild(s)

  const el = document.createElement("div")
  el.id = "co-splash"
  el.innerHTML = `
    <div class="co-rw">
      <div class="co-ring"></div>
      <div class="co-box"><span class="co-lt">C<span class="co-la">O</span></span></div>
    </div>
    <div class="co-name">Clinic<span class="co-la">OS</span></div>
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
