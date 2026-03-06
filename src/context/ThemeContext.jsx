import { createContext, useContext, useState, useEffect } from "react"

export const DARK = {
  bgPage:        "#0a1120",
  bgSidebar:     "#0f172a",
  bgCard:        "#1e293b",
  bgInput:       "#0f172a",
  bgInset:       "#0f172a",
  border:        "#1e293b",
  borderStrong:  "#334155",
  textPrimary:   "#f8fafc",
  textBody:      "#e2e8f0",
  textMuted:     "#94a3b8",
  textFaint:     "#64748b",
  textGhost:     "#475569",
  textDisabled:  "#334155",
  accent:        "#3b82f6",
  successBg:     "#052e16",
  successBorder: "#166534",
  successText:   "#86efac",
  errorBg:       "#450a0a",
  errorBorder:   "#7f1d1d",
  errorText:     "#fca5a5",
  infoBg:        "#0c1f3a",
  infoBorder:    "#1d4ed8",
  infoText:      "#93c5fd",
  shimmer1:      "#1e293b",
  shimmer2:      "#2d3f55",
}

export const LIGHT = {
  bgPage:        "#f1f5f9",
  bgSidebar:     "#ffffff",
  bgCard:        "#ffffff",
  bgInput:       "#ffffff",
  bgInset:       "#f1f5f9",
  border:        "#e2e8f0",
  borderStrong:  "#cbd5e1",
  textPrimary:   "#0f172a",
  textBody:      "#1e293b",
  textMuted:     "#475569",
  textFaint:     "#64748b",
  textGhost:     "#94a3b8",
  textDisabled:  "#cbd5e1",
  accent:        "#3b82f6",
  successBg:     "#f0fdf4",
  successBorder: "#bbf7d0",
  successText:   "#166534",
  errorBg:       "#fef2f2",
  errorBorder:   "#fecaca",
  errorText:     "#991b1b",
  infoBg:        "#eff6ff",
  infoBorder:    "#bfdbfe",
  infoText:      "#1d4ed8",
  shimmer1:      "#e2e8f0",
  shimmer2:      "#f8fafc",
}

const ThemeContext = createContext()

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState(() => localStorage.getItem("clinicos-theme") ?? "dark")
  const t = mode === "dark" ? DARK : LIGHT

  useEffect(() => {
    localStorage.setItem("clinicos-theme", mode)
    // Atualiza shimmer CSS dinamicamente
    const existing = document.getElementById("shimmer-style")
    if (existing) existing.remove()
    const tag = document.createElement("style")
    tag.id = "shimmer-style"
    tag.textContent = `
      @keyframes shimmer {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }
      .skeleton-shimmer {
        background: linear-gradient(90deg, ${t.shimmer1} 25%, ${t.shimmer2} 50%, ${t.shimmer1} 75%);
        background-size: 200% 100%;
        animation: shimmer 1.4s infinite;
        border-radius: 8px;
      }
    `
    document.head.appendChild(tag)
  }, [mode])

  const toggle = () => setMode(m => m === "dark" ? "light" : "dark")

  return (
    <ThemeContext.Provider value={{ t, mode, toggle }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
