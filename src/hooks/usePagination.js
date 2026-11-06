import { useCallback, useEffect, useState } from "react"
import { PAGE_SIZES } from "../config/pagination"

/**
 * Estado de paginação com tamanho de página persistido (25/50/100).
 * filterKey: string que muda quando qualquer filtro/busca muda; a página volta
 * para 1 automaticamente (derivado, sem efeito).
 */
export function usePagination(storageKey, filterKey = "") {
  const [pageSize, setPageSizeState] = useState(() => {
    try {
      const v = Number(localStorage.getItem(storageKey))
      return PAGE_SIZES.includes(v) ? v : PAGE_SIZES[0]
    } catch { return PAGE_SIZES[0] }
  })
  const [pg, setPg] = useState({ page: 1, key: filterKey })
  const page = pg.key === filterKey ? pg.page : 1

  const setPage = useCallback((p) => setPg({ page: Math.max(1, p), key: filterKey }), [filterKey])
  const setPageSize = useCallback((n) => {
    try { localStorage.setItem(storageKey, String(n)) } catch { /* sem storage */ }
    setPageSizeState(n)
    setPg({ page: 1, key: filterKey })
  }, [storageKey, filterKey])

  return { page, pageSize, setPage, setPageSize }
}

// Valor com atraso (busca): evita uma query por tecla.
export function useDebouncedValue(value, ms = 300) {
  const [v, setV] = useState(value)
  useEffect(() => {
    const id = setTimeout(() => setV(value), ms)
    return () => clearTimeout(id)
  }, [value, ms])
  return v
}
