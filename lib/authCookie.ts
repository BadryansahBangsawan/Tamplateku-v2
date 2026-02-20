export const AUTH_COOKIE_NAME = "tamplateku_auth_user";

export type AuthRole = "USER" | "ADMIN" | "TEMPLATE_ADMIN" | "SUPER_ADMIN";

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  picture?: string;
  provider: "google" | "local";
  role?: AuthRole;
  sessionIssuedAt?: string;
};

export function encodeAuthUser(user: AuthUser): string {
  return JSON.stringify(user);
}

export function decodeAuthUser(value: string | undefined): AuthUser | null {
  if (!value) return null;

  const parseCandidate = (candidate: string): AuthUser | null => {
    try {
      const parsed = JSON.parse(candidate) as Partial<AuthUser>;
      if (
        typeof parsed.id === "string" &&
        typeof parsed.email === "string" &&
        typeof parsed.name === "string" &&
        (parsed.provider === "google" || parsed.provider === "local")
      ) {
        return {
          id: parsed.id,
          email: parsed.email,
          name: parsed.name,
          picture: typeof parsed.picture === "string" ? parsed.picture : undefined,
          provider: parsed.provider,
          role:
            parsed.role === "USER" ||
            parsed.role === "ADMIN" ||
            parsed.role === "TEMPLATE_ADMIN" ||
            parsed.role === "SUPER_ADMIN"
              ? parsed.role
              : undefined,
          sessionIssuedAt:
            typeof parsed.sessionIssuedAt === "string" ? parsed.sessionIssuedAt : undefined,
        };
      }
      return null;
    } catch {
      return null;
    }
  };

  const direct = parseCandidate(value);
  if (direct) return direct;

  try {
    return parseCandidate(decodeURIComponent(value));
  } catch {
    return null;
  }
}
