"use client";

import ImageCarousel from "@/components/custom/ImageCarousel";
import { useLanguage } from "@/components/language-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useCaseStudies } from "@/hooks/use-case-studies";
import { enrichTemplates, formatIdr } from "@/lib/templateCatalog";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

export const runtime = "edge";

export default function BrowseTemplateDetailPage() {
  const caseStudies = useCaseStudies();
  const templates = useMemo(() => enrichTemplates(caseStudies), [caseStudies]);
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const slug = typeof params.slug === "string" ? params.slug : "";
  const { language } = useLanguage();
  const paymentStatus = searchParams.get("payment");

  const template = templates.find((item) => item.slug === slug);
  const [isCheckingAccess, setIsCheckingAccess] = useState(true);
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);
  const [loginRequired, setLoginRequired] = useState(false);
  const [actionMessage, setActionMessage] = useState<string>("");

  const copy = {
    back: language === "id" ? "Kembali ke Browse Template" : "Back to Browse Templates",
    liveDemo: language === "id" ? "Live Demo" : "Live Demo",
    consult: language === "id" ? "Konsultasi Sekarang" : "Consult Now",
    keyFeatures: language === "id" ? "Fitur Utama" : "Key Features",
    testimonial: language === "id" ? "Testimoni Pengguna" : "User Testimonial",
    statusReady: language === "id" ? "Siap Pakai" : "Ready to Use",
    bestSeller: language === "id" ? "Best Seller" : "Best Seller",
    notFoundTitle: language === "id" ? "Template tidak ditemukan" : "Template not found",
    notFoundSubtitle:
      language === "id"
        ? "Template mungkin sudah dihapus atau URL tidak valid."
        : "The template may have been removed or the URL is invalid.",
    buyNow: language === "id" ? "Beli Sekarang" : "Buy Now",
    buyProcessing:
      language === "id" ? "Mengarahkan ke pembayaran..." : "Redirecting to checkout...",
    downloadNow: language === "id" ? "Download Template" : "Download Template",
    unlocked:
      language === "id"
        ? "Template ini sudah kamu beli. Silakan download."
        : "You already purchased this template. Download is ready.",
    paymentSuccess:
      language === "id"
        ? "Pembayaran berhasil diproses. Akses download sudah dibuka."
        : "Payment success. Download access is now available.",
    paymentPending:
      language === "id"
        ? "Pembayaran sedang diproses. Tunggu beberapa saat lalu refresh."
        : "Payment is being processed. Please wait and refresh shortly.",
    paymentFailed:
      language === "id"
        ? "Pembayaran gagal atau dibatalkan. Silakan coba lagi."
        : "Payment failed or cancelled. Please try again.",
    loginToBuy:
      language === "id"
        ? "Login dulu untuk melanjutkan pembayaran."
        : "Please log in before checkout.",
  };

  useEffect(() => {
    if (!slug) return;

    let cancelled = false;
    const syncAccess = async () => {
      setIsCheckingAccess(true);
      try {
        const response = await fetch(
          `/api/payments/doku/checkout?action=status&slug=${encodeURIComponent(slug)}`,
          {
            cache: "no-store",
          }
        );
        const payload = (await response.json()) as {
          ok?: boolean;
          loginRequired?: boolean;
          purchased?: boolean;
        };

        if (cancelled) return;

        setLoginRequired(Boolean(payload.loginRequired));
        setHasAccess(Boolean(payload.purchased));
      } catch {
        if (cancelled) return;
        setLoginRequired(true);
        setHasAccess(false);
      } finally {
        if (!cancelled) setIsCheckingAccess(false);
      }
    };

    void syncAccess();

    return () => {
      cancelled = true;
    };
  }, [slug]);

  useEffect(() => {
    if (paymentStatus === "success") {
      setActionMessage(copy.paymentSuccess);
      return;
    }

    if (paymentStatus === "pending") {
      setActionMessage(copy.paymentPending);
      return;
    }

    if (paymentStatus === "failed") {
      setActionMessage(copy.paymentFailed);
    }
  }, [copy.paymentFailed, copy.paymentPending, copy.paymentSuccess, paymentStatus]);

  const handleStartCheckout = async () => {
    if (!template) return;

    if (loginRequired) {
      setActionMessage(copy.loginToBuy);
      router.push(`/login?next=${encodeURIComponent(`/browse-template/${template.slug}`)}`);
      return;
    }

    setActionMessage("");
    setIsCheckoutLoading(true);
    try {
      const response = await fetch("/api/payments/doku/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateSlug: template.slug }),
      });
      const payload = (await response.json()) as {
        ok?: boolean;
        alreadyPurchased?: boolean;
        downloadUrl?: string;
        paymentUrl?: string;
        message?: string;
      };

      if (!response.ok || !payload.ok) {
        setActionMessage(payload.message ?? copy.paymentFailed);
        return;
      }

      if (payload.alreadyPurchased && payload.downloadUrl) {
        window.location.href = payload.downloadUrl;
        return;
      }

      if (payload.paymentUrl) {
        window.location.href = payload.paymentUrl;
        return;
      }

      setActionMessage(copy.paymentFailed);
    } catch {
      setActionMessage(copy.paymentFailed);
    } finally {
      setIsCheckoutLoading(false);
    }
  };

  const handleDownload = () => {
    if (!template) return;
    window.location.href = `/api/payments/doku/checkout?action=download&slug=${encodeURIComponent(template.slug)}`;
  };

  if (!template) {
    return (
      <main className="mx-auto min-h-screen w-full max-w-5xl px-5 pt-[116px] pb-16 md:pt-[128px] md:pb-24 lg:pt-[140px]">
        <Card className="border-border/80">
          <CardContent className="space-y-4 p-6">
            <h1 className="text-2xl font-semibold">{copy.notFoundTitle}</h1>
            <p className="text-muted-foreground">{copy.notFoundSubtitle}</p>
            <Button asChild>
              <Link href="/browse-template">{copy.back}</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  const demoHref = template.project_link?.trim().length
    ? template.project_link
    : template.case_study_link && template.case_study_link !== "#"
      ? template.case_study_link
      : null;

  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl space-y-8 px-5 pt-[116px] pb-16 md:pt-[128px] md:pb-24 lg:pt-[140px]">
      <section className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {template.isBestSeller ? <Badge variant="default">{copy.bestSeller}</Badge> : null}
          <Badge variant="outline">{template.statusLabel || copy.statusReady}</Badge>
          <Badge variant="secondary">{template.framework}</Badge>
          <Badge variant="outline">{template.category}</Badge>
          <Badge variant="outline">{template.useCase}</Badge>
          <Badge variant="outline">{formatIdr(template.price)}</Badge>
        </div>
        <h1 className="text-3xl font-semibold text-foreground md:text-4xl">
          {template.project_title}
        </h1>
        <p className="max-w-3xl text-muted-foreground">{template.description}</p>
        {hasAccess ? (
          <div className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300">
            {copy.unlocked}
          </div>
        ) : null}
        {actionMessage ? (
          <div className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-300">
            {actionMessage}
          </div>
        ) : null}
        <div className="flex flex-wrap gap-2">
          {hasAccess ? (
            <Button onClick={handleDownload}>{copy.downloadNow}</Button>
          ) : (
            <Button
              onClick={() => void handleStartCheckout()}
              disabled={isCheckoutLoading || isCheckingAccess}
            >
              {isCheckoutLoading ? copy.buyProcessing : copy.buyNow}
            </Button>
          )}
          <Button variant="outline" asChild>
            <Link href="/browse-template">{copy.back}</Link>
          </Button>
          {demoHref ? (
            <Button asChild>
              <Link href={demoHref} target="_blank" rel="noopener noreferrer">
                {copy.liveDemo}
              </Link>
            </Button>
          ) : null}
          <Button variant="secondary" asChild>
            <Link href="/#contact-section">{copy.consult}</Link>
          </Button>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="overflow-hidden border-border/80 lg:col-span-2">
          <CardContent className="p-4">
            <ImageCarousel
              images={template.demo_images}
              caseStudyId={template.catalogIndex}
              caseStudyName={template.name}
            />
          </CardContent>
        </Card>

        <Card className="border-border/80">
          <CardContent className="space-y-4 p-5">
            <h2 className="text-lg font-semibold">{copy.keyFeatures}</h2>
            <ul className="list-disc space-y-2 pl-4 text-sm text-muted-foreground">
              {template.features.map((feature, index) => (
                <li key={`${template.slug}-feature-${index}`}>{feature}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </section>

      {template.testimonial ? (
        <section>
          <Card className="border-border/80">
            <CardContent className="space-y-3 p-5">
              <h2 className="text-lg font-semibold">{copy.testimonial}</h2>
              <blockquote className="italic text-muted-foreground">
                {template.testimonial}
              </blockquote>
              {template.founder_name ? (
                <p className="text-sm font-medium text-foreground">
                  {template.founder_name}
                  {template.position ? `, ${template.position}` : ""}
                </p>
              ) : null}
            </CardContent>
          </Card>
        </section>
      ) : null}
    </main>
  );
}
