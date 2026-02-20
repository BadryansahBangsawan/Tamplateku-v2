import { runD1Query } from "@/lib/cloudflareD1";
import type { AppRole } from "@/lib/roles";
let ensureSuperAdminTablesPromise: Promise<void> | null = null;
const SYSTEM_CONFIG_CACHE_TTL_MS = 15_000;
let cachedSystemConfig: { value: SystemConfig; expiresAt: number } | null = null;

export type AccessModule = "adminPage" | "templateManagerPage" | "superAdminPage";

export type RoleAccessPolicy = Record<AppRole, Record<AccessModule, boolean>>;

export type SystemConfig = {
  appName: string;
  appLogoUrl: string;
  maintenanceMode: boolean;
  loginAccess: {
    formLoginEnabled: boolean;
    googleLoginEnabled: boolean;
  };
  features: {
    browseTemplateEnabled: boolean;
    blogEnabled: boolean;
  };
  integrations: {
    resendEnabled: boolean;
    googleOauthEnabled: boolean;
    publicApiEnabled: boolean;
    publicApiKeyHint: string;
  };
  roleAccess: RoleAccessPolicy;
};

const DEFAULT_ROLE_ACCESS: RoleAccessPolicy = {
  USER: {
    adminPage: false,
    templateManagerPage: false,
    superAdminPage: false,
  },
  ADMIN: {
    adminPage: true,
    templateManagerPage: false,
    superAdminPage: false,
  },
  TEMPLATE_ADMIN: {
    adminPage: false,
    templateManagerPage: true,
    superAdminPage: false,
  },
  SUPER_ADMIN: {
    adminPage: true,
    templateManagerPage: true,
    superAdminPage: true,
  },
};

export const DEFAULT_SYSTEM_CONFIG: SystemConfig = {
  appName: "Tamplateku",
  appLogoUrl: "/logo.png",
  maintenanceMode: false,
  loginAccess: {
    formLoginEnabled: true,
    googleLoginEnabled: true,
  },
  features: {
    browseTemplateEnabled: true,
    blogEnabled: true,
  },
  integrations: {
    resendEnabled: true,
    googleOauthEnabled: true,
    publicApiEnabled: false,
    publicApiKeyHint: "",
  },
  roleAccess: DEFAULT_ROLE_ACCESS,
};

type AuditLogRow = {
  id: string;
  actor_email: string;
  action: string;
  target_type: string;
  target_id: string | null;
  detail_json: string | null;
  severity: string;
  created_at: string;
};

type LoginLogRow = {
  id: string;
  user_id: string | null;
  email: string;
  success: number;
  reason: string | null;
  request_ip: string;
  user_agent: string;
  created_at: string;
};

