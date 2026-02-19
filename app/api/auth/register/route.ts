import { registerUser } from "@/lib/authDb";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      name?: string;
      email?: string;
      password?: string;
      notes?: string;
    };

    const name = body.name?.trim() ?? "";
    const email = body.email?.trim() ?? "";
    const password = body.password ?? "";
    const notes = body.notes?.trim() ?? "";

    if (!name || !email || !password) {
      return NextResponse.json(
        { ok: false, message: "Data registrasi belum lengkap." },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { ok: false, message: "Password minimal 8 karakter." },
        { status: 400 }
      );
    }

    const result = await registerUser({ name, email, password, notes });
    if (!result.ok) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, message: "Terjadi kesalahan server." }, { status: 500 });
  }
}
