import { Link } from "react-router-dom"
import { useState, useEffect } from "react"

const INSTAGRAM_URL = "https://instagram.com/clinicos"

const responsiveCSS = `
  @media (max-width: 768px) {
    .lp-nav { padding: 16px 20px !important; }
    .lp-nav-links { display: none !important; }
    .lp-nav-actions button { padding: 8px 14px !important; font-size: 13px !important; }

    .lp-hero { padding: 60px 24px 48px !important; }
    .lp-hero-title { font-size: 32px !important; letter-spacing: -0.5px !important; }
    .lp-hero-sub { font-size: 15px !important; }
    .lp-hero-ctas { flex-direction: column !important; align-items: stretch !important; }
    .lp-hero-ctas a { width: 100% !important; }
    .lp-hero-ctas button { width: 100% !important; text-align: center !important; }
    .lp-preview-body { grid-template-columns: repeat(2, 1fr) !important; }
    .lp-preview-val { font-size: 20px !important; }

    .lp-section { padding: 60px 24px !important; }
    .lp-section-title { font-size: 28px !important; }
    .lp-section-sub { font-size: 15px !important; margin-bottom: 36px !important; }

    .lp-plans-grid { grid-template-columns: 1fr !important; max-width: 400px !important; margin: 0 auto !important; }

    .lp-cta { padding: 60px 24px !important; }
    .lp-cta-title { font-size: 28px !important; }

    .lp-footer { padding: 24px 20px !important; flex-direction: column !important; align-items: flex-start !important; }
  }
`

function InjectResponsive() {
  useEffect(() => {
    if (document.getElementById("lp-responsive")) return
    const tag = document.createElement("style")
    tag.id = "lp-responsive"
    tag.textContent = responsiveCSS
    document.head.appendChild(tag)
  }, [])
  return null
}

// ─── Data ────────────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: "🏥",
    title: "Gestão de Pacientes",
    desc: "Cadastro completo, histórico de atendimentos e dados centralizados. Acesse qualquer informação em segundos.",
  },
  {
    icon: "📅",
    title: "Agendamentos Inteligentes",
    desc: "Visualize a agenda do dia, semana ou mês. Evite conflitos e reduza faltas com lembretes automáticos.",
  },
  {
    icon: "👥",
    title: "Gestão de Equipe",
    desc: "Adicione dentistas, recepcionistas e assistentes com permissões individuais por papel.",
  },
  {
    icon: "📊",
    title: "Dashboard com Métricas",
    desc: "Acompanhe ocupação semanal, agendamentos do dia e crescimento da clínica em tempo real.",
  },
  {
    icon: "🔒",
    title: "Isolamento Total de Dados",
    desc: "Cada clínica é um ambiente independente. Seus dados nunca se misturam com os de outra clínica.",
  },
  {
    icon: "⚡",
    title: "Pronto em Minutos",
    desc: "Crie sua conta e comece a usar imediatamente. Sem instalação, sem configuração complexa.",
  },
]

const BILLING_CYCLES = [
  { id: "monthly",    label: "Mensal",     discount: 0  },
  { id: "quarterly",  label: "Trimestral", discount: 10 },
  { id: "semiannual", label: "Semestral",  discount: 15 },
]

function getPrice(base, discountPct) {
  return Math.round(base * (1 - discountPct / 100))
}

const PLANS = [
  {
    name: "Free",
    basePrice: 0,
    period: "/mês",
    desc: "Para experimentar o sistema.",
    features: ["Até 20 pacientes", "1 usuário (admin)", "Agendamentos ilimitados", "Dashboard básico"],
    cta: "Começar grátis",
    ctaUrl: "/register",
    highlight: false,
    color: "#64748b",
  },
  {
    name: "Pro",
    basePrice: 79,
    period: "/mês",
    desc: "Para profissionais autônomos.",
    features: ["Pacientes ilimitados", "Até 3 usuários", "Prontuário completo", "Financeiro completo", "Dashboard avançado"],
    cta: "Assinar Pro",
    ctaUrl: "/register",
    highlight: true,
    color: "#3b82f6",
  },
  {
    name: "Clínica",
    basePrice: 199,
    period: "/mês",
    desc: "Para clínicas com equipe.",
    features: ["Tudo do Pro", "Usuários ilimitados", "Suporte prioritário", "Onboarding dedicado"],
    cta: "Assinar Clínica",
    ctaUrl: "/register",
    highlight: false,
    color: "#8b5cf6",
  },
]

