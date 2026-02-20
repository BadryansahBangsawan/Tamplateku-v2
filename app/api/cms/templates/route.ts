import type { CaseStudyType } from "@/data/caseStudies";
import { getRequestAuthUser } from "@/lib/authRequest";
import { isAdminUser } from "@/lib/adminAccess";
import { getTemplatesFromDb, saveTemplatesToDb } from "@/lib/cmsDb";
import { NextResponse } from "next/server";

export const runtime = "edge";

export async function GET() {
  try {
    const templates = await getTemplatesFromDb();
    return NextResponse.json({ ok: true, data: templates });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "";
    return NextResponse.json(
      {
        ok: false,
        message: detail
          ? `Gagal memuat data template dari database. ${detail}`
          : "Gagal memuat data template dari database.",
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  const user = await getRequestAuthUser();
  if (!user) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }
  if (!isAdminUser(user)) {
    return NextResponse.json({ ok: false, message: "Forbidden" }, { status: 403 });
  }

  try {
    const body = (await request.json()) as { templates?: CaseStudyType[] };
    const templates = Array.isArray(body.templates) ? body.templates : [];
    const saved = await saveTemplatesToDb(templates);

    return NextResponse.json({ ok: true, data: saved });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "";
    return NextResponse.json(
      {
        ok: false,
        message: detail
          ? `Gagal menyimpan data template ke database. ${detail}`
          : "Gagal menyimpan data template ke database.",
      },
      { status: 500 }
    );
  }
}
