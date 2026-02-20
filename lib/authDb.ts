import { ensureAuthUsersTable, runD1Query } from "@/lib/cloudflareD1";
import { type AppRole, getUserRoleByEmail } from "@/lib/roles";
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
  role: AppRole;
  email_verified_at: string | null;
};

type AuthUserListRow = {
  id: string;
  name: string;
  email: string;
  role: string;
  email_verified_at: string | null;
  created_at: string;
  updated_at: string;
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
  const role = getUserRoleByEmail(email);
  await runD1Query(
    "INSERT INTO auth_users (id, name, email, password_hash, role, email_verified_at, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, NULL, ?, ?, ?)",
    [
      crypto.randomUUID(),
      params.name.trim(),
      email,
      passwordHash,
      role,
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
}): Promise<DbAuthResult<{ id: string; name: string; email: string; role: AppRole }>> {
  await ensureAuthUsersTable();
  const email = params.email.trim().toLowerCase();
  const users = await runD1Query<{
    id: string;
    name: string;
    email: string;
    password_hash: string;
    role: string;
    email_verified_at: string | null;
  }>(
    "SELECT id, name, email, password_hash, role, email_verified_at FROM auth_users WHERE email = ? LIMIT 1",
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
      role: getUserRoleByEmail(user.email),
    },
  };
}

export async function findAuthUserByEmail(emailInput: string): Promise<AuthUserRecord | null> {
  await ensureAuthUsersTable();
  const email = emailInput.trim().toLowerCase();

  const users = await runD1Query<AuthUserRecord>(
    "SELECT id, name, email, password_hash, role, email_verified_at FROM auth_users WHERE email = ? LIMIT 1",
    [email]
  );

  if (!users[0]) return null;
  return {
    ...users[0],
    role: getUserRoleByEmail(users[0].email),
  };
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

export type AdminAuthUserItem = {
  id: string;
  name: string;
  email: string;
  role: AppRole;
  emailVerifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export async function listAuthUsersForSuperAdmin(): Promise<AdminAuthUserItem[]> {
  await ensureAuthUsersTable();
  const rows = await runD1Query<AuthUserListRow>(
    `SELECT id, name, email, role, email_verified_at, created_at, updated_at
     FROM auth_users
     ORDER BY created_at DESC`
  );

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    email: row.email,
    role: getUserRoleByEmail(row.email),
    emailVerifiedAt: row.email_verified_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

export async function deleteAuthUserById(userId: string): Promise<boolean> {
  await ensureAuthUsersTable();
  const rows = await runD1Query<{ id: string }>("SELECT id FROM auth_users WHERE id = ? LIMIT 1", [
    userId,
  ]);
  if (rows.length === 0) return false;

  await runD1Query("DELETE FROM auth_users WHERE id = ?", [userId]);
  return true;
}

export async function getAuthUserForSuperAdminById(
  userId: string
): Promise<AdminAuthUserItem | null> {
  await ensureAuthUsersTable();
  const rows = await runD1Query<AuthUserListRow>(
    `SELECT id, name, email, role, email_verified_at, created_at, updated_at
     FROM auth_users
     WHERE id = ?
     LIMIT 1`,
    [userId]
  );

  if (!rows[0]) return null;
  return {
    id: rows[0].id,
    name: rows[0].name,
    email: rows[0].email,
    role: getUserRoleByEmail(rows[0].email),
    emailVerifiedAt: rows[0].email_verified_at,
    createdAt: rows[0].created_at,
    updatedAt: rows[0].updated_at,
  };
}
