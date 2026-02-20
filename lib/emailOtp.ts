import { OTP_EXPIRES_MINUTES, type OtpPurpose } from "@/lib/otp";

type SendOtpMailInput = {
  to: string;
  otp: string;
  purpose: OtpPurpose;
};

type OtpMailContent = {
  subject: string;
  intro: string;
};

function getMailContent(purpose: OtpPurpose): OtpMailContent {
  if (purpose === "REGISTER") {
    return {
      subject: "Kode Verifikasi Pendaftaran",
      intro: "Gunakan kode berikut untuk menyelesaikan pendaftaran akun Anda.",
    };
  }

  if (purpose === "CHANGE_EMAIL") {
    return {
      subject: "Kode Verifikasi Perubahan Email",
      intro: "Gunakan kode berikut untuk memverifikasi perubahan email akun Anda.",
    };
  }

  return {
    subject: "Kode Reset Password",
    intro: "Gunakan kode berikut untuk melanjutkan proses reset password.",
  };
}

export async function sendOtpEmail(input: SendOtpMailInput): Promise<void> {
  const from = process.env.SMTP_FROM;
  const resendApiKey = process.env.RESEND_API_KEY;
  if (!from) {
    throw new Error("Missing SMTP_FROM env var.");
  }
  if (!resendApiKey) {
    throw new Error("Missing RESEND_API_KEY env var.");
  }

  const content = getMailContent(input.purpose);

  const text = `${content.intro}\n\nKode OTP: ${input.otp}\nBerlaku selama ${OTP_EXPIRES_MINUTES} menit.\n\nJika Anda tidak meminta kode ini, abaikan email ini.`;

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.5;color:#0f172a">
      <h2 style="margin:0 0 12px">${content.subject}</h2>
      <p style="margin:0 0 16px">${content.intro}</p>
      <p style="margin:0 0 8px">Kode OTP Anda:</p>
      <p style="font-size:28px;font-weight:700;letter-spacing:4px;margin:0 0 16px">${input.otp}</p>
      <p style="margin:0 0 8px">Kode berlaku selama ${OTP_EXPIRES_MINUTES} menit.</p>
      <p style="margin:0">Jika Anda tidak meminta kode ini, abaikan email ini.</p>
    </div>
  `;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [input.to],
      subject: content.subject,
      text,
      html,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to send OTP via Resend API.");
  }
}
