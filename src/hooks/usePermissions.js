import { useAuth } from "../context/AuthContext"
import { PLAN_CONFIG } from "./usePlanLimits"

/**
 * usePermissions
 * Combina role do usuário + features do plano para determinar permissões.
 *
 * Plano Free:
 *   - Sem acesso à equipe
 *   - Sem prontuário
 *   - Sem financeiro
 *   - Dashboard simplificado
 */
export function usePermissions() {
  const { role, clinic } = useAuth()
  const isAdmin = role === "admin"
  const plan    = clinic?.plan ?? "free"
  const features = PLAN_CONFIG[plan]?.features ?? PLAN_CONFIG.free.features

  return {
    role,
    isAdmin,

    // Pacientes
    canViewPatients:   true,
    canCreatePatients: true,
    canDeletePatients: isAdmin,

    // Prontuário — bloqueado no free
    canViewRecords:   features.hasRecords,
    canEditRecords:   features.hasRecords && isAdmin,

    // Agendamentos
    canViewAppointments:         true,
    canCreateAppointments:       true,
    canDeleteAppointments:       isAdmin,
    canChangeAppointmentStatus:  true,

    // Financeiro — bloqueado no free
    canViewFinancial:  features.hasFinancial,
    canEditFinancial:  features.hasFinancial && isAdmin,

    // Clínica / perfil
    canViewClinicProfile: isAdmin,
    canEditClinicProfile: isAdmin,

    // Plano / faturamento
    canViewPlan:    isAdmin,
    canUpgradePlan: isAdmin,

    // Equipe — bloqueada no free
    canViewTeam:   features.hasTeam && isAdmin,
    canManageTeam: features.hasTeam && isAdmin,

    // Dashboard
    canViewDashboard:     true,
    canViewDashboardFull: features.hasDashboardFull,
  }
}
