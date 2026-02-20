import type { AuthUser } from "@/lib/authCookie";
import {
  type AppRole,
  canAccessAdminPage,
  canAccessSuperAdminPage,
  canAccessTemplateManagerPage,
  getUserRole,
  getUserRoleByEmail,
} from "@/lib/roles";

export type { AppRole };

export function getRoleFromUser(user: AuthUser | null | undefined): AppRole {
  return getUserRole(user);
}

export function getRoleFromEmail(email: string): AppRole {
  return getUserRoleByEmail(email);
}

export function isAdminEmail(email: string): boolean {
  return canAccessAdminPage(getUserRoleByEmail(email));
}

export function isAdminUser(user: AuthUser | null | undefined): boolean {
  return canAccessAdminPage(getUserRole(user));
}

export function isTemplateAdminUser(user: AuthUser | null | undefined): boolean {
  return canAccessTemplateManagerPage(getUserRole(user));
}

export function isSuperAdminUser(user: AuthUser | null | undefined): boolean {
  return canAccessSuperAdminPage(getUserRole(user));
}
