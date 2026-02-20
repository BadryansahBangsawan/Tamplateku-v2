import { getRoleFromUser } from "@/lib/adminAccess";
import { AUTH_COOKIE_NAME, decodeAuthUser } from "@/lib/authCookie";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const runtime = "edge";

export async function GET() {
  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  const user = decodeAuthUser(cookieValue);
  if (!user) {
    return NextResponse.json(
      {
        user: null,
        role: "USER",
        isAdmin: false,
        isTemplateAdmin: false,
        isSuperAdmin: false,
      },
      { status: 200 }
    );
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
