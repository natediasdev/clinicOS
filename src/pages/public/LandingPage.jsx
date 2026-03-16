import { Link } from "react-router-dom"
import { useState, useEffect, useRef, useCallback } from "react"

// ─── GSAP via CDN (sem instalar pacote) ──────────────────────────────────────
function useGSAP(callback) {
  const ready = useRef(false)
  useEffect(() => {
    if (ready.current) return
    if (window.gsap && window.ScrollTrigger) { ready.current = true; callback(window.gsap, window.ScrollTrigger); return }
    const gsapScript = document.createElement("script")
    gsapScript.src = "https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"
    gsapScript.onload = () => {
      const stScript = document.createElement("script")
      stScript.src = "https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js"
      stScript.onload = () => {
        window.gsap.registerPlugin(window.ScrollTrigger)
        ready.current = true
        callback(window.gsap, window.ScrollTrigger)
      }
      document.head.appendChild(stScript)
    }
    document.head.appendChild(gsapScript)
  }, [])
}

// ─── CSS global ───────────────────────────────────────────────────────────────
const LP_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:ital,wght@0,400;0,500;0,600;1,400&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .lp-root {
    background: #060d1a;
    color: #e2e8f0;
    font-family: 'DM Sans', 'Segoe UI', sans-serif;
    overflow-x: hidden;
    min-height: 100vh;
  }

  /* Noise texture overlay */
  .lp-root::before {
    content: '';
    position: fixed;
    inset: 0;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.025'/%3E%3C/svg%3E");
    pointer-events: none;
    z-index: 0;
    opacity: 0.4;
  }

  /* ── Nav ── */
  .lp-nav {
    position: fixed; top: 0; left: 0; right: 0; z-index: 100;
    display: flex; align-items: center; justify-content: space-between;
    padding: 20px 60px;
    transition: background .3s, border-color .3s, backdrop-filter .3s;
  }
  .lp-nav.scrolled {
    background: rgba(6,13,26,0.85);
    backdrop-filter: blur(16px);
    border-bottom: 1px solid rgba(30,41,59,0.8);
  }
  .lp-nav-logo {
    font-family: 'Syne', sans-serif;
    font-size: 22px; font-weight: 800;
    color: #f8fafc; letter-spacing: -0.5px;
    text-decoration: none;
  }
  .lp-nav-logo span { color: #3b82f6; }
  .lp-nav-links { display: flex; gap: 32px; }
  .lp-nav-link {
    font-size: 14px; font-weight: 500; color: #64748b;
    text-decoration: none; transition: color .2s;
  }
  .lp-nav-link:hover { color: #f1f5f9; }
  .lp-nav-actions { display: flex; gap: 10px; }

  /* ── Buttons ── */
  .lp-btn-outline {
    background: transparent; border: 1px solid #1e293b;
    color: #94a3b8; padding: 8px 20px; border-radius: 8px;
    font-size: 14px; font-weight: 600; cursor: pointer;
    transition: all .2s; font-family: inherit;
  }
  .lp-btn-outline:hover { border-color: #3b82f6; color: #f1f5f9; }
  .lp-btn-primary {
    background: #3b82f6; border: none;
    color: #fff; padding: 8px 20px; border-radius: 8px;
    font-size: 14px; font-weight: 700; cursor: pointer;
    transition: all .2s; font-family: inherit;
  }
  .lp-btn-primary:hover { background: #2563eb; transform: translateY(-1px); box-shadow: 0 8px 24px rgba(59,130,246,.3); }
  .lp-btn-hero {
    background: #3b82f6; border: none; color: #fff;
    padding: 16px 36px; border-radius: 10px;
    font-size: 16px; font-weight: 700; cursor: pointer;
    transition: all .25s; font-family: inherit;
    box-shadow: 0 4px 24px rgba(59,130,246,.25);
  }
  .lp-btn-hero:hover { background: #2563eb; transform: translateY(-2px); box-shadow: 0 8px 32px rgba(59,130,246,.4); }
  .lp-btn-ghost {
    background: transparent; border: 1px solid #1e293b;
    color: #94a3b8; padding: 16px 36px; border-radius: 10px;
    font-size: 16px; font-weight: 600; cursor: pointer;
    transition: all .25s; font-family: inherit;
  }
  .lp-btn-ghost:hover { border-color: #3b82f6; color: #f1f5f9; }

  /* ── Hero ── */
  .lp-hero {
    position: relative; min-height: 100vh;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    padding: 120px 60px 80px; text-align: center;
    overflow: hidden;
  }
  .lp-hero-bg {
    position: absolute; inset: 0; pointer-events: none;
  }
  .lp-hero-glow {
    position: absolute; width: 800px; height: 800px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%);
    top: 50%; left: 50%; transform: translate(-50%, -50%);
  }
  .lp-hero-glow-2 {
    position: absolute; width: 500px; height: 500px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%);
    top: 20%; right: 5%;
  }
  .lp-hero-grid {
    position: absolute; inset: 0;
    background-image: linear-gradient(rgba(30,41,59,.15) 1px, transparent 1px),
                      linear-gradient(90deg, rgba(30,41,59,.15) 1px, transparent 1px);
    background-size: 60px 60px;
    mask-image: radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 100%);
  }
  .lp-hero-badge {
    display: inline-flex; align-items: center; gap: 8px;
    background: rgba(59,130,246,.08); border: 1px solid rgba(59,130,246,.2);
    color: #93c5fd; padding: 6px 16px; border-radius: 99px;
    font-size: 12px; font-weight: 600; letter-spacing: .08em;
    text-transform: uppercase; margin-bottom: 32px;
    opacity: 0; /* animated by GSAP */
  }
  .lp-hero-title {
    font-family: 'Syne', sans-serif;
    font-size: clamp(40px, 6vw, 76px); font-weight: 800;
    color: #f8fafc; line-height: 1.05;
    letter-spacing: -2px; margin-bottom: 24px;
    opacity: 0;
  }
  .lp-hero-title-accent { color: #3b82f6; }
  .lp-hero-sub {
    font-size: clamp(15px, 1.8vw, 18px); color: #64748b;
    line-height: 1.7; max-width: 560px; margin: 0 auto 40px;
    opacity: 0;
  }
  .lp-hero-ctas {
    display: flex; gap: 14px; justify-content: center;
    flex-wrap: wrap; margin-bottom: 20px; opacity: 0;
  }
  .lp-hero-note {
    font-size: 13px; color: #334155; opacity: 0;
  }
  .lp-hero-preview {
    margin-top: 64px; max-width: 900px; width: 100%;
    border-radius: 16px; overflow: hidden;
    border: 1px solid rgba(30,41,59,0.8);
    box-shadow: 0 32px 80px rgba(0,0,0,.5), 0 0 0 1px rgba(59,130,246,.05);
    opacity: 0; transform: translateY(40px);
    position: relative; z-index: 1;
  }
  .lp-preview-bar {
    background: #0f172a; padding: 12px 16px;
    display: flex; align-items: center; gap: 6px;
    border-bottom: 1px solid #1e293b;
  }
  .lp-dot { width: 10px; height: 10px; border-radius: 50%; }
  .lp-preview-title { font-size: 12px; color: #334155; margin-left: 8px; }
  .lp-preview-body {
    display: grid; grid-template-columns: repeat(4, 1fr);
    gap: 1px; background: #1e293b; padding: 1px;
  }
  .lp-preview-card {
    background: #0f172a; padding: 20px 16px;
    display: flex; flex-direction: column; gap: 4px;
    transition: background .2s;
  }
  .lp-preview-card:hover { background: #111827; }
  .lp-preview-val { font-size: 28px; font-weight: 800; letter-spacing: -0.5px; }
  .lp-preview-label { font-size: 11px; color: #475569; }

  /* ── Stats ticker ── */
  .lp-stats {
    display: flex; align-items: center; justify-content: center;
    gap: 60px; padding: 40px 60px; flex-wrap: wrap;
    border-top: 1px solid rgba(30,41,59,.6);
    border-bottom: 1px solid rgba(30,41,59,.6);
    background: rgba(15,23,42,.4);
  }
  .lp-stat-item { text-align: center; }
  .lp-stat-val {
    font-family: 'Syne', sans-serif;
    font-size: 36px; font-weight: 800; color: #f1f5f9; letter-spacing: -1px;
  }
  .lp-stat-val span { color: #3b82f6; }
  .lp-stat-label { font-size: 13px; color: #475569; margin-top: 4px; }

  /* ── Sections ── */
  .lp-section {
    padding: 100px 60px; max-width: 1100px; margin: 0 auto;
    position: relative; z-index: 1;
  }
  .lp-section-label {
    font-size: 11px; font-weight: 700; color: #3b82f6;
    text-transform: uppercase; letter-spacing: .12em; margin-bottom: 12px;
  }
  .lp-section-title {
    font-family: 'Syne', sans-serif;
    font-size: clamp(28px, 4vw, 44px); font-weight: 800;
    color: #f8fafc; margin: 0 0 16px; letter-spacing: -1px; line-height: 1.15;
  }
  .lp-section-sub {
    font-size: 16px; color: #64748b; line-height: 1.7;
    max-width: 560px; margin: 0 0 56px;
  }

  /* ── Reveal helper ── */
  .gs-reveal { opacity: 0; transform: translateY(32px); }
  .gs-reveal-left { opacity: 0; transform: translateX(-40px); }
  .gs-reveal-right { opacity: 0; transform: translateX(40px); }
  .gs-reveal-scale { opacity: 0; transform: scale(0.88); }

  /* ── Feature cards ── */
  .lp-features-grid {
    display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px;
  }
  .lp-feature-card {
    background: #0a1222; border: 1px solid #1e293b; border-radius: 14px;
    padding: 28px 24px; cursor: default;
    transition: border-color .25s, transform .25s, box-shadow .25s;
  }
  .lp-feature-card:hover {
    border-color: rgba(59,130,246,.3);
    transform: translateY(-4px);
    box-shadow: 0 16px 40px rgba(0,0,0,.3), 0 0 0 1px rgba(59,130,246,.05);
  }
  .lp-feature-icon { font-size: 28px; display: block; margin-bottom: 16px; }
  .lp-feature-title { font-size: 16px; font-weight: 700; color: #f1f5f9; margin: 0 0 8px; }
  .lp-feature-desc { font-size: 14px; color: #64748b; line-height: 1.6; margin: 0; }

  /* ── Testimonials ── */
  .lp-testimonials-grid {
    display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px;
  }
  .lp-testimonial-card {
    background: #0a1222; border: 1px solid #1e293b; border-radius: 14px;
    padding: 28px 24px; position: relative; overflow: hidden;
  }
  .lp-testimonial-card::before {
    content: '"'; position: absolute; top: 12px; right: 20px;
    font-size: 80px; font-family: Georgia, serif; color: rgba(59,130,246,.08);
    line-height: 1;
  }
  .lp-testimonial-text { font-size: 15px; color: #cbd5e1; line-height: 1.7; margin: 0 0 24px; font-style: italic; }
  .lp-testimonial-author { display: flex; align-items: center; gap: 12px; }
  .lp-testimonial-avatar {
    width: 40px; height: 40px; border-radius: 50%;
    background: linear-gradient(135deg, #1d4ed8, #3b82f6);
    color: #fff; display: flex; align-items: center; justify-content: center;
    font-size: 13px; font-weight: 700; flex-shrink: 0;
  }
  .lp-testimonial-name { font-size: 14px; font-weight: 700; color: #f1f5f9; }
  .lp-testimonial-role { font-size: 12px; color: #475569; }

  /* ── Pricing ── */
  .lp-pricing-bg { background: #080f1a; }
  .lp-billing-toggle { display: flex; gap: 8px; margin-bottom: 48px; justify-content: center; flex-wrap: wrap; }
  .lp-billing-btn {
    background: transparent; border: 1px solid #1e293b;
    color: #64748b; border-radius: 8px; padding: 8px 20px;
    font-size: 14px; font-weight: 600; cursor: pointer;
    transition: all .2s; font-family: inherit;
  }
  .lp-billing-btn.active {
    background: #3b82f6; border-color: #3b82f6; color: #fff;
  }
  .lp-discount-badge {
    background: #052e16; color: #22c55e; border: 1px solid #166534;
    border-radius: 99px; padding: 2px 8px; font-size: 11px; font-weight: 700;
    margin-left: 8px;
  }
  .lp-plans-grid {
    display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    gap: 20px; max-width: 1000px; margin: 0 auto;
  }
  .lp-plan-card {
    background: #0a1222; border: 1px solid #1e293b; border-radius: 16px;
    padding: 32px 28px; display: flex; flex-direction: column;
    position: relative; transition: transform .25s, box-shadow .25s;
  }
  .lp-plan-card:hover { transform: translateY(-4px); box-shadow: 0 20px 50px rgba(0,0,0,.4); }
  .lp-plan-card.highlight { border-width: 2px; }
  .lp-plan-badge {
    position: absolute; top: -12px; left: 50%; transform: translateX(-50%);
    color: #fff; font-size: 11px; font-weight: 700;
    padding: 4px 14px; border-radius: 99px; white-space: nowrap;
  }
  .lp-plan-name { font-size: 16px; font-weight: 700; color: #94a3b8; margin: 0 0 8px; }
  .lp-plan-price { letter-spacing: -1px; margin: 0 0 4px; line-height: 1; }
  .lp-plan-period { font-size: 16px; font-weight: 400; color: #475569; }
  .lp-plan-cycle-note { font-size: 12px; color: #334155; margin: 0 0 8px; }
  .lp-plan-desc { font-size: 13px; color: #475569; margin: 0 0 24px; }
  .lp-plan-features { list-style: none; padding: 0; margin: 0 0 28px; display: flex; flex-direction: column; gap: 10px; }
  .lp-plan-feature { font-size: 14px; color: #cbd5e1; display: flex; gap: 8px; align-items: flex-start; }
  .lp-check { color: #22c55e; font-weight: 700; flex-shrink: 0; }
  .lp-plan-cta {
    border-radius: 8px; padding: 12px; font-size: 14px; font-weight: 700;
    cursor: pointer; width: 100%; margin-top: auto;
    transition: all .2s; font-family: inherit;
    text-decoration: none; text-align: center; display: block;
  }
  .lp-plan-cta-outline { background: #1e293b; border: 1px solid #334155; color: #e2e8f0; }
  .lp-plan-cta-outline:hover { background: #263345; }
  .lp-plan-cta-solid { border: none; color: #fff; }

  /* ── FAQ ── */
  .lp-faq-list { max-width: 680px; margin: 0 auto; display: flex; flex-direction: column; gap: 4px; }
  .lp-faq-item { border-bottom: 1px solid #1e293b; overflow: hidden; }
  .lp-faq-q {
    width: 100%; background: none; border: none; color: #e2e8f0;
    font-size: 15px; font-weight: 600; padding: 20px 0;
    text-align: left; cursor: pointer; display: flex;
    justify-content: space-between; align-items: center; gap: 16px;
    font-family: inherit; transition: color .2s;
  }
  .lp-faq-q:hover { color: #3b82f6; }
  .lp-faq-chevron { color: #475569; font-size: 16px; transition: transform .25s ease; flex-shrink: 0; }
  .lp-faq-a { font-size: 14px; color: #64748b; line-height: 1.7; padding-right: 32px; overflow: hidden; max-height: 0; transition: max-height .3s ease, margin-bottom .3s ease; }
  .lp-faq-a.open { max-height: 200px; margin-bottom: 20px; }

  /* ── CTA final ── */
  .lp-cta {
    text-align: center; padding: 120px 60px;
    background: linear-gradient(180deg, #060d1a 0%, #0c1f3a 100%);
    border-top: 1px solid #1e293b;
    position: relative; overflow: hidden;
  }
  .lp-cta-glow {
    position: absolute; width: 600px; height: 600px; border-radius: 50%;
    background: radial-gradient(circle, rgba(59,130,246,.1) 0%, transparent 70%);
    top: 50%; left: 50%; transform: translate(-50%, -50%);
    pointer-events: none;
  }
  .lp-cta-title {
    font-family: 'Syne', sans-serif;
    font-size: clamp(32px, 5vw, 52px); font-weight: 800;
    color: #f8fafc; margin: 0 0 16px; letter-spacing: -1px;
    position: relative;
  }
  .lp-cta-sub { font-size: 16px; color: #64748b; margin: 0 0 36px; position: relative; }
  .lp-cta-actions { display: flex; gap: 14px; justify-content: center; flex-wrap: wrap; position: relative; }

  /* ── Footer ── */
  .lp-footer {
    border-top: 1px solid #1e293b; padding: 32px 60px;
    display: flex; align-items: center; justify-content: space-between;
    flex-wrap: wrap; gap: 16px;
    background: #060d1a;
  }
  .lp-footer-text { font-size: 13px; color: #334155; }
  .lp-footer-links { display: flex; gap: 24px; flex-wrap: wrap; }
  .lp-footer-link { font-size: 13px; color: #475569; text-decoration: none; transition: color .2s; }
  .lp-footer-link:hover { color: #94a3b8; }

  /* ── Scrollbar ── */
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: #060d1a; }
  ::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 3px; }

  /* ── Responsive ── */
  @media (max-width: 768px) {
    .lp-nav { padding: 16px 20px !important; }
    .lp-nav-links { display: none !important; }
    .lp-hero { padding: 100px 24px 60px !important; text-align: left; align-items: flex-start; }
    .lp-hero-ctas { flex-direction: column; align-items: stretch; }
    .lp-hero-title { letter-spacing: -1px !important; }
    .lp-hero-badge { font-size: 11px; }
    .lp-hero-sub { margin-left: 0; }
    .lp-stats { gap: 32px; padding: 32px 24px; }
    .lp-section { padding: 60px 24px !important; }
    .lp-section-title { font-size: 28px !important; }
    .lp-preview-body { grid-template-columns: repeat(2,1fr) !important; }
    .lp-preview-val { font-size: 20px !important; }
    .lp-plans-grid { grid-template-columns: 1fr !important; max-width: 400px !important; margin: 0 auto !important; }
    .lp-cta { padding: 60px 24px !important; }
    .lp-footer { padding: 24px 20px !important; flex-direction: column; align-items: flex-start; }
  }
`

const INSTAGRAM_URL = "https://instagram.com/clinicos"

const FEATURES = [
  { icon: "🏥", title: "Gestão de Pacientes", desc: "Cadastro completo, histórico e prontuário digital. Acesse qualquer informação em segundos." },
  { icon: "📅", title: "Agendamentos Inteligentes", desc: "Agenda do dia, semana ou mês. Evite conflitos e reduza faltas com controle preciso." },
  { icon: "👥", title: "Gestão de Equipe", desc: "Convide dentistas, recepcionistas e assistentes com permissões individuais." },
  { icon: "💰", title: "Controle Financeiro", desc: "Registre pagamentos, descontos e forme de pagamento. Acompanhe o faturamento em tempo real." },
  { icon: "📎", title: "Prontuário Digital", desc: "Evoluções clínicas, notas e anexos por consulta. Imagens, raio-x e documentos no mesmo lugar." },
  { icon: "⚡", title: "Pronto em Minutos", desc: "Sem instalação, sem configuração complexa. Crie sua conta e comece a usar agora." },
]

const TESTIMONIALS = [
  { name: "Dra. Fernanda Costa", role: "Cirurgiã-dentista, São Paulo", text: "Antes eu usava planilhas para tudo. Hoje abro o sistema e já sei exatamente o que acontece na clínica. A diferença é absurda.", initials: "FC" },
  { name: "Dr. Rafael Mendes", role: "Ortodontista, Belo Horizonte", text: "Implementei em uma tarde. Minha recepcionista aprendeu sozinha. Nunca pensei que organizar a clínica pudesse ser tão simples.", initials: "RM" },
  { name: "Dra. Camila Souza", role: "Clínica geral, Curitiba", text: "O que mais me impressiona é a segurança. Sei que os dados dos meus pacientes estão protegidos e separados de qualquer outro sistema.", initials: "CS" },
]

const FAQS = [
  { q: "Preciso instalar alguma coisa?", a: "Não. O sistema funciona 100% pelo navegador. Você acessa de qualquer dispositivo com internet — computador, tablet ou celular." },
  { q: "Meus dados ficam seguros?", a: "Sim. Cada clínica possui um ambiente completamente isolado no banco de dados. Seus pacientes e agendamentos nunca são acessíveis por outras clínicas." },
  { q: "Posso adicionar minha equipe?", a: "Sim. No plano Pro e Clínica você pode convidar dentistas, recepcionistas e assistentes com permissões individuais por papel." },
  { q: "Posso migrar meus dados de outro sistema?", a: "Oferecemos importação via planilha CSV para pacientes. Para migrações complexas, nosso plano Clínica inclui onboarding dedicado." },
]

const BILLING_CYCLES = [
  { id: "monthly",    label: "Mensal",     discount: 0   },
  { id: "quarterly",  label: "Trimestral", discount: 10  },
  { id: "semiannual", label: "Semestral",  discount: 15  },
]

const PLANS = [
  { name: "Free", basePrice: 0, color: "#64748b", desc: "Para experimentar o sistema.", features: ["Até 20 pacientes", "1 usuário (admin)", "Agendamentos ilimitados", "Dashboard básico"], cta: "Começar grátis", ctaUrl: "/register", highlight: false },
  { name: "Pro", basePrice: 79, color: "#3b82f6", desc: "Para profissionais autônomos.", features: ["Pacientes ilimitados", "Até 3 usuários", "Prontuário completo", "Financeiro", "Dashboard avançado"], cta: "Assinar Pro", ctaUrl: "/register", highlight: true },
  { name: "Clínica", basePrice: 199, color: "#8b5cf6", desc: "Para clínicas com equipe.", features: ["Tudo do Pro", "Usuários ilimitados", "Suporte prioritário", "Onboarding dedicado"], cta: "Assinar Clínica", ctaUrl: "/register", highlight: false },
]

function getPrice(base, discountPct) { return Math.round(base * (1 - discountPct / 100)) }

// ─── Inject CSS ───────────────────────────────────────────────────────────────
function InjectCSS() {
  useEffect(() => {
    if (document.getElementById("lp-css")) return
    const el = document.createElement("style")
    el.id = "lp-css"
    el.textContent = LP_CSS
    document.head.appendChild(el)
    return () => { /* keep on unmount for perf */ }
  }, [])
  return null
}

// ─── Nav ──────────────────────────────────────────────────────────────────────
function Nav() {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40)
    window.addEventListener("scroll", fn, { passive: true })
    return () => window.removeEventListener("scroll", fn)
  }, [])
  return (
    <nav className={`lp-nav${scrolled ? " scrolled" : ""}`}>
      <span className="lp-nav-logo">Clinic<span>OS</span></span>
      <div className="lp-nav-links">
        <a href="#features" className="lp-nav-link">Funcionalidades</a>
        <a href="#pricing"  className="lp-nav-link">Planos</a>
        <a href="#faq"      className="lp-nav-link">FAQ</a>
      </div>
      <div className="lp-nav-actions">
        <Link to="/login"><button className="lp-btn-outline">Entrar</button></Link>
        <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer">
          <button className="lp-btn-primary">Falar conosco</button>
        </a>
      </div>
    </nav>
  )
}

// ─── Hero ─────────────────────────────────────────────────────────────────────
function Hero() {
  const badgeRef   = useRef(null)
  const titleRef   = useRef(null)
  const subRef     = useRef(null)
  const ctasRef    = useRef(null)
  const noteRef    = useRef(null)
  const previewRef = useRef(null)

  useGSAP((gsap) => {
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } })
    tl.to(badgeRef.current,   { opacity: 1, y: 0, duration: 0.7 }, 0.2)
      .to(titleRef.current,   { opacity: 1, y: 0, duration: 0.9 }, 0.35)
      .to(subRef.current,     { opacity: 1, y: 0, duration: 0.7 }, 0.55)
      .to(ctasRef.current,    { opacity: 1, y: 0, duration: 0.7 }, 0.7)
      .to(noteRef.current,    { opacity: 1, y: 0, duration: 0.6 }, 0.8)
      .to(previewRef.current, { opacity: 1, y: 0, duration: 1,   ease: "power2.out" }, 0.9)
  })

  return (
    <section className="lp-hero">
      <div className="lp-hero-bg">
        <div className="lp-hero-grid" />
        <div className="lp-hero-glow" />
        <div className="lp-hero-glow-2" />
      </div>

      <div ref={badgeRef} className="lp-hero-badge">✦ Gestão clínica simplificada</div>

      <h1 ref={titleRef} className="lp-hero-title">
        Sua clínica organizada.<br />
        <span className="lp-hero-title-accent">Do primeiro paciente ao décimo milhar.</span>
      </h1>

      <p ref={subRef} className="lp-hero-sub">
        Sistema completo para gestão de clínicas odontológicas. Pacientes, agendamentos,
        equipe e financeiro em um só lugar — seguro, rápido e pronto para crescer com você.
      </p>

      <div ref={ctasRef} className="lp-hero-ctas">
        <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer">
          <button className="lp-btn-hero">Quero conhecer →</button>
        </a>
        <a href="#features">
          <button className="lp-btn-ghost">Ver funcionalidades ↓</button>
        </a>
      </div>

      <p ref={noteRef} className="lp-hero-note">Sem instalação · Pronto em minutos · Suporte via WhatsApp</p>

      <div ref={previewRef} className="lp-hero-preview">
        <div className="lp-preview-bar">
          <span className="lp-dot" style={{ background:"#ef4444" }} />
          <span className="lp-dot" style={{ background:"#fbbf24" }} />
          <span className="lp-dot" style={{ background:"#22c55e" }} />
          <span className="lp-preview-title">Dashboard — ClinicOS</span>
        </div>
        <div className="lp-preview-body">
          {[
            { label:"Pacientes ativos",   val:"248", color:"#3b82f6" },
            { label:"Agendamentos hoje",  val:"12",  color:"#8b5cf6" },
            { label:"Próximos na fila",   val:"5",   color:"#f59e0b" },
            { label:"Ocupação semanal",   val:"87%", color:"#22c55e" },
          ].map(m => (
            <div key={m.label} className="lp-preview-card" style={{ borderTop:`2px solid ${m.color}` }}>
              <span className="lp-preview-val" style={{ color: m.color }}>{m.val}</span>
              <span className="lp-preview-label">{m.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Stats ────────────────────────────────────────────────────────────────────
function AnimatedCounter({ target, suffix = "" }) {
  const ref = useRef(null)
  const animated = useRef(false)

  useGSAP((gsap, ScrollTrigger) => {
    if (animated.current) return
    ScrollTrigger.create({
      trigger: ref.current,
      start: "top 85%",
      once: true,
      onEnter: () => {
        animated.current = true
        gsap.to({ val: 0 }, {
          val: target, duration: 1.8, ease: "power2.out",
          onUpdate: function() {
            if (ref.current) ref.current.textContent = Math.round(this.targets()[0].val) + suffix
          }
        })
      }
    })
  })

  return <span ref={ref}>0{suffix}</span>
}

function Stats() {
  const ref = useRef(null)
  useGSAP((gsap, ScrollTrigger) => {
    gsap.from(ref.current.querySelectorAll(".lp-stat-item"), {
      opacity: 0, y: 24, stagger: 0.12, duration: 0.7, ease: "power2.out",
      scrollTrigger: { trigger: ref.current, start: "top 85%", once: true }
    })
  })
  return (
    <div className="lp-stats" ref={ref}>
      {[
        { val: 500, suffix: "+", label: "Pacientes cadastrados" },
        { val: 99,  suffix: "%", label: "Uptime garantido"      },
        { val: 5,   suffix: "min", label: "Para começar a usar" },
      ].map(s => (
        <div key={s.label} className="lp-stat-item">
          <div className="lp-stat-val">
            <AnimatedCounter target={s.val} suffix={s.suffix} />
          </div>
          <div className="lp-stat-label">{s.label}</div>
        </div>
      ))}
    </div>
  )
}

// ─── Features ─────────────────────────────────────────────────────────────────
function Features() {
  const titleRef = useRef(null)
  const gridRef  = useRef(null)

  useGSAP((gsap, ScrollTrigger) => {
    gsap.from(titleRef.current.querySelectorAll(".gs-reveal"), {
      opacity: 0, y: 28, stagger: 0.1, duration: 0.7, ease: "power2.out",
      scrollTrigger: { trigger: titleRef.current, start: "top 82%", once: true }
    })
    gsap.from(gridRef.current.querySelectorAll(".lp-feature-card"), {
      opacity: 0, y: 40, scale: 0.95, stagger: 0.08, duration: 0.7, ease: "power2.out",
      scrollTrigger: { trigger: gridRef.current, start: "top 82%", once: true }
    })
  })

  return (
    <section id="features" className="lp-section">
      <div ref={titleRef}>
        <div className="lp-section-label gs-reveal">Funcionalidades</div>
        <h2 className="lp-section-title gs-reveal">Tudo que sua clínica precisa.<br /><span style={{ color:"#3b82f6" }}>Em um só sistema.</span></h2>
        <p className="lp-section-sub gs-reveal">Desenvolvido especificamente para clínicas de saúde. Cada funcionalidade pensada para o dia a dia do profissional.</p>
      </div>
      <div className="lp-features-grid" ref={gridRef}>
        {FEATURES.map(f => (
          <div key={f.title} className="lp-feature-card">
            <span className="lp-feature-icon">{f.icon}</span>
            <h3 className="lp-feature-title">{f.title}</h3>
            <p className="lp-feature-desc">{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

// ─── Testimonials ─────────────────────────────────────────────────────────────
function Testimonials() {
  const ref = useRef(null)
  useGSAP((gsap, ScrollTrigger) => {
    gsap.from(ref.current.querySelectorAll(".lp-testimonial-card"), {
      opacity: 0, y: 40, stagger: 0.15, duration: 0.8, ease: "power2.out",
      scrollTrigger: { trigger: ref.current, start: "top 82%", once: true }
    })
  })
  return (
    <section className="lp-section" style={{ background: "linear-gradient(180deg, transparent, rgba(15,23,42,.6), transparent)" }}>
      <div>
        <div className="lp-section-label gs-reveal">Depoimentos</div>
        <h2 className="lp-section-title gs-reveal">Clínicas que já transformaram<br />sua gestão.</h2>
      </div>
      <div className="lp-testimonials-grid" ref={ref}>
        {TESTIMONIALS.map(t => (
          <div key={t.name} className="lp-testimonial-card">
            <p className="lp-testimonial-text">{t.text}</p>
            <div className="lp-testimonial-author">
              <div className="lp-testimonial-avatar">{t.initials}</div>
              <div>
                <div className="lp-testimonial-name">{t.name}</div>
                <div className="lp-testimonial-role">{t.role}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

// ─── Pricing ──────────────────────────────────────────────────────────────────
function Pricing() {
  const [cycle, setCycle]   = useState("monthly")
  const activeCycle         = BILLING_CYCLES.find(c => c.id === cycle)
  const ref                 = useRef(null)

  useGSAP((gsap, ScrollTrigger) => {
    gsap.from(ref.current.querySelectorAll(".lp-plan-card"), {
      opacity: 0, y: 48, stagger: 0.12, duration: 0.8, ease: "power2.out",
      scrollTrigger: { trigger: ref.current, start: "top 82%", once: true }
    })
  })

  return (
    <section id="pricing" className="lp-section lp-pricing-bg" style={{ maxWidth:"100%", padding:"100px 60px" }}>
      <div style={{ maxWidth:1100, margin:"0 auto" }}>
        <div className="lp-section-label">Planos</div>
        <h2 className="lp-section-title">Simples e transparente.</h2>
        <p className="lp-section-sub">Comece grátis. Assine quando quiser. Cancele quando precisar.</p>

        <div className="lp-billing-toggle">
          {BILLING_CYCLES.map(c => (
            <button key={c.id} className={`lp-billing-btn${cycle===c.id ? " active" : ""}`} onClick={() => setCycle(c.id)}>
              {c.label}
              {c.discount > 0 && <span className="lp-discount-badge">-{c.discount}%</span>}
            </button>
          ))}
        </div>

        <div className="lp-plans-grid" ref={ref}>
          {PLANS.map(p => {
            const price = p.basePrice === 0 ? 0 : getPrice(p.basePrice, activeCycle.discount)
            return (
              <div key={p.name} className={`lp-plan-card${p.highlight ? " highlight" : ""}`}
                style={{ borderColor: p.highlight ? p.color : "#1e293b", borderTop: `3px solid ${p.color}`, boxShadow: p.highlight ? `0 0 40px ${p.color}20` : "none" }}>
                {p.highlight && <div className="lp-plan-badge" style={{ background: p.color }}>Mais popular</div>}
                <div className="lp-plan-name" style={{ color: p.color }}>{p.name}</div>
                <div className="lp-plan-price">
                  {price === 0
                    ? <span style={{ fontSize:40, fontWeight:800, color:"#f8fafc" }}>Grátis</span>
                    : <><span style={{ fontSize:16, fontWeight:700, color:"#94a3b8", verticalAlign:"top", marginTop:8, display:"inline-block" }}>R$</span>
                        <span style={{ fontSize:48, fontWeight:800, color:"#f8fafc", letterSpacing:"-2px" }}>{price}</span>
                        <span className="lp-plan-period">/mês</span></>}
                </div>
                {activeCycle.discount > 0 && price > 0 && (
                  <div className="lp-plan-cycle-note">
                    cobrado R${price * (cycle==="quarterly" ? 3 : 6)}/{cycle==="quarterly" ? "trimestre" : "semestre"}
                  </div>
                )}
                <div className="lp-plan-desc">{p.desc}</div>
                <ul className="lp-plan-features">
                  {p.features.map(f => (
                    <li key={f} className="lp-plan-feature"><span className="lp-check">✓</span> {f}</li>
                  ))}
                </ul>
                <Link to={p.ctaUrl} className={`lp-plan-cta ${p.highlight ? "lp-plan-cta-solid" : "lp-plan-cta-outline"}`}
                  style={p.highlight ? { background: p.color } : {}}>
                  {p.cta}
                </Link>
              </div>
            )
          })}
        </div>
        <p style={{ textAlign:"center", fontSize:13, color:"#334155", marginTop:32 }}>
          Sem fidelidade · Cancele quando quiser · Sem cartão para o plano Free
        </p>
      </div>
    </section>
  )
}

// ─── FAQ ──────────────────────────────────────────────────────────────────────
function FAQ() {
  const [open, setOpen] = useState(null)
  const ref = useRef(null)

  useGSAP((gsap, ScrollTrigger) => {
    gsap.from(ref.current.querySelectorAll(".lp-faq-item"), {
      opacity: 0, x: -24, stagger: 0.08, duration: 0.6, ease: "power2.out",
      scrollTrigger: { trigger: ref.current, start: "top 82%", once: true }
    })
  })

  return (
    <section id="faq" className="lp-section">
      <div className="lp-section-label">FAQ</div>
      <h2 className="lp-section-title">Perguntas frequentes.</h2>
      <div className="lp-faq-list" ref={ref}>
        {FAQS.map((f, i) => (
          <div key={i} className="lp-faq-item">
            <button className="lp-faq-q" onClick={() => setOpen(open === i ? null : i)}>
              {f.q}
              <span className="lp-faq-chevron" style={{ transform: open === i ? "rotate(180deg)" : "none" }}>▼</span>
            </button>
            <div className={`lp-faq-a${open === i ? " open" : ""}`}>{f.a}</div>
          </div>
        ))}
      </div>
    </section>
  )
}

// ─── CTA Final ────────────────────────────────────────────────────────────────
function CTAFinal() {
  const ref = useRef(null)
  useGSAP((gsap, ScrollTrigger) => {
    gsap.from(ref.current.querySelectorAll(".gs-reveal"), {
      opacity: 0, y: 32, stagger: 0.12, duration: 0.8, ease: "power2.out",
      scrollTrigger: { trigger: ref.current, start: "top 82%", once: true }
    })
  })
  return (
    <div className="lp-cta" ref={ref}>
      <div className="lp-cta-glow" />
      <div className="lp-section-label gs-reveal">Pronto para começar?</div>
      <h2 className="lp-cta-title gs-reveal">Organize sua clínica hoje.<br /><span style={{ color:"#3b82f6" }}>É grátis para começar.</span></h2>
      <p className="lp-cta-sub gs-reveal">Sem instalação. Sem cartão de crédito. Sem complicação.</p>
      <div className="lp-cta-actions gs-reveal">
        <Link to="/register"><button className="lp-btn-hero">Criar conta grátis →</button></Link>
        <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer">
          <button className="lp-btn-ghost">Falar no WhatsApp</button>
        </a>
      </div>
    </div>
  )
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="lp-footer">
      <p className="lp-footer-text">© {new Date().getFullYear()} ClinicOS. Todos os direitos reservados.</p>
      <div className="lp-footer-links">
        <Link to="/privacy" className="lp-footer-link">Privacidade</Link>
        <Link to="/terms"   className="lp-footer-link">Termos</Link>
        <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className="lp-footer-link">Instagram</a>
      </div>
    </footer>
  )
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <div className="lp-root">
      <InjectCSS />
      <Nav />
      <Hero />
      <Stats />
      <Features />
      <Testimonials />
      <Pricing />
      <FAQ />
      <CTAFinal />
      <Footer />
    </div>
  )
}
