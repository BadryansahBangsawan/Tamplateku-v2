import { AUTH_COOKIE_NAME, decodeAuthUser } from "@/lib/authCookie";
import { isAdminUser } from "@/lib/adminAccess";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const runtime = "edge";

export async function GET() {
  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  const user = decodeAuthUser(cookieValue);
  if (!user) {
    return NextResponse.json({ user: null, isAdmin: false }, { status: 200 });
  }

  return NextResponse.json({ user, isAdmin: isAdminUser(user) }, { status: 200 });
}
