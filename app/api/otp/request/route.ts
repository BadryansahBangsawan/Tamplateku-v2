import { findAuthUserByEmail } from "@/lib/authDb";
import { sendOtpEmail } from "@/lib/emailOtp";
import {
  OTP_EXPIRES_MINUTES,
  OTP_PURPOSES,
  type OtpPurpose,
  generateOtpCode,
  hashOtpCode,
  normalizeEmail,
} from "@/lib/otp";
import {
  checkAndConsumeRateLimit,
  createOtpRequest,
  getLatestActiveOtpRequest,
  revokeOtpRequest,
} from "@/lib/otpDb";
import { getRequestIp, getRequestUserAgent } from "@/lib/requestMeta";
import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "edge";

const requestOtpSchema = z.object({
  email: z.string().email().max(320),
  purpose: z.enum(OTP_PURPOSES),
});

const GENERIC_SUCCESS_MESSAGE = "Jika email valid, kode OTP akan dikirim.";

function addMinutes(minutes: number): string {
  return new Date(Date.now() + minutes * 60 * 1000).toISOString();
}

function isOtpServiceConfigured(): boolean {
  const hasOtpPepper = Boolean(
    process.env.OTP_PEPPER && process.env.OTP_PEPPER.trim().length >= 16
  );
  const hasResendConfig = Boolean(
    process.env.RESEND_API_KEY &&
      process.env.RESEND_API_KEY.trim().length > 0 &&
      process.env.SMTP_FROM &&
      process.env.SMTP_FROM.trim().length > 0
  );

  return hasOtpPepper && hasResendConfig;
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: security checks are intentionally explicit.
export async function POST(request: Request) {
  let payload: z.infer<typeof requestOtpSchema>;

  try {
    payload = requestOtpSchema.parse(await request.json());
  } catch {
    return NextResponse.json(
      { ok: false, message: "Data request OTP tidak valid." },
      { status: 400 }
    );
  }

  if (!isOtpServiceConfigured()) {
    return NextResponse.json(
      {
        ok: false,
        code: "OTP_SERVICE_NOT_CONFIGURED",
        message: "Layanan OTP belum dikonfigurasi.",
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
        key: `otp:request:ip:${purpose}:${ip}`,
        limit: 25,
        windowSeconds: 15 * 60,
      }),
      checkAndConsumeRateLimit({
        key: `otp:request:email:${purpose}:${email}`,
        limit: 5,
        windowSeconds: 15 * 60,
      }),
    ]);

    if (!ipRate.allowed || !emailRate.allowed) {
      const retryAfterSeconds = Math.max(ipRate.retryAfterSeconds, emailRate.retryAfterSeconds);
      return NextResponse.json(
        {
          ok: false,
          message: "Terlalu banyak permintaan OTP. Coba lagi nanti.",
          retryAfterSeconds,
        },
        { status: 429 }
      );
    }

    const latest = await getLatestActiveOtpRequest(email, purpose);
    if (latest) {
      const createdAtMs = Date.parse(latest.created_at);
      if (!Number.isNaN(createdAtMs)) {
        const waitSeconds = 60 - Math.floor((Date.now() - createdAtMs) / 1000);
        if (waitSeconds > 0) {
          return NextResponse.json(
            {
              ok: false,
              message: "Tunggu sebentar sebelum meminta OTP lagi.",
              retryAfterSeconds: waitSeconds,
            },
            { status: 429 }
          );
        }
      }
    }

    const user = await findAuthUserByEmail(email);

    if (purpose === "RESET_PASSWORD" && !user) {
      return NextResponse.json({ ok: true, message: GENERIC_SUCCESS_MESSAGE });
    }

    if (purpose === "REGISTER") {
      if (!user || user.email_verified_at) {
        return NextResponse.json({ ok: true, message: GENERIC_SUCCESS_MESSAGE });
      }
    }

    const otp = generateOtpCode();
    const otpHash = await hashOtpCode(otp, email, purpose);

    const otpRequest = await createOtpRequest({
      email,
      purpose,
      otpHash,
      expiresAt: addMinutes(OTP_EXPIRES_MINUTES),
      ip,
      userAgent,
    });

    try {
      await sendOtpEmail({
        to: email,
        otp,
        purpose,
      });
    } catch {
      await revokeOtpRequest(otpRequest.id);
      return NextResponse.json(
        { ok: false, message: "Gagal mengirim OTP. Coba lagi dalam beberapa saat." },
        { status: 503 }
      );
    }

    return NextResponse.json({ ok: true, message: GENERIC_SUCCESS_MESSAGE });
  } catch {
    return NextResponse.json(
      { ok: false, message: "Terjadi kesalahan saat memproses OTP." },
      { status: 500 }
    );
  }
}
