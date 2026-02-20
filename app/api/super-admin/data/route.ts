import type { CaseStudyType } from "@/data/caseStudies";
import { getRoleFromUser } from "@/lib/adminAccess";
import { getRequestAuthUser } from "@/lib/authRequest";
import {
  deleteAllTemplatesFromDb,
  getSiteContentFromDb,
  getTemplatesFromDb,
  saveSiteContentToDb,
  saveTemplatesToDb,
} from "@/lib/cmsDb";
import { mergeSiteContent, defaultSiteContent, type SiteContent } from "@/lib/siteContent";
import {
  createAuditLog,
  createDataBackup,
  getDataBackupById,
  listDataBackupMeta,
} from "@/lib/superAdminDb";
import { NextResponse } from "next/server";

export const runtime = "edge";

type ActionBody =
  | { action: "create_backup"; snapshotType?: string }
  | { action: "restore_backup"; backupId?: string }
  | { action: "replace_content"; content?: SiteContent }
  | { action: "replace_templates"; templates?: CaseStudyType[] }
  | { action: "delete_templates" };

export async function GET() {
  const user = await getRequestAuthUser();
  if (!user) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  if (getRoleFromUser(user) !== "SUPER_ADMIN") {
    return NextResponse.json({ ok: false, message: "Forbidden" }, { status: 403 });
  }

  try {
    const [content, templates, backups] = await Promise.all([
      getSiteContentFromDb(),
      getTemplatesFromDb(),
      listDataBackupMeta(30),
    ]);

    return NextResponse.json({ ok: true, content, templates, backups });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "";
    return NextResponse.json(
      {
        ok: false,
        message: detail ? `Gagal memuat kontrol data. ${detail}` : "Gagal memuat kontrol data.",
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

  if (getRoleFromUser(user) !== "SUPER_ADMIN") {
    return NextResponse.json({ ok: false, message: "Forbidden" }, { status: 403 });
  }

  let payload: ActionBody;
  try {
    payload = (await request.json()) as ActionBody;
  } catch {
    return NextResponse.json({ ok: false, message: "Body request tidak valid." }, { status: 400 });
  }

  try {
    if (payload.action === "create_backup") {
      const [content, templates] = await Promise.all([getSiteContentFromDb(), getTemplatesFromDb()]);
      const backup = await createDataBackup({
        snapshotType: payload.snapshotType?.trim() || "manual_snapshot",
        payload: {
          content,
          templates,
        },
        createdBy: user.email,
      });

      void createAuditLog({
        actorEmail: user.email,
        action: "DATA_BACKUP_CREATE",
        targetType: "backup",
        targetId: backup.id,
        detail: {
          snapshotType: backup.snapshotType,
          templateCount: templates.length,
        },
      });

      return NextResponse.json({ ok: true, backup });
    }

    if (payload.action === "restore_backup") {
      const backupId = payload.backupId?.trim();
      if (!backupId) {
        return NextResponse.json({ ok: false, message: "Backup ID wajib diisi." }, { status: 400 });
      }

      const backup = await getDataBackupById(backupId);
      if (!backup) {
        return NextResponse.json({ ok: false, message: "Backup tidak ditemukan." }, { status: 404 });
      }

      const contentRaw = backup.payload.content;
      const templatesRaw = backup.payload.templates;

      const mergedContent = mergeSiteContent(
        defaultSiteContent,
        (typeof contentRaw === "object" && contentRaw ? contentRaw : {}) as SiteContent
      );
      const savedTemplates = await saveTemplatesToDb(
        (Array.isArray(templatesRaw) ? templatesRaw : []) as CaseStudyType[]
      );
      await saveSiteContentToDb(mergedContent);

      void createAuditLog({
        actorEmail: user.email,
        action: "DATA_BACKUP_RESTORE",
        targetType: "backup",
        targetId: backup.id,
        detail: {
          snapshotType: backup.snapshotType,
          restoredTemplateCount: savedTemplates.length,
        },
        severity: "WARN",
      });

      return NextResponse.json({
        ok: true,
        content: mergedContent,
        templates: savedTemplates,
      });
    }

    if (payload.action === "replace_content") {
      const merged = mergeSiteContent(defaultSiteContent, payload.content ?? defaultSiteContent);
      await saveSiteContentToDb(merged);

      void createAuditLog({
        actorEmail: user.email,
        action: "DATA_CONTENT_REPLACE",
        targetType: "cms_site_content",
        detail: {
          by: "super_admin",
        },
        severity: "WARN",
      });

      return NextResponse.json({ ok: true, content: merged });
    }

    if (payload.action === "replace_templates") {
      const templates = Array.isArray(payload.templates) ? payload.templates : [];
      const saved = await saveTemplatesToDb(templates as CaseStudyType[]);

      void createAuditLog({
        actorEmail: user.email,
        action: "DATA_TEMPLATES_REPLACE",
        targetType: "cms_templates",
        detail: {
          templateCount: saved.length,
        },
        severity: "WARN",
      });

      return NextResponse.json({ ok: true, templates: saved });
    }

    if (payload.action === "delete_templates") {
      await deleteAllTemplatesFromDb();

      void createAuditLog({
        actorEmail: user.email,
        action: "DATA_TEMPLATES_DELETE_ALL",
        targetType: "cms_templates",
        severity: "CRITICAL",
      });

      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: false, message: "Aksi tidak dikenal." }, { status: 400 });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "";
    return NextResponse.json(
      {
        ok: false,
        message: detail
          ? `Gagal menjalankan aksi kontrol data. ${detail}`
          : "Gagal menjalankan aksi kontrol data.",
      },
      { status: 500 }
    );
  }
}
