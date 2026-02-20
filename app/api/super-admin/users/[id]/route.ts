import { getRoleFromUser } from "@/lib/adminAccess";
import { deleteAuthUserById, getAuthUserForSuperAdminById } from "@/lib/authDb";
import { getRequestAuthUser } from "@/lib/authRequest";
import { NextResponse } from "next/server";

export const runtime = "edge";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function DELETE(_request: Request, context: RouteContext) {
  const user = await getRequestAuthUser();
  if (!user) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  const role = getRoleFromUser(user);
  if (role !== "SUPER_ADMIN") {
    return NextResponse.json({ ok: false, message: "Forbidden" }, { status: 403 });
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
