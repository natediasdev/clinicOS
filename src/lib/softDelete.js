import { supabase } from "../supabaseClient"

/**
 * Exclusão lógica única do app: marca deleted_at em vez de apagar a linha.
 * Todas as telas usam este helper, então o comportamento (e o formato do erro)
 * é o mesmo em qualquer lugar.
 *
 * Se clinicId for informado, o UPDATE também filtra por clinic_id — defesa em
 * profundidade além do RLS. Passe apenas para tabelas que têm clinic_id.
 *
 * Retorna { error } (null em caso de sucesso).
 */
export async function softDelete(table, id, clinicId = null) {
  let req = supabase.from(table).update({ deleted_at: new Date().toISOString() }).eq("id", id)
  if (clinicId) req = req.eq("clinic_id", clinicId)
  const { error } = await req
  return { error: error ?? null }
}
