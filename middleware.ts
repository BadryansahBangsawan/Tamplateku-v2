import { getRoleFromUser } from "@/lib/adminAccess";
import { AUTH_COOKIE_NAME, decodeAuthUser } from "@/lib/authCookie";
import {
  canAccessAdminPage,
  canAccessSuperAdminPage,
  canAccessTemplateManagerPage,
} from "@/lib/roles";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const needsRoleCheck =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/admin-pengelola") ||
    pathname.startsWith("/super-admin");

  if (needsRoleCheck) {
    const cookieValue = request.cookies.get(AUTH_COOKIE_NAME)?.value;
    const user = decodeAuthUser(cookieValue);
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/signup";
      url.searchParams.set("auth", "required");
      return NextResponse.redirect(url);
    }

    const role = getRoleFromUser(user);
    const allowed =
      (pathname.startsWith("/admin-pengelola") && canAccessTemplateManagerPage(role)) ||
      (pathname.startsWith("/super-admin") && canAccessSuperAdminPage(role)) ||
      (pathname.startsWith("/admin") &&
        !pathname.startsWith("/admin-pengelola") &&
        canAccessAdminPage(role));

    if (!allowed) {
      const url = request.nextUrl.clone();
      url.pathname = "/browse-template";
      url.searchParams.set("admin", "forbidden");
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/admin-pengelola/:path*", "/super-admin/:path*"],
};
