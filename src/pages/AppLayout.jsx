import { Link, useLocation } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { useTheme } from "../context/ThemeContext"
import { usePermissions } from "../hooks/usePermissions"
import { useState } from "react"

const ALL_NAV_ITEMS = [
  { path: "/dashboard",    label: "Dashboard",     icon: "⊞", permission: "canViewDashboard" },
  { path: "/patients",     label: "Pacientes",     icon: "🦷", permission: "canViewPatients" },
  { path: "/appointments", label: "Agendamentos",  icon: "📅", permission: "canViewAppointments" },
  { path: "/profile",      label: "Minha Clínica", icon: "⚙️", permission: "canViewClinicProfile" },
  { path: "/team",          label: "Equipe",        icon: "👥", permission: "canViewTeam" },
]

export default function AppLayout({ children }) {
  const { user, logout } = useAuth()
  const { t, mode, toggle } = useTheme()
  const permissions = usePermissions()
  const NAV_ITEMS = ALL_NAV_ITEMS.filter(item => permissions[item.permission])
  const location = useLocation()
  const [loggingOut, setLoggingOut] = useState(false)

  async function handleLogout() {
    setLoggingOut(true)
    await logout()
    setLoggingOut(false)
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: t.bgPage, fontFamily: "'DM Sans','Segoe UI',sans-serif", color: t.textBody }}>
      <aside style={{ width: 220, minHeight: "100vh", background: t.bgSidebar, borderRight: `1px solid ${t.border}`, display: "flex", flexDirection: "column", flexShrink: 0, position: "sticky", top: 0, height: "100vh" }}>
        
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
                <span style={{ fontSize: 16, width: 20, textAlign: "center" }}>{item.icon}</span>
                <span>{item.label}</span>
                {active && <span style={{ width: 6, height: 6, borderRadius: "50%", background: t.accent, marginLeft: "auto" }} />}
              </Link>
            )
          })}
        </nav>

        <div style={{ padding: "16px 12px", borderTop: `1px solid ${t.border}`, display: "flex", flexDirection: "column", gap: 8 }}>
          {/* Toggle tema */}
          <button onClick={toggle} style={{
            background: t.bgCard, border: `1px solid ${t.border}`, color: t.textMuted,
            borderRadius: 8, padding: "8px", fontSize: 12, cursor: "pointer", width: "100%",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          }}>
            {mode === "dark" ? "☀️" : "🌙"} {mode === "dark" ? "Modo claro" : "Modo escuro"}
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

      <main style={{ flex: 1, minWidth: 0, padding: "32px 40px", boxSizing: "border-box" }}>
        {children}
      </main>
    </div>
  )
}
