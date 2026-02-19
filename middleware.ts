import { AUTH_COOKIE_NAME, decodeAuthUser } from "@/lib/authCookie";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/admin")) {
    const cookieValue = request.cookies.get(AUTH_COOKIE_NAME)?.value;
    const user = decodeAuthUser(cookieValue);
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/signup";
      url.searchParams.set("auth", "required");
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
