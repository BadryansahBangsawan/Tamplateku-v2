import { getRoleFromUser } from "@/lib/adminAccess";
import { createAuthUserBySuperAdmin, listAuthUsersForSuperAdmin } from "@/lib/authDb";
import { getRequestAuthUser } from "@/lib/authRequest";
import { createAuditLog } from "@/lib/superAdminDb";
import { NextResponse } from "next/server";

export const runtime = "edge";

function getForbiddenResponse() {
  return NextResponse.json({ ok: false, message: "Forbidden" }, { status: 403 });
}

export async function GET() {
  const user = await getRequestAuthUser();
  if (!user) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  const role = getRoleFromUser(user);
  if (role !== "SUPER_ADMIN") {
    return getForbiddenResponse();
  }

  try {
    const users = await listAuthUsersForSuperAdmin();
    return NextResponse.json({ ok: true, users });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "";
    return NextResponse.json(
      {
        ok: false,
        message: detail ? `Gagal memuat daftar user. ${detail}` : "Gagal memuat daftar user.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const user = await getRequestAuthUser();
  if (!user) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  const role = getRoleFromUser(user);
  if (role !== "SUPER_ADMIN") {
    return getForbiddenResponse();
  }

  try {
    const body = (await request.json()) as {
      name?: string;
      email?: string;
      password?: string;
      role?: "USER" | "ADMIN" | "TEMPLATE_ADMIN" | "SUPER_ADMIN";
      isActive?: boolean;
    };

    const result = await createAuthUserBySuperAdmin({
      name: body.name?.trim() ?? "",
      email: body.email?.trim().toLowerCase() ?? "",
      password: body.password ?? "",
      role: body.role ?? "USER",
      isActive: body.isActive,
    });

    if (!result.ok || !result.data) {
      return NextResponse.json(
        {
          ok: false,
          message: result.message ?? "Gagal membuat user.",
        },
        { status: 400 }
      );
    }

    void createAuditLog({
      actorEmail: user.email,
      action: "USER_CREATE",
      targetType: "auth_user",
      targetId: result.data.id,
      detail: {
        email: result.data.email,
        role: result.data.role,
        isActive: result.data.isActive,
      },
    });

    return NextResponse.json({ ok: true, user: result.data });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "";
    return NextResponse.json(
      {
        ok: false,
        message: detail ? `Gagal membuat user. ${detail}` : "Gagal membuat user.",
      },
      { status: 500 }
    );
  }
}
