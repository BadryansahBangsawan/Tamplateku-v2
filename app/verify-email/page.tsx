"use client";

import { SectionHeading } from "@/components/custom/SectionHeading";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, Suspense, useState } from "react";

function VerifyEmailPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultEmail = searchParams.get("email") ?? "";

  const [email, setEmail] = useState(defaultEmail);
  const [otp, setOtp] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleVerify = async (event: FormEvent<HTMLFormElement>) => {
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

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          purpose: "REGISTER",
          otp,
        }),
      });

      const result = (await response.json()) as { ok: boolean; message?: string };
      if (!response.ok || !result.ok) {
        setErrorMessage(result.message ?? "Verifikasi OTP gagal.");
        return;
      }

      router.push("/login?verified=success");
    } catch {
      setErrorMessage("Tidak bisa terhubung ke server.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    setErrorMessage("");
    setSuccessMessage("");

    if (!email.trim()) {
      setErrorMessage("Isi email dulu sebelum kirim ulang OTP.");
      return;
    }

    setIsResending(true);
    try {
      const response = await fetch("/api/otp/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          purpose: "REGISTER",
        }),
      });

      const result = (await response.json()) as {
        ok: boolean;
        message?: string;
        retryAfterSeconds?: number;
      };

      if (!response.ok) {
        if (response.status === 429 && result.retryAfterSeconds) {
          setErrorMessage(
            `Terlalu sering kirim OTP. Coba lagi dalam ${result.retryAfterSeconds} detik.`
          );
          return;
        }

        setErrorMessage(result.message ?? "Gagal mengirim ulang OTP.");
        return;
      }

      setSuccessMessage("OTP baru sudah dikirim ke email kamu.");
    } catch {
      setErrorMessage("Tidak bisa terhubung ke server.");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen w-full">
      <main id="main-content">
        <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-5 pt-[116px] pb-16 md:pt-[128px] md:pb-24 lg:pt-[140px]">
          <section
            className="mx-auto w-full max-w-xl space-y-8"
            aria-labelledby="verify-email-heading"
          >
            <SectionHeading
              badge="Email Verification"
              heading="Verifikasi Email Akun"
              description="Masukkan kode OTP 6 digit yang dikirim ke email untuk mengaktifkan akun kamu."
              size="md"
              align="center"
              as="h1"
              id="verify-email-heading"
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

            <form
              className="space-y-4 md:space-y-5"
              aria-label="Verify email OTP"
              onSubmit={handleVerify}
            >
              <div className="space-y-2">
                <label htmlFor="verify-email" className="text-sm font-medium text-heading">
                  Email
                </label>
                <Input
                  id="verify-email"
                  name="email"
                  type="email"
                  placeholder="Masukkan email kamu"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="verify-otp" className="text-sm font-medium text-heading">
                  Kode OTP
                </label>
                <Input
                  id="verify-otp"
                  name="otp"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  placeholder="Contoh: 123456"
                  value={otp}
                  onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))}
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Memverifikasi..." : "Verifikasi Email"}
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleResend}
                disabled={isResending}
              >
                {isResending ? "Mengirim Ulang..." : "Kirim Ulang OTP"}
              </Button>
            </form>

            <p className="text-center text-sm text-label">
              Sudah verifikasi?{" "}
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

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailPageContent />
    </Suspense>
  );
}
