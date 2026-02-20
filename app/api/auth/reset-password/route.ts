import { findAuthUserByEmail, updateAuthUserPassword } from "@/lib/authDb";
import {
  checkAndConsumeRateLimit,
  consumePasswordResetToken,
  invalidatePasswordResetTokensForEmail,
} from "@/lib/otpDb";
import { getRequestIp } from "@/lib/requestMeta";
import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "edge";

const resetPasswordSchema = z.object({
  resetToken: z.string().min(32).max(256),
  newPassword: z.string().min(8).max(128),
});

function hashTokenForRateLimit(token: string): string {
  return token.slice(0, 24);
}

function hasResetTokenSecret(): boolean {
  return Boolean(
    process.env.RESET_TOKEN_SECRET && process.env.RESET_TOKEN_SECRET.trim().length >= 32
  );
}

export async function POST(request: Request) {
  let payload: z.infer<typeof resetPasswordSchema>;

  try {
    payload = resetPasswordSchema.parse(await request.json());
  } catch {
    return NextResponse.json(
      { ok: false, message: "Data reset password tidak valid." },
      { status: 400 }
    );
  }

  if (!hasResetTokenSecret()) {
    return NextResponse.json(
      {
        ok: false,
        code: "RESET_SERVICE_NOT_CONFIGURED",
        message: "Layanan reset password belum dikonfigurasi.",
      },
      { status: 503 }
    );
  }

  try {
    const ip = getRequestIp(request);
    const tokenFingerprint = hashTokenForRateLimit(payload.resetToken);

    const [ipRate, tokenRate] = await Promise.all([
      checkAndConsumeRateLimit({
        key: `reset:ip:${ip}`,
        limit: 20,
        windowSeconds: 15 * 60,
      }),
      checkAndConsumeRateLimit({
        key: `reset:token:${tokenFingerprint}`,
        limit: 8,
        windowSeconds: 15 * 60,
      }),
    ]);

    if (!ipRate.allowed || !tokenRate.allowed) {
      const retryAfterSeconds = Math.max(ipRate.retryAfterSeconds, tokenRate.retryAfterSeconds);
      return NextResponse.json(
        {
          ok: false,
          message: "Terlalu banyak percobaan reset password. Coba lagi nanti.",
          retryAfterSeconds,
        },
        { status: 429 }
      );
    }

    const tokenData = await consumePasswordResetToken(payload.resetToken);
    if (!tokenData) {
      return NextResponse.json(
        { ok: false, message: "Token reset password tidak valid." },
        { status: 400 }
      );
    }

    const user = await findAuthUserByEmail(tokenData.email);
    if (!user) {
      return NextResponse.json(
        { ok: false, message: "Token reset password tidak valid." },
        { status: 400 }
      );
    }

    await updateAuthUserPassword(tokenData.email, payload.newPassword);
    await invalidatePasswordResetTokensForEmail(tokenData.email);

    return NextResponse.json({ ok: true, message: "Password berhasil diperbarui." });
  } catch {
    return NextResponse.json(
      { ok: false, message: "Terjadi kesalahan saat reset password." },
      { status: 500 }
    );
  }
}
