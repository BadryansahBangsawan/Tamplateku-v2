import { AUTH_COOKIE_NAME, encodeAuthUser } from "@/lib/authCookie";
import { loginUser, markAuthUserLoginSuccess } from "@/lib/authDb";
import { getRequestIp, getRequestUserAgent } from "@/lib/requestMeta";
import { DEFAULT_SYSTEM_CONFIG, createLoginLog, getSystemConfig } from "@/lib/superAdminDb";
import { NextResponse } from "next/server";

export const runtime = "edge";

export async function POST(request: Request) {
  const requestIp = getRequestIp(request);
  const userAgent = getRequestUserAgent(request);
  let email = "";

  try {
    const config = await getSystemConfig().catch(() => DEFAULT_SYSTEM_CONFIG);
    if (!config.loginAccess.formLoginEnabled) {
      return NextResponse.json(
        { ok: false, code: "FORM_LOGIN_DISABLED", message: "Login dengan email/password sedang nonaktif." },
        { status: 403 }
      );
    }

    const body = (await request.json()) as {
      email?: string;
      password?: string;
    };

    email = body.email?.trim().toLowerCase() ?? "";
    const password = body.password ?? "";

    if (!email || !password) {
      void createLoginLog({
        email: email || "unknown",
        success: false,
        reason: "MISSING_CREDENTIAL",
        requestIp,
        userAgent,
      });
      return NextResponse.json(
        { ok: false, message: "Email dan password wajib diisi." },
        { status: 400 }
      );
    }

    const result = await loginUser({ email, password });
    if (!result.ok || !result.data) {
      void createLoginLog({
        email,
        success: false,
        reason: result.code ?? "LOGIN_FAILED",
        requestIp,
        userAgent,
      });
      const status =
        result.code === "EMAIL_NOT_VERIFIED" ||
        result.code === "ACCOUNT_DISABLED" ||
        result.code === "PASSWORD_CHANGE_REQUIRED"
          ? 403
          : 401;
      return NextResponse.json(
        { ok: false, code: result.code, message: result.message ?? "Login gagal." },
        { status }
      );
    }

    const sessionIssuedAt = new Date().toISOString();
    void Promise.all([
      markAuthUserLoginSuccess(result.data.id),
      createLoginLog({
        email,
        userId: result.data.id,
        success: true,
        requestIp,
        userAgent,
        reason: "LOGIN_SUCCESS",
      }),
    ]);

    const response = NextResponse.json({ ok: true, user: result.data });
    response.cookies.set(
      AUTH_COOKIE_NAME,
      encodeAuthUser({
        id: result.data.id,
        email: result.data.email,
        name: result.data.name,
        provider: "local",
        role: result.data.role,
        sessionIssuedAt,
      }),
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      }
    );

    return response;
  } catch {
    if (email) {
      void createLoginLog({
        email,
        success: false,
        reason: "SERVER_ERROR",
        requestIp,
        userAgent,
      });
    }
    return NextResponse.json({ ok: false, message: "Terjadi kesalahan server." }, { status: 500 });
  }
}
