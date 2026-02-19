import type { CaseStudyType } from "@/data/caseStudies";
import { getRequestAuthUser } from "@/lib/authRequest";
import { getTemplatesFromDb, saveTemplatesToDb } from "@/lib/cmsDb";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const templates = await getTemplatesFromDb();
    return NextResponse.json({ ok: true, data: templates });
  } catch {
    return NextResponse.json(
      { ok: false, message: "Gagal memuat data template dari database." },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  const user = await getRequestAuthUser();
  if (!user) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as { templates?: CaseStudyType[] };
    const templates = Array.isArray(body.templates) ? body.templates : [];
    const saved = await saveTemplatesToDb(templates);

    return NextResponse.json({ ok: true, data: saved });
  } catch {
    return NextResponse.json(
      { ok: false, message: "Gagal menyimpan data template ke database." },
      { status: 500 }
    );
  }
}
