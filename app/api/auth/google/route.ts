import { NextResponse } from "next/server";
import { DEFAULT_SYSTEM_CONFIG, getSystemConfig } from "@/lib/superAdminDb";

export const runtime = "edge";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const CONFIG_TIMEOUT_MS = 700;

async function getSystemConfigQuick() {
  return Promise.race([
    getSystemConfig(),
    new Promise<typeof DEFAULT_SYSTEM_CONFIG>((resolve) => {
      setTimeout(() => resolve(DEFAULT_SYSTEM_CONFIG), CONFIG_TIMEOUT_MS);
    }),
  ]).catch(() => DEFAULT_SYSTEM_CONFIG);
}

export async function GET(request: Request) {
  const config = await getSystemConfigQuick();
  if (!config.loginAccess.googleLoginEnabled || !config.integrations.googleOauthEnabled) {
    const url = new URL(request.url);
    return NextResponse.redirect(new URL("/signup?google=disabled", url.origin));
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json({ error: "Missing GOOGLE_CLIENT_ID env var." }, { status: 500 });
  }

  const url = new URL(request.url);
  const redirectUri = `${url.origin}/api/auth/google/callback`;
  const state = crypto.randomUUID();

  const authUrl = new URL(GOOGLE_AUTH_URL);
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", "openid email profile");
  authUrl.searchParams.set("prompt", "select_account");
  authUrl.searchParams.set("state", state);

  const response = NextResponse.redirect(authUrl);
  response.cookies.set("google_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 10,
  });

  return response;
}
