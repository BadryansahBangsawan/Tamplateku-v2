import { ensureAuthUsersTable, runD1Query } from "@/lib/cloudflareD1";

export async function isAuthUserSessionValid(params: {
  email: string;
  sessionIssuedAt?: string;
}): Promise<boolean> {
  await ensureAuthUsersTable();
  const rows = await runD1Query<{
    is_active: number;
    force_logout_after: string | null;
  }>("SELECT is_active, force_logout_after FROM auth_users WHERE email = ? LIMIT 1", [
    params.email.trim().toLowerCase(),
  ]);

  const row = rows[0];
  if (!row) return true;
  if (!row.is_active) return false;

  if (!row.force_logout_after) return true;
  if (!params.sessionIssuedAt) return false;

  const issuedAt = Date.parse(params.sessionIssuedAt);
  const forceLogoutAfter = Date.parse(row.force_logout_after);

  if (Number.isNaN(issuedAt) || Number.isNaN(forceLogoutAfter)) return false;
  return issuedAt > forceLogoutAfter;
}
