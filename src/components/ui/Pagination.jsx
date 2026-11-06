import { useTheme } from "../../context/ThemeContext"
import { PAGE_SIZES } from "../../config/pagination"

// Barra de paginação única do app: "1–25 de 312", seletor de itens por página
// (25/50/100) e navegação. Usada em Pacientes e na lista da Agenda.
export default function Pagination({
  page, pageSize, total, onPageChange, onPageSizeChange,
  sizes = PAGE_SIZES, loading = false, style = {},
}) {
  const { t } = useTheme()
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const first = total === 0 ? 0 : (page - 1) * pageSize + 1
  const last  = Math.min(page * pageSize, total)

  // janela de páginas: 1 … p-1 p p+1 … N
  const pages = []
  for (let p = 1; p <= totalPages; p++) {
    if (p === 1 || p === totalPages || Math.abs(p - page) <= 1) pages.push(p)
    else if (pages[pages.length - 1] !== "…") pages.push("…")
  }

  const btn = (active, disabled) => ({
    minWidth: 32, height: 32, padding: "0 10px", borderRadius: 8, fontSize: 13, fontWeight: 600,
    fontFamily: "inherit", cursor: disabled ? "default" : "pointer", opacity: disabled ? 0.4 : 1,
    background: active ? t.accent : "transparent",
    color: active ? "#fff" : t.textMuted,
    border: `1px solid ${active ? t.accent : t.border}`,
  })

  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", marginTop: 16, opacity: loading ? 0.6 : 1, transition: "opacity .15s", ...style }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: t.textFaint }}>
        <span>{first}–{last} de {total}</span>
        <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span>Por página</span>
          <select value={pageSize} onChange={(e) => onPageSizeChange(Number(e.target.value))}
            aria-label="Itens por página"
            style={{ background: t.bgInset, border: `1px solid ${t.border}`, borderRadius: 8, padding: "5px 8px", fontSize: 13, color: t.textPrimary, cursor: "pointer", outline: "none", fontFamily: "inherit" }}>
            {sizes.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
      </div>

      {totalPages > 1 && (
        <nav aria-label="Paginação" style={{ display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap" }}>
          <button type="button" disabled={page <= 1} onClick={() => onPageChange(page - 1)} style={btn(false, page <= 1)} aria-label="Página anterior">‹</button>
          {pages.map((p, i) => p === "…"
            ? <span key={`gap${i}`} style={{ color: t.textGhost, padding: "0 4px" }}>…</span>
            : <button key={p} type="button" onClick={() => onPageChange(p)} style={btn(p === page, false)} aria-current={p === page ? "page" : undefined}>{p}</button>
          )}
          <button type="button" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)} style={btn(false, page >= totalPages)} aria-label="Próxima página">›</button>
        </nav>
      )}
    </div>
  )
}
