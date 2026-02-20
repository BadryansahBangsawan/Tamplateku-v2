import { getRoleFromUser } from "@/lib/adminAccess";
import { AUTH_COOKIE_NAME } from "@/lib/authCookie";
import { getRequestAuthUser } from "@/lib/authRequest";
import { NextResponse } from "next/server";

export const runtime = "edge";

export async function GET() {
  const user = await getRequestAuthUser();
  if (!user) {
    const response = NextResponse.json(
      {
        user: null,
        role: "USER",
        isAdmin: false,
        isTemplateAdmin: false,
        isSuperAdmin: false,
      },
      { status: 200 }
    );
    response.cookies.delete(AUTH_COOKIE_NAME);
    return response;
  }

  const role = getRoleFromUser(user);
  return NextResponse.json(
    {
      user,
      role,
      isAdmin: role === "ADMIN" || role === "SUPER_ADMIN",
      isTemplateAdmin: role === "TEMPLATE_ADMIN" || role === "SUPER_ADMIN",
      isSuperAdmin: role === "SUPER_ADMIN",
    },
    { status: 200 }
  );
}
