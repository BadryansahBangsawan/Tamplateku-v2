import type { AuthUser } from "@/lib/authCookie";

const DEFAULT_ADMIN_EMAIL = "badryansah99@gmail.com";

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function getConfiguredAdminEmails(): Set<string> {
  const raw = process.env.ADMIN_EMAILS ?? DEFAULT_ADMIN_EMAIL;
  const emails = raw
    .split(",")
    .map((email) => normalizeEmail(email))
    .filter((email) => email.length > 0);

  return new Set(emails.length > 0 ? emails : [DEFAULT_ADMIN_EMAIL]);
}

export function isAdminEmail(email: string): boolean {
  return getConfiguredAdminEmails().has(normalizeEmail(email));
}

export function isAdminUser(user: AuthUser | null | undefined): boolean {
  if (!user?.email) return false;
  return isAdminEmail(user.email);
}
