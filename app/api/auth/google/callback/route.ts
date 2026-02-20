import { AUTH_COOKIE_NAME, encodeAuthUser } from "@/lib/authCookie";
import { findAuthUserByEmail, markAuthUserLoginSuccess } from "@/lib/authDb";
import { getRequestIp, getRequestUserAgent } from "@/lib/requestMeta";
import { getUserRoleByEmail } from "@/lib/roles";
import { DEFAULT_SYSTEM_CONFIG, createLoginLog, getSystemConfig } from "@/lib/superAdminDb";
import { NextResponse } from "next/server";

export const runtime = "edge";

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo";
const GITHUB_TOKEN_URL = "https://github.com/login/oauth/access_token";
const GITHUB_USER_URL = "https://api.github.com/user";
const GITHUB_EMAILS_URL = "https://api.github.com/user/emails";
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

type GithubTokenResponse = {
  access_token?: string;
  error?: string;
  error_description?: string;
};

type GithubProfile = {
  id: number;
  login: string;
  name: string | null;
  email: string | null;
  avatar_url: string | null;
};

type GithubEmail = {
  email: string;
  verified: boolean;
  primary: boolean;
};

type SocialProvider = "google" | "github";

type SocialProfile = {
  provider: SocialProvider;
  providerUserId: string;
  email: string;
  name: string;
  picture?: string;
};

function readCookieValue(cookieHeader: string | null, key: string): string | null {
  if (!cookieHeader) return null;
  const raw = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${key}=`))
    ?.split("=")[1];
  return raw ?? null;
}

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

function resolveGithubEmail(profile: GithubProfile, emails: GithubEmail[]): string | null {
  if (profile.email?.includes("@")) {
    return normalizeEmail(profile.email);
  }

  const primaryVerified = emails.find((item) => item.primary && item.verified);
  if (primaryVerified) return normalizeEmail(primaryVerified.email);

  const anyVerified = emails.find((item) => item.verified);
  if (anyVerified) return normalizeEmail(anyVerified.email);

  return null;
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const requestIp = getRequestIp(request);
  const userAgent = getRequestUserAgent(request);
  const code = requestUrl.searchParams.get("code");
  const state = requestUrl.searchParams.get("state");
  const cookieHeader = request.headers.get("cookie");
  const googleState = readCookieValue(cookieHeader, "google_oauth_state");
  const githubState = readCookieValue(cookieHeader, "github_oauth_state");
  const oauthNextPath = readCookieValue(cookieHeader, "oauth_next_path");
  const safeOauthNextPath =
    typeof oauthNextPath === "string" &&
    oauthNextPath.startsWith("/") &&
    !oauthNextPath.startsWith("//")
      ? oauthNextPath
      : null;

  let provider: SocialProvider | null = null;
  if (state && googleState && state === googleState) provider = "google";
  if (state && githubState && state === githubState) provider = "github";

  if (!code || !state || !provider) {
    return NextResponse.redirect(new URL("/signup?social=invalid_state", requestUrl.origin));
  }

  const config = await getSystemConfigQuick();
  if (!config.loginAccess.googleLoginEnabled || !config.integrations.googleOauthEnabled) {
    return NextResponse.redirect(new URL(`/signup?${provider}=disabled`, requestUrl.origin));
  }

  let profile: SocialProfile;

  if (provider === "google") {
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

    const googleProfile = (await profileResponse.json()) as GoogleProfile;
    profile = {
      provider: "google",
      providerUserId: googleProfile.sub,
      email: normalizeEmail(googleProfile.email),
      name: googleProfile.name,
      picture: googleProfile.picture,
    };
  } else {
    const clientId = process.env.GITHUB_CLIENT_ID;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
      return NextResponse.redirect(new URL("/signup?github=missing_env", requestUrl.origin));
    }

    const redirectUri = `${requestUrl.origin}/api/auth/google/callback`;
    const tokenResponse = await fetch(GITHUB_TOKEN_URL, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
        state,
      }),
      cache: "no-store",
    });

    if (!tokenResponse.ok) {
      return NextResponse.redirect(new URL("/signup?github=token_error", requestUrl.origin));
    }

    const tokenData = (await tokenResponse.json()) as GithubTokenResponse;
    if (!tokenData.access_token) {
      return NextResponse.redirect(new URL("/signup?github=token_error", requestUrl.origin));
    }

    const authHeaders = {
      Authorization: `Bearer ${tokenData.access_token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    };

    const [profileResponse, emailResponse] = await Promise.all([
      fetch(GITHUB_USER_URL, { headers: authHeaders, cache: "no-store" }),
      fetch(GITHUB_EMAILS_URL, { headers: authHeaders, cache: "no-store" }),
    ]);

    if (!profileResponse.ok || !emailResponse.ok) {
      return NextResponse.redirect(new URL("/signup?github=profile_error", requestUrl.origin));
    }

    const githubProfile = (await profileResponse.json()) as GithubProfile;
    const githubEmails = (await emailResponse.json()) as GithubEmail[];
    const email = resolveGithubEmail(githubProfile, githubEmails);
    if (!email) {
      return NextResponse.redirect(new URL("/signup?github=email_unavailable", requestUrl.origin));
    }

    profile = {
      provider: "github",
      providerUserId: String(githubProfile.id),
      email,
      name: githubProfile.name?.trim() || githubProfile.login || "GitHub User",
      picture: githubProfile.avatar_url ?? undefined,
    };
  }

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
    return NextResponse.redirect(new URL(`/login?${provider}=disabled_account`, requestUrl.origin));
  }

  const role = localUser?.role ?? getUserRoleByEmail(profile.email);
  const roleRedirectPath =
    role === "SUPER_ADMIN"
      ? `/super-admin?${provider}=success`
      : role === "ADMIN"
        ? `/admin?${provider}=success`
        : role === "TEMPLATE_ADMIN"
          ? `/admin-pengelola?${provider}=success`
          : `/browse-template?${provider}=success`;
  const redirectPath = safeOauthNextPath ?? roleRedirectPath;

  const sessionIssuedAt = new Date().toISOString();
  if (localUser) {
    void Promise.all([
      markAuthUserLoginSuccess(localUser.id),
      createLoginLog({
        email: profile.email,
        userId: localUser.id,
        success: true,
        reason: provider === "google" ? "GOOGLE_LOGIN_SUCCESS" : "GITHUB_LOGIN_SUCCESS",
        requestIp,
        userAgent,
      }),
    ]);
  } else {
    void createLoginLog({
      email: profile.email,
      success: true,
      reason: provider === "google" ? "GOOGLE_LOGIN_SUCCESS" : "GITHUB_LOGIN_SUCCESS",
      requestIp,
      userAgent,
    });
  }

  const response = NextResponse.redirect(new URL(redirectPath, requestUrl.origin));
  response.cookies.delete("google_oauth_state");
  response.cookies.delete("github_oauth_state");
  response.cookies.delete("oauth_next_path");
  response.cookies.set(
    AUTH_COOKIE_NAME,
    encodeAuthUser({
      id: profile.providerUserId,
      email: profile.email,
      name: profile.name,
      picture: profile.picture,
      provider,
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
