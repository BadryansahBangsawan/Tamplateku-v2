"use client";

import { SectionHeading } from "@/components/custom/SectionHeading";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, Suspense, useState } from "react";

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [unverifiedEmail, setUnverifiedEmail] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const registered = searchParams.get("registered") === "success";
  const verified = searchParams.get("verified") === "success";

  const handleLoginSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const result = (await response.json()) as {
        ok: boolean;
        code?: string;
        message?: string;
      };
      if (!response.ok || !result.ok) {
        setErrorMessage(result.message ?? "Login gagal.");
        if (result.code === "EMAIL_NOT_VERIFIED") {
          setUnverifiedEmail(email);
        } else {
          setUnverifiedEmail("");
        }
        return;
      }
      setUnverifiedEmail("");
      router.push("/browse-template?login=form_success");
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
          <section className="mx-auto w-full max-w-xl space-y-8" aria-labelledby="login-heading">
            <SectionHeading
              badge="Member Access"
              heading="Login ke akun Tamplateku"
              description="Masuk untuk mengelola template favorit, melihat detail implementasi, dan melanjutkan proses pembelian."
              size="md"
              align="center"
              as="h1"
              id="login-heading"
              className="mb-4"
              showDescriptionToScreenReaders={true}
            />

            {registered ? (
              <div className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300">
                Registrasi berhasil. Cek email lalu verifikasi OTP sebelum login.
              </div>
            ) : null}

            {verified ? (
              <div className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300">
                Verifikasi email berhasil. Sekarang kamu bisa login.
              </div>
            ) : null}
            {errorMessage ? (
              <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {errorMessage}
              </div>
            ) : null}
            {unverifiedEmail ? (
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => {
                  router.push(
                    `/verify-email?email=${encodeURIComponent(unverifiedEmail)}&purpose=REGISTER`
                  );
                }}
              >
                Verifikasi Email Sekarang
              </Button>
            ) : null}

            <form
              className="space-y-4 md:space-y-5"
              aria-label="Login form"
              onSubmit={handleLoginSubmit}
            >
              <div className="space-y-2">
                <label htmlFor="login-email" className="text-sm font-medium text-heading">
                  Email
                </label>
                <Input
                  id="login-email"
                  name="email"
                  type="email"
                  placeholder="Masukkan email kamu"
                  autoComplete="email"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="login-password" className="text-sm font-medium text-heading">
                  Password
                </label>
                <Input
                  id="login-password"
                  name="password"
                  type="password"
                  placeholder="Masukkan password"
                  autoComplete="current-password"
                  required
                />
                <div className="text-right">
                  <Link href="/forgot-password" className="text-xs text-primary hover:underline">
                    Lupa password?
                  </Link>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Memproses..." : "Masuk"}
              </Button>
            </form>

            <p className="text-center text-sm text-label">
              Belum punya akun?{" "}
              <Link href="/signup" className="text-primary hover:underline">
                Daftar sekarang
              </Link>
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageContent />
    </Suspense>
  );
}
