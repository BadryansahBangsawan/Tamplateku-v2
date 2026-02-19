import { AUTH_COOKIE_NAME } from "@/lib/authCookie";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const requestUrl = new URL(request.url);
  const response = NextResponse.json({ ok: true }, { status: 200 });
  response.cookies.delete(AUTH_COOKIE_NAME);
  response.cookies.delete("google_oauth_state");

  if (requestUrl.searchParams.get("redirect") === "1") {
    return NextResponse.redirect(new URL("/", requestUrl.origin));
  }

  return response;
}
