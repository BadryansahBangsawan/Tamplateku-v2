import { getRoleFromUser } from "@/lib/adminAccess";
import { getRequestAuthUser } from "@/lib/authRequest";
import { listAuditLogs, listLoginLogs, listSuspiciousActivities } from "@/lib/superAdminDb";
import { NextResponse } from "next/server";

export const runtime = "edge";

export async function GET(request: Request) {
  const user = await getRequestAuthUser();
  if (!user) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  if (getRoleFromUser(user) !== "SUPER_ADMIN") {
    return NextResponse.json({ ok: false, message: "Forbidden" }, { status: 403 });
  }

  const url = new URL(request.url);
  const rawLimit = Number(url.searchParams.get("limit") ?? "100");
  const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(Math.floor(rawLimit), 1), 500) : 100;

  try {
    const [loginLogs, auditLogs, suspicious] = await Promise.all([
      listLoginLogs(limit),
      listAuditLogs(limit),
      listSuspiciousActivities(),
    ]);

    return NextResponse.json({
      ok: true,
      loginLogs,
      auditLogs,
      suspicious,
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "";
    return NextResponse.json(
      {
        ok: false,
        message: detail ? `Gagal memuat log aktivitas. ${detail}` : "Gagal memuat log aktivitas.",
      },
      { status: 500 }
    );
  }
}
