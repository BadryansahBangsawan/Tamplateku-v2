import { getRequestAuthUser } from "@/lib/authRequest";
import { isAdminUser } from "@/lib/adminAccess";
import { getSiteContentFromDb, saveSiteContentToDb } from "@/lib/cmsDb";
import { type SiteContent, defaultSiteContent, mergeSiteContent } from "@/lib/siteContent";
import { createAuditLog } from "@/lib/superAdminDb";
import { NextResponse } from "next/server";

export const runtime = "edge";

export async function GET() {
  try {
    const content = await getSiteContentFromDb();
    return NextResponse.json({ ok: true, data: content });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "";
    return NextResponse.json(
      {
        ok: false,
        message: detail
          ? `Gagal memuat konten section dari database. ${detail}`
          : "Gagal memuat konten section dari database.",
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
    const body = (await request.json()) as { content?: SiteContent };
    const merged = mergeSiteContent(defaultSiteContent, body.content ?? defaultSiteContent);
    await saveSiteContentToDb(merged);
    void createAuditLog({
      actorEmail: user.email,
      action: "CMS_CONTENT_UPDATE",
      targetType: "cms_site_content",
      detail: { by: "admin_panel" },
    });

    return NextResponse.json({ ok: true, data: merged });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "";
    return NextResponse.json(
      {
        ok: false,
        message: detail
          ? `Gagal menyimpan konten section ke database. ${detail}`
          : "Gagal menyimpan konten section ke database.",
      },
      { status: 500 }
    );
  }
}
