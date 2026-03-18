// Centralized status colors configuration
// These colors should be used consistently across the application

export const STATUS_COLORS = {
  // Appointment statuses
  scheduled: {
    label: "Agendado",
    color: "#3b82f6",  // Blue
    bg: "rgba(59, 130, 246, 0.15)",
    border: "rgba(59, 130, 246, 0.3)"
  },
  completed: {
    label: "Concluído",
    color: "#22c55e",  // Green
    bg: "rgba(34, 197, 94, 0.15)",
    border: "rgba(34, 197, 94, 0.3)"
  },
  cancelled: {
    label: "Cancelado",
    color: "#ef4444",  // Red
    bg: "rgba(239, 68, 68, 0.15)",
    border: "rgba(239, 68, 68, 0.3)"
  },
  no_show: {
    label: "Não veio",
    color: "#f59e0b",  // Amber/Orange
    bg: "rgba(245, 158, 11, 0.15)",
    border: "rgba(245, 158, 11, 0.3)"
  },
  
  // Payment statuses
  paid: {
    label: "Pago",
    color: "#22c55e",  // Green
    bg: "rgba(34, 197, 94, 0.15)",
    border: "rgba(34, 197, 94, 0.3)"
  },
  pending: {
    label: "Pendente",
    color: "#f59e0b",  // Amber/Orange
    bg: "rgba(245, 158, 11, 0.15)",
    border: "rgba(245, 158, 11, 0.3)"
  }
};

// Helper function to get status config
export function getStatusConfig(status) {
  return STATUS_COLORS[status] || { 
    label: status, 
    color: "#64748b", 
    bg: "rgba(100, 116, 139, 0.15)",
    border: "rgba(100, 116, 139, 0.3)"
  };
}
