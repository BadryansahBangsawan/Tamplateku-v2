"use client";

import { SectionHeading } from "@/components/custom/SectionHeading";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function SignupSection() {
  return (
    <section
      id="signup-section"
      className="mx-auto max-w-6xl px-5 py-16 md:py-24"
      aria-labelledby="signup-heading"
    >
      <SectionHeading
        badge="Join Tamplateku"
        heading="Buat akun Tamplateku"
        description="Daftar sekali, lalu akses semua template premium yang cocok untuk kebutuhan website bisnismu."
        size="md"
        align="center"
        as="h2"
        id="signup-heading"
        className="mb-8 md:mb-10"
        showDescriptionToScreenReaders={true}
      />

      <div className="grid gap-10 md:grid-cols-2">
        <div className="space-y-4">
          <p className="text-label text-sm md:text-base">
            Isi form di samping untuk membuat akun. Setelah daftar, kamu bisa menyimpan template
            favorit, melihat detail implementasi, dan konsultasi kebutuhan website dengan lebih
            mudah.
          </p>
          <ul className="space-y-2 text-sm text-label">
            <li>• Akses update template terbaru</li>
            <li>• Simpan dan bandingkan beberapa template</li>
            <li>• Dapatkan rekomendasi template sesuai jenis bisnis</li>
          </ul>
        </div>

        <form className="space-y-4 md:space-y-5" aria-label="Sign up form">
          <div className="space-y-2">
            <label htmlFor="signup-name" className="text-sm font-medium text-heading">
              Nama Lengkap
            </label>
            <Input
              id="signup-name"
              name="name"
              placeholder="Masukkan nama kamu"
              autoComplete="name"
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="signup-email" className="text-sm font-medium text-heading">
              Email
            </label>
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
            <label htmlFor="signup-password" className="text-sm font-medium text-heading">
              Password
            </label>
            <Input
              id="signup-password"
              name="password"
              type="password"
              placeholder="Minimal 8 karakter"
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="signup-notes" className="text-sm font-medium text-heading">
              Jenis bisnis / catatan (opsional)
            </label>
            <Textarea
              id="signup-notes"
              name="notes"
              rows={3}
              placeholder="Ceritakan singkat bisnis atau kebutuhan websitemu..."
            />
          </div>

          <Button type="submit" className="w-full md:w-auto">
            Buat Akun
          </Button>
        </form>
      </div>
    </section>
  );
}
