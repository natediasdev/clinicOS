import { useTheme } from '../../context/ThemeContext'

// Campo de busca único do app: mesmo ícone, mesmo botão de limpar, mesmo
// comportamento (Esc limpa) em Pacientes, Agenda e Financeiro.
// onChange recebe a STRING digitada (não o evento).
export default function SearchInput({
  value, onChange, placeholder = 'Buscar...', loading = false,
  style = {}, wrapperStyle = {}, ...props
}) {
  const { t } = useTheme()

  return (
    <div style={{ position: 'relative', ...wrapperStyle }}>
      <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', display: 'flex' }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={t.textGhost} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </span>
      <input
        type="text"
        inputMode="search"
        enterKeyHint="search"
        autoComplete="off"
        aria-label={placeholder}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Escape' && value) onChange('') }}
        onFocus={(e) => { e.target.style.borderColor = t.accent }}
        onBlur={(e) => { e.target.style.borderColor = t.border }}
        style={{
          background: t.bgInput, border: `1px solid ${t.border}`, borderRadius: 8,
          padding: '10px 36px 10px 36px', fontSize: 14, color: t.textPrimary,
          outline: 'none', transition: 'border-color 0.2s', width: '100%',
          boxSizing: 'border-box', fontFamily: 'inherit', ...style,
        }}
        {...props}
      />
      {loading && (
        <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: t.textGhost }}>
          buscando...
        </span>
      )}
      {value && !loading && (
        <button
          type="button" onClick={() => onChange('')} aria-label="Limpar busca"
          style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: t.textGhost, cursor: 'pointer', width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6 }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
        </button>
      )}
    </div>
  )
}
