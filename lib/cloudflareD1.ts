const CLOUDFLARE_API_BASE = "https://api.cloudflare.com/client/v4";
let ensureAuthUsersTablePromise: Promise<void> | null = null;

type D1Result<T = Record<string, unknown>> = {
  success: boolean;
  result: Array<{
    success: boolean;
    results?: T[];
    meta?: Record<string, unknown>;
  }>;
  errors?: Array<{ message?: string }>;
};

function getD1Config() {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const databaseId = process.env.CLOUDFLARE_D1_DATABASE_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;

  if (!accountId || !databaseId || !apiToken) {
    throw new Error(
      "Missing Cloudflare D1 env vars: CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_D1_DATABASE_ID, CLOUDFLARE_API_TOKEN"
    );
  }

  return { accountId, databaseId, apiToken };
}

export async function runD1Query<T = Record<string, unknown>>(
  sql: string,
  params: unknown[] = []
): Promise<T[]> {
  const { accountId, databaseId, apiToken } = getD1Config();
  const endpoint = `${CLOUDFLARE_API_BASE}/accounts/${accountId}/d1/database/${databaseId}/query`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiToken}`,
    },
    body: JSON.stringify({ sql, params }),
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`D1 query failed (${response.status}): ${text}`);
  }

  const payload = (await response.json()) as D1Result<T>;
  if (!payload.success) {
    const message = payload.errors?.[0]?.message ?? "Unknown D1 error";
    throw new Error(message);
  }

  return payload.result?.[0]?.results ?? [];
}

async function ensureAuthUsersTableInner() {
  await runD1Query(`
    CREATE TABLE IF NOT EXISTS auth_users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'USER',
      is_active INTEGER NOT NULL DEFAULT 1,
      must_change_password INTEGER NOT NULL DEFAULT 0,
      force_logout_after TEXT,
      last_login_at TEXT,
      email_verified_at TEXT,
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  const columns = await runD1Query<{ name: string }>("PRAGMA table_info(auth_users)");
  const hasEmailVerifiedAt = columns.some((column) => column.name === "email_verified_at");
  if (!hasEmailVerifiedAt) {
    await runD1Query("ALTER TABLE auth_users ADD COLUMN email_verified_at TEXT");
  }

  const hasRole = columns.some((column) => column.name === "role");
  if (!hasRole) {
    await runD1Query("ALTER TABLE auth_users ADD COLUMN role TEXT NOT NULL DEFAULT 'USER'");
  }

  const hasIsActive = columns.some((column) => column.name === "is_active");
  if (!hasIsActive) {
    await runD1Query("ALTER TABLE auth_users ADD COLUMN is_active INTEGER NOT NULL DEFAULT 1");
  }

  const hasMustChangePassword = columns.some((column) => column.name === "must_change_password");
  if (!hasMustChangePassword) {
    await runD1Query(
      "ALTER TABLE auth_users ADD COLUMN must_change_password INTEGER NOT NULL DEFAULT 0"
    );
  }

  const hasForceLogoutAfter = columns.some((column) => column.name === "force_logout_after");
  if (!hasForceLogoutAfter) {
    await runD1Query("ALTER TABLE auth_users ADD COLUMN force_logout_after TEXT");
  }

  const hasLastLoginAt = columns.some((column) => column.name === "last_login_at");
  if (!hasLastLoginAt) {
    await runD1Query("ALTER TABLE auth_users ADD COLUMN last_login_at TEXT");
  }
}

export async function ensureAuthUsersTable(): Promise<void> {
  if (!ensureAuthUsersTablePromise) {
    ensureAuthUsersTablePromise = ensureAuthUsersTableInner().catch((error) => {
      ensureAuthUsersTablePromise = null;
      throw error;
    });
  }

  await ensureAuthUsersTablePromise;
}
