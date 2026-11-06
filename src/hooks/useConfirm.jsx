import { useCallback, useRef, useState } from "react"
import ConfirmDialog from "../components/ui/ConfirmDialog"
import { softDelete } from "../lib/softDelete"

/**
 * Confirmação baseada em Promise, no lugar de window.confirm e dos botões
 * "Sim/Não" inline que cada tela implementava de um jeito.
 *
 *   const [confirm, confirmDialog] = useConfirm()
 *   if (!(await confirm({ title:"Remover?", message:"...", confirmLabel:"Remover" }))) return
 *   ...
 *   return <>{confirmDialog} ...</>
 */
export function useConfirm() {
  const [opts, setOpts] = useState(null)
  const resolver = useRef(null)

  const settle = useCallback((value) => {
    resolver.current?.(value)
    resolver.current = null
    setOpts(null)
  }, [])

  const confirm = useCallback((options = {}) => new Promise((resolve) => {
    resolver.current?.(false)
    resolver.current = resolve
    setOpts(options)
  }), [])

  const dialog = (
    <ConfirmDialog
      open={!!opts}
      title={opts?.title}
      message={opts?.message}
      confirmLabel={opts?.confirmLabel}
      cancelLabel={opts?.cancelLabel}
      danger={opts?.danger ?? true}
      onConfirm={() => settle(true)}
      onCancel={() => settle(false)}
    />
  )

  return [confirm, dialog]
}

/**
 * Fluxo completo de exclusão: confirma → soft delete → aviso → callback.
 *
 *   const [removeItem, confirmDialog] = useDeleteFlow({ showToast })
 *   removeItem({ table:"patients", id, clinicId, label:"este paciente",
 *                successMessage:"Paciente removido.", onDone: reload })
 *
 * showToast deve aceitar (mensagem, "success" | "error").
 */
export function useDeleteFlow({ showToast } = {}) {
  const [confirm, dialog] = useConfirm()

  const run = useCallback(async ({
    table, id, clinicId = null, label = "este item",
    title = "Remover", successMessage = "Removido.", onDone, afterDelete,
  }) => {
    const ok = await confirm({
      title,
      message: `Tem certeza que deseja remover ${label}? Essa ação não pode ser desfeita pela interface.`,
      confirmLabel: "Remover",
    })
    if (!ok) return false
    const { error } = await softDelete(table, id, clinicId)
    if (error) { showToast?.(`Não foi possível remover: ${error.message}`, "error"); return false }
    // ex.: apagar o arquivo do storage depois que o registro foi marcado como removido
    try { await afterDelete?.() } catch { /* melhor esforço */ }
    showToast?.(successMessage, "success")
    await onDone?.(id)
    return true
  }, [confirm, showToast])

  return [run, dialog]
}
