import { useAuth } from "../context/AuthContext"

/**
 * usePermissions
 * Retorna flags de permissão baseadas no role do usuário autenticado.
 * Roles: admin | staff | dentist | receptionist
 */
export function usePermissions() {
  const { role } = useAuth()
  const isAdmin = role === "admin"

  return {
    role,
    isAdmin,

    // Pacientes
    canViewPatients: true,
    canCreatePatients: true,
    canDeletePatients: isAdmin,

    // Agendamentos
    canViewAppointments: true,
    canCreateAppointments: true,
    canDeleteAppointments: isAdmin,
    canChangeAppointmentStatus: true,

    // Clínica / perfil
    canViewClinicProfile: isAdmin,
    canEditClinicProfile: isAdmin,

    // Plano / faturamento
    canViewPlan: isAdmin,
    canUpgradePlan: isAdmin,

    // Equipe
    canViewTeam: isAdmin,
    canManageTeam: isAdmin,

    // Dashboard
    canViewDashboard: true,
  }
}
