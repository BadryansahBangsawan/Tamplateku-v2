"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, KeyRound, RefreshCcw, Save, ShieldAlert, Trash2, UserPlus } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

type AppRole = "USER" | "ADMIN" | "TEMPLATE_ADMIN" | "SUPER_ADMIN";

type UserItem = {
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

type RoleAccessPolicy = Record<AppRole, {
  adminPage: boolean;
  templateManagerPage: boolean;
  superAdminPage: boolean;
}>;

type SystemConfig = {
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

type BackupItem = {
  id: string;
  snapshotType: string;
  createdBy: string;
  createdAt: string;
};

type LoginLogItem = {
  id: string;
  email: string;
  success: boolean;
  reason: string | null;
  requestIp: string;
  userAgent: string;
  createdAt: string;
};

type AuditLogItem = {
  id: string;
  actorEmail: string;
  action: string;
  targetType: string;
  targetId: string | null;
  severity: string;
  createdAt: string;
};

type SuspiciousItem = {
  email: string;
  failedAttempts: number;
  firstAttemptAt: string;
  lastAttemptAt: string;
};

const DEFAULT_CONFIG: SystemConfig = {
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
  roleAccess: {
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
  },
};

function formatDate(value: string | null): string {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";
  return parsed.toLocaleString("id-ID");
}

function roleLabel(role: AppRole): string {
  if (role === "SUPER_ADMIN") return "Superadmin";
  if (role === "ADMIN") return "Admin Utama";
  if (role === "TEMPLATE_ADMIN") return "Admin Pengelola";
  return "User";
}

export default function SuperAdminPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");

  const [config, setConfig] = useState<SystemConfig>(DEFAULT_CONFIG);
  const [loadingConfig, setLoadingConfig] = useState(true);

  const [loginLogs, setLoginLogs] = useState<LoginLogItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [suspicious, setSuspicious] = useState<SuspiciousItem[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(true);

  const [backups, setBackups] = useState<BackupItem[]>([]);
  const [contentJson, setContentJson] = useState("");
  const [templatesJson, setTemplatesJson] = useState("");
  const [loadingData, setLoadingData] = useState(true);
  const [selectedBackupId, setSelectedBackupId] = useState("");

  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    password: "",
    role: "USER" as AppRole,
    isActive: true,
  });

  const [resetPasswordByUserId, setResetPasswordByUserId] = useState<Record<string, string>>({});

  const loadUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const response = await fetch("/api/super-admin/users", { cache: "no-store" });
      const payload = (await response.json()) as {
        ok: boolean;
        message?: string;
        users?: UserItem[];
      };

      if (!response.ok || !payload.ok) {
        setStatus(payload.message ?? "Gagal memuat user.");
        setUsers([]);
        return;
      }

      setUsers(payload.users ?? []);
    } catch {
      setStatus("Gagal memuat user.");
      setUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  const loadConfig = useCallback(async () => {
    setLoadingConfig(true);
    try {
      const response = await fetch("/api/super-admin/settings", { cache: "no-store" });
      const payload = (await response.json()) as {
        ok: boolean;
        message?: string;
        config?: SystemConfig;
      };

      if (!response.ok || !payload.ok || !payload.config) {
        setStatus(payload.message ?? "Gagal memuat pengaturan sistem.");
        setConfig(DEFAULT_CONFIG);
        return;
      }

      setConfig(payload.config);
    } catch {
      setStatus("Gagal memuat pengaturan sistem.");
      setConfig(DEFAULT_CONFIG);
    } finally {
      setLoadingConfig(false);
    }
  }, []);

  const loadLogs = useCallback(async () => {
    setLoadingLogs(true);
    try {
      const response = await fetch("/api/super-admin/logs?limit=100", { cache: "no-store" });
      const payload = (await response.json()) as {
        ok: boolean;
        message?: string;
        loginLogs?: LoginLogItem[];
        auditLogs?: AuditLogItem[];
        suspicious?: SuspiciousItem[];
      };

      if (!response.ok || !payload.ok) {
        setStatus(payload.message ?? "Gagal memuat log aktivitas.");
        setLoginLogs([]);
        setAuditLogs([]);
        setSuspicious([]);
        return;
      }

      setLoginLogs(payload.loginLogs ?? []);
      setAuditLogs(payload.auditLogs ?? []);
      setSuspicious(payload.suspicious ?? []);
    } catch {
      setStatus("Gagal memuat log aktivitas.");
      setLoginLogs([]);
      setAuditLogs([]);
      setSuspicious([]);
    } finally {
      setLoadingLogs(false);
    }
  }, []);

  const loadDataControl = useCallback(async () => {
    setLoadingData(true);
    try {
      const response = await fetch("/api/super-admin/data", { cache: "no-store" });
      const payload = (await response.json()) as {
        ok: boolean;
        message?: string;
        content?: Record<string, unknown>;
        templates?: Array<Record<string, unknown>>;
        backups?: BackupItem[];
      };

      if (!response.ok || !payload.ok) {
        setStatus(payload.message ?? "Gagal memuat data website.");
        setContentJson("");
        setTemplatesJson("");
        setBackups([]);
        return;
      }

      setContentJson(JSON.stringify(payload.content ?? {}, null, 2));
      setTemplatesJson(JSON.stringify(payload.templates ?? [], null, 2));
      setBackups(payload.backups ?? []);
      if (payload.backups?.[0]?.id) {
        setSelectedBackupId((prev) => prev || payload.backups?.[0]?.id || "");
      }
    } catch {
      setStatus("Gagal memuat data website.");
      setContentJson("");
      setTemplatesJson("");
      setBackups([]);
    } finally {
      setLoadingData(false);
    }
  }, []);

  const reloadAll = useCallback(async () => {
    setStatus("");
    await Promise.all([loadUsers(), loadConfig(), loadLogs(), loadDataControl()]);
  }, [loadUsers, loadConfig, loadLogs, loadDataControl]);

  useEffect(() => {
    void reloadAll();
  }, [reloadAll]);

  const stats = useMemo(() => {
    const total = users.length;
    const active = users.filter((user) => user.isActive).length;
    const verified = users.filter((user) => Boolean(user.emailVerifiedAt)).length;
    const adminCount = users.filter((user) => user.role !== "USER").length;
    return {
      total,
      active,
      verified,
      adminCount,
    };
  }, [users]);

  const createUser = async () => {
    if (!newUser.name || !newUser.email || !newUser.password) {
      setStatus("Nama, email, dan password user baru wajib diisi.");
      return;
    }

    setSaving(true);
    setStatus("");

    try {
      const response = await fetch("/api/super-admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUser),
      });
      const payload = (await response.json()) as {
        ok: boolean;
        message?: string;
        user?: UserItem;
      };

      if (!response.ok || !payload.ok || !payload.user) {
        setStatus(payload.message ?? "Gagal membuat user baru.");
        return;
      }

      setUsers((prev) => [payload.user as UserItem, ...prev]);
      setStatus(`User ${payload.user.email} berhasil dibuat.`);
      setNewUser({ name: "", email: "", password: "", role: "USER", isActive: true });
    } catch {
      setStatus("Gagal membuat user baru.");
    } finally {
      setSaving(false);
    }
  };

  const updateUser = async (
    user: UserItem,
    patch: {
      role?: AppRole;
      isActive?: boolean;
      mustChangePassword?: boolean;
      revokeSessionNow?: boolean;
    },
    successMessage: string
  ) => {
    setSaving(true);
    setStatus("");

    try {
      const response = await fetch(`/api/super-admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const payload = (await response.json()) as {
        ok: boolean;
        message?: string;
        user?: UserItem;
      };

      if (!response.ok || !payload.ok || !payload.user) {
        setStatus(payload.message ?? "Gagal memperbarui user.");
        return;
      }

      setUsers((prev) => prev.map((item) => (item.id === payload.user?.id ? payload.user : item)));
      setStatus(successMessage);
    } catch {
      setStatus("Gagal memperbarui user.");
    } finally {
      setSaving(false);
    }
  };

  const resetUserPassword = async (user: UserItem) => {
    const newPassword = (resetPasswordByUserId[user.id] ?? "").trim();
    if (newPassword.length < 8) {
      setStatus("Password baru minimal 8 karakter.");
      return;
    }

    setSaving(true);
    setStatus("");

    try {
      const response = await fetch(`/api/super-admin/users/${user.id}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newPassword,
          forceChangeOnNextLogin: Boolean(user.mustChangePassword),
        }),
      });
      const payload = (await response.json()) as {
        ok: boolean;
        message?: string;
        user?: UserItem;
      };

      if (!response.ok || !payload.ok || !payload.user) {
        setStatus(payload.message ?? "Gagal reset password user.");
        return;
      }

      setUsers((prev) => prev.map((item) => (item.id === payload.user?.id ? payload.user : item)));
      setResetPasswordByUserId((prev) => ({ ...prev, [user.id]: "" }));
      setStatus(`Password ${user.email} berhasil direset.`);
    } catch {
      setStatus("Gagal reset password user.");
    } finally {
      setSaving(false);
    }
  };

  const deleteUser = async (user: UserItem) => {
    const confirmed = window.confirm(`Hapus user ${user.email}? Tindakan ini tidak bisa dibatalkan.`);
    if (!confirmed) return;

    setSaving(true);
    setStatus("");

    try {
      const response = await fetch(`/api/super-admin/users/${user.id}`, { method: "DELETE" });
      const payload = (await response.json()) as { ok: boolean; message?: string };

      if (!response.ok || !payload.ok) {
        setStatus(payload.message ?? "Gagal menghapus user.");
        return;
      }

      setUsers((prev) => prev.filter((item) => item.id !== user.id));
      setStatus(`User ${user.email} berhasil dihapus.`);
    } catch {
      setStatus("Gagal menghapus user.");
    } finally {
      setSaving(false);
    }
  };

  const saveSystemConfig = async () => {
    setSaving(true);
    setStatus("");

    try {
      const response = await fetch("/api/super-admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config }),
      });
      const payload = (await response.json()) as {
        ok: boolean;
        message?: string;
        config?: SystemConfig;
      };

      if (!response.ok || !payload.ok || !payload.config) {
        setStatus(payload.message ?? "Gagal menyimpan pengaturan sistem.");
        return;
      }

      setConfig(payload.config);
      setStatus("Pengaturan sistem berhasil disimpan.");
    } catch {
      setStatus("Gagal menyimpan pengaturan sistem.");
    } finally {
      setSaving(false);
    }
  };

  const createBackup = async () => {
    setSaving(true);
    setStatus("");

    try {
      const response = await fetch("/api/super-admin/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create_backup", snapshotType: "manual_super_admin" }),
      });
      const payload = (await response.json()) as {
        ok: boolean;
        message?: string;
      };

      if (!response.ok || !payload.ok) {
        setStatus(payload.message ?? "Gagal membuat cadangan data.");
        return;
      }

      await loadDataControl();
      setStatus("Cadangan data berhasil dibuat.");
    } catch {
      setStatus("Gagal membuat cadangan data.");
    } finally {
      setSaving(false);
    }
  };

  const restoreBackup = async () => {
    if (!selectedBackupId) {
      setStatus("Pilih backup terlebih dahulu.");
      return;
    }

    const confirmed = window.confirm("Restore backup akan menimpa data saat ini. Lanjutkan?");
    if (!confirmed) return;

    setSaving(true);
    setStatus("");

    try {
      const response = await fetch("/api/super-admin/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "restore_backup", backupId: selectedBackupId }),
      });
      const payload = (await response.json()) as { ok: boolean; message?: string };

      if (!response.ok || !payload.ok) {
        setStatus(payload.message ?? "Gagal restore backup.");
        return;
      }

      await loadDataControl();
      setStatus("Backup berhasil direstore.");
    } catch {
      setStatus("Gagal restore backup.");
    } finally {
      setSaving(false);
    }
  };

  const saveContentJson = async () => {
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(contentJson) as Record<string, unknown>;
    } catch {
      setStatus("Format JSON konten tidak valid.");
      return;
    }

    setSaving(true);
    setStatus("");

    try {
      const response = await fetch("/api/super-admin/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "replace_content", content: parsed }),
      });
      const payload = (await response.json()) as { ok: boolean; message?: string; content?: unknown };

      if (!response.ok || !payload.ok) {
        setStatus(payload.message ?? "Gagal menyimpan data konten.");
        return;
      }

      setContentJson(JSON.stringify(payload.content ?? parsed, null, 2));
      setStatus("Data konten berhasil disimpan.");
    } catch {
      setStatus("Gagal menyimpan data konten.");
    } finally {
      setSaving(false);
    }
  };

  const saveTemplatesJson = async () => {
    let parsed: Array<Record<string, unknown>>;
    try {
      const raw = JSON.parse(templatesJson) as unknown;
      parsed = Array.isArray(raw) ? (raw as Array<Record<string, unknown>>) : [];
    } catch {
      setStatus("Format JSON template tidak valid.");
      return;
    }

    setSaving(true);
    setStatus("");

    try {
      const response = await fetch("/api/super-admin/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "replace_templates", templates: parsed }),
      });
      const payload = (await response.json()) as { ok: boolean; message?: string; templates?: unknown };

      if (!response.ok || !payload.ok) {
        setStatus(payload.message ?? "Gagal menyimpan data template.");
        return;
      }

      setTemplatesJson(JSON.stringify(payload.templates ?? parsed, null, 2));
      setStatus("Data template berhasil disimpan.");
    } catch {
      setStatus("Gagal menyimpan data template.");
    } finally {
      setSaving(false);
    }
  };

  const deleteAllTemplates = async () => {
    const confirmed = window.confirm("Semua template akan dihapus. Yakin lanjut?");
    if (!confirmed) return;

    setSaving(true);
    setStatus("");

    try {
      const response = await fetch("/api/super-admin/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete_templates" }),
      });
      const payload = (await response.json()) as { ok: boolean; message?: string };

      if (!response.ok || !payload.ok) {
        setStatus(payload.message ?? "Gagal menghapus semua template.");
        return;
      }

      setTemplatesJson("[]");
      setStatus("Semua template berhasil dihapus.");
    } catch {
      setStatus("Gagal menghapus semua template.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-muted/30 px-4 py-6 md:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col gap-3 rounded-xl border bg-background p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Tamplateku Superadmin</p>
            <h1 className="text-2xl font-semibold">Pusat Kendali Superadmin</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Kelola user, hak akses, data website, keamanan, log aktivitas, dan integrasi.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" asChild>
              <Link href="/admin">Buka Admin Utama</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/admin-pengelola">Buka Admin Pengelola</Link>
            </Button>
            <Button variant="outline" onClick={() => void reloadAll()} disabled={saving}>
              <RefreshCcw className="mr-2 h-4 w-4" />
              Muat Ulang Data
            </Button>
          </div>
        </header>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Total User</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">{stats.total}</CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Akun Aktif</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">{stats.active}</CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Email Terverifikasi</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">{stats.verified}</CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Akun Admin</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">{stats.adminCount}</CardContent>
          </Card>
        </div>

        {status ? (
          <Card>
            <CardContent className="py-3">
              <p className="text-sm text-muted-foreground">{status}</p>
            </CardContent>
          </Card>
        ) : null}

        <Tabs defaultValue="users" className="space-y-4">
          <TabsList className="flex h-auto w-full flex-wrap justify-start gap-2 bg-transparent p-0">
            <TabsTrigger value="users">1. Manajemen User</TabsTrigger>
            <TabsTrigger value="roles">2. Role & Hak Akses</TabsTrigger>
            <TabsTrigger value="data">3. Kontrol Data</TabsTrigger>
            <TabsTrigger value="logs">4. Log & Aktivitas</TabsTrigger>
            <TabsTrigger value="system">5. Pengaturan Sistem</TabsTrigger>
            <TabsTrigger value="security">6. Keamanan Dasar</TabsTrigger>
            <TabsTrigger value="integration">7. Integrasi</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Tambah User Baru</CardTitle>
                <CardDescription>Buat akun user baru langsung dari panel superadmin.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-5">
                <Input
                  placeholder="Nama user"
                  value={newUser.name}
                  onChange={(e) => setNewUser((prev) => ({ ...prev, name: e.target.value }))}
                />
                <Input
                  type="email"
                  placeholder="Email user"
                  value={newUser.email}
                  onChange={(e) => setNewUser((prev) => ({ ...prev, email: e.target.value }))}
                />
                <Input
                  type="password"
                  placeholder="Password awal"
                  value={newUser.password}
                  onChange={(e) => setNewUser((prev) => ({ ...prev, password: e.target.value }))}
                />
                <select
                  className="h-10 rounded-md border bg-background px-3 text-sm"
                  value={newUser.role}
                  onChange={(e) =>
                    setNewUser((prev) => ({
                      ...prev,
                      role: e.target.value as AppRole,
                    }))
                  }
                >
                  <option value="USER">User</option>
                  <option value="ADMIN">Admin Utama</option>
                  <option value="TEMPLATE_ADMIN">Admin Pengelola</option>
                  <option value="SUPER_ADMIN">Superadmin</option>
                </select>
                <div className="flex items-center justify-between gap-2 rounded-md border px-3">
                  <label className="text-sm">Akun Aktif</label>
                  <input
                    type="checkbox"
                    checked={newUser.isActive}
                    onChange={(e) =>
                      setNewUser((prev) => ({
                        ...prev,
                        isActive: e.target.checked,
                      }))
                    }
                  />
                </div>
                <div className="md:col-span-5">
                  <Button onClick={() => void createUser()} disabled={saving}>
                    <UserPlus className="mr-2 h-4 w-4" /> Tambah User
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Daftar User</CardTitle>
                <CardDescription>
                  Kelola user: ubah role, aktif/nonaktif akun, reset password, dan blokir sesi.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {loadingUsers ? (
                  <p className="text-sm text-muted-foreground">Memuat daftar user...</p>
                ) : users.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Belum ada user.</p>
                ) : (
                  users.map((user) => (
                    <div key={user.id} className="space-y-3 rounded-md border p-3">
                      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{user.name}</p>
                            <Badge variant="secondary">{roleLabel(user.role)}</Badge>
                            <Badge variant={user.isActive ? "default" : "destructive"}>
                              {user.isActive ? "Aktif" : "Nonaktif"}
                            </Badge>
                            <Badge variant={user.emailVerifiedAt ? "default" : "outline"}>
                              {user.emailVerifiedAt ? "Terverifikasi" : "Belum Verifikasi"}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                          <p className="text-xs text-muted-foreground">
                            Login terakhir: {formatDate(user.lastLoginAt)} | Dibuat: {formatDate(user.createdAt)}
                          </p>
                        </div>
                      </div>

                      <div className="grid gap-2 md:grid-cols-4">
                        <select
                          className="h-10 rounded-md border bg-background px-3 text-sm"
                          value={user.role}
                          onChange={(e) =>
                            void updateUser(
                              user,
                              { role: e.target.value as AppRole },
                              `Role ${user.email} berhasil diperbarui.`
                            )
                          }
                          disabled={saving}
                        >
                          <option value="USER">User</option>
                          <option value="ADMIN">Admin Utama</option>
                          <option value="TEMPLATE_ADMIN">Admin Pengelola</option>
                          <option value="SUPER_ADMIN">Superadmin</option>
                        </select>

                        <Button
                          variant={user.isActive ? "outline" : "default"}
                          onClick={() =>
                            void updateUser(
                              user,
                              { isActive: !user.isActive },
                              user.isActive
                                ? `Akun ${user.email} dinonaktifkan.`
                                : `Akun ${user.email} diaktifkan.`
                            )
                          }
                          disabled={saving}
                        >
                          {user.isActive ? "Nonaktifkan Akun" : "Aktifkan Akun"}
                        </Button>

                        <Button
                          variant="outline"
                          onClick={() =>
                            void updateUser(
                              user,
                              { revokeSessionNow: true },
                              `Sesi login ${user.email} berhasil diblokir.`
                            )
                          }
                          disabled={saving}
                        >
                          Blokir Sesi Login
                        </Button>

                        <Button
                          variant={user.mustChangePassword ? "default" : "outline"}
                          onClick={() =>
                            void updateUser(
                              user,
                              { mustChangePassword: !user.mustChangePassword },
                              user.mustChangePassword
                                ? `Paksa ganti password ${user.email} dimatikan.`
                                : `Paksa ganti password ${user.email} diaktifkan.`
                            )
                          }
                          disabled={saving}
                        >
                          {user.mustChangePassword ? "Wajib Ganti: ON" : "Wajib Ganti: OFF"}
                        </Button>
                      </div>

                      <div className="grid gap-2 md:grid-cols-[1fr_auto_auto]">
                        <Input
                          type="password"
                          placeholder="Password baru (minimal 8 karakter)"
                          value={resetPasswordByUserId[user.id] ?? ""}
                          onChange={(e) =>
                            setResetPasswordByUserId((prev) => ({
                              ...prev,
                              [user.id]: e.target.value,
                            }))
                          }
                        />
                        <Button onClick={() => void resetUserPassword(user)} disabled={saving}>
                          <KeyRound className="mr-2 h-4 w-4" /> Reset Password
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => void deleteUser(user)}
                          disabled={saving || user.role === "SUPER_ADMIN"}
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Hapus User
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="roles" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Role & Hak Akses Menu</CardTitle>
                <CardDescription>
                  Atur hak akses tiap role untuk masuk ke menu admin utama, admin pengelola, dan superadmin.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {loadingConfig ? (
                  <p className="text-sm text-muted-foreground">Memuat role akses...</p>
                ) : (
                  <div className="space-y-3">
                    {(["USER", "ADMIN", "TEMPLATE_ADMIN", "SUPER_ADMIN"] as AppRole[]).map((role) => (
                      <div key={role} className="grid items-center gap-3 rounded-md border p-3 md:grid-cols-4">
                        <p className="text-sm font-medium">{roleLabel(role)}</p>
                        <label className="inline-flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={config.roleAccess[role].adminPage}
                            disabled={role === "SUPER_ADMIN"}
                            onChange={(e) =>
                              setConfig((prev) => ({
                                ...prev,
                                roleAccess: {
                                  ...prev.roleAccess,
                                  [role]: {
                                    ...prev.roleAccess[role],
                                    adminPage: e.target.checked,
                                  },
                                },
                              }))
                            }
                          />
                          Admin Utama
                        </label>
                        <label className="inline-flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={config.roleAccess[role].templateManagerPage}
                            disabled={role === "SUPER_ADMIN"}
                            onChange={(e) =>
                              setConfig((prev) => ({
                                ...prev,
                                roleAccess: {
                                  ...prev.roleAccess,
                                  [role]: {
                                    ...prev.roleAccess[role],
                                    templateManagerPage: e.target.checked,
                                  },
                                },
                              }))
                            }
                          />
                          Admin Pengelola
                        </label>
                        <label className="inline-flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={config.roleAccess[role].superAdminPage}
                            disabled={true}
                            onChange={() => {}}
                          />
                          Superadmin
                        </label>
                      </div>
                    ))}
                  </div>
                )}

                <Button onClick={() => void saveSystemConfig()} disabled={saving || loadingConfig}>
                  <Save className="mr-2 h-4 w-4" /> Simpan Hak Akses
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="data" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Kontrol Data Website</CardTitle>
                <CardDescription>
                  Lihat semua data, ubah data JSON, hapus data template, dan restore dari backup.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" onClick={() => void createBackup()} disabled={saving || loadingData}>
                    Buat Backup Data
                  </Button>
                  <Button variant="outline" onClick={() => void restoreBackup()} disabled={saving || loadingData}>
                    Restore Backup
                  </Button>
                  <Button variant="destructive" onClick={() => void deleteAllTemplates()} disabled={saving || loadingData}>
                    Hapus Semua Template
                  </Button>
                </div>

                <div className="grid gap-3 md:grid-cols-[1fr_auto]">
                  <select
                    className="h-10 rounded-md border bg-background px-3 text-sm"
                    value={selectedBackupId}
                    onChange={(e) => setSelectedBackupId(e.target.value)}
                  >
                    <option value="">Pilih backup untuk restore</option>
                    {backups.map((backup) => (
                      <option key={backup.id} value={backup.id}>
                        {backup.snapshotType} - {formatDate(backup.createdAt)}
                      </option>
                    ))}
                  </select>
                  <Button variant="outline" onClick={() => void loadDataControl()} disabled={loadingData}>
                    Muat Ulang Backup
                  </Button>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label>Data Konten Website (JSON)</Label>
                  <Textarea
                    rows={14}
                    value={contentJson}
                    onChange={(e) => setContentJson(e.target.value)}
                    placeholder="Data konten website (JSON)"
                  />
                  <Button onClick={() => void saveContentJson()} disabled={saving || loadingData}>
                    Simpan Data Konten
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label>Data Template Website (JSON Array)</Label>
                  <Textarea
                    rows={16}
                    value={templatesJson}
                    onChange={(e) => setTemplatesJson(e.target.value)}
                    placeholder="Data template (JSON array)"
                  />
                  <Button onClick={() => void saveTemplatesJson()} disabled={saving || loadingData}>
                    Simpan Data Template
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="logs" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Deteksi Aktivitas Mencurigakan</CardTitle>
                <CardDescription>
                  Menampilkan email dengan banyak percobaan login gagal dalam 24 jam terakhir.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {loadingLogs ? (
                  <p className="text-sm text-muted-foreground">Memuat aktivitas mencurigakan...</p>
                ) : suspicious.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Tidak ada aktivitas mencurigakan.</p>
                ) : (
                  suspicious.map((item) => (
                    <div key={item.email} className="rounded-md border p-3">
                      <p className="font-medium text-foreground">{item.email}</p>
                      <p className="text-sm text-muted-foreground">
                        Gagal login: {item.failedAttempts} kali | Pertama: {formatDate(item.firstAttemptAt)} | Terakhir: {formatDate(item.lastAttemptAt)}
                      </p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Riwayat Login User</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {loadingLogs ? (
                  <p className="text-sm text-muted-foreground">Memuat riwayat login...</p>
                ) : loginLogs.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Belum ada log login.</p>
                ) : (
                  loginLogs.slice(0, 50).map((log) => (
                    <div key={log.id} className="rounded-md border p-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={log.success ? "default" : "destructive"}>
                          {log.success ? "Berhasil" : "Gagal"}
                        </Badge>
                        <p className="text-sm font-medium">{log.email}</p>
                        <p className="text-xs text-muted-foreground">IP: {log.requestIp}</p>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatDate(log.createdAt)} | Alasan: {log.reason ?? "-"}
                      </p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Catatan Perubahan Data</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {loadingLogs ? (
                  <p className="text-sm text-muted-foreground">Memuat catatan perubahan...</p>
                ) : auditLogs.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Belum ada catatan perubahan.</p>
                ) : (
                  auditLogs.slice(0, 50).map((log) => (
                    <div key={log.id} className="rounded-md border p-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge
                          variant={
                            log.severity === "CRITICAL"
                              ? "destructive"
                              : log.severity === "WARN"
                                ? "default"
                                : "secondary"
                          }
                        >
                          {log.severity}
                        </Badge>
                        <p className="text-sm font-medium">{log.action}</p>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Oleh {log.actorEmail} | Target: {log.targetType}
                        {log.targetId ? ` (${log.targetId})` : ""} | {formatDate(log.createdAt)}
                      </p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="system" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Konfigurasi Aplikasi</CardTitle>
                <CardDescription>Atur nama aplikasi, logo, dan mode maintenance.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Nama Aplikasi</Label>
                    <Input
                      value={config.appName}
                      onChange={(e) => setConfig((prev) => ({ ...prev, appName: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>URL Logo Aplikasi</Label>
                    <Input
                      value={config.appLogoUrl}
                      onChange={(e) => setConfig((prev) => ({ ...prev, appLogoUrl: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                  <label className="inline-flex items-center gap-2 rounded-md border p-3 text-sm">
                    <input
                      type="checkbox"
                      checked={config.maintenanceMode}
                      onChange={(e) =>
                        setConfig((prev) => ({ ...prev, maintenanceMode: e.target.checked }))
                      }
                    />
                    Maintenance Mode
                  </label>
                  <label className="inline-flex items-center gap-2 rounded-md border p-3 text-sm">
                    <input
                      type="checkbox"
                      checked={config.features.browseTemplateEnabled}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          features: {
                            ...prev.features,
                            browseTemplateEnabled: e.target.checked,
                          },
                        }))
                      }
                    />
                    Fitur Browse Template Aktif
                  </label>
                  <label className="inline-flex items-center gap-2 rounded-md border p-3 text-sm">
                    <input
                      type="checkbox"
                      checked={config.features.blogEnabled}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          features: {
                            ...prev.features,
                            blogEnabled: e.target.checked,
                          },
                        }))
                      }
                    />
                    Fitur Blog Aktif
                  </label>
                </div>

                <Button onClick={() => void saveSystemConfig()} disabled={saving || loadingConfig}>
                  <Save className="mr-2 h-4 w-4" /> Simpan Pengaturan Sistem
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Keamanan Dasar</CardTitle>
                <CardDescription>
                  Blokir user/session, paksa ganti password, dan kontrol akses login.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-md border p-3">
                  <p className="text-sm font-medium">Kontrol Akses Login</p>
                  <div className="mt-2 grid gap-3 md:grid-cols-2">
                    <label className="inline-flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={config.loginAccess.formLoginEnabled}
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            loginAccess: {
                              ...prev.loginAccess,
                              formLoginEnabled: e.target.checked,
                            },
                          }))
                        }
                      />
                      Login dengan Email/Password
                    </label>
                    <label className="inline-flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={config.loginAccess.googleLoginEnabled}
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            loginAccess: {
                              ...prev.loginAccess,
                              googleLoginEnabled: e.target.checked,
                            },
                          }))
                        }
                      />
                      Login dengan Google
                    </label>
                  </div>
                </div>

                <div className="rounded-md border p-3">
                  <p className="text-sm font-medium">Aksi Keamanan User</p>
                  <p className="text-xs text-muted-foreground">
                    Aksi keamanan per user dilakukan di tab Manajemen User: Nonaktifkan akun, Blokir sesi login,
                    dan Wajib ganti password.
                  </p>
                </div>

                <Button onClick={() => void saveSystemConfig()} disabled={saving || loadingConfig}>
                  <ShieldAlert className="mr-2 h-4 w-4" /> Simpan Pengaturan Keamanan
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="integration" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Integrasi & API Key</CardTitle>
                <CardDescription>Kelola status integrasi dan catatan API key internal.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 md:grid-cols-3">
                  <label className="inline-flex items-center gap-2 rounded-md border p-3 text-sm">
                    <input
                      type="checkbox"
                      checked={config.integrations.resendEnabled}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          integrations: {
                            ...prev.integrations,
                            resendEnabled: e.target.checked,
                          },
                        }))
                      }
                    />
                    Integrasi Email (Resend)
                  </label>
                  <label className="inline-flex items-center gap-2 rounded-md border p-3 text-sm">
                    <input
                      type="checkbox"
                      checked={config.integrations.googleOauthEnabled}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          integrations: {
                            ...prev.integrations,
                            googleOauthEnabled: e.target.checked,
                          },
                        }))
                      }
                    />
                    Integrasi Google OAuth
                  </label>
                  <label className="inline-flex items-center gap-2 rounded-md border p-3 text-sm">
                    <input
                      type="checkbox"
                      checked={config.integrations.publicApiEnabled}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          integrations: {
                            ...prev.integrations,
                            publicApiEnabled: e.target.checked,
                          },
                        }))
                      }
                    />
                    Integrasi Public API
                  </label>
                </div>

                <div className="space-y-2">
                  <Label>Catatan API Key (Hint Internal)</Label>
                  <Input
                    placeholder="Contoh: key publik terakhir dirotasi 2026-02-20"
                    value={config.integrations.publicApiKeyHint}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        integrations: {
                          ...prev.integrations,
                          publicApiKeyHint: e.target.value,
                        },
                      }))
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Catatan ini hanya untuk referensi internal panel, bukan untuk menyimpan secret sensitif.
                  </p>
                </div>

                <Button onClick={() => void saveSystemConfig()} disabled={saving || loadingConfig}>
                  <Save className="mr-2 h-4 w-4" /> Simpan Pengaturan Integrasi
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Info Keamanan Integrasi</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>
                  <AlertTriangle className="mr-1 inline h-4 w-4 text-amber-500" /> Secret produksi tetap
                  harus disimpan di Environment Variables server, bukan di database panel.
                </p>
                <p>
                  Gunakan tab ini untuk aktif/nonaktif integrasi dan mencatat status operasional integrasi.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
