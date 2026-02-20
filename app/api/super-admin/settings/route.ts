import { getRoleFromUser } from "@/lib/adminAccess";
import { getRequestAuthUser } from "@/lib/authRequest";
import {
  createAuditLog,
  DEFAULT_SYSTEM_CONFIG,
  getSystemConfig,
  saveSystemConfig,
  type SystemConfig,
} from "@/lib/superAdminDb";
import { NextResponse } from "next/server";

export const runtime = "edge";

function mergePartialConfig(partial: unknown, current: SystemConfig): SystemConfig {
  if (typeof partial !== "object" || partial === null) {
    return current;
  }

  const input = partial as Partial<SystemConfig>;
  return {
    appName: typeof input.appName === "string" ? input.appName : current.appName,
    appLogoUrl: typeof input.appLogoUrl === "string" ? input.appLogoUrl : current.appLogoUrl,
    maintenanceMode:
      typeof input.maintenanceMode === "boolean"
        ? input.maintenanceMode
        : current.maintenanceMode,
    loginAccess: {
      formLoginEnabled:
        typeof input.loginAccess?.formLoginEnabled === "boolean"
          ? input.loginAccess.formLoginEnabled
          : current.loginAccess.formLoginEnabled,
      googleLoginEnabled:
        typeof input.loginAccess?.googleLoginEnabled === "boolean"
          ? input.loginAccess.googleLoginEnabled
          : current.loginAccess.googleLoginEnabled,
    },
    features: {
      browseTemplateEnabled:
        typeof input.features?.browseTemplateEnabled === "boolean"
          ? input.features.browseTemplateEnabled
          : current.features.browseTemplateEnabled,
      blogEnabled:
        typeof input.features?.blogEnabled === "boolean"
          ? input.features.blogEnabled
          : current.features.blogEnabled,
    },
    integrations: {
      resendEnabled:
        typeof input.integrations?.resendEnabled === "boolean"
          ? input.integrations.resendEnabled
          : current.integrations.resendEnabled,
      googleOauthEnabled:
        typeof input.integrations?.googleOauthEnabled === "boolean"
          ? input.integrations.googleOauthEnabled
          : current.integrations.googleOauthEnabled,
      publicApiEnabled:
        typeof input.integrations?.publicApiEnabled === "boolean"
          ? input.integrations.publicApiEnabled
          : current.integrations.publicApiEnabled,
      publicApiKeyHint:
        typeof input.integrations?.publicApiKeyHint === "string"
          ? input.integrations.publicApiKeyHint
          : current.integrations.publicApiKeyHint,
    },
    roleAccess: {
      USER: {
        adminPage: Boolean(input.roleAccess?.USER?.adminPage ?? current.roleAccess.USER.adminPage),
        templateManagerPage: Boolean(
          input.roleAccess?.USER?.templateManagerPage ?? current.roleAccess.USER.templateManagerPage
        ),
        superAdminPage: false,
      },
      ADMIN: {
        adminPage: Boolean(
          input.roleAccess?.ADMIN?.adminPage ?? current.roleAccess.ADMIN.adminPage
        ),
        templateManagerPage: Boolean(
          input.roleAccess?.ADMIN?.templateManagerPage ?? current.roleAccess.ADMIN.templateManagerPage
        ),
        superAdminPage: false,
      },
      TEMPLATE_ADMIN: {
        adminPage: Boolean(
          input.roleAccess?.TEMPLATE_ADMIN?.adminPage ??
            current.roleAccess.TEMPLATE_ADMIN.adminPage
        ),
        templateManagerPage: Boolean(
          input.roleAccess?.TEMPLATE_ADMIN?.templateManagerPage ??
            current.roleAccess.TEMPLATE_ADMIN.templateManagerPage
        ),
        superAdminPage: false,
      },
      SUPER_ADMIN: {
        adminPage: true,
        templateManagerPage: true,
        superAdminPage: true,
      },
    },
  };
}

export async function GET() {
  const user = await getRequestAuthUser();
  if (!user) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  if (getRoleFromUser(user) !== "SUPER_ADMIN") {
    return NextResponse.json({ ok: false, message: "Forbidden" }, { status: 403 });
  }

  try {
    const config = await getSystemConfig();
    return NextResponse.json({ ok: true, config });
  } catch {
    return NextResponse.json(
      { ok: false, message: "Gagal memuat pengaturan sistem." },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  const user = await getRequestAuthUser();
  if (!user) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  if (getRoleFromUser(user) !== "SUPER_ADMIN") {
    return NextResponse.json({ ok: false, message: "Forbidden" }, { status: 403 });
  }

  try {
    const body = (await request.json()) as { config?: unknown };
    const currentConfig = await getSystemConfig().catch(() => DEFAULT_SYSTEM_CONFIG);
    const nextConfig = mergePartialConfig(body.config, currentConfig);
    const saved = await saveSystemConfig(nextConfig);

    void createAuditLog({
      actorEmail: user.email,
      action: "SYSTEM_CONFIG_UPDATE",
      targetType: "system_config",
      detail: {
        maintenanceMode: saved.maintenanceMode,
        formLoginEnabled: saved.loginAccess.formLoginEnabled,
        googleLoginEnabled: saved.loginAccess.googleLoginEnabled,
      },
      severity: "WARN",
    });

    return NextResponse.json({ ok: true, config: saved });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "";
    return NextResponse.json(
      {
        ok: false,
        message: detail
          ? `Gagal menyimpan pengaturan sistem. ${detail}`
          : "Gagal menyimpan pengaturan sistem.",
      },
      { status: 500 }
    );
  }
}
