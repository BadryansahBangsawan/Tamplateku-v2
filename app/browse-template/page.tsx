"use client";

import { useLanguage } from "@/components/language-provider";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCaseStudies } from "@/hooks/use-case-studies";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function BrowseTemplateContent() {
  const caseStudies = useCaseStudies();
  const { language } = useLanguage();
  const searchParams = useSearchParams();
  const loginStatus = searchParams.get("google");

  const copy = {
    title: language === "id" ? "Browse Template" : "Browse Templates",
    subtitle:
      language === "id"
        ? "Lihat semua koleksi template dan preview gambarnya."
        : "Explore all template collections and image previews.",
    premium: language === "id" ? "Template Premium" : "Premium Template",
    loginSuccess:
      language === "id"
        ? "Login Google berhasil. Silakan pilih template yang kamu suka."
        : "Google sign-in successful. Pick a template you like.",
  };

  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl px-5 pt-[116px] pb-16 md:pt-[128px] md:pb-24 lg:pt-[140px]">
      <section className="space-y-8">
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold text-foreground md:text-4xl">{copy.title}</h1>
          <p className="text-muted-foreground">{copy.subtitle}</p>
        </header>

        {loginStatus === "success" ? (
          <div className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300">
            {copy.loginSuccess}
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {caseStudies.map((item, index) => (
            <Card
              key={item.id ?? `${item.name}-${index}`}
              className="overflow-hidden border-border/80"
            >
              <CardHeader className="space-y-2 pb-3">
                <Badge variant="secondary" className="w-fit rounded-full">
                  {copy.premium}
                </Badge>
                <CardTitle className="line-clamp-2 text-lg">{item.project_title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="overflow-hidden rounded-xl border bg-muted/30">
                  <img
                    src={item.main_image_src}
                    alt={`Preview ${item.name}`}
                    className="aspect-[16/10] h-full w-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
                <p className="line-clamp-2 text-sm text-muted-foreground">{item.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
}

export default function BrowseTemplatePage() {
  return (
    <Suspense fallback={null}>
      <BrowseTemplateContent />
    </Suspense>
  );
}
