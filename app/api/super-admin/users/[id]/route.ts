import { getRoleFromUser } from "@/lib/adminAccess";
import {
  deleteAuthUserById,
  getAuthUserForSuperAdminById,
  updateAuthUserByIdForSuperAdmin,
} from "@/lib/authDb";
import { getRequestAuthUser } from "@/lib/authRequest";
import { createAuditLog } from "@/lib/superAdminDb";
import { NextResponse } from "next/server";

export const runtime = "edge";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function isRole(value: unknown): value is "USER" | "ADMIN" | "TEMPLATE_ADMIN" | "SUPER_ADMIN" {
  return (
    value === "USER" ||
    value === "ADMIN" ||
    value === "TEMPLATE_ADMIN" ||
    value === "SUPER_ADMIN"
  );
}

function forbidden() {
  return NextResponse.json({ ok: false, message: "Forbidden" }, { status: 403 });
}

export async function PATCH(request: Request, context: RouteContext) {
  const actor = await getRequestAuthUser();
  if (!actor) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  if (getRoleFromUser(actor) !== "SUPER_ADMIN") {
    return forbidden();
  }

  const params = await context.params;
  const userId = params.id?.trim();
  if (!userId) {
    return NextResponse.json({ ok: false, message: "User ID tidak valid." }, { status: 400 });
  }

  try {
    const target = await getAuthUserForSuperAdminById(userId);
    if (!target) {
      return NextResponse.json({ ok: false, message: "User tidak ditemukan." }, { status: 404 });
    }

    const body = (await request.json()) as {
      role?: unknown;
      isActive?: unknown;
      mustChangePassword?: unknown;
      revokeSessionNow?: unknown;
    };

    const patch: {
      role?: "USER" | "ADMIN" | "TEMPLATE_ADMIN" | "SUPER_ADMIN";
      isActive?: boolean;
      mustChangePassword?: boolean;
      revokeSessionNow?: boolean;
    } = {};

    if (typeof body.role !== "undefined") {
      if (!isRole(body.role)) {
        return NextResponse.json({ ok: false, message: "Role tidak valid." }, { status: 400 });
      }
      patch.role = body.role;
    }

    if (typeof body.isActive !== "undefined") {
      if (typeof body.isActive !== "boolean") {
        return NextResponse.json(
          { ok: false, message: "Nilai aktif/nonaktif tidak valid." },
          { status: 400 }
        );
      }
      patch.isActive = body.isActive;
    }

    if (typeof body.mustChangePassword !== "undefined") {
      if (typeof body.mustChangePassword !== "boolean") {
        return NextResponse.json(
          { ok: false, message: "Nilai paksa ganti password tidak valid." },
          { status: 400 }
        );
      }
      patch.mustChangePassword = body.mustChangePassword;
    }

    if (typeof body.revokeSessionNow !== "undefined") {
      if (typeof body.revokeSessionNow !== "boolean") {
        return NextResponse.json(
          { ok: false, message: "Nilai blokir sesi tidak valid." },
          { status: 400 }
        );
      }
      patch.revokeSessionNow = body.revokeSessionNow;
    }

    if (target.email.toLowerCase() === actor.email.toLowerCase()) {
      if (patch.role && patch.role !== "SUPER_ADMIN") {
        return NextResponse.json(
          { ok: false, message: "Super admin tidak boleh menurunkan role akun sendiri." },
          { status: 400 }
        );
      }
      if (patch.isActive === false) {
        return NextResponse.json(
          { ok: false, message: "Super admin tidak boleh menonaktifkan akun sendiri." },
          { status: 400 }
        );
      }
    }

    const result = await updateAuthUserByIdForSuperAdmin(userId, patch);
    if (!result.ok || !result.data) {
      return NextResponse.json(
        { ok: false, message: result.message ?? "Gagal memperbarui user." },
        { status: 400 }
      );
    }

    void createAuditLog({
      actorEmail: actor.email,
      action: "USER_UPDATE",
      targetType: "auth_user",
      targetId: userId,
      detail: {
        role: patch.role,
        isActive: patch.isActive,
        mustChangePassword: patch.mustChangePassword,
        revokeSessionNow: patch.revokeSessionNow,
      },
      severity: patch.revokeSessionNow ? "WARN" : "INFO",
    });

    return NextResponse.json({ ok: true, user: result.data });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "";
    return NextResponse.json(
      {
        ok: false,
        message: detail ? `Gagal memperbarui user. ${detail}` : "Gagal memperbarui user.",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const user = await getRequestAuthUser();
  if (!user) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  const role = getRoleFromUser(user);
  if (role !== "SUPER_ADMIN") {
    return forbidden();
  }

  const params = await context.params;
  const userId = params.id?.trim();
  if (!userId) {
    return NextResponse.json({ ok: false, message: "User ID tidak valid." }, { status: 400 });
  }

  try {
    const target = await getAuthUserForSuperAdminById(userId);
    if (!target) {
      return NextResponse.json({ ok: false, message: "User tidak ditemukan." }, { status: 404 });
    }

    if (target.email.toLowerCase() === user.email.toLowerCase()) {
      return NextResponse.json(
        { ok: false, message: "Super admin tidak bisa menghapus akun sendiri." },
        { status: 400 }
      );
    }

    if (target.role === "SUPER_ADMIN") {
      return NextResponse.json(
        { ok: false, message: "Akun super admin lain tidak bisa dihapus lewat panel ini." },
        { status: 400 }
      );
    }

    const deleted = await deleteAuthUserById(target.id);
    if (!deleted) {
      return NextResponse.json({ ok: false, message: "User tidak ditemukan." }, { status: 404 });
    }

    void createAuditLog({
      actorEmail: user.email,
      action: "USER_DELETE",
      targetType: "auth_user",
      targetId: target.id,
      detail: {
        email: target.email,
      },
      severity: "WARN",
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "";
    return NextResponse.json(
      {
        ok: false,
        message: detail ? `Gagal menghapus user. ${detail}` : "Gagal menghapus user.",
      },
      { status: 500 }
    );
  }
}
