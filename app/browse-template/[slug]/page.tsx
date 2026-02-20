"use client";

import ImageCarousel from "@/components/custom/ImageCarousel";
import { useLanguage } from "@/components/language-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useCaseStudies } from "@/hooks/use-case-studies";
import { enrichTemplates, formatIdr } from "@/lib/templateCatalog";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo } from "react";

export const runtime = "edge";

export default function BrowseTemplateDetailPage() {
  const caseStudies = useCaseStudies();
  const templates = useMemo(() => enrichTemplates(caseStudies), [caseStudies]);
  const params = useParams<{ slug: string }>();
  const slug = typeof params.slug === "string" ? params.slug : "";
  const { language } = useLanguage();

  const template = templates.find((item) => item.slug === slug);

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
        <div className="flex flex-wrap gap-2">
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
