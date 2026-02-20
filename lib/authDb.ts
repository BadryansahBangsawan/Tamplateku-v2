import { ensureAuthUsersTable, runD1Query } from "@/lib/cloudflareD1";
import { type AppRole, getUserRoleByEmail } from "@/lib/roles";
import bcrypt from "bcryptjs";

export type DbAuthResult<T = undefined> = {
  ok: boolean;
  code?: string;
  message?: string;
  data?: T;
};

const VALID_ROLES: AppRole[] = ["USER", "ADMIN", "TEMPLATE_ADMIN", "SUPER_ADMIN"];

function isAppRole(value: unknown): value is AppRole {
  return typeof value === "string" && VALID_ROLES.includes(value as AppRole);
}

function resolveUserRole(email: string, roleValue: unknown): AppRole {
  const forcedByEmail = getUserRoleByEmail(email);
  if (forcedByEmail === "SUPER_ADMIN") return "SUPER_ADMIN";
  if (isAppRole(roleValue)) return roleValue;
  return forcedByEmail;
}

export type AuthUserRecord = {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  role: AppRole;
  is_active: number;
  must_change_password: number;
  force_logout_after: string | null;
  last_login_at: string | null;
  email_verified_at: string | null;
};

type AuthUserListRow = {
  id: string;
  name: string;
  email: string;
  role: string;
  is_active: number;
  must_change_password: number;
  force_logout_after: string | null;
  last_login_at: string | null;
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

  const passwordHash = bcrypt.hashSync(params.password, 10);
  const now = new Date().toISOString();
  const role = getUserRoleByEmail(email);
  await runD1Query(
    "INSERT INTO auth_users (id, name, email, password_hash, role, is_active, must_change_password, force_logout_after, last_login_at, email_verified_at, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 1, 0, NULL, NULL, NULL, ?, ?, ?)",
    [crypto.randomUUID(), params.name.trim(), email, passwordHash, role, params.notes?.trim() || null, now, now]
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
    is_active: number;
    must_change_password: number;
    email_verified_at: string | null;
  }>(
    "SELECT id, name, email, password_hash, role, is_active, must_change_password, email_verified_at FROM auth_users WHERE email = ? LIMIT 1",
    [email]
  );
  const user = users[0];

  if (!user) {
    return { ok: false, message: "Akun tidak ditemukan. Silakan daftar dulu." };
  }

  if (!user.is_active) {
    return {
      ok: false,
      code: "ACCOUNT_DISABLED",
      message: "Akun sedang dinonaktifkan. Hubungi admin.",
    };
  }

  const valid = bcrypt.compareSync(params.password, user.password_hash);
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

  if (user.must_change_password) {
    return {
      ok: false,
      code: "PASSWORD_CHANGE_REQUIRED",
      message: "Akun ini wajib ganti password dulu. Gunakan fitur lupa password.",
    };
  }

  return {
    ok: true,
    data: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: resolveUserRole(user.email, user.role),
    },
  };
}

export async function findAuthUserByEmail(emailInput: string): Promise<AuthUserRecord | null> {
  await ensureAuthUsersTable();
  const email = emailInput.trim().toLowerCase();

  const users = await runD1Query<AuthUserRecord>(
    "SELECT id, name, email, password_hash, role, is_active, must_change_password, force_logout_after, last_login_at, email_verified_at FROM auth_users WHERE email = ? LIMIT 1",
    [email]
  );

  if (!users[0]) return null;
  return {
    ...users[0],
    role: resolveUserRole(users[0].email, users[0].role),
  };
}

