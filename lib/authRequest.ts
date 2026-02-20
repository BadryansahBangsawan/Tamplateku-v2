import { AUTH_COOKIE_NAME, type AuthUser, decodeAuthUser } from "@/lib/authCookie";
import { findAuthUserByEmail } from "@/lib/authDb";
import { isAuthUserSessionValid } from "@/lib/authSession";
import { cookies } from "next/headers";

export async function getRequestAuthUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  const user = decodeAuthUser(cookieValue);
  if (!user) return null;

  try {
    const [dbUser, validSession] = await Promise.all([
      findAuthUserByEmail(user.email),
      isAuthUserSessionValid({ email: user.email, sessionIssuedAt: user.sessionIssuedAt }),
    ]);

    if (!validSession) return null;

    if (dbUser) {
      return {
        ...user,
        role: dbUser.role,
      };
    }
  } catch {
    // Graceful fallback: keep cookie user if DB unavailable.
  }

  return user;
}
