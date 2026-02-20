"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, Suspense, useState } from "react";

function SignupPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const googleStatus = searchParams.get("google");
  const authStatus = searchParams.get("auth");
  const [errorMessage, setErrorMessage] = useState<string>("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFormSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");

    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const notes = String(formData.get("notes") ?? "").trim();

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, notes }),
      });
      const result = (await response.json()) as { ok: boolean; message?: string };
      if (!response.ok || !result.ok) {
        setErrorMessage(result.message ?? "Registrasi gagal.");
        return;
      }

      const otpResponse = await fetch("/api/otp/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          purpose: "REGISTER",
        }),
      });

      const otpResult = (await otpResponse.json()) as {
        ok: boolean;
        message?: string;
      };

      if (!otpResponse.ok && otpResponse.status !== 429) {
        setErrorMessage(otpResult.message ?? "Registrasi berhasil, tapi gagal kirim OTP.");
        return;
      }

      router.push(`/verify-email?email=${encodeURIComponent(email)}&purpose=REGISTER`);
    } catch {
      setErrorMessage("Tidak bisa terhubung ke server.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full">
      <main id="main-content">
        <div className="mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-5 pt-[116px] pb-16 md:pt-[128px] md:pb-24 lg:pt-[140px]">
          <section className="mx-auto w-full max-w-2xl" aria-labelledby="signup-heading">
            <Card className="border-border/70">
              <CardHeader>
                <CardTitle id="signup-heading">Form Registrasi</CardTitle>
                <CardDescription>Lengkapi data di bawah untuk membuat akun baru.</CardDescription>
              </CardHeader>
              <CardContent>
                {authStatus === "required" ? (
                  <div className="mb-4 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-300">
                    Untuk mengakses admin, login dengan Google terlebih dahulu.
                  </div>
                ) : null}
                {googleStatus === "success" ? (
                  <div className="mb-4 rounded-md border border-green-500/40 bg-green-500/10 px-3 py-2 text-sm text-green-700 dark:text-green-300">
                    Login Google berhasil. Akun kamu sudah terhubung.
                  </div>
                ) : null}
                {errorMessage ? (
                  <div className="mb-4 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {errorMessage}
                  </div>
                ) : null}
                <form
                  className="space-y-4 md:space-y-5"
                  aria-label="Sign up form"
                  onSubmit={handleFormSubmit}
                >
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Nama Lengkap</Label>
                    <Input
                      id="signup-name"
                      name="name"
                      placeholder="Masukkan nama kamu"
                      autoComplete="name"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      name="email"
                      type="email"
                      placeholder="Masukkan email aktif"
                      autoComplete="email"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
                      name="password"
                      type="password"
                      placeholder="Minimal 8 karakter"
                      autoComplete="new-password"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-notes">Jenis bisnis / catatan (opsional)</Label>
                    <Textarea
                      id="signup-notes"
                      name="notes"
                      rows={3}
                      placeholder="Ceritakan singkat bisnis atau kebutuhan websitemu..."
                    />
                  </div>

                  <div className="flex items-start gap-3 rounded-lg border p-3">
                    <Checkbox id="signup-agreement" required />
                    <Label htmlFor="signup-agreement" className="text-sm leading-relaxed">
                      Saya setuju dengan syarat layanan dan kebijakan privasi Tamplateku.
                    </Label>
                  </div>

                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? "Memproses..." : "Buat Akun"}
                  </Button>

                  <div className="flex items-center gap-3">
                    <Separator className="flex-1" />
                    <span className="text-muted-foreground text-xs">atau</span>
                    <Separator className="flex-1" />
                  </div>

                  <Button type="button" variant="outline" className="w-full" asChild>
                    <a href="/api/auth/google">
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

                  <p className="text-center text-sm text-label">
                    Sudah punya akun?{" "}
                    <a href="/login" className="text-primary hover:underline">
                      Login di sini
                    </a>
                  </p>
                </form>
              </CardContent>
            </Card>
          </section>
        </div>
      </main>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={null}>
      <SignupPageContent />
    </Suspense>
  );
}
