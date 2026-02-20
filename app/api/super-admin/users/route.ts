import { getRoleFromUser } from "@/lib/adminAccess";
import { listAuthUsersForSuperAdmin } from "@/lib/authDb";
import { getRequestAuthUser } from "@/lib/authRequest";
import { NextResponse } from "next/server";

export const runtime = "edge";

export async function GET() {
  const user = await getRequestAuthUser();
  if (!user) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  const role = getRoleFromUser(user);
  if (role !== "SUPER_ADMIN") {
    return NextResponse.json({ ok: false, message: "Forbidden" }, { status: 403 });
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