const TESTIMONIALS = [
  {
    name: "Dra. Fernanda Costa",
    role: "Cirurgiã-dentista, São Paulo",
    text: "Antes eu usava planilhas para tudo. Hoje abro o sistema e já sei exatamente o que acontece na clínica. A diferença é absurda.",
    initials: "FC",
  },
  {
    name: "Dr. Rafael Mendes",
    role: "Ortodontista, Belo Horizonte",
    text: "Implementei em uma tarde. Minha recepcionista aprendeu sozinha. Nunca pensei que organizar a clínica pudesse ser tão simples.",
    initials: "RM",
  },
  {
    name: "Dra. Camila Souza",
    role: "Clínica geral, Curitiba",
    text: "O que mais me impressiona é a segurança. Sei que os dados dos meus pacientes estão protegidos e separados de qualquer outro sistema.",
    initials: "CS",
  },
]

const FAQS = [
  {
    q: "Preciso instalar alguma coisa?",
    a: "Não. O sistema funciona 100% pelo navegador. Você acessa de qualquer dispositivo com internet — computador, tablet ou celular.",
  },
  {
    q: "Meus dados ficam seguros?",
    a: "Sim. Cada clínica possui um ambiente completamente isolado no banco de dados. Seus pacientes e agendamentos nunca são acessíveis por outras clínicas.",
  },
  {
    q: "Posso adicionar minha equipe?",
    a: "Sim. No plano Pro e Clínica você pode convidar dentistas, recepcionistas e assistentes com permissões individuais por papel.",
  },

  {
    q: "Posso migrar meus dados de outro sistema?",
    a: "Oferecemos importação via planilha CSV para pacientes. Para migrações complexas, nosso plano Clínica inclui onboarding dedicado.",
  },
]

// ─── Componentes de seção ────────────────────────────────────────────────────

function Nav() {
  return (
    <nav style={s.nav} className="lp-nav">
      <span style={s.logo}>Clinic<span style={s.logoAccent}>OS</span></span>
      <div style={s.navLinks} className="lp-nav-links">
        <a href="#features" style={s.navLink}>Funcionalidades</a>
        <a href="#pricing" style={s.navLink}>Planos</a>
        <a href="#faq" style={s.navLink}>FAQ</a>
      </div>
      <div style={s.navActions}>
        <Link to="/login"><button style={s.btnOutline}>Entrar</button></Link>
        <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer"><button style={s.btnPrimary}>Falar conosco</button></a>
      </div>
    </nav>
  )
}

