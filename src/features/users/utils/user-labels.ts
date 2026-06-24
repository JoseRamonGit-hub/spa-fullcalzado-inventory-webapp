import type { UserRole } from "@/types";

export const USER_ROLE_LABELS: Partial<Record<UserRole, string>> = {
  admin: "Administrador",
  employee: "Empleado",
};

export function getUserRoleLabel(role: UserRole) {
  return USER_ROLE_LABELS[role] ?? role;
}
