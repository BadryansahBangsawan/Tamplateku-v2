import { runD1Query } from "@/lib/cloudflareD1";
import { OTP_MAX_ATTEMPTS, type OtpPurpose } from "@/lib/otp";

type OtpRequestRow = {
  id: string;
  email: string;
  purpose: OtpPurpose;
  otp_hash: string;
  expires_at: string;
  attempts: number;
  max_attempts: number;
  consumed_at: string | null;
  created_at: string;
};

type RateLimitRow = {
  key: string;
  count: number;
  window_start: string;
};

type ResetTokenRow = {
  id: string;
  email: string;
  expires_at: string;
  consumed_at: string | null;
};

function nowIso(): string {
  return new Date().toISOString();
}

function addMinutesToNow(minutes: number): string {
  return new Date(Date.now() + minutes * 60 * 1000).toISOString();
}

function getResetTokenSecret(): string {
  const secret = process.env.RESET_TOKEN_SECRET;
  if (!secret || secret.trim().length < 32) {
    throw new Error("Missing or weak RESET_TOKEN_SECRET env var (minimum 32 chars).");
  }
  return secret;
}

let cachedResetTokenKey: Promise<CryptoKey> | null = null;

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function bytesToBase64Url(bytes: Uint8Array): string {
  const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join("");
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function randomTokenBase64Url(size: number): string {
  const bytes = new Uint8Array(size);
  crypto.getRandomValues(bytes);
  return bytesToBase64Url(bytes);
}

async function getResetTokenKey(): Promise<CryptoKey> {
  if (!cachedResetTokenKey) {
    cachedResetTokenKey = crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(getResetTokenSecret()),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
  }

  return cachedResetTokenKey;
}

async function hashResetToken(token: string): Promise<string> {
  const key = await getResetTokenKey();
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(token));
  return bytesToHex(new Uint8Array(signature));
}

