import { OTP_EXPIRES_MINUTES, type OtpPurpose } from "@/lib/otp";

type SendOtpMailInput = {
  to: string;
  otp: string;
  purpose: OtpPurpose;
};

type OtpMailContent = {
  subject: string;
  intro: string;
  preheader: string;
  badge: string;
};

function getMailContent(purpose: OtpPurpose): OtpMailContent {
  if (purpose === "REGISTER") {
    return {
      subject: "Kode Verifikasi Pendaftaran",
      intro: "Gunakan kode berikut untuk menyelesaikan pendaftaran akun Anda.",
      preheader: "Kode OTP pendaftaran Tamplateku",
      badge: "Verifikasi Pendaftaran",
    };
  }

  if (purpose === "CHANGE_EMAIL") {
    return {
      subject: "Kode Verifikasi Perubahan Email",
      intro: "Gunakan kode berikut untuk memverifikasi perubahan email akun Anda.",
      preheader: "Kode OTP perubahan email Tamplateku",
      badge: "Perubahan Email",
    };
  }

  return {
    subject: "Kode Reset Password",
    intro: "Gunakan kode berikut untuk melanjutkan proses reset password.",
    preheader: "Kode OTP reset password Tamplateku",
    badge: "Reset Password",
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
  const appName = "Tamplateku";

  const text = [
    `${appName} - ${content.subject}`,
    "",
    content.intro,
    "",
    `Kode OTP: ${input.otp}`,
    `Berlaku selama ${OTP_EXPIRES_MINUTES} menit.`,
    "",
    "Jangan bagikan kode ini ke siapa pun.",
    "Jika Anda tidak meminta kode ini, abaikan email ini.",
  ].join("\n");

  const html = `
    <!doctype html>
    <html>
      <head>
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${content.subject}</title>
      </head>
      <body style="margin:0;padding:0;background:#f8fafc;font-family:Arial,sans-serif;color:#0f172a;">
        <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${content.preheader}</div>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f8fafc;padding:24px 12px;">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border:1px solid #e2e8f0;border-radius:14px;overflow:hidden;">
                <tr>
                  <td style="padding:20px 24px;border-bottom:1px solid #eef2f7;">
                    <div style="display:inline-block;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#0369a1;background:#e0f2fe;border-radius:999px;padding:6px 10px;">${content.badge}</div>
                    <h1 style="margin:14px 0 0;font-size:22px;line-height:1.3;color:#0f172a;">${content.subject}</h1>
                    <p style="margin:10px 0 0;font-size:15px;line-height:1.6;color:#334155;">${content.intro}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:22px 24px;">
                    <p style="margin:0 0 10px;font-size:13px;color:#64748b;">Kode OTP Anda</p>
                    <div style="display:inline-block;background:#0f172a;color:#ffffff;border-radius:10px;padding:14px 18px;font-size:30px;font-weight:700;letter-spacing:8px;line-height:1;">${input.otp}</div>
                    <p style="margin:16px 0 0;font-size:14px;color:#334155;">
                      Kode berlaku selama <strong>${OTP_EXPIRES_MINUTES} menit</strong>.
                    </p>
                    <p style="margin:10px 0 0;font-size:14px;color:#334155;">
                      Untuk keamanan akun, jangan bagikan kode ini ke siapa pun.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:18px 24px;background:#f8fafc;border-top:1px solid #eef2f7;">
                    <p style="margin:0;font-size:12px;line-height:1.6;color:#64748b;">
                      Jika Anda tidak meminta kode ini, abaikan email ini.
                    </p>
                    <p style="margin:8px 0 0;font-size:12px;color:#94a3b8;">
                      © ${new Date().getFullYear()} ${appName}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
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
