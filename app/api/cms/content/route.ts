import { getRequestAuthUser } from "@/lib/authRequest";
import { getSiteContentFromDb, saveSiteContentToDb } from "@/lib/cmsDb";
import { type SiteContent, defaultSiteContent, mergeSiteContent } from "@/lib/siteContent";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const content = await getSiteContentFromDb();
    return NextResponse.json({ ok: true, data: content });
  } catch {
    return NextResponse.json(
      { ok: false, message: "Gagal memuat konten section dari database." },
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
    const body = (await request.json()) as { content?: SiteContent };
    const merged = mergeSiteContent(defaultSiteContent, body.content ?? defaultSiteContent);
    await saveSiteContentToDb(merged);

    return NextResponse.json({ ok: true, data: merged });
  } catch {
    return NextResponse.json(
      { ok: false, message: "Gagal menyimpan konten section ke database." },
      { status: 500 }
    );
  }
}
