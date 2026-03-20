import { Link, useLocation } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { useTheme } from "../context/ThemeContext"
import { usePermissions } from "../hooks/usePermissions"
import { useState, useEffect, useRef, useCallback } from "react"
import { motion } from "framer-motion"
import { pageVariants } from "../hooks/useMotion"


// ─── Animações globais do app (CSS puro, injetado uma vez) ────────────────────
// ─── Nav Icons (SVG inline) ───────────────────────────────────────────────────
const NavIcons = {
  dashboard:    (c) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>
    </svg>
  ),
  patients:     (c) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  appointments: (c) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
      <line x1="8" y1="14" x2="8" y2="14"/><line x1="12" y1="14" x2="12" y2="14"/><line x1="16" y1="14" x2="16" y2="14"/>
    </svg>
  ),
  financeiro:   (c) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23"/>
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
    </svg>
  ),
  profile:      (c) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  ),
  team:         (c) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  moon:         (c) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  ),
  sun:          (c) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5"/>
      <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
      <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    </svg>
  ),
}

const ALL_NAV_ITEMS = [
  { path: "/dashboard",    label: "Dashboard",     icon: NavIcons.dashboard,    permission: "canViewDashboard" },
  { path: "/patients",     label: "Pacientes",     icon: NavIcons.patients,     permission: "canViewPatients" },
  { path: "/appointments", label: "Agendamentos",  icon: NavIcons.appointments, permission: "canViewAppointments" },
  { path: "/financeiro",   label: "Financeiro",    icon: NavIcons.financeiro,   permission: "canViewFinancial" },
  { path: "/profile",      label: "Minha Clínica", icon: NavIcons.profile,      permission: "canViewClinicProfile" },
  { path: "/team",         label: "Equipe",        icon: NavIcons.team,         permission: "canViewTeam" },
]

