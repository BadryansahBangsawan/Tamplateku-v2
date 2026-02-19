import { AUTH_COOKIE_NAME, encodeAuthUser } from "@/lib/authCookie";
import { loginUser } from "@/lib/authDb";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      email?: string;
      password?: string;
    };

    const email = body.email?.trim() ?? "";
    const password = body.password ?? "";

    if (!email || !password) {
      return NextResponse.json(
        { ok: false, message: "Email dan password wajib diisi." },
        { status: 400 }
      );
    }

    const result = await loginUser({ email, password });
    if (!result.ok || !result.data) {
      return NextResponse.json(
        { ok: false, message: result.message ?? "Login gagal." },
        { status: 401 }
      );
    }

    const response = NextResponse.json({ ok: true, user: result.data });
    response.cookies.set(
      AUTH_COOKIE_NAME,
      encodeAuthUser({
        id: result.data.id,
        email: result.data.email,
        name: result.data.name,
        provider: "local",
      }),
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      }
    );

    return response;
  } catch {
    return NextResponse.json({ ok: false, message: "Terjadi kesalahan server." }, { status: 500 });
  }
}
