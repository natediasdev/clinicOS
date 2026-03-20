import { Link } from "react-router-dom"
import ParticleBackground from "../../components/ParticleBackground"
import { useState, useEffect, useRef, useCallback } from "react"

// ─── GSAP via CDN ─────────────────────────────────────────────────────────────
function useGSAP(callback) {
  const ready = useRef(false)
  useEffect(() => {
    if (ready.current) return
    if (window.gsap && window.ScrollTrigger) { ready.current = true; callback(window.gsap, window.ScrollTrigger); return }
    const s1 = document.createElement("script")
    s1.src = "https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"
    s1.onload = () => {
      const s2 = document.createElement("script")
      s2.src = "https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js"
      s2.onload = () => { window.gsap.registerPlugin(window.ScrollTrigger); ready.current = true; callback(window.gsap, window.ScrollTrigger) }
      document.head.appendChild(s2)
    }
    document.head.appendChild(s1)
  }, [])
}

// ─── SVG Icons ────────────────────────────────────────────────────────────────
const Icons = {
  patients: (c="#3b82f6") => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  calendar: (c="#8b5cf6") => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  team: (c="#22c55e") => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  finance: (c="#f59e0b") => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
  clipboard: (c="#ef4444") => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/></svg>,
  zap: (c="#3b82f6") => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
  check: (c="#22c55e") => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  chevron: (c="#475569") => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>,
}