export default function AppLayout({ children }) {
  const { user, logout } = useAuth()
  const { t, mode, toggle } = useTheme()
  const permissions = usePermissions()
  const NAV_ITEMS = ALL_NAV_ITEMS.filter(item => permissions[item.permission])
  const location = useLocation()
  const [loggingOut, setLoggingOut] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)

  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth <= 768)
      if (window.innerWidth > 768) setMenuOpen(false)
    }
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // Fecha menu ao trocar de rota
  useEffect(() => { setMenuOpen(false) }, [location.pathname])

  async function handleLogout() {
    setLoggingOut(true)
    await logout()
    setLoggingOut(false)
  }

  const currentPage = NAV_ITEMS.find(i => i.path === location.pathname)

  return (
    <div style={{
      display: "flex",
      height: "100vh",
      width: "100%",
      maxWidth: "100%",
      overflow: "hidden",
      background: t.bgPage,
      fontFamily: "'DM Sans','Segoe UI',sans-serif",
      color: t.textBody,
      flexDirection: isMobile ? "column" : "row",
    }}>

      {/* ── MOBILE: Top bar ── */}
      {isMobile && (
        <header style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          background: t.bgSidebar,
          borderBottom: `1px solid ${t.border}`,
          // Safe area: respeita notch e barra de status do celular
          paddingTop: "env(safe-area-inset-top, 0px)",
          paddingLeft: "max(16px, env(safe-area-inset-left, 0px))",
          paddingRight: "max(16px, env(safe-area-inset-right, 0px))",
          paddingBottom: 0,
          minHeight: 56,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}>
          <span style={{ fontSize: 18, fontWeight: 800, color: t.textPrimary, letterSpacing: "-0.5px" }}>
            Clinic<span style={{ color: t.accent }}>OS</span>
          </span>

          <span style={{ fontSize: 14, fontWeight: 600, color: t.textMuted }}>
            {currentPage && currentPage.icon(t.textMuted)} <span style={{marginLeft:4}}>{currentPage?.label ?? ""}</span>
          </span>

          {/* Botão hambúrguer */}
          <button
            onClick={() => setMenuOpen(o => !o)}
            style={{
              background: "transparent",
              border: `1px solid ${t.border}`,
              borderRadius: 8,
              width: 36,
              height: 36,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 5,
              cursor: "pointer",
              padding: 0,
            }}
          >
            <span style={{
              display: "block", width: 18, height: 2,
              background: t.textMuted, borderRadius: 2,
              transition: "all 0.2s",
              transform: menuOpen ? "rotate(45deg) translate(5px, 5px)" : "none",
            }} />
            <span style={{
              display: "block", width: 18, height: 2,
              background: t.textMuted, borderRadius: 2,
              transition: "all 0.2s",
              opacity: menuOpen ? 0 : 1,
            }} />
            <span style={{
              display: "block", width: 18, height: 2,
              background: t.textMuted, borderRadius: 2,
              transition: "all 0.2s",
              transform: menuOpen ? "rotate(-45deg) translate(5px, -5px)" : "none",
            }} />
          </button>
        </header>
      )}

      {/* ── MOBILE: Drawer menu ── */}
      {isMobile && menuOpen && (
        <>
          <div
            onClick={() => setMenuOpen(false)}
            style={{
              position: "fixed", inset: 0, zIndex: 150,
              background: "rgba(0,0,0,0.5)",
            }}
          />
          <div style={{
            position: "fixed",
            top: 56, right: 0,
            width: 240,
            height: "calc(100vh - 56px)",
            background: t.bgSidebar,
            borderLeft: `1px solid ${t.border}`,
            zIndex: 200,
            display: "flex",
            flexDirection: "column",
            padding: "16px 12px",
            overflowY: "auto",
          }}>
            <nav style={{ display: "flex", flexDirection: "column", gap: 2, flex: 1 }}>
              {NAV_ITEMS.map((item) => {
                const active = location.pathname === item.path
                return (
                  <Link key={item.path} to={item.path} style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "12px 14px", borderRadius: 8, fontSize: 15,
                    fontWeight: active ? 700 : 500,
                    color: active ? t.textPrimary : t.textFaint,
                    background: active ? t.bgCard : "transparent",
                    textDecoration: "none",
                    transition: "background 0.15s, color 0.15s",
                  }}>
                    <span style={{ width: 24, display:"flex", alignItems:"center", justifyContent:"center" }}>{item.icon(active ? t.accent : t.textFaint)}</span>
                    <span>{item.label}</span>
                    {active && <span style={{ width: 6, height: 6, borderRadius: "50%", background: t.accent, marginLeft: "auto" }} />}
                  </Link>
                )
              })}
            </nav>

            <div style={{ display: "flex", flexDirection: "column", gap: 8, paddingTop: 16, borderTop: `1px solid ${t.border}` }}>
              <button onClick={toggle} style={{
                background: t.bgCard, border: `1px solid ${t.border}`, color: t.textMuted,
                borderRadius: 8, padding: "10px", fontSize: 13, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                fontFamily: "inherit",
              }}>
                {mode === "dark" ? NavIcons.sun(t.textMuted) : NavIcons.moon(t.textMuted)}
                {mode === "dark" ? "Modo claro" : "Modo escuro"}
              </button>

              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 4px" }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#1d4ed8", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
                  {user?.email?.[0]?.toUpperCase() ?? "U"}
                </div>
                <div style={{ fontSize: 12, color: t.textGhost, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user?.email}</div>
              </div>

              <button onClick={handleLogout} disabled={loggingOut} style={{
                background: "transparent", border: `1px solid ${t.border}`, color: t.textGhost,
                borderRadius: 8, padding: "10px", fontSize: 13, cursor: "pointer",
                opacity: loggingOut ? 0.6 : 1,
              }}>
                {loggingOut ? "Saindo..." : "Sair"}
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── DESKTOP: Sidebar ── */}
      {!isMobile && (
        <aside style={{
          width: 220,
          background: t.bgSidebar, borderRight: `1px solid ${t.border}`,
          display: "flex", flexDirection: "column", flexShrink: 0,
          height: "100vh", overflowY: "auto",
        }}>
          <div style={{ padding: "28px 24px 20px", borderBottom: `1px solid ${t.border}` }}>
            <span style={{ fontSize: 20, fontWeight: 800, color: t.textPrimary, letterSpacing: "-0.5px" }}>
              Clinic<span style={{ color: t.accent }}>OS</span>
            </span>
          </div>

          <nav style={{ display: "flex", flexDirection: "column", gap: 2, padding: "16px 12px", flex: 1 }}>
            {NAV_ITEMS.map((item) => {
              const active = location.pathname === item.path
              return (
                <Link key={item.path} to={item.path} style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "10px 12px", borderRadius: 8, fontSize: 14,
                  fontWeight: active ? 600 : 500,
                  color: active ? t.textPrimary : t.textFaint,
                  background: active ? t.bgCard : "transparent",
                  textDecoration: "none", position: "relative",
                  transition: "background 0.15s, color 0.15s",
                }}>
                  <span style={{ width: 20, display:"flex", alignItems:"center", justifyContent:"center" }}>{item.icon(active ? t.accent : t.textFaint)}</span>
                  <span>{item.label}</span>
                  {active && <span style={{ width: 6, height: 6, borderRadius: "50%", background: t.accent, marginLeft: "auto" }} />}
                </Link>
              )
            })}
          </nav>

          <div style={{ padding: "16px 12px", borderTop: `1px solid ${t.border}`, display: "flex", flexDirection: "column", gap: 8 }}>
            <button onClick={toggle} style={{
              background: t.bgCard, border: `1px solid ${t.border}`, color: t.textMuted,
              borderRadius: 8, padding: "8px", fontSize: 12, cursor: "pointer", width: "100%",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              fontFamily: "inherit",
            }}>
              {mode === "dark" ? NavIcons.sun(t.textMuted) : NavIcons.moon(t.textMuted)}
              {mode === "dark" ? "Modo claro" : "Modo escuro"}
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#1d4ed8", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
                {user?.email?.[0]?.toUpperCase() ?? "U"}
              </div>
              <div style={{ fontSize: 12, color: t.textGhost, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user?.email}</div>
            </div>

            <button onClick={handleLogout} disabled={loggingOut} style={{
              background: "transparent", border: `1px solid ${t.border}`, color: t.textGhost,
              borderRadius: 8, padding: "8px", fontSize: 13, cursor: "pointer", width: "100%",
              opacity: loggingOut ? 0.6 : 1,
            }}>
              {loggingOut ? "Saindo..." : "Sair"}
            </button>
          </div>
        </aside>
      )}

      {/* ── Conteúdo principal ── */}
      <main style={{
        flex: 1,
        minWidth: 0,
        maxWidth: "100%",
        height: "100vh",
        overflowY: "auto",
        overflowX: "hidden",
        padding: isMobile
          ? `20px max(16px, env(safe-area-inset-right, 0px)) max(20px, env(safe-area-inset-bottom, 0px)) max(16px, env(safe-area-inset-left, 0px))`
          : "32px 40px",
        boxSizing: "border-box",
        fontSize: isMobile ? "14px" : "16px",
      }}>
        {/* motion.div — transição de página via Framer Motion */}
        <motion.div
          key={location.pathname}
          variants={pageVariants}
          initial="initial"
          animate="enter"
          exit="exit"
          style={{ minHeight: "100%" }}
        >
          {children}
        </motion.div>
      </main>

    </div>
  )
}
