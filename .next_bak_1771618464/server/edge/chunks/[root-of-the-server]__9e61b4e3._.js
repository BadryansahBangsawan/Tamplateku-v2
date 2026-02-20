(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push(["chunks/[root-of-the-server]__9e61b4e3._.js",
"[externals]/node:buffer [external] (node:buffer, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:buffer", () => require("node:buffer"));

module.exports = mod;
}),
"[externals]/node:async_hooks [external] (node:async_hooks, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:async_hooks", () => require("node:async_hooks"));

module.exports = mod;
}),
"[project]/lib/roles.ts [middleware-edge] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "canAccessAdminPage",
    ()=>canAccessAdminPage,
    "canAccessSuperAdminPage",
    ()=>canAccessSuperAdminPage,
    "canAccessTemplateManagerPage",
    ()=>canAccessTemplateManagerPage,
    "getUserRole",
    ()=>getUserRole,
    "getUserRoleByEmail",
    ()=>getUserRoleByEmail
]);
const DEFAULT_SUPER_ADMIN_EMAIL = "badryansah99@gmail.com";
function normalizeEmail(email) {
    return email.trim().toLowerCase();
}
function getConfiguredEmails(envName, fallback = "") {
    const raw = process.env[envName] ?? fallback;
    const emails = raw.split(",").map((email)=>normalizeEmail(email)).filter((email)=>email.length > 0);
    return new Set(emails);
}
function isInSet(email, emails) {
    return emails.has(normalizeEmail(email));
}
function getUserRoleByEmail(email) {
    const normalized = normalizeEmail(email);
    const superAdmins = getConfiguredEmails("SUPER_ADMIN_EMAILS", DEFAULT_SUPER_ADMIN_EMAIL);
    if (isInSet(normalized, superAdmins)) return "SUPER_ADMIN";
    const admins = getConfiguredEmails("ADMIN_EMAILS");
    if (isInSet(normalized, admins)) return "ADMIN";
    const templateAdmins = getConfiguredEmails("TEMPLATE_ADMIN_EMAILS");
    if (isInSet(normalized, templateAdmins)) return "TEMPLATE_ADMIN";
    return "USER";
}
function getUserRole(user) {
    if (!user?.email) return "USER";
    const emailBasedRole = getUserRoleByEmail(user.email);
    if (emailBasedRole === "SUPER_ADMIN") return "SUPER_ADMIN";
    if (user.role === "USER" || user.role === "ADMIN" || user.role === "TEMPLATE_ADMIN" || user.role === "SUPER_ADMIN") {
        return user.role;
    }
    return emailBasedRole;
}
function canAccessAdminPage(role) {
    return role === "ADMIN" || role === "SUPER_ADMIN";
}
function canAccessTemplateManagerPage(role) {
    return role === "TEMPLATE_ADMIN" || role === "SUPER_ADMIN";
}
function canAccessSuperAdminPage(role) {
    return role === "SUPER_ADMIN";
}
}),
"[project]/lib/adminAccess.ts [middleware-edge] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getRoleFromEmail",
    ()=>getRoleFromEmail,
    "getRoleFromUser",
    ()=>getRoleFromUser,
    "isAdminEmail",
    ()=>isAdminEmail,
    "isAdminUser",
    ()=>isAdminUser,
    "isSuperAdminUser",
    ()=>isSuperAdminUser,
    "isTemplateAdminUser",
    ()=>isTemplateAdminUser
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$roles$2e$ts__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/roles.ts [middleware-edge] (ecmascript)");
;
function getRoleFromUser(user) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$roles$2e$ts__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["getUserRole"])(user);
}
function getRoleFromEmail(email) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$roles$2e$ts__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["getUserRoleByEmail"])(email);
}
function isAdminEmail(email) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$roles$2e$ts__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["canAccessAdminPage"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$roles$2e$ts__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["getUserRoleByEmail"])(email));
}
function isAdminUser(user) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$roles$2e$ts__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["canAccessAdminPage"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$roles$2e$ts__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["getUserRole"])(user));
}
function isTemplateAdminUser(user) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$roles$2e$ts__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["canAccessTemplateManagerPage"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$roles$2e$ts__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["getUserRole"])(user));
}
function isSuperAdminUser(user) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$roles$2e$ts__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["canAccessSuperAdminPage"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$roles$2e$ts__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["getUserRole"])(user));
}
}),
"[project]/lib/cloudflareD1.ts [middleware-edge] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ensureAuthUsersTable",
    ()=>ensureAuthUsersTable,
    "runD1Query",
    ()=>runD1Query
]);
const CLOUDFLARE_API_BASE = "https://api.cloudflare.com/client/v4";
let ensureAuthUsersTablePromise = null;
function getD1Config() {
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    const databaseId = process.env.CLOUDFLARE_D1_DATABASE_ID;
    const apiToken = process.env.CLOUDFLARE_API_TOKEN;
    if (!accountId || !databaseId || !apiToken) {
        throw new Error("Missing Cloudflare D1 env vars: CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_D1_DATABASE_ID, CLOUDFLARE_API_TOKEN");
    }
    return {
        accountId,
        databaseId,
        apiToken
    };
}
async function runD1Query(sql, params = []) {
    const { accountId, databaseId, apiToken } = getD1Config();
    const endpoint = `${CLOUDFLARE_API_BASE}/accounts/${accountId}/d1/database/${databaseId}/query`;
    const response = await fetch(endpoint, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiToken}`
        },
        body: JSON.stringify({
            sql,
            params
        }),
        cache: "no-store"
    });
    if (!response.ok) {
        const text = await response.text();
        throw new Error(`D1 query failed (${response.status}): ${text}`);
    }
    const payload = await response.json();
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
    const columns = await runD1Query("PRAGMA table_info(auth_users)");
    const hasEmailVerifiedAt = columns.some((column)=>column.name === "email_verified_at");
    if (!hasEmailVerifiedAt) {
        await runD1Query("ALTER TABLE auth_users ADD COLUMN email_verified_at TEXT");
    }
    const hasRole = columns.some((column)=>column.name === "role");
    if (!hasRole) {
        await runD1Query("ALTER TABLE auth_users ADD COLUMN role TEXT NOT NULL DEFAULT 'USER'");
    }
    const hasIsActive = columns.some((column)=>column.name === "is_active");
    if (!hasIsActive) {
        await runD1Query("ALTER TABLE auth_users ADD COLUMN is_active INTEGER NOT NULL DEFAULT 1");
    }
    const hasMustChangePassword = columns.some((column)=>column.name === "must_change_password");
    if (!hasMustChangePassword) {
        await runD1Query("ALTER TABLE auth_users ADD COLUMN must_change_password INTEGER NOT NULL DEFAULT 0");
    }
    const hasForceLogoutAfter = columns.some((column)=>column.name === "force_logout_after");
    if (!hasForceLogoutAfter) {
        await runD1Query("ALTER TABLE auth_users ADD COLUMN force_logout_after TEXT");
    }
    const hasLastLoginAt = columns.some((column)=>column.name === "last_login_at");
    if (!hasLastLoginAt) {
        await runD1Query("ALTER TABLE auth_users ADD COLUMN last_login_at TEXT");
    }
}
async function ensureAuthUsersTable() {
    if (!ensureAuthUsersTablePromise) {
        ensureAuthUsersTablePromise = ensureAuthUsersTableInner().catch((error)=>{
            ensureAuthUsersTablePromise = null;
            throw error;
        });
    }
    await ensureAuthUsersTablePromise;
}
}),
"[project]/lib/authSession.ts [middleware-edge] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "isAuthUserSessionValid",
    ()=>isAuthUserSessionValid
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$cloudflareD1$2e$ts__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/cloudflareD1.ts [middleware-edge] (ecmascript)");
;
async function isAuthUserSessionValid(params) {
    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$cloudflareD1$2e$ts__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["ensureAuthUsersTable"])();
    const rows = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$cloudflareD1$2e$ts__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["runD1Query"])("SELECT is_active, force_logout_after FROM auth_users WHERE email = ? LIMIT 1", [
        params.email.trim().toLowerCase()
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
}),
"[project]/lib/authCookie.ts [middleware-edge] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "AUTH_COOKIE_NAME",
    ()=>AUTH_COOKIE_NAME,
    "decodeAuthUser",
    ()=>decodeAuthUser,
    "encodeAuthUser",
    ()=>encodeAuthUser
]);
const AUTH_COOKIE_NAME = "tamplateku_auth_user";
function encodeAuthUser(user) {
    return JSON.stringify(user);
}
function decodeAuthUser(value) {
    if (!value) return null;
    const parseCandidate = (candidate)=>{
        try {
            const parsed = JSON.parse(candidate);
            if (typeof parsed.id === "string" && typeof parsed.email === "string" && typeof parsed.name === "string" && (parsed.provider === "google" || parsed.provider === "github" || parsed.provider === "local")) {
                return {
                    id: parsed.id,
                    email: parsed.email,
                    name: parsed.name,
                    picture: typeof parsed.picture === "string" ? parsed.picture : undefined,
                    provider: parsed.provider,
                    role: parsed.role === "USER" || parsed.role === "ADMIN" || parsed.role === "TEMPLATE_ADMIN" || parsed.role === "SUPER_ADMIN" ? parsed.role : undefined,
                    sessionIssuedAt: typeof parsed.sessionIssuedAt === "string" ? parsed.sessionIssuedAt : undefined
                };
            }
            return null;
        } catch  {
            return null;
        }
    };
    const direct = parseCandidate(value);
    if (direct) return direct;
    try {
        return parseCandidate(decodeURIComponent(value));
    } catch  {
        return null;
    }
}
}),
"[project]/lib/superAdminDb.ts [middleware-edge] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "DEFAULT_SYSTEM_CONFIG",
    ()=>DEFAULT_SYSTEM_CONFIG,
    "canRoleAccessModule",
    ()=>canRoleAccessModule,
    "createAuditLog",
    ()=>createAuditLog,
    "createDataBackup",
    ()=>createDataBackup,
    "createLoginLog",
    ()=>createLoginLog,
    "ensureSuperAdminTables",
    ()=>ensureSuperAdminTables,
    "getDataBackupById",
    ()=>getDataBackupById,
    "getSystemConfig",
    ()=>getSystemConfig,
    "listAuditLogs",
    ()=>listAuditLogs,
    "listDataBackupMeta",
    ()=>listDataBackupMeta,
    "listDataBackups",
    ()=>listDataBackups,
    "listLoginLogs",
    ()=>listLoginLogs,
    "listSuspiciousActivities",
    ()=>listSuspiciousActivities,
    "saveSystemConfig",
    ()=>saveSystemConfig
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$cloudflareD1$2e$ts__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/cloudflareD1.ts [middleware-edge] (ecmascript)");
;
let ensureSuperAdminTablesPromise = null;
const SYSTEM_CONFIG_CACHE_TTL_MS = 15_000;
let cachedSystemConfig = null;
const DEFAULT_ROLE_ACCESS = {
    USER: {
        adminPage: false,
        templateManagerPage: false,
        superAdminPage: false
    },
    ADMIN: {
        adminPage: true,
        templateManagerPage: false,
        superAdminPage: false
    },
    TEMPLATE_ADMIN: {
        adminPage: false,
        templateManagerPage: true,
        superAdminPage: false
    },
    SUPER_ADMIN: {
        adminPage: true,
        templateManagerPage: true,
        superAdminPage: true
    }
};
const DEFAULT_SYSTEM_CONFIG = {
    appName: "Tamplateku",
    appLogoUrl: "/logo.png",
    maintenanceMode: false,
    loginAccess: {
        formLoginEnabled: true,
        googleLoginEnabled: true
    },
    features: {
        browseTemplateEnabled: true,
        blogEnabled: true
    },
    integrations: {
        resendEnabled: true,
        googleOauthEnabled: true,
        publicApiEnabled: false,
        publicApiKeyHint: ""
    },
    roleAccess: DEFAULT_ROLE_ACCESS
};
function isRecord(value) {
    return typeof value === "object" && value !== null;
}
function toBoolean(value, fallback) {
    return typeof value === "boolean" ? value : fallback;
}
function toStringValue(value, fallback) {
    if (typeof value !== "string") return fallback;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : fallback;
}
function mergeRoleAccess(raw) {
    if (!isRecord(raw)) return DEFAULT_ROLE_ACCESS;
    const roles = [
        "USER",
        "ADMIN",
        "TEMPLATE_ADMIN",
        "SUPER_ADMIN"
    ];
    const result = {
        USER: {
            ...DEFAULT_ROLE_ACCESS.USER
        },
        ADMIN: {
            ...DEFAULT_ROLE_ACCESS.ADMIN
        },
        TEMPLATE_ADMIN: {
            ...DEFAULT_ROLE_ACCESS.TEMPLATE_ADMIN
        },
        SUPER_ADMIN: {
            ...DEFAULT_ROLE_ACCESS.SUPER_ADMIN
        }
    };
    for (const role of roles){
        const roleRaw = raw[role];
        if (!isRecord(roleRaw)) continue;
        result[role] = {
            adminPage: toBoolean(roleRaw.adminPage, result[role].adminPage),
            templateManagerPage: toBoolean(roleRaw.templateManagerPage, result[role].templateManagerPage),
            superAdminPage: toBoolean(roleRaw.superAdminPage, result[role].superAdminPage)
        };
    }
    result.SUPER_ADMIN = {
        adminPage: true,
        templateManagerPage: true,
        superAdminPage: true
    };
    return result;
}
function mergeSystemConfig(raw) {
    if (!isRecord(raw)) return DEFAULT_SYSTEM_CONFIG;
    const loginAccess = isRecord(raw.loginAccess) ? raw.loginAccess : {};
    const features = isRecord(raw.features) ? raw.features : {};
    const integrations = isRecord(raw.integrations) ? raw.integrations : {};
    return {
        appName: toStringValue(raw.appName, DEFAULT_SYSTEM_CONFIG.appName),
        appLogoUrl: toStringValue(raw.appLogoUrl, DEFAULT_SYSTEM_CONFIG.appLogoUrl),
        maintenanceMode: toBoolean(raw.maintenanceMode, DEFAULT_SYSTEM_CONFIG.maintenanceMode),
        loginAccess: {
            formLoginEnabled: toBoolean(loginAccess.formLoginEnabled, DEFAULT_SYSTEM_CONFIG.loginAccess.formLoginEnabled),
            googleLoginEnabled: toBoolean(loginAccess.googleLoginEnabled, DEFAULT_SYSTEM_CONFIG.loginAccess.googleLoginEnabled)
        },
        features: {
            browseTemplateEnabled: toBoolean(features.browseTemplateEnabled, DEFAULT_SYSTEM_CONFIG.features.browseTemplateEnabled),
            blogEnabled: toBoolean(features.blogEnabled, DEFAULT_SYSTEM_CONFIG.features.blogEnabled)
        },
        integrations: {
            resendEnabled: toBoolean(integrations.resendEnabled, DEFAULT_SYSTEM_CONFIG.integrations.resendEnabled),
            googleOauthEnabled: toBoolean(integrations.googleOauthEnabled, DEFAULT_SYSTEM_CONFIG.integrations.googleOauthEnabled),
            publicApiEnabled: toBoolean(integrations.publicApiEnabled, DEFAULT_SYSTEM_CONFIG.integrations.publicApiEnabled),
            publicApiKeyHint: toStringValue(integrations.publicApiKeyHint, DEFAULT_SYSTEM_CONFIG.integrations.publicApiKeyHint)
        },
        roleAccess: mergeRoleAccess(raw.roleAccess)
    };
}
async function ensureSuperAdminTablesInner() {
    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$cloudflareD1$2e$ts__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["runD1Query"])(`
    CREATE TABLE IF NOT EXISTS super_admin_settings (
      key TEXT PRIMARY KEY,
      value_json TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);
    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$cloudflareD1$2e$ts__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["runD1Query"])(`
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
    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$cloudflareD1$2e$ts__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["runD1Query"])(`
    CREATE INDEX IF NOT EXISTS idx_super_admin_audit_logs_created
    ON super_admin_audit_logs(created_at DESC);
  `);
    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$cloudflareD1$2e$ts__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["runD1Query"])(`
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
    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$cloudflareD1$2e$ts__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["runD1Query"])(`
    CREATE INDEX IF NOT EXISTS idx_auth_login_logs_email_created
    ON auth_login_logs(email, created_at DESC);
  `);
    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$cloudflareD1$2e$ts__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["runD1Query"])(`
    CREATE INDEX IF NOT EXISTS idx_auth_login_logs_success_created
    ON auth_login_logs(success, created_at DESC);
  `);
    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$cloudflareD1$2e$ts__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["runD1Query"])(`
    CREATE TABLE IF NOT EXISTS super_admin_backups (
      id TEXT PRIMARY KEY,
      snapshot_type TEXT NOT NULL,
      payload_json TEXT NOT NULL,
      created_by TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);
    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$cloudflareD1$2e$ts__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["runD1Query"])(`
    CREATE INDEX IF NOT EXISTS idx_super_admin_backups_created
    ON super_admin_backups(created_at DESC);
  `);
}
async function ensureSuperAdminTables() {
    if (!ensureSuperAdminTablesPromise) {
        ensureSuperAdminTablesPromise = ensureSuperAdminTablesInner().catch((error)=>{
            ensureSuperAdminTablesPromise = null;
            throw error;
        });
    }
    await ensureSuperAdminTablesPromise;
}
async function getSettingValue(key, fallback) {
    await ensureSuperAdminTables();
    const rows = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$cloudflareD1$2e$ts__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["runD1Query"])("SELECT value_json FROM super_admin_settings WHERE key = ? LIMIT 1", [
        key
    ]);
    if (!rows[0]) return fallback;
    try {
        return JSON.parse(rows[0].value_json);
    } catch  {
        return fallback;
    }
}
async function setSettingValue(key, value) {
    await ensureSuperAdminTables();
    const now = new Date().toISOString();
    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$cloudflareD1$2e$ts__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["runD1Query"])("INSERT OR REPLACE INTO super_admin_settings (key, value_json, updated_at) VALUES (?, ?, ?)", [
        key,
        JSON.stringify(value),
        now
    ]);
}
async function getSystemConfig(options) {
    if (!options?.forceRefresh && cachedSystemConfig && Date.now() < cachedSystemConfig.expiresAt) {
        return cachedSystemConfig.value;
    }
    const raw = await getSettingValue("system_config", DEFAULT_SYSTEM_CONFIG);
    const merged = mergeSystemConfig(raw);
    cachedSystemConfig = {
        value: merged,
        expiresAt: Date.now() + SYSTEM_CONFIG_CACHE_TTL_MS
    };
    return merged;
}
async function saveSystemConfig(config) {
    const merged = mergeSystemConfig(config);
    await setSettingValue("system_config", merged);
    cachedSystemConfig = {
        value: merged,
        expiresAt: Date.now() + SYSTEM_CONFIG_CACHE_TTL_MS
    };
    return merged;
}
async function canRoleAccessModule(role, module) {
    const config = await getSystemConfig();
    return Boolean(config.roleAccess[role]?.[module]);
}
async function createAuditLog(params) {
    await ensureSuperAdminTables();
    const now = new Date().toISOString();
    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$cloudflareD1$2e$ts__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["runD1Query"])(`INSERT INTO super_admin_audit_logs (
      id, actor_email, action, target_type, target_id, detail_json, severity, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [
        crypto.randomUUID(),
        params.actorEmail.trim().toLowerCase(),
        params.action,
        params.targetType,
        params.targetId ?? null,
        params.detail ? JSON.stringify(params.detail) : null,
        params.severity ?? "INFO",
        now
    ]);
}
async function listAuditLogs(limit = 100) {
    await ensureSuperAdminTables();
    const safeLimit = Number.isFinite(limit) ? Math.min(Math.max(Math.floor(limit), 1), 500) : 100;
    const rows = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$cloudflareD1$2e$ts__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["runD1Query"])(`SELECT id, actor_email, action, target_type, target_id, detail_json, severity, created_at
     FROM super_admin_audit_logs
     ORDER BY created_at DESC
     LIMIT ?`, [
        safeLimit
    ]);
    return rows.map((row)=>{
        let detail = null;
        if (row.detail_json) {
            try {
                const parsed = JSON.parse(row.detail_json);
                detail = isRecord(parsed) ? parsed : null;
            } catch  {
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
            createdAt: row.created_at
        };
    });
}
async function createLoginLog(params) {
    await ensureSuperAdminTables();
    const now = new Date().toISOString();
    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$cloudflareD1$2e$ts__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["runD1Query"])(`INSERT INTO auth_login_logs (
      id, user_id, email, success, reason, request_ip, user_agent, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [
        crypto.randomUUID(),
        params.userId ?? null,
        params.email.trim().toLowerCase(),
        params.success ? 1 : 0,
        params.reason?.trim() || null,
        params.requestIp,
        params.userAgent,
        now
    ]);
}
async function listLoginLogs(limit = 100) {
    await ensureSuperAdminTables();
    const safeLimit = Number.isFinite(limit) ? Math.min(Math.max(Math.floor(limit), 1), 500) : 100;
    const rows = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$cloudflareD1$2e$ts__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["runD1Query"])(`SELECT id, user_id, email, success, reason, request_ip, user_agent, created_at
     FROM auth_login_logs
     ORDER BY created_at DESC
     LIMIT ?`, [
        safeLimit
    ]);
    return rows.map((row)=>({
            id: row.id,
            userId: row.user_id,
            email: row.email,
            success: row.success === 1,
            reason: row.reason,
            requestIp: row.request_ip,
            userAgent: row.user_agent,
            createdAt: row.created_at
        }));
}
async function listSuspiciousActivities() {
    await ensureSuperAdminTables();
    const cutoffIso = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const rows = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$cloudflareD1$2e$ts__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["runD1Query"])(`SELECT email,
            COUNT(*) AS failed_attempts,
            MIN(created_at) AS first_attempt_at,
            MAX(created_at) AS last_attempt_at
     FROM auth_login_logs
     WHERE success = 0
       AND created_at >= ?
     GROUP BY email
     HAVING COUNT(*) >= 5
     ORDER BY failed_attempts DESC, last_attempt_at DESC
     LIMIT 100`, [
        cutoffIso
    ]);
    return rows.map((row)=>({
            email: row.email,
            failedAttempts: row.failed_attempts,
            firstAttemptAt: row.first_attempt_at,
            lastAttemptAt: row.last_attempt_at
        }));
}
async function createDataBackup(params) {
    await ensureSuperAdminTables();
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$cloudflareD1$2e$ts__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["runD1Query"])(`INSERT INTO super_admin_backups (id, snapshot_type, payload_json, created_by, created_at)
     VALUES (?, ?, ?, ?, ?)`, [
        id,
        params.snapshotType,
        JSON.stringify(params.payload),
        params.createdBy,
        now
    ]);
    return {
        id,
        snapshotType: params.snapshotType,
        payload: params.payload,
        createdBy: params.createdBy,
        createdAt: now
    };
}
async function listDataBackups(limit = 30) {
    await ensureSuperAdminTables();
    const safeLimit = Number.isFinite(limit) ? Math.min(Math.max(Math.floor(limit), 1), 200) : 30;
    const rows = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$cloudflareD1$2e$ts__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["runD1Query"])(`SELECT id, snapshot_type, payload_json, created_by, created_at
     FROM super_admin_backups
     ORDER BY created_at DESC
     LIMIT ?`, [
        safeLimit
    ]);
    return rows.map((row)=>{
        let payload = {};
        try {
            const parsed = JSON.parse(row.payload_json);
            payload = isRecord(parsed) ? parsed : {};
        } catch  {
            payload = {};
        }
        return {
            id: row.id,
            snapshotType: row.snapshot_type,
            payload,
            createdBy: row.created_by,
            createdAt: row.created_at
        };
    });
}
async function listDataBackupMeta(limit = 30) {
    await ensureSuperAdminTables();
    const safeLimit = Number.isFinite(limit) ? Math.min(Math.max(Math.floor(limit), 1), 200) : 30;
    const rows = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$cloudflareD1$2e$ts__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["runD1Query"])(`SELECT id, snapshot_type, created_by, created_at
     FROM super_admin_backups
     ORDER BY created_at DESC
     LIMIT ?`, [
        safeLimit
    ]);
    return rows.map((row)=>({
            id: row.id,
            snapshotType: row.snapshot_type,
            createdBy: row.created_by,
            createdAt: row.created_at
        }));
}
async function getDataBackupById(backupId) {
    await ensureSuperAdminTables();
    const rows = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$cloudflareD1$2e$ts__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["runD1Query"])(`SELECT id, snapshot_type, payload_json, created_by, created_at
     FROM super_admin_backups
     WHERE id = ?
     LIMIT 1`, [
        backupId
    ]);
    if (!rows[0]) return null;
    let payload = {};
    try {
        const parsed = JSON.parse(rows[0].payload_json);
        payload = isRecord(parsed) ? parsed : {};
    } catch  {
        payload = {};
    }
    return {
        id: rows[0].id,
        snapshotType: rows[0].snapshot_type,
        payload,
        createdBy: rows[0].created_by,
        createdAt: rows[0].created_at
    };
}
}),
"[project]/middleware.ts [middleware-edge] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "config",
    ()=>config,
    "middleware",
    ()=>middleware
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$adminAccess$2e$ts__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/adminAccess.ts [middleware-edge] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$authSession$2e$ts__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/authSession.ts [middleware-edge] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$authCookie$2e$ts__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/authCookie.ts [middleware-edge] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$roles$2e$ts__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/roles.ts [middleware-edge] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$superAdminDb$2e$ts__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/superAdminDb.ts [middleware-edge] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$api$2f$server$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/next/dist/esm/api/server.js [middleware-edge] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$exports$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/esm/server/web/exports/index.js [middleware-edge] (ecmascript)");
;
;
;
;
;
;
async function middleware(request) {
    const pathname = request.nextUrl.pathname;
    const needsRoleCheck = pathname.startsWith("/admin") || pathname.startsWith("/admin-pengelola") || pathname.startsWith("/super-admin");
    if (needsRoleCheck) {
        const cookieValue = request.cookies.get(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$authCookie$2e$ts__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["AUTH_COOKIE_NAME"])?.value;
        const user = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$authCookie$2e$ts__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["decodeAuthUser"])(cookieValue);
        if (!user) {
            const url = request.nextUrl.clone();
            url.pathname = "/signup";
            url.searchParams.set("auth", "required");
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$exports$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].redirect(url);
        }
        try {
            const validSession = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$authSession$2e$ts__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["isAuthUserSessionValid"])({
                email: user.email,
                sessionIssuedAt: user.sessionIssuedAt
            });
            if (!validSession) {
                const url = request.nextUrl.clone();
                url.pathname = "/login";
                url.searchParams.set("auth", "expired");
                const response = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$exports$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].redirect(url);
                response.cookies.delete(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$authCookie$2e$ts__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["AUTH_COOKIE_NAME"]);
                return response;
            }
        } catch  {
        // fallback to cookie-only check when DB unavailable
        }
        const role = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$adminAccess$2e$ts__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["getRoleFromUser"])(user);
        let allowed = pathname.startsWith("/admin-pengelola") && (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$roles$2e$ts__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["canAccessTemplateManagerPage"])(role) || pathname.startsWith("/super-admin") && (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$roles$2e$ts__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["canAccessSuperAdminPage"])(role) || pathname.startsWith("/admin") && !pathname.startsWith("/admin-pengelola") && (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$roles$2e$ts__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["canAccessAdminPage"])(role);
        if (allowed) {
            const module = pathname.startsWith("/admin-pengelola") ? "templateManagerPage" : pathname.startsWith("/super-admin") ? "superAdminPage" : "adminPage";
            try {
                allowed = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$superAdminDb$2e$ts__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["canRoleAccessModule"])(role, module);
            } catch  {
            // fallback to static role checks if dynamic policy fails
            }
        }
        if (!allowed) {
            const url = request.nextUrl.clone();
            url.pathname = "/browse-template";
            url.searchParams.set("admin", "forbidden");
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$exports$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].redirect(url);
        }
    }
    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$exports$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].next();
}
const config = {
    matcher: [
        "/admin/:path*",
        "/admin-pengelola/:path*",
        "/super-admin/:path*"
    ]
};
}),
]);

//# sourceMappingURL=%5Broot-of-the-server%5D__9e61b4e3._.js.map