// ─── CSS ──────────────────────────────────────────────────────────────────────
const LP_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .lp-root {
    background: #060d1a;
    color: #e2e8f0;
    font-family: 'Plus Jakarta Sans', 'DM Sans', 'Segoe UI', sans-serif;
    overflow-x: hidden;
    min-height: 100vh;
  }

  /* ── Nav ── */
  .lp-nav {
    position: fixed; top: 0; left: 0; right: 0; z-index: 100;
    display: flex; align-items: center; justify-content: space-between;
    padding: 20px 60px;
    transition: background .3s, backdrop-filter .3s, border-color .3s;
  }
  .lp-nav.scrolled {
    background: rgba(6,13,26,0.9);
    backdrop-filter: blur(16px);
    border-bottom: 1px solid rgba(30,41,59,0.7);
  }
  .lp-nav-logo { font-size: 22px; font-weight: 800; color: #f8fafc; letter-spacing: -0.5px; text-decoration: none; }
  .lp-nav-logo span { color: #3b82f6; }
  .lp-nav-links { display: flex; gap: 32px; }
  .lp-nav-link { font-size: 14px; font-weight: 500; color: #64748b; text-decoration: none; transition: color .2s; }
  .lp-nav-link:hover { color: #f1f5f9; }
  .lp-nav-actions { display: flex; gap: 10px; }

  /* ── Buttons ── */
  .lp-btn-outline { background: transparent; border: 1px solid #1e293b; color: #94a3b8; padding: 8px 20px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all .2s; font-family: inherit; }
  .lp-btn-outline:hover { border-color: #3b82f6; color: #f1f5f9; }
  .lp-btn-primary { background: #3b82f6; border: none; color: #fff; padding: 8px 20px; border-radius: 8px; font-size: 14px; font-weight: 700; cursor: pointer; transition: all .2s; font-family: inherit; }
  .lp-btn-primary:hover { background: #2563eb; transform: translateY(-1px); box-shadow: 0 8px 24px rgba(59,130,246,.3); }
  .lp-btn-hero { background: #3b82f6; border: none; color: #fff; padding: 14px 32px; border-radius: 10px; font-size: 16px; font-weight: 700; cursor: pointer; transition: all .25s; font-family: inherit; box-shadow: 0 4px 20px rgba(59,130,246,.25); }
  .lp-btn-hero:hover { background: #2563eb; transform: translateY(-2px); box-shadow: 0 8px 32px rgba(59,130,246,.4); }
  .lp-btn-ghost { background: transparent; border: 1px solid #1e293b; color: #94a3b8; padding: 14px 32px; border-radius: 10px; font-size: 16px; font-weight: 600; cursor: pointer; transition: all .25s; font-family: inherit; }
  .lp-btn-ghost:hover { border-color: #3b82f6; color: #f1f5f9; }

  /* ── Hero ── */
  .lp-hero {
    position: relative; min-height: 100vh;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    padding: 120px 60px 80px; text-align: center;
    overflow: hidden;
  }
  .lp-hero-bg { position: absolute; inset: 0; pointer-events: none; }
  .lp-hero-glow { position: absolute; width: 700px; height: 700px; border-radius: 50%; background: radial-gradient(circle, rgba(59,130,246,0.1) 0%, transparent 70%); top: 50%; left: 50%; transform: translate(-50%,-50%); }
  .lp-hero-grid { position: absolute; inset: 0; background-image: linear-gradient(rgba(30,41,59,.12) 1px, transparent 1px), linear-gradient(90deg, rgba(30,41,59,.12) 1px, transparent 1px); background-size: 60px 60px; mask-image: radial-gradient(ellipse 80% 80% at 50% 50%, black 20%, transparent 100%); }
  .lp-hero-badge { display: inline-flex; align-items: center; gap: 8px; background: rgba(59,130,246,.08); border: 1px solid rgba(59,130,246,.18); color: #93c5fd; padding: 6px 16px; border-radius: 99px; font-size: 12px; font-weight: 600; letter-spacing: .08em; text-transform: uppercase; margin-bottom: 28px; }
  .lp-hero-title { font-size: clamp(38px, 5.5vw, 68px); font-weight: 800; color: #f8fafc; line-height: 1.08; letter-spacing: -1.5px; margin-bottom: 22px; }
  .lp-hero-title-accent { color: #3b82f6; }
  .lp-hero-sub { font-size: clamp(15px, 1.6vw, 17px); color: #64748b; line-height: 1.7; max-width: 520px; margin: 0 auto 36px; }
  .lp-hero-ctas { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; margin-bottom: 18px; }
  .lp-hero-note { font-size: 13px; color: #334155; }
  .lp-hero-preview { margin-top: 56px; max-width: 860px; width: 100%; border-radius: 14px; overflow: hidden; border: 1px solid rgba(30,41,59,0.8); box-shadow: 0 24px 64px rgba(0,0,0,.5); transform: translateY(0); position: relative; z-index: 1; }
  .lp-preview-bar { background: #0f172a; padding: 10px 14px; display: flex; align-items: center; gap: 5px; border-bottom: 1px solid #1e293b; }
  .lp-dot { width: 9px; height: 9px; border-radius: 50%; }
  .lp-preview-title { font-size: 11px; color: #334155; margin-left: 7px; }
  .lp-preview-body { display: grid; grid-template-columns: repeat(4,1fr); gap: 1px; background: #1e293b; padding: 1px; }
  .lp-preview-card { background: #0f172a; padding: 18px 14px; display: flex; flex-direction: column; gap: 4px; }
  .lp-preview-val { font-size: 26px; font-weight: 800; letter-spacing: -0.5px; }
  .lp-preview-label { font-size: 10px; color: #475569; }

  /* ── Stats ── */
  .lp-stats { display: flex; align-items: center; justify-content: center; gap: 60px; padding: 36px 60px; flex-wrap: wrap; border-top: 1px solid rgba(30,41,59,.5); border-bottom: 1px solid rgba(30,41,59,.5); background: rgba(15,23,42,.3); }
  .lp-stat-item { text-align: center; }
  .lp-stat-val { font-size: 40px; font-weight: 800; color: #f1f5f9; letter-spacing: -1.5px; line-height: 1; }
  .lp-stat-val span { color: #3b82f6; }
  .lp-stat-label { font-size: 12px; color: #475569; margin-top: 6px; font-weight: 500; text-transform: uppercase; letter-spacing: .06em; }

  /* ── Sections — padding reduzido ── */
  .lp-section { padding: 72px 60px; max-width: 1100px; margin: 0 auto; position: relative; z-index: 1; }
  .lp-section-label { font-size: 11px; font-weight: 700; color: #3b82f6; text-transform: uppercase; letter-spacing: .12em; margin-bottom: 10px; }
  .lp-section-title { font-size: clamp(26px, 3.5vw, 40px); font-weight: 800; color: #f8fafc; margin: 0 0 14px; letter-spacing: -0.8px; line-height: 1.15; }
  .lp-section-sub { font-size: 15px; color: #64748b; line-height: 1.7; max-width: 520px; margin: 0 0 44px; }

  /* ── Reveal ── */
  .gs-reveal { transform: translateY(0); }
  .gs-reveal-left { transform: translateX(0); }

  /* ── Features ── */
  .lp-features-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; }
  .lp-feature-card { background: #0a1222; border: 1px solid #1e293b; border-radius: 14px; padding: 28px 22px; transition: border-color .25s, transform .25s, box-shadow .25s; cursor: default; }
  .lp-feature-card:hover { border-color: rgba(59,130,246,.28); transform: translateY(-3px); box-shadow: 0 12px 32px rgba(0,0,0,.25); }
  .lp-feature-icon { margin-bottom: 16px; display: block; }
  .lp-feature-title { font-size: 15px; font-weight: 700; color: #f1f5f9; margin: 0 0 7px; }
  .lp-feature-desc { font-size: 13px; color: #64748b; line-height: 1.6; margin: 0; }

  /* ── Testimonials ── */
  .lp-testimonials-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; }
  .lp-testimonial-card { background: #0a1222; border: 1px solid #1e293b; border-radius: 14px; padding: 28px 22px; position: relative; overflow: hidden; }
  .lp-testimonial-card::before { content: '"'; position: absolute; top: 8px; right: 18px; font-size: 72px; font-family: Georgia, serif; color: rgba(59,130,246,.07); line-height: 1; }
  .lp-testimonial-text { font-size: 14px; color: #cbd5e1; line-height: 1.7; margin: 0 0 22px; font-style: italic; }
  .lp-testimonial-author { display: flex; align-items: center; gap: 12px; }
  .lp-testimonial-avatar { width: 38px; height: 38px; border-radius: 50%; background: linear-gradient(135deg,#1d4ed8,#3b82f6); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; flex-shrink: 0; }
  .lp-testimonial-name { font-size: 13px; font-weight: 700; color: #f1f5f9; }
  .lp-testimonial-role { font-size: 11px; color: #475569; }

  /* ── Pricing ── */
  .lp-pricing-bg { background: #080f1a; }
  .lp-billing-note { font-size: 13px; color: #475569; text-align: center; margin-bottom: 44px; }
  .lp-plans-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; max-width: 1000px; margin: 0 auto; }
  .lp-plan-card { background: #0a1222; border: 1px solid #1e293b; border-radius: 14px; padding: 28px 22px; display: flex; flex-direction: column; position: relative; transition: transform .25s, box-shadow .25s; }
  .lp-plan-card:hover { transform: translateY(-3px); box-shadow: 0 16px 40px rgba(0,0,0,.3); }
  .lp-plan-card.highlight { border-width: 2px; }
  .lp-plan-badge { position: absolute; top: -11px; left: 50%; transform: translateX(-50%); color: #fff; font-size: 10px; font-weight: 700; padding: 3px 12px; border-radius: 99px; white-space: nowrap; }
  .lp-plan-name { font-size: 13px; font-weight: 700; margin: 0 0 6px; }
  .lp-plan-price-wrap { margin-bottom: 4px; line-height: 1; }
  .lp-plan-price { font-size: 38px; font-weight: 800; color: #f8fafc; letter-spacing: -1px; }
  .lp-plan-period { font-size: 14px; font-weight: 400; color: #475569; }
  .lp-plan-saving { font-size: 11px; font-weight: 700; margin-bottom: 6px; }
  .lp-plan-desc { font-size: 12px; color: #475569; margin: 0 0 20px; }
  .lp-plan-features { list-style: none; padding: 0; margin: 0 0 24px; display: flex; flex-direction: column; gap: 8px; flex: 1; }
  .lp-plan-feature { font-size: 13px; color: #cbd5e1; display: flex; gap: 7px; align-items: flex-start; }
  .lp-plan-cta { border-radius: 8px; padding: 11px; font-size: 13px; font-weight: 700; cursor: pointer; width: 100%; margin-top: auto; transition: all .2s; font-family: inherit; text-decoration: none; text-align: center; display: block; }
  .lp-plan-cta-outline { background: #1e293b; border: 1px solid #334155; color: #e2e8f0; }
  .lp-plan-cta-outline:hover { background: #263345; }
  .lp-plan-cta-solid { border: none; color: #fff; }

  /* ── FAQ ── */
  .lp-faq-list { max-width: 660px; margin: 0 auto; display: flex; flex-direction: column; gap: 2px; }
  .lp-faq-item { border-bottom: 1px solid #1e293b; overflow: hidden; }
  .lp-faq-q { width: 100%; background: none; border: none; color: #e2e8f0; font-size: 15px; font-weight: 600; padding: 18px 0; text-align: left; cursor: pointer; display: flex; justify-content: space-between; align-items: center; gap: 16px; font-family: inherit; transition: color .2s; }
  .lp-faq-q:hover { color: #3b82f6; }
  .lp-faq-chevron { color: #475569; transition: transform .25s ease; flex-shrink: 0; }
  .lp-faq-a { font-size: 14px; color: #64748b; line-height: 1.7; padding-right: 32px; overflow: hidden; max-height: 0; transition: max-height .3s ease, margin-bottom .3s ease; }
  .lp-faq-a.open { max-height: 200px; margin-bottom: 18px; }

  /* ── CTA Final ── */
  .lp-cta { text-align: center; padding: 96px 60px; background: linear-gradient(180deg, #060d1a 0%, #0b1a30 100%); border-top: 1px solid #1e293b; position: relative; overflow: hidden; }
  .lp-cta-glow { position: absolute; width: 500px; height: 500px; border-radius: 50%; background: radial-gradient(circle, rgba(59,130,246,.08) 0%, transparent 70%); top: 50%; left: 50%; transform: translate(-50%,-50%); pointer-events: none; }
  .lp-cta-title { font-size: clamp(28px, 4vw, 46px); font-weight: 800; color: #f8fafc; margin: 0 0 14px; letter-spacing: -1px; position: relative; }
  .lp-cta-title span { color: #3b82f6; }
  .lp-cta-sub { font-size: 15px; color: #64748b; margin: 0 0 32px; position: relative; }
  .lp-cta-actions { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; position: relative; }

  /* ── Footer ── */
  .lp-footer { border-top: 1px solid #1e293b; padding: 28px 60px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 14px; background: #060d1a; }
  .lp-footer-text { font-size: 13px; color: #334155; }
  .lp-footer-links { display: flex; gap: 22px; flex-wrap: wrap; }
  .lp-footer-link { font-size: 13px; color: #475569; text-decoration: none; transition: color .2s; }
  .lp-footer-link:hover { color: #94a3b8; }

  /* ── Scrollbar ── */
  ::-webkit-scrollbar { width: 5px; }
  ::-webkit-scrollbar-track { background: #060d1a; }
  ::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 3px; }

  /* ── Responsive ── */
  @media (max-width: 900px) {
    .lp-plans-grid { grid-template-columns: repeat(2, 1fr) !important; max-width: 580px !important; margin: 0 auto !important; }
  }
  @media (max-width: 768px) {
    .lp-nav { padding: 14px 20px !important; }
    .lp-nav-links { display: none !important; }
    .lp-hero { padding: 100px 24px 56px !important; text-align: left; align-items: flex-start; }
    .lp-hero-ctas { flex-direction: column; align-items: stretch; }
    .lp-hero-sub { margin-left: 0; }
    .lp-stats { gap: 28px; padding: 28px 24px; }
    .lp-section { padding: 52px 24px !important; }
    .lp-preview-body { grid-template-columns: repeat(2,1fr) !important; }
    .lp-preview-val { font-size: 20px !important; }
    .lp-plans-grid { grid-template-columns: 1fr !important; max-width: 360px !important; margin: 0 auto !important; }
    .lp-cta { padding: 56px 24px !important; }
    .lp-footer { padding: 22px 20px !important; flex-direction: column; align-items: flex-start; }
  }
`

const INSTAGRAM_URL = "https://instagram.com/clinicos"

const FEATURES = [
  { Icon: Icons.patients, color:"#3b82f6", title:"Gestão de Pacientes", desc:"Cadastro completo, histórico e prontuário digital. Acesse qualquer informação em segundos." },
  { Icon: Icons.calendar, color:"#8b5cf6", title:"Agendamentos Inteligentes", desc:"Agenda do dia, semana ou mês. Evite conflitos e reduza faltas com controle preciso." },
  { Icon: Icons.team,     color:"#22c55e", title:"Gestão de Equipe", desc:"Convide dentistas, recepcionistas e assistentes com permissões individuais." },
  { Icon: Icons.finance,  color:"#f59e0b", title:"Controle Financeiro", desc:"Registre pagamentos e acompanhe o faturamento em tempo real." },
  { Icon: Icons.clipboard,color:"#ef4444", title:"Prontuário Digital", desc:"Evoluções clínicas, notas e anexos por consulta — imagens, raio-x e documentos." },
  { Icon: Icons.zap,      color:"#3b82f6", title:"Pronto em Minutos", desc:"Sem instalação, sem configuração complexa. Crie sua conta e comece agora." },
]

const TESTIMONIALS = [
  { name:"Dra. Fernanda Costa",  role:"Cirurgiã-dentista, São Paulo",   text:"Antes eu usava planilhas para tudo. Hoje abro o sistema e já sei exatamente o que acontece na clínica. A diferença é absurda.", initials:"FC" },
  { name:"Dr. Rafael Mendes",    role:"Ortodontista, Belo Horizonte",    text:"Implementei em uma tarde. Minha recepcionista aprendeu sozinha. Nunca pensei que organizar a clínica pudesse ser tão simples.", initials:"RM" },
  { name:"Dra. Camila Souza",    role:"Clínica geral, Curitiba",         text:"O que mais me impressiona é a segurança. Sei que os dados dos meus pacientes estão protegidos e separados de qualquer outro sistema.", initials:"CS" },
]

const FAQS = [
  { q:"Preciso instalar alguma coisa?", a:"Não. O sistema funciona 100% pelo navegador em qualquer dispositivo — computador, tablet ou celular." },
  { q:"Meus dados ficam seguros?",      a:"Sim. Cada clínica possui um ambiente completamente isolado. Seus pacientes nunca são acessíveis por outras clínicas." },
  { q:"Posso adicionar minha equipe?",  a:"Sim. No plano Pro você pode convidar dentistas, recepcionistas e assistentes com permissões individuais." },
  { q:"Posso migrar dados de outro sistema?", a:"Oferecemos importação via planilha CSV para pacientes. Estamos sempre disponíveis para ajudar no processo." },
]

// Planos: Free + 3 ciclos do mesmo plano Pro
const PLANS = [
  {
    name: "Free", price: 0, color: "#64748b", highlight: false,
    desc: "Para experimentar sem compromisso.",
    saving: null,
    features: ["Até 20 pacientes","1 usuário","Agendamentos","Dashboard básico"],
    cta: "Começar grátis", ctaUrl: "/register",
  },
  {
    name: "Mensal", price: 79, color: "#3b82f6", highlight: true,
    desc: "Cobrança mês a mês, cancele quando quiser.",
    saving: null,
    features: ["Pacientes ilimitados","Até 3 usuários","Prontuário completo","Financeiro","Dashboard avançado"],
    cta: "Assinar Mensal", ctaUrl: "/register",
  },
  {
    name: "Trimestral", price: 71, color: "#8b5cf6", highlight: false,
    desc: "Cobrado a cada 3 meses.",
    saving: "Economize 10% — R$213/trimestre",
    savingColor: "#22c55e",
    features: ["Tudo do Mensal","Desconto de 10%","Suporte prioritário"],
    cta: "Assinar Trimestral", ctaUrl: "/register",
  },
  {
    name: "Semestral", price: 67, color: "#f59e0b", highlight: false,
    desc: "Cobrado a cada 6 meses.",
    saving: "Economize 15% — R$402/semestre",
    savingColor: "#22c55e",
    features: ["Tudo do Mensal","Desconto de 15%","Suporte prioritário"],
    cta: "Assinar Semestral", ctaUrl: "/register",
  },
]

// ─── CSS inject — SÍNCRONO ────────────────────────────────────────────────────
// Executado no module load, antes do primeiro render do React.
// Elimina o flash de tela sem estilo após a loading screen.
;(function() {
  if (document.getElementById("lp-css-v2")) return
  const el = document.createElement("style")
  el.id = "lp-css-v2"
  el.textContent = LP_CSS
  document.head.appendChild(el)
})()

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
  const badgeRef  = useRef(null); const titleRef = useRef(null)
  const subRef    = useRef(null); const ctasRef  = useRef(null)
  const noteRef   = useRef(null); const prevRef  = useRef(null)
  // Parallax refs
  const gridRef   = useRef(null)
  const glowRef   = useRef(null)
  const prevWrapRef = useRef(null)
  const scrollY   = useRef(0)
  const rafId     = useRef(null)

  // ── Parallax via rAF — zero jank, CPU mínimo ──────────────────────────────
  const applyParallax = useCallback(() => {
    const y = scrollY.current
    // Grid: move mais devagar que o scroll (efeito de profundidade)
    if (gridRef.current)    gridRef.current.style.transform    = `translateY(${y * 0.28}px)`
    // Glow: ainda mais lento
    if (glowRef.current)    glowRef.current.style.transform    = `translate(-50%, calc(-50% + ${y * 0.14}px))`
    // Preview: leve "float" na direção oposta ao scroll
    if (prevWrapRef.current) prevWrapRef.current.style.transform = `translateY(${y * -0.06}px)`
    rafId.current = null
  }, [])

  useEffect(() => {
    const onScroll = () => {
      scrollY.current = window.scrollY
      if (!rafId.current) rafId.current = requestAnimationFrame(applyParallax)
    }
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => {
      window.removeEventListener("scroll", onScroll)
      if (rafId.current) cancelAnimationFrame(rafId.current)
    }
  }, [applyParallax])

  // ── Animação de entrada GSAP ──────────────────────────────────────────────
  useGSAP((gsap) => {
    gsap.set([badgeRef.current, titleRef.current, subRef.current,
               ctasRef.current, noteRef.current], { opacity:0, y:20 })
    gsap.set(prevRef.current, { opacity:0, y:40 })
    const tl = gsap.timeline({ defaults: { ease:"power3.out" } })
    tl.to(badgeRef.current, { opacity:1, y:0, duration:.7 }, .2)
      .to(titleRef.current, { opacity:1, y:0, duration:.9 }, .35)
      .to(subRef.current,   { opacity:1, y:0, duration:.7 }, .55)
      .to(ctasRef.current,  { opacity:1, y:0, duration:.7 }, .7)
      .to(noteRef.current,  { opacity:1, y:0, duration:.6 }, .8)
      .to(prevRef.current,  { opacity:1, y:0, duration:1,  ease:"power2.out" }, .9)
  })

  return (
    <section className="lp-hero">
      <div className="lp-hero-bg">
        {/* Camada 1 — grid: move 28% do scroll (mais lento = mais longe) */}
        <div ref={gridRef} className="lp-hero-grid" style={{ willChange:"transform" }}/>
        {/* Camada 2 — glow: move 14% (mais longe ainda) */}
        <div ref={glowRef} className="lp-hero-glow" style={{ willChange:"transform" }}/>
        <ParticleBackground color="#3b82f6" count={48} speed={0.3} opacity={0.11}/>
      </div>

      <div ref={badgeRef} className="lp-hero-badge">✦ Gestão clínica simplificada</div>
      <h1 ref={titleRef} className="lp-hero-title">
        Sua clínica organizada.<br/>
        <span className="lp-hero-title-accent">Do primeiro paciente ao décimo milhar.</span>
      </h1>
      <p ref={subRef} className="lp-hero-sub">
        Sistema completo para gestão de clínicas odontológicas. Pacientes, agendamentos, equipe e financeiro em um só lugar.
      </p>
      <div ref={ctasRef} className="lp-hero-ctas">
        <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer"><button className="lp-btn-hero">Quero conhecer →</button></a>
        <a href="#features"><button className="lp-btn-ghost">Ver funcionalidades ↓</button></a>
      </div>
      <p ref={noteRef} className="lp-hero-note">Sem instalação · Pronto em minutos · Suporte via WhatsApp</p>

      {/* Camada 3 — preview: leve counter-scroll (-6%) cria sensação de flutuar */}
      <div ref={prevWrapRef} style={{ width:"100%", display:"flex", justifyContent:"center", willChange:"transform" }}>
        <div ref={prevRef} className="lp-hero-preview">
          <div className="lp-preview-bar">
            <span className="lp-dot" style={{background:"#ef4444"}}/>
            <span className="lp-dot" style={{background:"#fbbf24"}}/>
            <span className="lp-dot" style={{background:"#22c55e"}}/>
            <span className="lp-preview-title">Dashboard — ClinicOS</span>
          </div>
          <div className="lp-preview-body">
            {[{label:"Pacientes ativos",val:"248",color:"#3b82f6"},{label:"Agendamentos hoje",val:"12",color:"#8b5cf6"},{label:"Próximos na fila",val:"5",color:"#f59e0b"},{label:"Ocupação semanal",val:"87%",color:"#22c55e"}].map(m=>(
              <div key={m.label} className="lp-preview-card" style={{borderTop:`2px solid ${m.color}`}}>
                <span className="lp-preview-val" style={{color:m.color}}>{m.val}</span>
                <span className="lp-preview-label">{m.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Stats ────────────────────────────────────────────────────────────────────
function AnimatedCounter({ target, suffix="" }) {
  const ref = useRef(null); const animated = useRef(false)
  useGSAP((gsap, ScrollTrigger) => {
    if (animated.current) return
    ScrollTrigger.create({ trigger: ref.current, start:"top 85%", once:true, onEnter: () => {
      animated.current = true
      gsap.to({ val:0 }, { val:target, duration:1.8, ease:"power2.out",
        onUpdate: function() { if (ref.current) ref.current.textContent = Math.round(this.targets()[0].val) + suffix }
      })
    }})
  })
  return <span ref={ref}>0{suffix}</span>
}

function Stats() {
  const ref = useRef(null)
  useGSAP((gsap, ScrollTrigger) => {
    gsap.set(ref.current.querySelectorAll(".lp-stat-item"), { opacity:0, y:20 })
    gsap.to(ref.current.querySelectorAll(".lp-stat-item"), {
      opacity:1, y:0, stagger:.12, duration:.7, ease:"power2.out",
      scrollTrigger:{ trigger:ref.current, start:"top 85%", once:true }
    })
  })
  return (
    <div className="lp-stats" ref={ref}>
      {[{val:500,suffix:"+",label:"Pacientes cadastrados"},{val:99,suffix:"%",label:"Uptime garantido"},{val:5,suffix:"min",label:"Para começar a usar"}].map(s=>(
        <div key={s.label} className="lp-stat-item">
          <div className="lp-stat-val"><AnimatedCounter target={s.val} suffix={s.suffix}/></div>
          <div className="lp-stat-label">{s.label}</div>
        </div>
      ))}
    </div>
  )
}

// ─── Features ─────────────────────────────────────────────────────────────────
function Features() {
  const titleRef = useRef(null); const gridRef = useRef(null)
  useGSAP((gsap, ScrollTrigger) => {
    gsap.set(titleRef.current.querySelectorAll(".gs-reveal"), { opacity:0, y:24 })
    gsap.set(gridRef.current.querySelectorAll(".lp-feature-card"), { opacity:0, y:36, scale:.95 })
    gsap.to(titleRef.current.querySelectorAll(".gs-reveal"), { opacity:1, y:0, stagger:.1, duration:.7, ease:"power2.out", scrollTrigger:{ trigger:titleRef.current, start:"top 82%", once:true }})
    gsap.to(gridRef.current.querySelectorAll(".lp-feature-card"), { opacity:1, y:0, scale:1, stagger:.07, duration:.7, ease:"power2.out", scrollTrigger:{ trigger:gridRef.current, start:"top 82%", once:true }})
  })
  return (
    <section id="features" className="lp-section">
      <div ref={titleRef}>
        <div className="lp-section-label gs-reveal">Funcionalidades</div>
        <h2 className="lp-section-title gs-reveal">Tudo que sua clínica precisa.<br/><span style={{color:"#3b82f6"}}>Em um só lugar.</span></h2>
        <p className="lp-section-sub gs-reveal">Desenvolvido para clínicas de saúde. Cada funcionalidade pensada para o dia a dia do profissional.</p>
      </div>
      <div className="lp-features-grid" ref={gridRef}>
        {FEATURES.map(f=>(
          <div key={f.title} className="lp-feature-card">
            <span className="lp-feature-icon">{f.Icon(f.color)}</span>
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
    gsap.set(ref.current.querySelectorAll(".lp-testimonial-card"), { opacity:0, y:36 })
    gsap.to(ref.current.querySelectorAll(".lp-testimonial-card"), { opacity:1, y:0, stagger:.13, duration:.8, ease:"power2.out", scrollTrigger:{ trigger:ref.current, start:"top 82%", once:true }})
  })
  return (
    <section className="lp-section">
      <div className="lp-section-label gs-reveal">Depoimentos</div>
      <h2 className="lp-section-title gs-reveal" style={{marginBottom:40}}>Clínicas que já transformaram<br/>sua gestão.</h2>
      <div className="lp-testimonials-grid" ref={ref}>
        {TESTIMONIALS.map(t=>(
          <div key={t.name} className="lp-testimonial-card">
            <p className="lp-testimonial-text">{t.text}</p>
            <div className="lp-testimonial-author">
              <div className="lp-testimonial-avatar">{t.initials}</div>
              <div><div className="lp-testimonial-name">{t.name}</div><div className="lp-testimonial-role">{t.role}</div></div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

// ─── Pricing ──────────────────────────────────────────────────────────────────
function Pricing() {
  const ref = useRef(null)
  useGSAP((gsap, ScrollTrigger) => {
    gsap.set(ref.current.querySelectorAll(".lp-plan-card"), { opacity:0, y:40 })
    gsap.to(ref.current.querySelectorAll(".lp-plan-card"), { opacity:1, y:0, stagger:.1, duration:.8, ease:"power2.out", scrollTrigger:{ trigger:ref.current, start:"top 82%", once:true }})
  })
  return (
    <section id="pricing" style={{background:"#080f1a", padding:"72px 60px"}}>
      <div style={{maxWidth:1100, margin:"0 auto"}}>
        <div className="lp-section-label">Planos</div>
        <h2 className="lp-section-title">Simples e transparente.</h2>
        <p className="lp-section-sub">Comece grátis. Assine quando quiser. Cancele quando precisar.</p>
        <div className="lp-plans-grid" ref={ref}>
          {PLANS.map(p=>(
            <div key={p.name} className={`lp-plan-card${p.highlight?" highlight":""}`}
              style={{ borderColor:p.highlight?p.color:"#1e293b", borderTop:`3px solid ${p.color}`, boxShadow:p.highlight?`0 0 32px ${p.color}18`:"none" }}>
              {p.highlight && <div className="lp-plan-badge" style={{background:p.color}}>Mais popular</div>}
              <div className="lp-plan-name" style={{color:p.color}}>{p.name}</div>
              <div className="lp-plan-price-wrap">
                {p.price === 0
                  ? <span className="lp-plan-price">Grátis</span>
                  : <><span style={{fontSize:15,fontWeight:700,color:"#94a3b8",verticalAlign:"top",marginTop:8,display:"inline-block"}}>R$</span>
                      <span className="lp-plan-price">{p.price}</span>
                      <span className="lp-plan-period">/mês</span></>
                }
              </div>
              {p.saving && <div className="lp-plan-saving" style={{color:p.savingColor}}>{p.saving}</div>}
              <div className="lp-plan-desc">{p.desc}</div>
              <ul className="lp-plan-features">
                {p.features.map(f=>(
                  <li key={f} className="lp-plan-feature">
                    <span style={{flexShrink:0,marginTop:2}}>{Icons.check()}</span>{f}
                  </li>
                ))}
              </ul>
              <Link to={p.ctaUrl} className={`lp-plan-cta ${p.highlight?"lp-plan-cta-solid":"lp-plan-cta-outline"}`}
                style={p.highlight?{background:p.color}:{}}>
                {p.cta}
              </Link>
            </div>
          ))}
        </div>
        <p style={{textAlign:"center",fontSize:12,color:"#334155",marginTop:28}}>Sem fidelidade · Cancele quando quiser · Sem cartão para o plano Free</p>
      </div>
    </section>
  )
}

// ─── FAQ ──────────────────────────────────────────────────────────────────────
function FAQ() {
  const [open, setOpen] = useState(null)
  const ref = useRef(null)
  useGSAP((gsap, ScrollTrigger) => {
    gsap.set(ref.current.querySelectorAll(".lp-faq-item"), { opacity:0, x:-20 })
    gsap.to(ref.current.querySelectorAll(".lp-faq-item"), { opacity:1, x:0, stagger:.07, duration:.6, ease:"power2.out", scrollTrigger:{ trigger:ref.current, start:"top 82%", once:true }})
  })
  return (
    <section id="faq" className="lp-section">
      <div className="lp-section-label">FAQ</div>
      <h2 className="lp-section-title">Perguntas frequentes.</h2>
      <div className="lp-faq-list" ref={ref}>
        {FAQS.map((f,i)=>(
          <div key={i} className="lp-faq-item">
            <button className="lp-faq-q" onClick={()=>setOpen(open===i?null:i)}>
              {f.q}
              <span className="lp-faq-chevron" style={{transform:open===i?"rotate(180deg)":"none"}}>{Icons.chevron()}</span>
            </button>
            <div className={`lp-faq-a${open===i?" open":""}`}>{f.a}</div>
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
    gsap.set(ref.current.querySelectorAll(".gs-reveal"), { opacity:0, y:28 })
    gsap.to(ref.current.querySelectorAll(".gs-reveal"), { opacity:1, y:0, stagger:.1, duration:.8, ease:"power2.out", scrollTrigger:{ trigger:ref.current, start:"top 82%", once:true }})
  })
  return (
    <div className="lp-cta" ref={ref}>
      <div className="lp-cta-glow"/>
      <div className="lp-section-label gs-reveal">Pronto para começar?</div>
      <h2 className="lp-cta-title gs-reveal">Organize sua clínica hoje.<br/><span>É grátis para começar.</span></h2>
      <p className="lp-cta-sub gs-reveal">Sem instalação. Sem cartão de crédito. Sem complicação.</p>
      <div className="lp-cta-actions gs-reveal">
        <Link to="/register"><button className="lp-btn-hero">Criar conta grátis →</button></Link>
        <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer"><button className="lp-btn-ghost">Falar no WhatsApp</button></a>
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
        <Nav/>
      <Hero/>
      <Stats/>
      <Features/>
      <Testimonials/>
      <Pricing/>
      <FAQ/>
      <CTAFinal/>
      <Footer/>
    </div>
  )
}
