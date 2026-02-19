import { AUTH_COOKIE_NAME, type AuthUser, decodeAuthUser } from "@/lib/authCookie";
import { cookies } from "next/headers";

export async function getRequestAuthUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  return decodeAuthUser(cookieValue);
}
