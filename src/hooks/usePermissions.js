import { useAuth } from "../context/AuthContext"
import { PLAN_CONFIG } from "./usePlanLimits"

/**
 * usePermissions
 * Combina role do usuário + features do plano + status da assinatura
 * para determinar permissões.
 *
 * Plano Free:
 *   - Sem acesso à equipe
 *   - Sem prontuário
 *   - Sem financeiro
 *   - Dashboard simplificado
 *
 * "locked" (trial vencido / assinatura pendente de liberação):
 *   - Dashboard, Agenda e Pacientes continuam visíveis (modo leitura),
 *     mas nada pode ser criado/editado/excluído nessas telas
 *   - Financeiro, Equipe, Serviços, Turmas e Perfil da clínica continuam
 *     totalmente bloqueados (redirecionados pra tela de assinatura)
 */
export function usePermissions() {
  const { role, clinic, subscriptionActive } = useAuth()
  const isAdmin = role === "admin"
  const plan    = clinic?.plan ?? "free"
  const features = PLAN_CONFIG[plan]?.features ?? PLAN_CONFIG.free.features
  const locked   = clinic?.plan === "pro" && !subscriptionActive

  return {
    role,
    isAdmin,
    locked,

    // Pacientes — leitura sempre liberada, escrita bloqueia com "locked"
    canViewPatients:   true,
    canCreatePatients: !locked,
    canEditPatients:   !locked,
    canDeletePatients: isAdmin && !locked,

    // Prontuário — bloqueado no free, escrita também bloqueia com "locked"
    canViewRecords:   features.hasRecords,
    canEditRecords:   features.hasRecords && isAdmin && !locked,

    // Agendamentos — leitura sempre liberada, escrita bloqueia com "locked"
    canViewAppointments:         true,
    canCreateAppointments:       !locked,
    canDeleteAppointments:       isAdmin && !locked,
    canChangeAppointmentStatus:  !locked,

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
