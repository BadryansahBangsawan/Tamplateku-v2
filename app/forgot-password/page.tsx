"use client";

import { SectionHeading } from "@/components/custom/SectionHeading";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { type FormEvent, Suspense, useState } from "react";

type Step = "request" | "verify" | "done";

type ApiMessage = {
  ok: boolean;
  message?: string;
  retryAfterSeconds?: number;
  resetToken?: string;
  resetTokenExpiresAt?: string;
};

function ForgotPasswordPageContent() {
  const searchParams = useSearchParams();
  const [step, setStep] = useState<Step>("request");
  const [email, setEmail] = useState(searchParams.get("email") ?? "");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: flow is explicit for security and UX messaging.
  const requestOtp = async (resend = false) => {
    setErrorMessage("");
    if (!email.trim()) {
      setErrorMessage("Email wajib diisi.");
      return false;
    }

    resend ? setIsResending(true) : setIsSubmitting(true);

    try {
      const response = await fetch("/api/otp/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          purpose: "RESET_PASSWORD",
        }),
      });

      const result = (await response.json()) as ApiMessage;
      if (!response.ok) {
        if (response.status === 429 && result.retryAfterSeconds) {
          setErrorMessage(
            `Terlalu sering meminta OTP. Coba lagi dalam ${result.retryAfterSeconds} detik.`
          );
          return false;
        }

        setErrorMessage(result.message ?? "Gagal mengirim OTP.");
        return false;
      }

      setStep("verify");
      setSuccessMessage(
        resend
          ? "OTP baru telah dikirim. Cek inbox/spam email kamu."
          : "Jika email terdaftar, OTP telah dikirim. Lanjutkan verifikasi di bawah."
      );
      return true;
    } catch {
      setErrorMessage("Tidak bisa terhubung ke server.");
      return false;
    } finally {
      resend ? setIsResending(false) : setIsSubmitting(false);
    }
  };

  const handleRequestOtp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSuccessMessage("");
    await requestOtp(false);
  };

  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: flow is explicit for validation and secure reset sequence.
  const handleVerifyAndReset = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!email.trim()) {
      setErrorMessage("Email wajib diisi.");
      return;
    }

    if (!/^\d{6}$/.test(otp)) {
      setErrorMessage("Kode OTP harus 6 digit.");
      return;
    }

    if (newPassword.length < 8) {
      setErrorMessage("Password baru minimal 8 karakter.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage("Konfirmasi password tidak cocok.");
      return;
    }

    setIsSubmitting(true);

    try {
      const verifyResponse = await fetch("/api/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          purpose: "RESET_PASSWORD",
          otp,
        }),
      });

      const verifyResult = (await verifyResponse.json()) as ApiMessage;
      if (!verifyResponse.ok || !verifyResult.ok || !verifyResult.resetToken) {
        setErrorMessage(verifyResult.message ?? "Verifikasi OTP gagal.");
        return;
      }

      const resetResponse = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resetToken: verifyResult.resetToken,
          newPassword,
        }),
      });

      const resetResult = (await resetResponse.json()) as ApiMessage;
      if (!resetResponse.ok || !resetResult.ok) {
        setErrorMessage(resetResult.message ?? "Gagal reset password.");
        return;
      }

      setStep("done");
      setSuccessMessage("Password berhasil diubah. Silakan login dengan password baru.");
    } catch {
      setErrorMessage("Tidak bisa terhubung ke server.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full">
      <main id="main-content">
        <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-5 pt-[116px] pb-16 md:pt-[128px] md:pb-24 lg:pt-[140px]">
          <section
            className="mx-auto w-full max-w-xl space-y-8"
            aria-labelledby="forgot-password-heading"
          >
            <SectionHeading
              badge="Password Recovery"
              heading="Lupa Password"
              description="Minta OTP ke email, verifikasi kode, lalu set password baru akun kamu."
              size="md"
              align="center"
              as="h1"
              id="forgot-password-heading"
              className="mb-4"
              showDescriptionToScreenReaders={true}
            />

            {successMessage ? (
              <div className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300">
                {successMessage}
              </div>
            ) : null}

            {errorMessage ? (
              <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {errorMessage}
              </div>
            ) : null}

            {step === "request" ? (
              <form
                className="space-y-4 md:space-y-5"
                aria-label="Request reset OTP"
                onSubmit={handleRequestOtp}
              >
                <div className="space-y-2">
                  <label htmlFor="forgot-email" className="text-sm font-medium text-heading">
                    Email
                  </label>
                  <Input
                    id="forgot-email"
                    type="email"
                    name="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="Masukkan email akun kamu"
                    autoComplete="email"
                    required
                  />
                </div>

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? "Mengirim OTP..." : "Kirim OTP Reset Password"}
                </Button>
              </form>
            ) : null}

            {step === "verify" ? (
              <form
                className="space-y-4 md:space-y-5"
                aria-label="Verify reset OTP"
                onSubmit={handleVerifyAndReset}
              >
                <div className="space-y-2">
                  <label htmlFor="reset-email" className="text-sm font-medium text-heading">
                    Email
                  </label>
                  <Input
                    id="reset-email"
                    type="email"
                    name="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="Masukkan email akun kamu"
                    autoComplete="email"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="reset-otp" className="text-sm font-medium text-heading">
                    Kode OTP
                  </label>
                  <Input
                    id="reset-otp"
                    type="text"
                    name="otp"
                    inputMode="numeric"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    value={otp}
                    onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="Masukkan 6 digit OTP"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="new-password" className="text-sm font-medium text-heading">
                    Password Baru
                  </label>
                  <Input
                    id="new-password"
                    type="password"
                    name="newPassword"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    placeholder="Minimal 8 karakter"
                    autoComplete="new-password"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="confirm-password" className="text-sm font-medium text-heading">
                    Konfirmasi Password Baru
                  </label>
                  <Input
                    id="confirm-password"
                    type="password"
                    name="confirmPassword"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    placeholder="Ulangi password baru"
                    autoComplete="new-password"
                    required
                  />
                </div>

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? "Memproses..." : "Verifikasi OTP & Ubah Password"}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    void requestOtp(true);
                  }}
                  disabled={isResending}
                >
                  {isResending ? "Mengirim Ulang..." : "Kirim Ulang OTP"}
                </Button>
              </form>
            ) : null}

            {step === "done" ? (
              <Button asChild className="w-full">
                <Link href="/login">Kembali ke Login</Link>
              </Button>
            ) : null}

            <p className="text-center text-sm text-label">
              Ingat password?{" "}
              <Link href="/login" className="text-primary hover:underline">
                Login di sini
              </Link>
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ForgotPasswordPageContent />
    </Suspense>
  );
}
