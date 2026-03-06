import { useAuth } from "../context/AuthContext"
import { supabase } from "../supabaseClient"

/**
 * usePlanLimits
 * Verifica se a clínica atingiu os limites do plano antes de inserir.
 *
 * Uso:
 *   const { checkPatientLimit, checkStaffLimit } = usePlanLimits()
 *   const { allowed, message } = await checkPatientLimit()
 *   if (!allowed) { showToast(message, "error"); return }
 */
export function usePlanLimits() {
  const { clinic } = useAuth()

  function planLabel() {
    if (clinic?.plan === "pro") return "Pro"
    if (clinic?.plan === "clinica") return "Clínica"
    return "Free"
  }

  async function checkPatientLimit() {
    if (!clinic) return { allowed: false, message: "Clínica não encontrada." }

    const limit = clinic.patient_limit ?? 50
    const { count } = await supabase
      .from("patients")
      .select("id", { count: "exact", head: true })
      .is("deleted_at", null)

    const current = count ?? 0
    if (current >= limit) {
      return {
        allowed: false,
        limitReached: true,
        message: `Limite de ${limit} pacientes atingido no plano ${planLabel()}. Faça upgrade para continuar.`,
      }
    }
    return { allowed: true, current, limit }
  }

  async function checkStaffLimit() {
    if (!clinic) return { allowed: false, message: "Clínica não encontrada." }

    const limit = clinic.staff_limit ?? 1
    const { count } = await supabase
      .from("staff")
      .select("id", { count: "exact", head: true })
      .is("deleted_at", null)

    const current = count ?? 0
    if (current >= limit) {
      return {
        allowed: false,
        limitReached: true,
        message: `Limite de ${limit} usuários atingido no plano ${planLabel()}. Faça upgrade para continuar.`,
      }
    }
    return { allowed: true, current, limit }
  }

  return { checkPatientLimit, checkStaffLimit }
}
