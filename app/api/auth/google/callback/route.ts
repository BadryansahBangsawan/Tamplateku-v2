import { AUTH_COOKIE_NAME, encodeAuthUser } from "@/lib/authCookie";
import { findAuthUserByEmail, markAuthUserLoginSuccess } from "@/lib/authDb";
import { getRequestIp, getRequestUserAgent } from "@/lib/requestMeta";
import { getUserRoleByEmail } from "@/lib/roles";
import { DEFAULT_SYSTEM_CONFIG, createLoginLog, getSystemConfig } from "@/lib/superAdminDb";
import { NextResponse } from "next/server";

export const runtime = "edge";

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo";
const CONFIG_TIMEOUT_MS = 700;

async function getSystemConfigQuick() {
  return Promise.race([
    getSystemConfig(),
    new Promise<typeof DEFAULT_SYSTEM_CONFIG>((resolve) => {
      setTimeout(() => resolve(DEFAULT_SYSTEM_CONFIG), CONFIG_TIMEOUT_MS);
    }),
  ]).catch(() => DEFAULT_SYSTEM_CONFIG);
}

type GoogleTokenResponse = {
  access_token: string;
  id_token?: string;
  expires_in?: number;
  token_type?: string;
  scope?: string;
};

type GoogleProfile = {
  sub: string;
  email: string;
  email_verified: boolean;
  name: string;
  picture?: string;
};

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const requestIp = getRequestIp(request);
  const userAgent = getRequestUserAgent(request);
  const code = requestUrl.searchParams.get("code");
  const state = requestUrl.searchParams.get("state");
  const cookieState = request.headers
    .get("cookie")
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith("google_oauth_state="))
    ?.split("=")[1];

  if (!code || !state || !cookieState || state !== cookieState) {
    return NextResponse.redirect(new URL("/signup?google=invalid_state", requestUrl.origin));
  }

  const config = await getSystemConfigQuick();
  if (!config.loginAccess.googleLoginEnabled || !config.integrations.googleOauthEnabled) {
    return NextResponse.redirect(new URL("/signup?google=disabled", requestUrl.origin));
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return NextResponse.redirect(new URL("/signup?google=missing_env", requestUrl.origin));
  }

  const redirectUri = `${requestUrl.origin}/api/auth/google/callback`;
  const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
    cache: "no-store",
  });

  if (!tokenResponse.ok) {
    return NextResponse.redirect(new URL("/signup?google=token_error", requestUrl.origin));
  }

  const tokenData = (await tokenResponse.json()) as GoogleTokenResponse;
  const profileResponse = await fetch(GOOGLE_USERINFO_URL, {
    headers: {
      Authorization: `Bearer ${tokenData.access_token}`,
    },
    cache: "no-store",
  });

  if (!profileResponse.ok) {
    return NextResponse.redirect(new URL("/signup?google=profile_error", requestUrl.origin));
  }

  const profile = (await profileResponse.json()) as GoogleProfile;
  const localUser = await findAuthUserByEmail(profile.email);
  if (localUser && !localUser.is_active) {
    void createLoginLog({
      email: profile.email,
      userId: localUser.id,
      success: false,
      reason: "ACCOUNT_DISABLED",
      requestIp,
      userAgent,
    });
    return NextResponse.redirect(new URL("/login?google=disabled_account", requestUrl.origin));
  }

  const role = localUser?.role ?? getUserRoleByEmail(profile.email);
  const redirectPath =
    role === "SUPER_ADMIN"
      ? "/super-admin?google=success"
      : role === "ADMIN"
        ? "/admin?google=success"
        : role === "TEMPLATE_ADMIN"
          ? "/admin-pengelola?google=success"
          : "/browse-template?google=success";

  const sessionIssuedAt = new Date().toISOString();
  if (localUser) {
    void Promise.all([
      markAuthUserLoginSuccess(localUser.id),
      createLoginLog({
        email: profile.email,
        userId: localUser.id,
        success: true,
        reason: "GOOGLE_LOGIN_SUCCESS",
        requestIp,
        userAgent,
      }),
    ]);
  } else {
    void createLoginLog({
      email: profile.email,
      success: true,
      reason: "GOOGLE_LOGIN_SUCCESS",
      requestIp,
      userAgent,
    });
  }

  const response = NextResponse.redirect(new URL(redirectPath, requestUrl.origin));
  response.cookies.delete("google_oauth_state");
  response.cookies.set(
    AUTH_COOKIE_NAME,
    encodeAuthUser({
      id: profile.sub,
      email: profile.email,
      name: profile.name,
      picture: profile.picture,
      provider: "google",
      role,
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
}
