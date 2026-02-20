import { getRoleFromUser } from "@/lib/adminAccess";
import { isAuthUserSessionValid } from "@/lib/authSession";
import { AUTH_COOKIE_NAME, decodeAuthUser } from "@/lib/authCookie";
import {
  canAccessAdminPage,
  canAccessSuperAdminPage,
  canAccessTemplateManagerPage,
} from "@/lib/roles";
import { canRoleAccessModule } from "@/lib/superAdminDb";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
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

    try {
      const validSession = await isAuthUserSessionValid({
        email: user.email,
        sessionIssuedAt: user.sessionIssuedAt,
      });
      if (!validSession) {
        const url = request.nextUrl.clone();
        url.pathname = "/login";
        url.searchParams.set("auth", "expired");
        const response = NextResponse.redirect(url);
        response.cookies.delete(AUTH_COOKIE_NAME);
        return response;
      }
    } catch {
      // fallback to cookie-only check when DB unavailable
    }

    const role = getRoleFromUser(user);
    let allowed =
      (pathname.startsWith("/admin-pengelola") && canAccessTemplateManagerPage(role)) ||
      (pathname.startsWith("/super-admin") && canAccessSuperAdminPage(role)) ||
      (pathname.startsWith("/admin") &&
        !pathname.startsWith("/admin-pengelola") &&
        canAccessAdminPage(role));

    if (allowed) {
      const module = pathname.startsWith("/admin-pengelola")
        ? "templateManagerPage"
        : pathname.startsWith("/super-admin")
          ? "superAdminPage"
          : "adminPage";

      try {
        allowed = await canRoleAccessModule(role, module);
      } catch {
        // fallback to static role checks if dynamic policy fails
      }
    }

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
