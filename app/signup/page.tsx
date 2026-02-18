"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";

function SignupPage() {
  return (
    <div className="min-h-screen w-full">
      <main id="main-content">
        <div className="mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-5 pt-[116px] pb-16 md:pt-[128px] md:pb-24 lg:pt-[140px]">
          <section className="grid gap-6 lg:grid-cols-2" aria-labelledby="signup-heading">
            <Card className="border-border/70 bg-gradient-to-b from-background to-muted/40">
              <CardHeader className="space-y-4">
                <CardTitle id="signup-heading" className="text-2xl md:text-3xl">
                  Buat akun Tamplateku
                </CardTitle>
                <CardDescription className="text-sm md:text-base">
                  Daftar sekali untuk akses template premium, simpan favorit, dan konsultasi
                  langsung kebutuhan website bisnis kamu.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg border bg-background/60 p-4">
                  <p className="text-sm font-medium text-heading">Yang kamu dapatkan</p>
                  <ul className="mt-3 space-y-2 text-sm text-label">
                    <li>• Akses katalog template premium</li>
                    <li>• Simpan dan bandingkan template favorit</li>
                    <li>• Prioritas update konten dan komponen terbaru</li>
                  </ul>
                </div>
                <Separator />
                <p className="text-sm text-label">
                  Sudah punya akun?{" "}
                  <Link href="/login" className="text-primary font-medium hover:underline">
                    Login di sini
                  </Link>
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/70">
              <CardHeader>
                <CardTitle>Form Registrasi</CardTitle>
                <CardDescription>Lengkapi data di bawah untuk membuat akun baru.</CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-4 md:space-y-5" aria-label="Sign up form">
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

                  <Button type="submit" className="w-full">
                    Buat Akun
                  </Button>
                </form>
              </CardContent>
            </Card>
          </section>
        </div>
      </main>
    </div>
  );
}

export default SignupPage;
