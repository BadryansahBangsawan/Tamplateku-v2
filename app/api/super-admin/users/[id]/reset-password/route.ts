import { getRoleFromUser } from "@/lib/adminAccess";
import {
  getAuthUserForSuperAdminById,
  resetAuthUserPasswordByIdForSuperAdmin,
} from "@/lib/authDb";
import { getRequestAuthUser } from "@/lib/authRequest";
import { createAuditLog } from "@/lib/superAdminDb";
import { NextResponse } from "next/server";

export const runtime = "edge";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const actor = await getRequestAuthUser();
  if (!actor) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  if (getRoleFromUser(actor) !== "SUPER_ADMIN") {
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

    const body = (await request.json()) as {
      newPassword?: string;
      forceChangeOnNextLogin?: boolean;
    };

    const newPassword = body.newPassword ?? "";
    const forceChangeOnNextLogin = body.forceChangeOnNextLogin === true;

    const result = await resetAuthUserPasswordByIdForSuperAdmin({
      userId,
      newPassword,
      forceChangeOnNextLogin,
    });

    if (!result.ok || !result.data) {
      return NextResponse.json(
        {
          ok: false,
          message: result.message ?? "Gagal reset password user.",
        },
        { status: 400 }
      );
    }

    void createAuditLog({
      actorEmail: actor.email,
      action: "USER_RESET_PASSWORD",
      targetType: "auth_user",
      targetId: userId,
      detail: {
        targetEmail: target.email,
        forceChangeOnNextLogin,
      },
      severity: "WARN",
    });

    return NextResponse.json({ ok: true, user: result.data });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "";
    return NextResponse.json(
      {
        ok: false,
        message: detail
          ? `Gagal reset password user. ${detail}`
          : "Gagal reset password user.",
      },
      { status: 500 }
    );
  }
}
