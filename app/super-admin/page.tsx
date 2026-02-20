"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Trash2 } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

type UserItem = {
  id: string;
  name: string;
  email: string;
  role: "USER" | "ADMIN" | "TEMPLATE_ADMIN" | "SUPER_ADMIN";
  emailVerifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type UsersResponse = {
  ok: boolean;
  message?: string;
  users?: UserItem[];
};

function formatDate(value: string | null): string {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";
  return parsed.toLocaleString("id-ID");
}

export default function SuperAdminPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/super-admin/users", { cache: "no-store" });
      const payload = (await response.json()) as UsersResponse;
      if (!response.ok || !payload.ok) {
        setStatus(payload.message ?? "Gagal memuat user.");
        setUsers([]);
        return;
      }
      setUsers(payload.users ?? []);
      setStatus("");
    } catch {
      setStatus("Gagal memuat user.");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const stats = useMemo(() => {
    const total = users.length;
    const verified = users.filter((user) => Boolean(user.emailVerifiedAt)).length;
    const admins = users.filter(
      (user) =>
        user.role === "ADMIN" || user.role === "TEMPLATE_ADMIN" || user.role === "SUPER_ADMIN"
    ).length;
    return { total, verified, admins };
  }, [users]);

  const deleteUser = async (user: UserItem) => {
    const confirmed = window.confirm(
      `Hapus user ${user.email}? Tindakan ini tidak bisa dibatalkan.`
    );
    if (!confirmed) return;

    setDeletingUserId(user.id);
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
      setDeletingUserId(null);
    }
  };

  return (
    <main className="min-h-screen bg-muted/30 px-4 py-6 md:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col gap-3 rounded-xl border bg-background p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Tamplateku Super Admin</p>
            <h1 className="text-2xl font-semibold">Manajemen User & Sistem</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Kelola user terdaftar, audit role, dan tindakan sensitif tingkat platform.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href="/admin">Masuk Admin Page</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/admin-pengelola">Masuk Admin Pengelola</Link>
            </Button>
          </div>
        </header>

        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Total User</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">{stats.total}</CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Email Verified</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">{stats.verified}</CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Privileged Roles</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">{stats.admins}</CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Daftar User</CardTitle>
            <CardDescription>Hanya super admin yang bisa menghapus user.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {status ? (
              <>
                <p className="text-sm text-muted-foreground">{status}</p>
                <Separator />
              </>
            ) : null}

            {loading ? (
              <p className="text-sm text-muted-foreground">Memuat user...</p>
            ) : users.length === 0 ? (
              <p className="text-sm text-muted-foreground">Belum ada user.</p>
            ) : (
              <div className="space-y-3">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className="flex flex-col gap-3 rounded-md border p-3 md:flex-row md:items-center md:justify-between"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{user.name}</p>
                        <Badge variant="secondary">{user.role}</Badge>
                        <Badge variant={user.emailVerifiedAt ? "default" : "outline"}>
                          {user.emailVerifiedAt ? "Verified" : "Unverified"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                      <p className="text-xs text-muted-foreground">
                        Dibuat: {formatDate(user.createdAt)} | Update: {formatDate(user.updatedAt)}
                      </p>
                    </div>
                    <div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => void deleteUser(user)}
                        disabled={deletingUserId === user.id || user.role === "SUPER_ADMIN"}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        {deletingUserId === user.id ? "Menghapus..." : "Hapus User"}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Rekomendasi Scope Super Admin</CardTitle>
            <CardDescription>Ini yang ideal ditambahkan bertahap.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>1. User lifecycle: suspend, reactivate, hard delete, reset password paksa.</p>
            <p>2. Role governance: ubah role user, audit log perubahan role, approval flow.</p>
            <p>3. Security center: login attempts, lockout events, OTP abuse monitoring.</p>
            <p>4. System settings: env status checker, email provider health, D1 health check.</p>
            <p>5. Backup & restore: snapshot konten/template + rollback cepat.</p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
