import { ensureAuthUsersTable, runD1Query } from "@/lib/cloudflareD1";
import bcrypt from "bcryptjs";

export type DbAuthResult<T = undefined> = {
  ok: boolean;
  code?: string;
  message?: string;
  data?: T;
};

export type AuthUserRecord = {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  email_verified_at: string | null;
};

export async function registerUser(params: {
  name: string;
  email: string;
  password: string;
  notes?: string;
}): Promise<DbAuthResult> {
  await ensureAuthUsersTable();
  const email = params.email.trim().toLowerCase();
  const existing = await runD1Query<{ id: string }>(
    "SELECT id FROM auth_users WHERE email = ? LIMIT 1",
    [email]
  );
  if (existing.length > 0) {
    return { ok: false, message: "Email sudah terdaftar. Silakan login." };
  }

  const passwordHash = await bcrypt.hash(params.password, 10);
  const now = new Date().toISOString();
  await runD1Query(
    "INSERT INTO auth_users (id, name, email, password_hash, email_verified_at, notes, created_at, updated_at) VALUES (?, ?, ?, ?, NULL, ?, ?, ?)",
    [
      crypto.randomUUID(),
      params.name.trim(),
      email,
      passwordHash,
      params.notes?.trim() || null,
      now,
      now,
    ]
  );

  return { ok: true };
}

export async function loginUser(params: {
  email: string;
  password: string;
}): Promise<DbAuthResult<{ id: string; name: string; email: string }>> {
  await ensureAuthUsersTable();
  const email = params.email.trim().toLowerCase();
  const users = await runD1Query<{
    id: string;
    name: string;
    email: string;
    password_hash: string;
    email_verified_at: string | null;
  }>(
    "SELECT id, name, email, password_hash, email_verified_at FROM auth_users WHERE email = ? LIMIT 1",
    [email]
  );
  const user = users[0];

  if (!user) {
    return { ok: false, message: "Akun tidak ditemukan. Silakan daftar dulu." };
  }

  const valid = await bcrypt.compare(params.password, user.password_hash);
  if (!valid) {
    return { ok: false, message: "Password salah. Coba lagi." };
  }

  if (!user.email_verified_at) {
    return {
      ok: false,
      code: "EMAIL_NOT_VERIFIED",
      message: "Email belum diverifikasi. Silakan verifikasi OTP dulu.",
    };
  }

  return {
    ok: true,
    data: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
  };
}

export async function findAuthUserByEmail(emailInput: string): Promise<AuthUserRecord | null> {
  await ensureAuthUsersTable();
  const email = emailInput.trim().toLowerCase();

  const users = await runD1Query<AuthUserRecord>(
    "SELECT id, name, email, password_hash, email_verified_at FROM auth_users WHERE email = ? LIMIT 1",
    [email]
  );

  return users[0] ?? null;
}

export async function updateAuthUserPassword(emailInput: string, password: string): Promise<void> {
  await ensureAuthUsersTable();
  const email = emailInput.trim().toLowerCase();
  const passwordHash = await bcrypt.hash(password, 10);
  const now = new Date().toISOString();

  await runD1Query("UPDATE auth_users SET password_hash = ?, updated_at = ? WHERE email = ?", [
    passwordHash,
    now,
    email,
  ]);
}

export async function markAuthUserEmailVerified(emailInput: string): Promise<void> {
  await ensureAuthUsersTable();
  const email = emailInput.trim().toLowerCase();
  const now = new Date().toISOString();

  await runD1Query(
    "UPDATE auth_users SET email_verified_at = COALESCE(email_verified_at, ?), updated_at = ? WHERE email = ?",
    [now, now, email]
  );
}
