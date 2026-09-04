import { useAuth } from "../context/AuthContext"
import { supabase } from "../supabaseClient"

/**
 * PLANOS
 *
 * Plano Free:
 *   - Até 20 pacientes
 *   - 1 usuário (somente admin)
 *   - Sem equipe, sem prontuário, sem financeiro
 *   - Dashboard simplificado
 *
 * Plano Pro:
 *   - Pacientes ilimitados
 *   - Equipe completa
 *   - Prontuário eletrônico
 *   - Financeiro
 *   - Dashboard completo
 */

export const PLAN_CONFIG = {
  free: {
    label:         "Free",
    color:         "#64748b",
    patient_limit: 20,
    staff_limit:   1,
    features: {
      hasTeam:          false,
      hasRecords:       false,
      hasFinancial:     false,
      hasDashboardFull: false,
    },
  },
  pro: {
    label:         "Pro",
    color:         "#3b82f6",
    patient_limit: null, // null significa ilimitado
    staff_limit:   999,
    features: {
      hasTeam:          true,
      hasRecords:       true,
      hasFinancial:     true,
      hasDashboardFull: true,
    },
  },
}

export function usePlanLimits() {
  const { clinic } = useAuth()

  function planLabel() {
    return PLAN_CONFIG[clinic?.plan]?.label ?? "Free"
  }

  function planFeatures() {
    return PLAN_CONFIG[clinic?.plan]?.features ?? PLAN_CONFIG.free.features
  }

  function isFree() {
    return !clinic?.plan || clinic.plan === "free"
  }

  function isPaid() {
    return clinic?.plan === "pro"
  }

  function isOnTrial() {
    if (!clinic?.trial_end) return false
    return new Date(clinic.trial_end) > new Date()
  }

  function getTrialDaysRemaining() {
    if (!clinic?.trial_end) return 0
    const remaining = Math.ceil((new Date(clinic.trial_end) - new Date()) / (1000 * 60 * 60 * 24))
    return Math.max(0, remaining)
  }

  async function checkPatientLimit() {
    if (!clinic) return { allowed: false, message: "Clínica não encontrada." }
    const limit = (clinic.patient_limit !== null && clinic.patient_limit !== undefined) 
      ? clinic.patient_limit 
      : (PLAN_CONFIG[clinic.plan]?.patient_limit ?? 20)
    if (limit === null) return { allowed: true }
    const { count } = await supabase.from("patients").select("id", { count: "exact", head: true }).eq("clinic_id", clinic.id).is("deleted_at", null)
    const current = count ?? 0
    if (current >= limit) {
      return { allowed: false, limitReached: true, message: `Limite de ${limit} pacientes atingido no plano ${planLabel()}. Faça upgrade para continuar.` }
    }
    return { allowed: true, current, limit }
  }

  async function checkStaffLimit() {
    if (!clinic) return { allowed: false, message: "Clínica não encontrada." }
    const limit = (clinic.staff_limit !== null && clinic.staff_limit !== undefined)
      ? clinic.staff_limit
      : (PLAN_CONFIG[clinic.plan]?.staff_limit ?? 1)
    if (limit >= 999) return { allowed: true }
    const { count } = await supabase.from("staff").select("id", { count: "exact", head: true }).eq("clinic_id", clinic.id).is("deleted_at", null)
    const current = count ?? 0
    if (current >= limit) {
      return { allowed: false, limitReached: true, message: `Limite de ${limit} usuário(s) atingido no plano ${planLabel()}. Faça upgrade para continuar.` }
    }
    return { allowed: true, current, limit }
  }

  return { checkPatientLimit, checkStaffLimit, planLabel, planFeatures, isFree, isPaid, isOnTrial, getTrialDaysRemaining }
}
