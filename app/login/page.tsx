"use client";

import { SectionHeading } from "@/components/custom/SectionHeading";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
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
  const googleStatus = searchParams.get("google");
  const githubStatus = searchParams.get("github");
  const nextParam = searchParams.get("next");

  const safeNextPath =
    typeof nextParam === "string" && nextParam.startsWith("/") && !nextParam.startsWith("//")
      ? nextParam
      : null;
  const googleAuthHref = safeNextPath
    ? `/api/auth/google?next=${encodeURIComponent(safeNextPath)}`
    : "/api/auth/google";
  const githubAuthHref = safeNextPath
    ? `/api/auth/github?next=${encodeURIComponent(safeNextPath)}`
    : "/api/auth/github";

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
        user?: {
          role?: "USER" | "ADMIN" | "TEMPLATE_ADMIN" | "SUPER_ADMIN";
        };
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
      const role = result.user?.role ?? "USER";
      const target =
        role === "SUPER_ADMIN"
          ? "/super-admin?login=form_success"
          : role === "ADMIN"
            ? "/admin?login=form_success"
            : role === "TEMPLATE_ADMIN"
              ? "/admin-pengelola?login=form_success"
              : "/browse-template?login=form_success";
      router.push(safeNextPath ?? target);
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
            {googleStatus === "disabled_account" ? (
              <div className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-300">
                Akun Google kamu sedang dinonaktifkan. Hubungi admin.
              </div>
            ) : null}
            {githubStatus === "disabled_account" ? (
              <div className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-300">
                Akun GitHub kamu sedang dinonaktifkan. Hubungi admin.
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

              <div className="flex items-center gap-3">
                <Separator className="flex-1" />
                <span className="text-muted-foreground text-xs">atau</span>
                <Separator className="flex-1" />
              </div>

              <Button type="button" variant="outline" className="w-full" asChild>
                <a href={googleAuthHref}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 48 48"
                    className="mr-2 h-4 w-4"
                    aria-hidden="true"
                  >
                    <path
                      fill="#FFC107"
                      d="M43.611,20.083H42V20H24v8h11.303c-1.65,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12 s5.373-12,12-12c3.059,0,5.842,1.154,7.955,3.045l5.657-5.657C33.868,6.053,29.159,4,24,4C12.955,4,4,12.955,4,24 s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"
                    />
                    <path
                      fill="#FF3D00"
                      d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.955,3.045l5.657-5.657 C33.868,6.053,29.159,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"
                    />
                    <path
                      fill="#4CAF50"
                      d="M24,44c5.061,0,9.746-1.934,13.286-5.081l-6.19-5.238C29.033,35.091,26.62,36,24,36 c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"
                    />
                    <path
                      fill="#1976D2"
                      d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.235-2.231,4.166-4.207,5.681 c0.001-0.001,0.003-0.002,0.004-0.003l6.19,5.238C36.862,39.188,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"
                    />
                  </svg>
                  Sign in with Google
                </a>
              </Button>

              <Button type="button" variant="outline" className="w-full" asChild>
                <a href={githubAuthHref}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    className="mr-2 h-4 w-4"
                    aria-hidden="true"
                    fill="currentColor"
                  >
                    <path d="M12 .5C5.649.5.5 5.649.5 12A11.5 11.5 0 008.357 22.93c.576.106.786-.25.786-.555 0-.274-.01-1-.015-1.962-3.196.695-3.87-1.54-3.87-1.54-.522-1.327-1.276-1.68-1.276-1.68-1.043-.713.079-.699.079-.699 1.153.081 1.759 1.184 1.759 1.184 1.025 1.756 2.69 1.248 3.346.954.104-.743.401-1.248.73-1.535-2.552-.29-5.236-1.276-5.236-5.683 0-1.256.449-2.284 1.184-3.09-.119-.29-.513-1.457.112-3.038 0 0 .966-.309 3.166 1.18A11.05 11.05 0 0112 6.09c.98.005 1.968.132 2.89.387 2.198-1.49 3.163-1.18 3.163-1.18.627 1.581.233 2.748.114 3.038.737.806 1.182 1.834 1.182 3.09 0 4.418-2.688 5.39-5.25 5.674.412.354.78 1.052.78 2.12 0 1.53-.014 2.764-.014 3.14 0 .308.207.667.792.553A11.502 11.502 0 0023.5 12C23.5 5.649 18.351.5 12 .5z" />
                  </svg>
                  Sign in with GitHub
                </a>
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