function Hero() {
  return (
    <section style={s.hero} className="lp-hero">
      <div style={s.heroBadge}>✦ Gestão clínica simplificada</div>
      <h1 style={s.heroTitle} className="lp-hero-title">
        Sua clínica organizada.<br />
        <span style={s.heroTitleAccent}>Do primeiro paciente ao décimo milhar.</span>
      </h1>
      <p style={s.heroSub} className="lp-hero-sub">
        Sistema completo para gestão de clínicas odontológicas. Pacientes, agendamentos,
        equipe e métricas em um só lugar — seguro, rápido e pronto para crescer com você.
      </p>
      <div style={s.heroCtas} className="lp-hero-ctas">
        <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer">
          <button style={s.btnHero}>Quero conhecer →</button>
        </a>
        <a href="#features">
          <button style={s.btnHeroGhost}>Ver funcionalidades →</button>
        </a>
      </div>
      <p style={s.heroNote}>Sem instalação · Pronto em minutos · Suporte via WhatsApp</p>

      {/* Mock dashboard preview */}
      <div style={s.heroPreview}>
        <div style={s.previewBar}>
          <span style={s.previewDot} />
          <span style={{ ...s.previewDot, background: "#fbbf24" }} />
          <span style={{ ...s.previewDot, background: "#22c55e" }} />
          <span style={s.previewTitle}>Dashboard — ClinicOS</span>
        </div>
        <div style={s.previewBody} className="lp-preview-body">
          {[
            { label: "Pacientes ativos", val: "248", color: "#3b82f6" },
            { label: "Agendamentos hoje", val: "12", color: "#8b5cf6" },
            { label: "Próximos na fila", val: "5", color: "#f59e0b" },
            { label: "Ocupação semanal", val: "87%", color: "#22c55e" },
          ].map((m) => (
            <div key={m.label} style={{ ...s.previewCard, borderTop: `2px solid ${m.color}` }}>
              <span style={{ ...s.previewVal, color: m.color }} className="lp-preview-val">{m.val}</span>
              <span style={s.previewLabel}>{m.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Features() {
  return (
    <section id="features" style={s.section} className="lp-section">
      <div style={s.sectionLabel}>Funcionalidades</div>
      <h2 style={s.sectionTitle} className="lp-section-title">Tudo que sua clínica precisa,<br />nada que ela não precisa.</h2>
      <p style={s.sectionSub} className="lp-section-sub">
        Construído para ser direto ao ponto. Cada funcionalidade foi pensada para economizar
        tempo real no dia a dia da clínica.
      </p>
      <div style={s.featuresGrid}>
        {FEATURES.map((f) => (
          <div key={f.title} style={s.featureCard}>
            <span style={s.featureIcon}>{f.icon}</span>
            <h3 style={s.featureTitle}>{f.title}</h3>
            <p style={s.featureDesc}>{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

function Pricing() {
  const [cycle, setCycle] = useState("monthly")
  const activeCycle = BILLING_CYCLES.find(c => c.id === cycle)

  return (
    <section id="pricing" style={{ ...s.section, background: "#080f1a" }} className="lp-section">
      <div style={s.sectionLabel}>Planos</div>
      <h2 style={s.sectionTitle} className="lp-section-title">Simples e transparente.</h2>
      <p style={s.sectionSub} className="lp-section-sub">Comece grátis. Assine quando quiser. Cancele quando precisar.</p>

      {/* Seletor de ciclo */}
      <div style={{ display:"flex", gap:8, marginBottom:48, justifyContent:"center", flexWrap:"wrap" }}>
        {BILLING_CYCLES.map(c => (
          <button key={c.id} onClick={() => setCycle(c.id)} style={{
            background: cycle===c.id ? "#3b82f6" : "transparent",
            border: `1px solid ${cycle===c.id ? "#3b82f6" : "#1e293b"}`,
            color: cycle===c.id ? "#fff" : "#64748b",
            borderRadius: 8, padding: "8px 20px", fontSize: 14, fontWeight: 600, cursor: "pointer",
          }}>
            {c.label}
            {c.discount > 0 && (
              <span style={{ marginLeft:8, background:"#052e16", color:"#22c55e", border:"1px solid #166534", borderRadius:99, padding:"2px 8px", fontSize:11, fontWeight:700 }}>
                -{c.discount}%
              </span>
            )}
          </button>
        ))}
      </div>

      <div style={{ ...s.plansGrid, gridTemplateColumns:"repeat(auto-fit, minmax(260px, 1fr))", maxWidth:1000, margin:"0 auto" }} className="lp-plans-grid">
        {PLANS.map((p) => {
          const price = p.basePrice === 0 ? 0 : getPrice(p.basePrice, activeCycle.discount)
          return (
            <div key={p.name} className={p.highlight ? "lp-plan-highlighted" : ""} style={{
              ...s.planCard,
              ...(p.highlight ? s.planCardHighlight : {}),
              borderColor: p.highlight ? p.color : "#1e293b",
              borderWidth: p.highlight ? 2 : 1,
              transform: p.highlight ? "scale(1.04)" : "scale(1)",
              boxShadow: p.highlight ? `0 0 40px ${p.color}22` : "none",
              borderTop: `3px solid ${p.color}`,
            }}>
              {p.highlight && <div style={{ ...s.planBadge, background: p.color }}>Mais popular</div>}
              <h3 style={{ ...s.planName, color: p.color }}>{p.name}</h3>
              <div style={s.planPrice}>
                {price === 0
                  ? <span style={{ fontSize:40, fontWeight:800, color:"#f8fafc" }}>Grátis</span>
                  : <>
                      <span style={{ fontSize:16, fontWeight:700, color:"#94a3b8", verticalAlign:"top", marginTop:8, display:"inline-block" }}>R$</span>
                      <span style={{ fontSize:48, fontWeight:800, color:"#f8fafc", letterSpacing:"-2px" }}>{price}</span>
                      <span style={s.planPeriod}>/mês</span>
                    </>
                }
              </div>
              {activeCycle.discount > 0 && price > 0 && (
                <p style={{ fontSize:12, color:"#475569", margin:"-8px 0 8px" }}>
                  cobrado R${price * (cycle === "quarterly" ? 3 : 6)}/{cycle === "quarterly" ? "trimestre" : "semestre"}
                </p>
              )}
              <p style={s.planDesc}>{p.desc}</p>
              <ul style={s.planFeatures}>
                {p.features.map((f) => (
                  <li key={f} style={s.planFeatureItem}><span style={s.checkIcon}>✓</span> {f}</li>
                ))}
              </ul>
              <Link to={p.ctaUrl} style={{ textDecoration:"none" }}>
                <button style={p.highlight ? { ...s.btnPlanHighlight, background: p.color } : s.btnPlan}>{p.cta}</button>
              </Link>
            </div>
          )
        })}
      </div>
      <p style={{ textAlign:"center", fontSize:13, color:"#334155", marginTop:32 }}>
        Sem fidelidade · Cancele quando quiser · Sem cartão para o plano Free
      </p>
    </section>
  )
}

function Testimonials() {
  return (
    <section style={s.section} className="lp-section">
      <div style={s.sectionLabel}>Depoimentos</div>
      <h2 style={s.sectionTitle} className="lp-section-title">Clínicas que já transformaram<br />sua gestão.</h2>
      <div style={s.testimonialsGrid}>
        {TESTIMONIALS.map((t) => (
          <div key={t.name} style={s.testimonialCard}>
            <p style={s.testimonialText}>"{t.text}"</p>
            <div style={s.testimonialAuthor}>
              <div style={s.testimonialAvatar}>{t.initials}</div>
              <div>
                <div style={s.testimonialName}>{t.name}</div>
                <div style={s.testimonialRole}>{t.role}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function FAQ() {
  const [open, setOpen] = useState(null)
  return (
    <section id="faq" style={{ ...s.section, background: "#080f1a" }} className="lp-section">
      <div style={s.sectionLabel}>FAQ</div>
      <h2 style={s.sectionTitle} className="lp-section-title">Perguntas frequentes.</h2>
      <div style={s.faqList}>
        {FAQS.map((item, i) => (
          <div key={i} style={s.faqItem}>
            <button
              style={s.faqQuestion}
              onClick={() => setOpen(open === i ? null : i)}
            >
              {item.q}
              <span style={{ ...s.faqChevron, transform: open === i ? "rotate(180deg)" : "rotate(0deg)" }}>▾</span>
            </button>
            {open === i && <p style={s.faqAnswer}>{item.a}</p>}
          </div>
        ))}
      </div>
    </section>
  )
}

function CTA() {
  return (
    <section style={s.ctaSection} className="lp-cta">
      <h2 style={s.ctaTitle} className="lp-cta-title">Pronto para organizar sua clínica?</h2>
      <p style={s.ctaSub}>Crie sua conta em menos de 2 minutos. Sem cartão de crédito.</p>
      <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer">
        <button style={s.btnHero}>Quero conhecer →</button>
      </a>
    </section>
  )
}

function Footer() {
  return (
    <footer style={s.footer} className="lp-footer">
      <span style={s.logo}>Clinic<span style={s.logoAccent}>OS</span></span>
      <p style={s.footerText}>© {new Date().getFullYear()} ClinicOS. Todos os direitos reservados.</p>
      <div style={s.footerLinks}>
        <Link to="/login" style={s.footerLink}>Entrar</Link>
        <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" style={s.footerLink}>Criar conta</a>
      </div>
    </footer>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div style={s.page}>
      <InjectResponsive />
      <Nav />
      <Hero />
      <Features />
      <Testimonials />
      <Pricing />
      <FAQ />
      <CTA />
      <Footer />
    </div>
  )
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const s = {
  page: {
    background: "#0a1120",
    color: "#e2e8f0",
    fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
    minHeight: "100vh",
    overflowX: "hidden",
  },

  // Nav
  nav: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "20px 60px",
    borderBottom: "1px solid #1e293b",
    position: "sticky",
    top: 0,
    background: "rgba(10,17,32,0.95)",
    backdropFilter: "blur(12px)",
    zIndex: 100,
    flexWrap: "wrap",
    gap: 16,
  },
  logo: {
    fontSize: 22,
    fontWeight: 800,
    color: "#f8fafc",
    letterSpacing: "-0.5px",
    textDecoration: "none",
  },
  logoAccent: { color: "#3b82f6" },
  navLinks: { display: "flex", gap: 32 },
  navLink: {
    color: "#94a3b8",
    textDecoration: "none",
    fontSize: 14,
    fontWeight: 500,
    transition: "color 0.2s",
  },
  navActions: { display: "flex", gap: 10 },
  btnOutline: {
    background: "transparent",
    border: "1px solid #334155",
    color: "#cbd5e1",
    borderRadius: 8,
    padding: "9px 20px",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
  },
  btnPrimary: {
    background: "#3b82f6",
    border: "none",
    color: "#fff",
    borderRadius: 8,
    padding: "9px 20px",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
  },

  // Hero
  hero: {
    padding: "100px 60px 80px",
    textAlign: "center",
    maxWidth: 900,
    margin: "0 auto",
  },
  heroBadge: {
    display: "inline-block",
    background: "#0f2a4a",
    color: "#60a5fa",
    border: "1px solid #1d4ed8",
    borderRadius: 99,
    padding: "5px 16px",
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: "0.05em",
    marginBottom: 28,
  },
  heroTitle: {
    fontSize: 56,
    fontWeight: 800,
    lineHeight: 1.1,
    color: "#f8fafc",
    margin: "0 0 24px",
    letterSpacing: "-1.5px",
  },
  heroTitleAccent: { color: "#3b82f6" },
  heroSub: {
    fontSize: 18,
    color: "#94a3b8",
    lineHeight: 1.7,
    maxWidth: 600,
    margin: "0 auto 36px",
  },
  heroCtas: { display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" },
  btnHero: {
    background: "#3b82f6",
    border: "none",
    color: "#fff",
    borderRadius: 10,
    padding: "14px 32px",
    fontSize: 16,
    fontWeight: 700,
    cursor: "pointer",
    letterSpacing: "-0.2px",
  },
  btnHeroGhost: {
    background: "transparent",
    border: "1px solid #1e293b",
    color: "#94a3b8",
    borderRadius: 10,
    padding: "14px 28px",
    fontSize: 16,
    fontWeight: 600,
    cursor: "pointer",
  },
  heroNote: { fontSize: 12, color: "#475569", marginTop: 16 },

  // Preview mock
  heroPreview: {
    marginTop: 60,
    background: "#0f172a",
    border: "1px solid #1e293b",
    borderRadius: 16,
    overflow: "hidden",
    maxWidth: 760,
    marginLeft: "auto",
    marginRight: "auto",
    boxShadow: "0 40px 80px rgba(0,0,0,0.5)",
  },
  previewBar: {
    background: "#1e293b",
    padding: "12px 16px",
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  previewDot: {
    width: 10,
    height: 10,
    borderRadius: "50%",
    background: "#ef4444",
    display: "inline-block",
  },
  previewTitle: { fontSize: 12, color: "#475569", marginLeft: 8 },
  previewBody: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: 1,
    background: "#1e293b",
    padding: 1,
  },
  previewCard: {
    background: "#0f172a",
    padding: "20px 16px",
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  previewVal: { fontSize: 28, fontWeight: 800, letterSpacing: "-0.5px" },
  previewLabel: { fontSize: 11, color: "#475569" },

  // Sections
  section: {
    padding: "100px 60px",
    maxWidth: 1100,
    margin: "0 auto",
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: 700,
    color: "#3b82f6",
    textTransform: "uppercase",
    letterSpacing: "0.12em",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 40,
    fontWeight: 800,
    color: "#f8fafc",
    margin: "0 0 16px",
    letterSpacing: "-1px",
    lineHeight: 1.15,
  },
  sectionSub: {
    fontSize: 16,
    color: "#64748b",
    lineHeight: 1.7,
    maxWidth: 560,
    margin: "0 0 56px",
  },

  // Features
  featuresGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: 20,
  },
  featureCard: {
    background: "#0f172a",
    border: "1px solid #1e293b",
    borderRadius: 12,
    padding: "28px 24px",
  },
  featureIcon: { fontSize: 28, display: "block", marginBottom: 14 },
  featureTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: "#f1f5f9",
    margin: "0 0 8px",
  },
  featureDesc: { fontSize: 14, color: "#64748b", lineHeight: 1.6, margin: 0 },

  // Testimonials
  testimonialsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: 20,
  },
  testimonialCard: {
    background: "#0f172a",
    border: "1px solid #1e293b",
    borderRadius: 12,
    padding: "28px 24px",
  },
  testimonialText: {
    fontSize: 15,
    color: "#cbd5e1",
    lineHeight: 1.7,
    margin: "0 0 24px",
    fontStyle: "italic",
  },
  testimonialAuthor: { display: "flex", alignItems: "center", gap: 12 },
  testimonialAvatar: {
    width: 40,
    height: 40,
    borderRadius: "50%",
    background: "#1d4ed8",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 13,
    fontWeight: 700,
    flexShrink: 0,
  },
  testimonialName: { fontSize: 14, fontWeight: 700, color: "#f1f5f9" },
  testimonialRole: { fontSize: 12, color: "#475569" },

  // Pricing
  plansGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: 20,
    maxWidth: 900,
    margin: "0 auto",
  },
  planCard: {
    background: "#0f172a",
    border: "1px solid #1e293b",
    borderRadius: 16,
    padding: "32px 28px",
    display: "flex",
    flexDirection: "column",
    gap: 0,
    position: "relative",
  },
  planCardHighlight: {
    border: "1px solid #3b82f6",
    background: "#0c1f3a",
  },
  planBadge: {
    position: "absolute",
    top: -12,
    left: "50%",
    transform: "translateX(-50%)",
    background: "#3b82f6",
    color: "#fff",
    fontSize: 11,
    fontWeight: 700,
    padding: "4px 14px",
    borderRadius: 99,
    whiteSpace: "nowrap",
  },
  planName: { fontSize: 16, fontWeight: 700, color: "#94a3b8", margin: "0 0 8px" },
  planPrice: { fontSize: 40, fontWeight: 800, color: "#f8fafc", letterSpacing: "-1px", margin: "0 0 4px" },
  planPeriod: { fontSize: 16, fontWeight: 400, color: "#475569" },
  planDesc: { fontSize: 13, color: "#475569", margin: "0 0 24px" },
  planFeatures: { listStyle: "none", padding: 0, margin: "0 0 28px", display: "flex", flexDirection: "column", gap: 10 },
  planFeatureItem: { fontSize: 14, color: "#cbd5e1", display: "flex", gap: 8, alignItems: "flex-start" },
  checkIcon: { color: "#22c55e", fontWeight: 700, flexShrink: 0 },
  btnPlan: {
    background: "#1e293b",
    border: "1px solid #334155",
    color: "#e2e8f0",
    borderRadius: 8,
    padding: "12px",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    width: "100%",
    marginTop: "auto",
  },
  btnPlanHighlight: {
    background: "#3b82f6",
    border: "none",
    color: "#fff",
    borderRadius: 8,
    padding: "12px",
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
    width: "100%",
    marginTop: "auto",
  },

  // FAQ
  faqList: { maxWidth: 680, margin: "0 auto", display: "flex", flexDirection: "column", gap: 4 },
  faqItem: {
    borderBottom: "1px solid #1e293b",
  },
  faqQuestion: {
    width: "100%",
    background: "none",
    border: "none",
    color: "#e2e8f0",
    fontSize: 15,
    fontWeight: 600,
    padding: "20px 0",
    textAlign: "left",
    cursor: "pointer",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
  },
  faqChevron: {
    color: "#475569",
    fontSize: 16,
    transition: "transform 0.2s",
    flexShrink: 0,
  },
  faqAnswer: {
    fontSize: 14,
    color: "#64748b",
    lineHeight: 1.7,
    margin: "0 0 20px",
    paddingRight: 32,
  },

  // CTA final
  ctaSection: {
    textAlign: "center",
    padding: "100px 60px",
    background: "linear-gradient(180deg, #0a1120 0%, #0c1f3a 100%)",
    borderTop: "1px solid #1e293b",
  },
  ctaTitle: {
    fontSize: 44,
    fontWeight: 800,
    color: "#f8fafc",
    margin: "0 0 16px",
    letterSpacing: "-1px",
  },
  ctaSub: { fontSize: 16, color: "#64748b", margin: "0 0 36px" },

  // Footer
  footer: {
    borderTop: "1px solid #1e293b",
    padding: "32px 60px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 16,
  },
  footerText: { fontSize: 13, color: "#334155", margin: 0 },
  footerLinks: { display: "flex", gap: 24, flexWrap: "wrap" },
  footerLink: { fontSize: 13, color: "#475569", textDecoration: "none" },
}