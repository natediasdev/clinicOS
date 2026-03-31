import { useAuth } from "../context/AuthContext"
import { supabase } from "../supabaseClient"

/**
 * PLANOS E PREÇOS
 *
 * Ciclos de cobrança:
 *   monthly    → preço cheio
 *   quarterly  → -10%
 *   semiannual → -15%
 *
 * Plano Free:
 *   - Até 20 pacientes
 *   - 1 usuário (somente admin)
 *   - Sem equipe, sem prontuário, sem financeiro
 *   - Dashboard simplificado
 */

export const PLAN_PRICES = {
  pro: {
    monthly:    79,
    quarterly:  Math.round(79 * 0.90),   // -10% → R$71/mês
    semiannual: Math.round(79 * 0.85),   // -15% → R$67/mês
  },
  clinica: {
    monthly:    199,
    quarterly:  Math.round(199 * 0.90),  // -10% → R$179/mês
    semiannual: Math.round(199 * 0.85),  // -15% → R$169/mês
  },
}

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
    patient_limit: null,
    staff_limit:   3,
    features: {
      hasTeam:          true,
      hasRecords:       true,
      hasFinancial:     true,
      hasDashboardFull: true,
    },
  },
  clinica: {
    label:         "Clínica",
    color:         "#8b5cf6",
    patient_limit: null,
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
    return clinic?.plan === "pro" || clinic?.plan === "clinica"
  }

  async function checkPatientLimit() {
    if (!clinic) return { allowed: false, message: "Clínica não encontrada." }
    const limit = (clinic.patient_limit !== null && clinic.patient_limit !== undefined) 
      ? clinic.patient_limit 
      : (PLAN_CONFIG[clinic.plan]?.patient_limit ?? 20)
    if (limit === null) return { allowed: true }
    const { count } = await supabase.from("patients").select("id", { count: "exact", head: true }).is("deleted_at", null)
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
    const { count } = await supabase.from("staff").select("id", { count: "exact", head: true }).is("deleted_at", null)
    const current = count ?? 0
    if (current >= limit) {
      return { allowed: false, limitReached: true, message: `Limite de ${limit} usuário(s) atingido no plano ${planLabel()}. Faça upgrade para continuar.` }
    }
    return { allowed: true, current, limit }
  }

  function getPriceForCycle(plan, cycle = "monthly") {
    return PLAN_PRICES[plan]?.[cycle] ?? null
  }

  return { checkPatientLimit, checkStaffLimit, planLabel, planFeatures, isFree, isPaid, getPriceForCycle }
}
