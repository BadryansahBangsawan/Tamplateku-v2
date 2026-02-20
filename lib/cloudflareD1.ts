const CLOUDFLARE_API_BASE = "https://api.cloudflare.com/client/v4";

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

export async function ensureAuthUsersTable() {
  await runD1Query(`
    CREATE TABLE IF NOT EXISTS auth_users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'USER',
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
}
