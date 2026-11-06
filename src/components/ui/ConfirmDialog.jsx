import { MotionModal } from "./MotionComponents"
import Button from "./Button"
import { useTheme } from "../../context/ThemeContext"

// Diálogo de confirmação único do app (exclusões e ações destrutivas).
// Normalmente usado via useConfirm(); ver src/hooks/useConfirm.jsx.
export default function ConfirmDialog({
  open, title = "Confirmar", message, confirmLabel = "Confirmar",
  cancelLabel = "Cancelar", danger = true, onConfirm, onCancel,
}) {
  const { t } = useTheme()
  return (
    <MotionModal open={open} onClose={onCancel} maxWidth={400}>
      <div role="alertdialog" aria-modal="true" aria-label={title}
        style={{ background: t.bgInset, border: `1px solid ${t.border}`, borderRadius: 16, overflow: "hidden" }}>
        <div style={{ padding: "22px 24px 8px" }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: t.textPrimary, margin: 0 }}>{title}</h2>
          {message && <p style={{ fontSize: 14, color: t.textMuted, margin: "10px 0 0", lineHeight: 1.5 }}>{message}</p>}
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, padding: "16px 24px 20px" }}>
          <Button variant="secondary" onClick={onCancel}>{cancelLabel}</Button>
          <Button variant={danger ? "danger" : "primary"} onClick={onConfirm}>{confirmLabel}</Button>
        </div>
      </div>
    </MotionModal>
  )
}