export async function updateAuthUserPassword(emailInput: string, password: string): Promise<void> {
  await ensureAuthUsersTable();
  const email = emailInput.trim().toLowerCase();
  const passwordHash = bcrypt.hashSync(password, 10);
  const now = new Date().toISOString();

  await runD1Query(
    "UPDATE auth_users SET password_hash = ?, must_change_password = 0, force_logout_after = ?, updated_at = ? WHERE email = ?",
    [passwordHash, now, now, email]
  );
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

export async function markAuthUserLoginSuccess(userId: string): Promise<void> {
  await ensureAuthUsersTable();
  const now = new Date().toISOString();
  await runD1Query("UPDATE auth_users SET last_login_at = ?, updated_at = ? WHERE id = ?", [
    now,
    now,
    userId,
  ]);
}

export type AdminAuthUserItem = {
  id: string;
  name: string;
  email: string;
  role: AppRole;
  isActive: boolean;
  mustChangePassword: boolean;
  forceLogoutAfter: string | null;
  lastLoginAt: string | null;
  emailVerifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export async function listAuthUsersForSuperAdmin(): Promise<AdminAuthUserItem[]> {
  await ensureAuthUsersTable();
  const rows = await runD1Query<AuthUserListRow>(
    `SELECT id, name, email, role, is_active, must_change_password, force_logout_after, last_login_at, email_verified_at, created_at, updated_at
     FROM auth_users
     ORDER BY created_at DESC`
  );

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    email: row.email,
    role: resolveUserRole(row.email, row.role),
    isActive: row.is_active === 1,
    mustChangePassword: row.must_change_password === 1,
    forceLogoutAfter: row.force_logout_after,
    lastLoginAt: row.last_login_at,
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
    `SELECT id, name, email, role, is_active, must_change_password, force_logout_after, last_login_at, email_verified_at, created_at, updated_at
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
    role: resolveUserRole(rows[0].email, rows[0].role),
    isActive: rows[0].is_active === 1,
    mustChangePassword: rows[0].must_change_password === 1,
    forceLogoutAfter: rows[0].force_logout_after,
    lastLoginAt: rows[0].last_login_at,
    emailVerifiedAt: rows[0].email_verified_at,
    createdAt: rows[0].created_at,
    updatedAt: rows[0].updated_at,
  };
}

export async function createAuthUserBySuperAdmin(params: {
  name: string;
  email: string;
  password: string;
  role: AppRole;
  isActive?: boolean;
}): Promise<DbAuthResult<AdminAuthUserItem>> {
  await ensureAuthUsersTable();

  const email = params.email.trim().toLowerCase();
  const name = params.name.trim();

  if (!name || !email || !params.password) {
    return { ok: false, message: "Nama, email, dan password wajib diisi." };
  }

  if (params.password.length < 8) {
    return { ok: false, message: "Password minimal 8 karakter." };
  }

  if (!isAppRole(params.role)) {
    return { ok: false, message: "Role tidak valid." };
  }

  const existing = await runD1Query<{ id: string }>(
    "SELECT id FROM auth_users WHERE email = ? LIMIT 1",
    [email]
  );
  if (existing.length > 0) {
    return { ok: false, message: "Email sudah dipakai user lain." };
  }

  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  const passwordHash = bcrypt.hashSync(params.password, 10);

  await runD1Query(
    "INSERT INTO auth_users (id, name, email, password_hash, role, is_active, must_change_password, force_logout_after, last_login_at, email_verified_at, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, 0, NULL, NULL, NULL, NULL, ?, ?)",
    [id, name, email, passwordHash, params.role, params.isActive === false ? 0 : 1, now, now]
  );

  const created = await getAuthUserForSuperAdminById(id);
  if (!created) {
    return { ok: false, message: "Gagal membuat user." };
  }

  return { ok: true, data: created };
}

export async function updateAuthUserByIdForSuperAdmin(
  userId: string,
  patch: {
    role?: AppRole;
    isActive?: boolean;
    mustChangePassword?: boolean;
    revokeSessionNow?: boolean;
  }
): Promise<DbAuthResult<AdminAuthUserItem>> {
  await ensureAuthUsersTable();
  const target = await getAuthUserForSuperAdminById(userId);
  if (!target) {
    return { ok: false, message: "User tidak ditemukan." };
  }

  const now = new Date().toISOString();
  const updates: string[] = [];
  const params: unknown[] = [];

  if (typeof patch.role !== "undefined") {
    if (!isAppRole(patch.role)) {
      return { ok: false, message: "Role tidak valid." };
    }
    updates.push("role = ?");
    params.push(patch.role);
  }

  if (typeof patch.isActive !== "undefined") {
    updates.push("is_active = ?");
    params.push(patch.isActive ? 1 : 0);
  }

  if (typeof patch.mustChangePassword !== "undefined") {
    updates.push("must_change_password = ?");
    params.push(patch.mustChangePassword ? 1 : 0);
  }

  if (patch.revokeSessionNow) {
    updates.push("force_logout_after = ?");
    params.push(now);
  }

  if (updates.length === 0) {
    return { ok: false, message: "Tidak ada perubahan yang dikirim." };
  }

  updates.push("updated_at = ?");
  params.push(now);
  params.push(userId);

  await runD1Query(`UPDATE auth_users SET ${updates.join(", ")} WHERE id = ?`, params);

  const updated = await getAuthUserForSuperAdminById(userId);
  if (!updated) {
    return { ok: false, message: "User tidak ditemukan." };
  }

  return { ok: true, data: updated };
}

export async function resetAuthUserPasswordByIdForSuperAdmin(params: {
  userId: string;
  newPassword: string;
  forceChangeOnNextLogin: boolean;
}): Promise<DbAuthResult<AdminAuthUserItem>> {
  await ensureAuthUsersTable();
  const target = await getAuthUserForSuperAdminById(params.userId);
  if (!target) {
    return { ok: false, message: "User tidak ditemukan." };
  }

  if (params.newPassword.length < 8) {
    return { ok: false, message: "Password baru minimal 8 karakter." };
  }

  const now = new Date().toISOString();
  const passwordHash = bcrypt.hashSync(params.newPassword, 10);

  await runD1Query(
    "UPDATE auth_users SET password_hash = ?, must_change_password = ?, force_logout_after = ?, updated_at = ? WHERE id = ?",
    [passwordHash, params.forceChangeOnNextLogin ? 1 : 0, now, now, params.userId]
  );

  const updated = await getAuthUserForSuperAdminById(params.userId);
  if (!updated) {
    return { ok: false, message: "User tidak ditemukan." };
  }

  return { ok: true, data: updated };
}
