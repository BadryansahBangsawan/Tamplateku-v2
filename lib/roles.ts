import type { AuthUser } from "@/lib/authCookie";

export type AppRole = "USER" | "ADMIN" | "TEMPLATE_ADMIN" | "SUPER_ADMIN";

const DEFAULT_SUPER_ADMIN_EMAIL = "badryansah99@gmail.com";

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function getConfiguredEmails(envName: string, fallback = ""): Set<string> {
  const raw = process.env[envName] ?? fallback;
  const emails = raw
    .split(",")
    .map((email) => normalizeEmail(email))
    .filter((email) => email.length > 0);

  return new Set(emails);
}

function isInSet(email: string, emails: Set<string>): boolean {
  return emails.has(normalizeEmail(email));
}

export function getUserRoleByEmail(email: string): AppRole {
  const normalized = normalizeEmail(email);
  const superAdmins = getConfiguredEmails("SUPER_ADMIN_EMAILS", DEFAULT_SUPER_ADMIN_EMAIL);
  if (isInSet(normalized, superAdmins)) return "SUPER_ADMIN";

  const admins = getConfiguredEmails("ADMIN_EMAILS");
  if (isInSet(normalized, admins)) return "ADMIN";

  const templateAdmins = getConfiguredEmails("TEMPLATE_ADMIN_EMAILS");
  if (isInSet(normalized, templateAdmins)) return "TEMPLATE_ADMIN";

  return "USER";
}

export function getUserRole(user: AuthUser | null | undefined): AppRole {
  if (!user?.email) return "USER";
  return getUserRoleByEmail(user.email);
}

export function canAccessAdminPage(role: AppRole): boolean {
  return role === "ADMIN" || role === "SUPER_ADMIN";
}

export function canAccessTemplateManagerPage(role: AppRole): boolean {
  return role === "TEMPLATE_ADMIN" || role === "SUPER_ADMIN";
}

export function canAccessSuperAdminPage(role: AppRole): boolean {
  return role === "SUPER_ADMIN";
}
