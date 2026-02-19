import { AUTH_COOKIE_NAME, encodeAuthUser } from "@/lib/authCookie";
import { NextResponse } from "next/server";

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo";

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

  const response = NextResponse.redirect(
    new URL("/browse-template?google=success", requestUrl.origin)
  );
  response.cookies.delete("google_oauth_state");
  response.cookies.set(
    AUTH_COOKIE_NAME,
    encodeAuthUser({
      id: profile.sub,
      email: profile.email,
      name: profile.name,
      picture: profile.picture,
      provider: "google",
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
