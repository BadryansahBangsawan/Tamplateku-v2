"use client";

import { SectionHeading } from "@/components/custom/SectionHeading";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";

function LoginPage() {
  return (
    <div className="min-h-screen w-full">
      <main id="main-content">
        <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-5 pt-[116px] pb-16 md:pt-[128px] md:pb-24 lg:pt-[140px]">
          <section
            className="mx-auto w-full max-w-xl space-y-8"
            aria-labelledby="login-heading"
          >
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

            <form className="space-y-4 md:space-y-5" aria-label="Login form">
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
              </div>

              <Button type="submit" className="w-full">
                Masuk
              </Button>
            </form>

            <p className="text-center text-sm text-label">
              Belum punya akun?{" "}
              <Link href="/#signup-section" className="text-primary hover:underline">
                Daftar sekarang
              </Link>
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}

export default LoginPage;