export async function ensureOtpTables(): Promise<void> {
  await runD1Query(`
    CREATE TABLE IF NOT EXISTS otp_requests (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      purpose TEXT NOT NULL CHECK (purpose IN ('REGISTER', 'RESET_PASSWORD', 'CHANGE_EMAIL')),
      otp_hash TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      attempts INTEGER NOT NULL DEFAULT 0,
      max_attempts INTEGER NOT NULL DEFAULT 5,
      consumed_at TEXT,
      request_ip TEXT,
      user_agent TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  await runD1Query(`
    CREATE INDEX IF NOT EXISTS idx_otp_requests_email_purpose_created
    ON otp_requests(email, purpose, created_at DESC);
  `);

  await runD1Query(`
    CREATE INDEX IF NOT EXISTS idx_otp_requests_expires_at
    ON otp_requests(expires_at);
  `);

  await runD1Query(`
    CREATE TABLE IF NOT EXISTS otp_rate_limits (
      key TEXT PRIMARY KEY,
      count INTEGER NOT NULL,
      window_start TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  await runD1Query(`
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      token_hash TEXT NOT NULL UNIQUE,
      otp_request_id TEXT,
      expires_at TEXT NOT NULL,
      consumed_at TEXT,
      request_ip TEXT,
      user_agent TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  await runD1Query(`
    CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_email
    ON password_reset_tokens(email, created_at DESC);
  `);
}

export async function checkAndConsumeRateLimit(params: {
  key: string;
  limit: number;
  windowSeconds: number;
}): Promise<{ allowed: boolean; retryAfterSeconds: number }> {
  await ensureOtpTables();

  const now = new Date();
  const nowString = now.toISOString();
  const rows = await runD1Query<RateLimitRow>(
    "SELECT key, count, window_start FROM otp_rate_limits WHERE key = ? LIMIT 1",
    [params.key]
  );

  if (rows.length === 0) {
    await runD1Query(
      "INSERT INTO otp_rate_limits (key, count, window_start, updated_at) VALUES (?, ?, ?, ?)",
      [params.key, 1, nowString, nowString]
    );
    return { allowed: true, retryAfterSeconds: 0 };
  }

  const current = rows[0];
  const windowStartMs = Date.parse(current.window_start);
  const elapsedSeconds = Number.isNaN(windowStartMs)
    ? params.windowSeconds
    : Math.floor((now.getTime() - windowStartMs) / 1000);

  if (elapsedSeconds >= params.windowSeconds) {
    await runD1Query(
      "UPDATE otp_rate_limits SET count = 1, window_start = ?, updated_at = ? WHERE key = ?",
      [nowString, nowString, params.key]
    );
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (current.count >= params.limit) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, params.windowSeconds - elapsedSeconds),
    };
  }

  await runD1Query("UPDATE otp_rate_limits SET count = count + 1, updated_at = ? WHERE key = ?", [
    nowString,
    params.key,
  ]);

  return { allowed: true, retryAfterSeconds: 0 };
}

export async function getLatestActiveOtpRequest(
  email: string,
  purpose: OtpPurpose
): Promise<OtpRequestRow | null> {
  await ensureOtpTables();

  const rows = await runD1Query<OtpRequestRow>(
    `SELECT id, email, purpose, otp_hash, expires_at, attempts, max_attempts, consumed_at, created_at
     FROM otp_requests
     WHERE email = ? AND purpose = ? AND consumed_at IS NULL
     ORDER BY created_at DESC
     LIMIT 1`,
    [email, purpose]
  );

  return rows[0] ?? null;
}

export async function createOtpRequest(params: {
  email: string;
  purpose: OtpPurpose;
  otpHash: string;
  expiresAt: string;
  ip: string;
  userAgent: string;
}): Promise<{ id: string; createdAt: string }> {
  await ensureOtpTables();

  const id = crypto.randomUUID();
  const now = nowIso();

  await runD1Query(
    `UPDATE otp_requests
     SET consumed_at = COALESCE(consumed_at, ?), updated_at = ?
     WHERE email = ? AND purpose = ? AND consumed_at IS NULL`,
    [now, now, params.email, params.purpose]
  );

  await runD1Query(
    `INSERT INTO otp_requests (
      id, email, purpose, otp_hash, expires_at, attempts, max_attempts,
      consumed_at, request_ip, user_agent, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, 0, ?, NULL, ?, ?, ?, ?)`,
    [
      id,
      params.email,
      params.purpose,
      params.otpHash,
      params.expiresAt,
      OTP_MAX_ATTEMPTS,
      params.ip,
      params.userAgent,
      now,
      now,
    ]
  );

  return { id, createdAt: now };
}

export async function consumeOtpRequest(otpRequestId: string): Promise<void> {
  const now = nowIso();
  await runD1Query(
    "UPDATE otp_requests SET consumed_at = COALESCE(consumed_at, ?), updated_at = ? WHERE id = ?",
    [now, now, otpRequestId]
  );
}

export async function increaseOtpAttempt(params: {
  otpRequestId: string;
  currentAttempts: number;
  maxAttempts: number;
}): Promise<number> {
  const nextAttempts = params.currentAttempts + 1;
  const now = nowIso();

  if (nextAttempts >= params.maxAttempts) {
    await runD1Query(
      `UPDATE otp_requests
       SET attempts = ?, consumed_at = COALESCE(consumed_at, ?), updated_at = ?
       WHERE id = ?`,
      [nextAttempts, now, now, params.otpRequestId]
    );
    return nextAttempts;
  }

  await runD1Query("UPDATE otp_requests SET attempts = ?, updated_at = ? WHERE id = ?", [
    nextAttempts,
    now,
    params.otpRequestId,
  ]);

  return nextAttempts;
}

export async function revokeOtpRequest(otpRequestId: string): Promise<void> {
  await consumeOtpRequest(otpRequestId);
}

export async function issuePasswordResetToken(params: {
  email: string;
  otpRequestId: string;
  ip: string;
  userAgent: string;
  ttlMinutes?: number;
}): Promise<{ token: string; expiresAt: string }> {
  await ensureOtpTables();

  const rawToken = randomTokenBase64Url(32);
  const tokenHash = await hashResetToken(rawToken);
  const now = nowIso();
  const expiresAt = addMinutesToNow(params.ttlMinutes ?? 15);

  await runD1Query(
    `INSERT INTO password_reset_tokens (
      id, email, token_hash, otp_request_id, expires_at, consumed_at,
      request_ip, user_agent, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, NULL, ?, ?, ?, ?)`,
    [
      crypto.randomUUID(),
      params.email,
      tokenHash,
      params.otpRequestId,
      expiresAt,
      params.ip,
      params.userAgent,
      now,
      now,
    ]
  );

  return {
    token: rawToken,
    expiresAt,
  };
}

export async function consumePasswordResetToken(
  rawToken: string
): Promise<{ email: string } | null> {
  await ensureOtpTables();

  const tokenHash = await hashResetToken(rawToken);
  const rows = await runD1Query<ResetTokenRow>(
    `SELECT id, email, expires_at, consumed_at
     FROM password_reset_tokens
     WHERE token_hash = ?
     LIMIT 1`,
    [tokenHash]
  );

  const token = rows[0];
  if (!token) return null;

  const now = new Date();
  const expired = Number.isNaN(Date.parse(token.expires_at)) || new Date(token.expires_at) <= now;
  if (token.consumed_at || expired) {
    return null;
  }

  const nowString = now.toISOString();
  await runD1Query(
    "UPDATE password_reset_tokens SET consumed_at = ?, updated_at = ? WHERE id = ?",
    [nowString, nowString, token.id]
  );

  return { email: token.email };
}

export async function invalidatePasswordResetTokensForEmail(email: string): Promise<void> {
  const now = nowIso();
  await runD1Query(
    `UPDATE password_reset_tokens
     SET consumed_at = COALESCE(consumed_at, ?), updated_at = ?
     WHERE email = ? AND consumed_at IS NULL`,
    [now, now, email]
  );
}
