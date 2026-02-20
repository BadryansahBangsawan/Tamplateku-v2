import { findAuthUserByEmail, markAuthUserEmailVerified } from "@/lib/authDb";
import { OTP_PURPOSES, type OtpPurpose, normalizeEmail, verifyOtpCode } from "@/lib/otp";
import {
  checkAndConsumeRateLimit,
  consumeOtpRequest,
  getLatestActiveOtpRequest,
  increaseOtpAttempt,
  issuePasswordResetToken,
} from "@/lib/otpDb";
import { getRequestIp, getRequestUserAgent } from "@/lib/requestMeta";
import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "edge";

const verifyOtpSchema = z.object({
  email: z.string().email().max(320),
  purpose: z.enum(OTP_PURPOSES),
  otp: z.string().regex(/^\d{6}$/),
});

const INVALID_OTP_MESSAGE = "Kode OTP tidak valid atau sudah kedaluwarsa.";

function hasOtpPepper(): boolean {
  return Boolean(process.env.OTP_PEPPER && process.env.OTP_PEPPER.trim().length >= 16);
}

function hasResetTokenSecret(): boolean {
  return Boolean(
    process.env.RESET_TOKEN_SECRET && process.env.RESET_TOKEN_SECRET.trim().length >= 32
  );
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: security checks are intentionally explicit.
export async function POST(request: Request) {
  let payload: z.infer<typeof verifyOtpSchema>;

  try {
    payload = verifyOtpSchema.parse(await request.json());
  } catch {
    return NextResponse.json(
      { ok: false, message: "Data verifikasi OTP tidak valid." },
      { status: 400 }
    );
  }

  if (!hasOtpPepper()) {
    return NextResponse.json(
      {
        ok: false,
        code: "OTP_SERVICE_NOT_CONFIGURED",
        message: "Layanan OTP belum dikonfigurasi.",
      },
      { status: 503 }
    );
  }

  if (payload.purpose === "RESET_PASSWORD" && !hasResetTokenSecret()) {
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
    const email = normalizeEmail(payload.email);
    const purpose = payload.purpose as OtpPurpose;
    const ip = getRequestIp(request);
    const userAgent = getRequestUserAgent(request);

    const [ipRate, emailRate] = await Promise.all([
      checkAndConsumeRateLimit({
        key: `otp:verify:ip:${purpose}:${ip}`,
        limit: 40,
        windowSeconds: 15 * 60,
      }),
      checkAndConsumeRateLimit({
        key: `otp:verify:email:${purpose}:${email}`,
        limit: 15,
        windowSeconds: 15 * 60,
      }),
    ]);

    if (!ipRate.allowed || !emailRate.allowed) {
      const retryAfterSeconds = Math.max(ipRate.retryAfterSeconds, emailRate.retryAfterSeconds);
      return NextResponse.json(
        {
          ok: false,
          message: "Terlalu banyak percobaan verifikasi OTP. Coba lagi nanti.",
          retryAfterSeconds,
        },
        { status: 429 }
      );
    }

    const otpRequest = await getLatestActiveOtpRequest(email, purpose);
    if (!otpRequest) {
      return NextResponse.json({ ok: false, message: INVALID_OTP_MESSAGE }, { status: 400 });
    }

    const isExpired = Number.isNaN(Date.parse(otpRequest.expires_at))
      ? true
      : new Date(otpRequest.expires_at) <= new Date();

    if (isExpired || otpRequest.attempts >= otpRequest.max_attempts) {
      await consumeOtpRequest(otpRequest.id);
      return NextResponse.json({ ok: false, message: INVALID_OTP_MESSAGE }, { status: 400 });
    }

    const valid = await verifyOtpCode(payload.otp, email, purpose, otpRequest.otp_hash);
    if (!valid) {
      await increaseOtpAttempt({
        otpRequestId: otpRequest.id,
        currentAttempts: otpRequest.attempts,
        maxAttempts: otpRequest.max_attempts,
      });

      return NextResponse.json({ ok: false, message: INVALID_OTP_MESSAGE }, { status: 400 });
    }

    await consumeOtpRequest(otpRequest.id);

    if (purpose === "REGISTER") {
      const user = await findAuthUserByEmail(email);
      if (!user) {
        return NextResponse.json(
          { ok: false, message: "Permintaan verifikasi tidak valid." },
          { status: 400 }
        );
      }

      await markAuthUserEmailVerified(email);
      return NextResponse.json({ ok: true, message: "Email berhasil diverifikasi." });
    }

    if (purpose === "RESET_PASSWORD") {
      const user = await findAuthUserByEmail(email);
      if (!user) {
        return NextResponse.json(
          { ok: false, message: "Permintaan reset tidak valid." },
          { status: 400 }
        );
      }

      const resetToken = await issuePasswordResetToken({
        email,
        otpRequestId: otpRequest.id,
        ip,
        userAgent,
        ttlMinutes: 15,
      });

      return NextResponse.json({
        ok: true,
        message: "OTP valid.",
        resetToken: resetToken.token,
        resetTokenExpiresAt: resetToken.expiresAt,
      });
    }

    return NextResponse.json({ ok: true, message: "OTP valid." });
  } catch {
    return NextResponse.json(
      { ok: false, message: "Terjadi kesalahan saat verifikasi OTP." },
      { status: 500 }
    );
  }
}