type BackupRow = {
  id: string;
  snapshot_type: string;
  payload_json: string;
  created_by: string;
  created_at: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function toBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function toStringValue(value: unknown, fallback: string): string {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : fallback;
}

function mergeRoleAccess(raw: unknown): RoleAccessPolicy {
  if (!isRecord(raw)) return DEFAULT_ROLE_ACCESS;

  const roles: AppRole[] = ["USER", "ADMIN", "TEMPLATE_ADMIN", "SUPER_ADMIN"];
  const result: RoleAccessPolicy = {
    USER: { ...DEFAULT_ROLE_ACCESS.USER },
    ADMIN: { ...DEFAULT_ROLE_ACCESS.ADMIN },
    TEMPLATE_ADMIN: { ...DEFAULT_ROLE_ACCESS.TEMPLATE_ADMIN },
    SUPER_ADMIN: { ...DEFAULT_ROLE_ACCESS.SUPER_ADMIN },
  };

  for (const role of roles) {
    const roleRaw = raw[role];
    if (!isRecord(roleRaw)) continue;

    result[role] = {
      adminPage: toBoolean(roleRaw.adminPage, result[role].adminPage),
      templateManagerPage: toBoolean(roleRaw.templateManagerPage, result[role].templateManagerPage),
      superAdminPage: toBoolean(roleRaw.superAdminPage, result[role].superAdminPage),
    };
  }

  result.SUPER_ADMIN = {
    adminPage: true,
    templateManagerPage: true,
    superAdminPage: true,
  };

  return result;
}

function mergeSystemConfig(raw: unknown): SystemConfig {
  if (!isRecord(raw)) return DEFAULT_SYSTEM_CONFIG;

  const loginAccess = isRecord(raw.loginAccess) ? raw.loginAccess : {};
  const features = isRecord(raw.features) ? raw.features : {};
  const integrations = isRecord(raw.integrations) ? raw.integrations : {};

  return {
    appName: toStringValue(raw.appName, DEFAULT_SYSTEM_CONFIG.appName),
    appLogoUrl: toStringValue(raw.appLogoUrl, DEFAULT_SYSTEM_CONFIG.appLogoUrl),
    maintenanceMode: toBoolean(raw.maintenanceMode, DEFAULT_SYSTEM_CONFIG.maintenanceMode),
    loginAccess: {
      formLoginEnabled: toBoolean(
        loginAccess.formLoginEnabled,
        DEFAULT_SYSTEM_CONFIG.loginAccess.formLoginEnabled
      ),
      googleLoginEnabled: toBoolean(
        loginAccess.googleLoginEnabled,
        DEFAULT_SYSTEM_CONFIG.loginAccess.googleLoginEnabled
      ),
    },
    features: {
      browseTemplateEnabled: toBoolean(
        features.browseTemplateEnabled,
        DEFAULT_SYSTEM_CONFIG.features.browseTemplateEnabled
      ),
      blogEnabled: toBoolean(features.blogEnabled, DEFAULT_SYSTEM_CONFIG.features.blogEnabled),
    },
    integrations: {
      resendEnabled: toBoolean(
        integrations.resendEnabled,
        DEFAULT_SYSTEM_CONFIG.integrations.resendEnabled
      ),
      googleOauthEnabled: toBoolean(
        integrations.googleOauthEnabled,
        DEFAULT_SYSTEM_CONFIG.integrations.googleOauthEnabled
      ),
      publicApiEnabled: toBoolean(
        integrations.publicApiEnabled,
        DEFAULT_SYSTEM_CONFIG.integrations.publicApiEnabled
      ),
      publicApiKeyHint: toStringValue(
        integrations.publicApiKeyHint,
        DEFAULT_SYSTEM_CONFIG.integrations.publicApiKeyHint
      ),
    },
    roleAccess: mergeRoleAccess(raw.roleAccess),
  };
}

async function ensureSuperAdminTablesInner(): Promise<void> {
  await runD1Query(`
    CREATE TABLE IF NOT EXISTS super_admin_settings (
      key TEXT PRIMARY KEY,
      value_json TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  await runD1Query(`
    CREATE TABLE IF NOT EXISTS super_admin_audit_logs (
      id TEXT PRIMARY KEY,
      actor_email TEXT NOT NULL,
      action TEXT NOT NULL,
      target_type TEXT NOT NULL,
      target_id TEXT,
      detail_json TEXT,
      severity TEXT NOT NULL DEFAULT 'INFO',
      created_at TEXT NOT NULL
    );
  `);

  await runD1Query(`
    CREATE INDEX IF NOT EXISTS idx_super_admin_audit_logs_created
    ON super_admin_audit_logs(created_at DESC);
  `);

  await runD1Query(`
    CREATE TABLE IF NOT EXISTS auth_login_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      email TEXT NOT NULL,
      success INTEGER NOT NULL,
      reason TEXT,
      request_ip TEXT NOT NULL,
      user_agent TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);

  await runD1Query(`
    CREATE INDEX IF NOT EXISTS idx_auth_login_logs_email_created
    ON auth_login_logs(email, created_at DESC);
  `);

  await runD1Query(`
    CREATE INDEX IF NOT EXISTS idx_auth_login_logs_success_created
    ON auth_login_logs(success, created_at DESC);
  `);

  await runD1Query(`
    CREATE TABLE IF NOT EXISTS super_admin_backups (
      id TEXT PRIMARY KEY,
      snapshot_type TEXT NOT NULL,
      payload_json TEXT NOT NULL,
      created_by TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);

  await runD1Query(`
    CREATE INDEX IF NOT EXISTS idx_super_admin_backups_created
    ON super_admin_backups(created_at DESC);
  `);
}

export async function ensureSuperAdminTables(): Promise<void> {
  if (!ensureSuperAdminTablesPromise) {
    ensureSuperAdminTablesPromise = ensureSuperAdminTablesInner().catch((error) => {
      ensureSuperAdminTablesPromise = null;
      throw error;
    });
  }

  await ensureSuperAdminTablesPromise;
}

async function getSettingValue<T>(key: string, fallback: T): Promise<T> {
  await ensureSuperAdminTables();

  const rows = await runD1Query<{ value_json: string }>(
    "SELECT value_json FROM super_admin_settings WHERE key = ? LIMIT 1",
    [key]
  );

  if (!rows[0]) return fallback;

  try {
    return JSON.parse(rows[0].value_json) as T;
  } catch {
    return fallback;
  }
}

async function setSettingValue(key: string, value: unknown): Promise<void> {
  await ensureSuperAdminTables();
  const now = new Date().toISOString();
  await runD1Query(
    "INSERT OR REPLACE INTO super_admin_settings (key, value_json, updated_at) VALUES (?, ?, ?)",
    [key, JSON.stringify(value), now]
  );
}

export async function getSystemConfig(options?: { forceRefresh?: boolean }): Promise<SystemConfig> {
  if (!options?.forceRefresh && cachedSystemConfig && Date.now() < cachedSystemConfig.expiresAt) {
    return cachedSystemConfig.value;
  }

  const raw = await getSettingValue<unknown>("system_config", DEFAULT_SYSTEM_CONFIG);
  const merged = mergeSystemConfig(raw);
  cachedSystemConfig = {
    value: merged,
    expiresAt: Date.now() + SYSTEM_CONFIG_CACHE_TTL_MS,
  };
  return merged;
}

export async function saveSystemConfig(config: SystemConfig): Promise<SystemConfig> {
  const merged = mergeSystemConfig(config);
  await setSettingValue("system_config", merged);
  cachedSystemConfig = {
    value: merged,
    expiresAt: Date.now() + SYSTEM_CONFIG_CACHE_TTL_MS,
  };
  return merged;
}

export async function canRoleAccessModule(role: AppRole, module: AccessModule): Promise<boolean> {
  const config = await getSystemConfig();
  return Boolean(config.roleAccess[role]?.[module]);
}

export async function createAuditLog(params: {
  actorEmail: string;
  action: string;
  targetType: string;
  targetId?: string;
  detail?: Record<string, unknown>;
  severity?: "INFO" | "WARN" | "CRITICAL";
}): Promise<void> {
  await ensureSuperAdminTables();
  const now = new Date().toISOString();

  await runD1Query(
    `INSERT INTO super_admin_audit_logs (
      id, actor_email, action, target_type, target_id, detail_json, severity, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      crypto.randomUUID(),
      params.actorEmail.trim().toLowerCase(),
      params.action,
      params.targetType,
      params.targetId ?? null,
      params.detail ? JSON.stringify(params.detail) : null,
      params.severity ?? "INFO",
      now,
    ]
  );
}

export type AuditLogItem = {
  id: string;
  actorEmail: string;
  action: string;
  targetType: string;
  targetId: string | null;
  detail: Record<string, unknown> | null;
  severity: string;
  createdAt: string;
};

export async function listAuditLogs(limit = 100): Promise<AuditLogItem[]> {
  await ensureSuperAdminTables();
  const safeLimit = Number.isFinite(limit) ? Math.min(Math.max(Math.floor(limit), 1), 500) : 100;

  const rows = await runD1Query<AuditLogRow>(
    `SELECT id, actor_email, action, target_type, target_id, detail_json, severity, created_at
     FROM super_admin_audit_logs
     ORDER BY created_at DESC
     LIMIT ?`,
    [safeLimit]
  );

  return rows.map((row) => {
    let detail: Record<string, unknown> | null = null;
    if (row.detail_json) {
      try {
        const parsed = JSON.parse(row.detail_json) as unknown;
        detail = isRecord(parsed) ? parsed : null;
      } catch {
        detail = null;
      }
    }

    return {
      id: row.id,
      actorEmail: row.actor_email,
      action: row.action,
      targetType: row.target_type,
      targetId: row.target_id,
      detail,
      severity: row.severity,
      createdAt: row.created_at,
    };
  });
}

export async function createLoginLog(params: {
  email: string;
  success: boolean;
  requestIp: string;
  userAgent: string;
  reason?: string;
  userId?: string;
}): Promise<void> {
  await ensureSuperAdminTables();
  const now = new Date().toISOString();

  await runD1Query(
    `INSERT INTO auth_login_logs (
      id, user_id, email, success, reason, request_ip, user_agent, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      crypto.randomUUID(),
      params.userId ?? null,
      params.email.trim().toLowerCase(),
      params.success ? 1 : 0,
      params.reason?.trim() || null,
      params.requestIp,
      params.userAgent,
      now,
    ]
  );
}

export type LoginLogItem = {
  id: string;
  userId: string | null;
  email: string;
  success: boolean;
  reason: string | null;
  requestIp: string;
  userAgent: string;
  createdAt: string;
};

export async function listLoginLogs(limit = 100): Promise<LoginLogItem[]> {
  await ensureSuperAdminTables();
  const safeLimit = Number.isFinite(limit) ? Math.min(Math.max(Math.floor(limit), 1), 500) : 100;

  const rows = await runD1Query<LoginLogRow>(
    `SELECT id, user_id, email, success, reason, request_ip, user_agent, created_at
     FROM auth_login_logs
     ORDER BY created_at DESC
     LIMIT ?`,
    [safeLimit]
  );

  return rows.map((row) => ({
    id: row.id,
    userId: row.user_id,
    email: row.email,
    success: row.success === 1,
    reason: row.reason,
    requestIp: row.request_ip,
    userAgent: row.user_agent,
    createdAt: row.created_at,
  }));
}

export type SuspiciousActivityItem = {
  email: string;
  failedAttempts: number;
  firstAttemptAt: string;
  lastAttemptAt: string;
};

export async function listSuspiciousActivities(): Promise<SuspiciousActivityItem[]> {
  await ensureSuperAdminTables();
  const cutoffIso = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const rows = await runD1Query<{
    email: string;
    failed_attempts: number;
    first_attempt_at: string;
    last_attempt_at: string;
  }>(
    `SELECT email,
            COUNT(*) AS failed_attempts,
            MIN(created_at) AS first_attempt_at,
            MAX(created_at) AS last_attempt_at
     FROM auth_login_logs
     WHERE success = 0
       AND created_at >= ?
     GROUP BY email
     HAVING COUNT(*) >= 5
     ORDER BY failed_attempts DESC, last_attempt_at DESC
     LIMIT 100`,
    [cutoffIso]
  );

  return rows.map((row) => ({
    email: row.email,
    failedAttempts: row.failed_attempts,
    firstAttemptAt: row.first_attempt_at,
    lastAttemptAt: row.last_attempt_at,
  }));
}

export type DataBackupItem = {
  id: string;
  snapshotType: string;
  payload: Record<string, unknown>;
  createdBy: string;
  createdAt: string;
};

export type DataBackupMetaItem = {
  id: string;
  snapshotType: string;
  createdBy: string;
  createdAt: string;
};

export async function createDataBackup(params: {
  snapshotType: string;
  payload: Record<string, unknown>;
  createdBy: string;
}): Promise<DataBackupItem> {
  await ensureSuperAdminTables();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  await runD1Query(
    `INSERT INTO super_admin_backups (id, snapshot_type, payload_json, created_by, created_at)
     VALUES (?, ?, ?, ?, ?)`,
    [id, params.snapshotType, JSON.stringify(params.payload), params.createdBy, now]
  );

  return {
    id,
    snapshotType: params.snapshotType,
    payload: params.payload,
    createdBy: params.createdBy,
    createdAt: now,
  };
}

export async function listDataBackups(limit = 30): Promise<DataBackupItem[]> {
  await ensureSuperAdminTables();
  const safeLimit = Number.isFinite(limit) ? Math.min(Math.max(Math.floor(limit), 1), 200) : 30;

  const rows = await runD1Query<BackupRow>(
    `SELECT id, snapshot_type, payload_json, created_by, created_at
     FROM super_admin_backups
     ORDER BY created_at DESC
     LIMIT ?`,
    [safeLimit]
  );

  return rows.map((row) => {
    let payload: Record<string, unknown> = {};
    try {
      const parsed = JSON.parse(row.payload_json) as unknown;
      payload = isRecord(parsed) ? parsed : {};
    } catch {
      payload = {};
    }

    return {
      id: row.id,
      snapshotType: row.snapshot_type,
      payload,
      createdBy: row.created_by,
      createdAt: row.created_at,
    };
  });
}

export async function listDataBackupMeta(limit = 30): Promise<DataBackupMetaItem[]> {
  await ensureSuperAdminTables();
  const safeLimit = Number.isFinite(limit) ? Math.min(Math.max(Math.floor(limit), 1), 200) : 30;

  const rows = await runD1Query<{
    id: string;
    snapshot_type: string;
    created_by: string;
    created_at: string;
  }>(
    `SELECT id, snapshot_type, created_by, created_at
     FROM super_admin_backups
     ORDER BY created_at DESC
     LIMIT ?`,
    [safeLimit]
  );

  return rows.map((row) => ({
    id: row.id,
    snapshotType: row.snapshot_type,
    createdBy: row.created_by,
    createdAt: row.created_at,
  }));
}

export async function getDataBackupById(backupId: string): Promise<DataBackupItem | null> {
  await ensureSuperAdminTables();

  const rows = await runD1Query<BackupRow>(
    `SELECT id, snapshot_type, payload_json, created_by, created_at
     FROM super_admin_backups
     WHERE id = ?
     LIMIT 1`,
    [backupId]
  );

  if (!rows[0]) return null;

  let payload: Record<string, unknown> = {};
  try {
    const parsed = JSON.parse(rows[0].payload_json) as unknown;
    payload = isRecord(parsed) ? parsed : {};
  } catch {
    payload = {};
  }

  return {
    id: rows[0].id,
    snapshotType: rows[0].snapshot_type,
    payload,
    createdBy: rows[0].created_by,
    createdAt: rows[0].created_at,
  };
}
