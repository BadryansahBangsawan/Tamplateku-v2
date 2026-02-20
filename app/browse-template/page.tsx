"use client";

import { useLanguage } from "@/components/language-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCaseStudies } from "@/hooks/use-case-studies";
import {
  type PriceFilter,
  type SortOption,
  enrichTemplates,
  formatIdr,
  priceMatchesFilter,
  sortTemplates,
} from "@/lib/templateCatalog";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";

function BrowseTemplateContent() {
  const caseStudies = useCaseStudies();
  const templates = useMemo(() => enrichTemplates(caseStudies), [caseStudies]);
  const { language } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const loginStatus = searchParams.get("google");
  const [query, setQuery] = useState("");
  const [frameworkFilter, setFrameworkFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [useCaseFilter, setUseCaseFilter] = useState("all");
  const [priceFilter, setPriceFilter] = useState<PriceFilter>("all");
  const [sortBy, setSortBy] = useState<SortOption>("latest");
  const [processingSlug, setProcessingSlug] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState("");

  const copy = {
    title: language === "id" ? "Browse Template" : "Browse Templates",
    subtitle:
      language === "id"
        ? "Pilih template premium berdasarkan framework, kategori, use case, dan budget."
        : "Pick premium templates by framework, category, use case, and budget.",
    premium: language === "id" ? "Template Premium" : "Premium Template",
    loginSuccess:
      language === "id"
        ? "Login Google berhasil. Silakan pilih template yang kamu suka."
        : "Google sign-in successful. Pick a template you like.",
    filters: language === "id" ? "Filter Template" : "Template Filters",
    searchPlaceholder:
      language === "id"
        ? "Cari nama template, deskripsi, atau judul..."
        : "Search template name, description, or title...",
    framework: language === "id" ? "Framework" : "Framework",
    category: language === "id" ? "Kategori" : "Category",
    useCase: language === "id" ? "Use Case" : "Use Case",
    price: language === "id" ? "Harga" : "Price",
    sort: language === "id" ? "Urutkan" : "Sort",
    all: language === "id" ? "Semua" : "All",
    noResults:
      language === "id"
        ? "Template tidak ditemukan. Coba ubah filter atau kata kunci."
        : "No templates found. Try changing your filters or search.",
    detail: language === "id" ? "Detail" : "Detail",
    buyNow: language === "id" ? "Beli" : "Buy",
    buyProcessing: language === "id" ? "Memproses..." : "Processing...",
    liveDemo: language === "id" ? "Live Demo" : "Live Demo",
    statusReady: language === "id" ? "Siap Pakai" : "Ready to Use",
    bestSeller: language === "id" ? "Best Seller" : "Best Seller",
    latest: language === "id" ? "Terbaru" : "Latest",
    oldest: language === "id" ? "Terlama" : "Oldest",
    cheapest: language === "id" ? "Termurah" : "Cheapest",
    expensive: language === "id" ? "Termahal" : "Most Expensive",
    templatesFound:
      language === "id"
        ? (count: number) => `${count} template ditemukan`
        : (count: number) => `${count} templates found`,
    paymentFailed:
      language === "id"
        ? "Gagal membuat checkout. Coba lagi sebentar."
        : "Failed to create checkout. Please try again.",
  };

  const handleBuyTemplate = async (templateSlug: string) => {
    setActionMessage("");
    setProcessingSlug(templateSlug);
    try {
      const response = await fetch("/api/payments/doku/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateSlug }),
      });

      const rawText = await response.text();
      let payload = {} as {
        ok?: boolean;
        paymentUrl?: string;
        alreadyPurchased?: boolean;
        downloadUrl?: string;
        message?: string;
      };
      try {
        payload = rawText ? (JSON.parse(rawText) as typeof payload) : {};
      } catch {
        const trimmed = rawText.trim();
        const lower = trimmed.toLowerCase();
        const isHtml =
          lower.startsWith("<!doctype") || lower.startsWith("<html") || lower.startsWith("<!--[if");
        payload = {
          message: isHtml ? undefined : trimmed.slice(0, 200) || undefined,
        };
      }

      if (response.status === 401) {
        router.push(`/login?next=${encodeURIComponent(`/browse-template/${templateSlug}`)}`);
        return;
      }

      if (!response.ok || !payload.ok) {
        setActionMessage(payload.message ?? `${copy.paymentFailed} (HTTP ${response.status})`);
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
      setProcessingSlug(null);
    }
  };

  const frameworkOptions = useMemo(
    () => Array.from(new Set(templates.map((item) => item.framework))),
    [templates]
  );
  const categoryOptions = useMemo(
    () => Array.from(new Set(templates.map((item) => item.category))),
    [templates]
  );
  const useCaseOptions = useMemo(
    () => Array.from(new Set(templates.map((item) => item.useCase))),
    [templates]
  );

  const filteredTemplates = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return templates.filter((item) => {
      const searchable = `${item.name} ${item.project_title} ${item.description}`.toLowerCase();
      const queryMatched = normalizedQuery.length === 0 || searchable.includes(normalizedQuery);
      const frameworkMatched = frameworkFilter === "all" || item.framework === frameworkFilter;
      const categoryMatched = categoryFilter === "all" || item.category === categoryFilter;
      const useCaseMatched = useCaseFilter === "all" || item.useCase === useCaseFilter;
      const priceMatched = priceMatchesFilter(item.price, priceFilter);

      return queryMatched && frameworkMatched && categoryMatched && useCaseMatched && priceMatched;
    });
  }, [categoryFilter, frameworkFilter, priceFilter, query, templates, useCaseFilter]);

  const displayedTemplates = useMemo(
    () => sortTemplates(filteredTemplates, sortBy),
    [filteredTemplates, sortBy]
  );

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
        {actionMessage ? (
          <div className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-300">
            {actionMessage}
          </div>
        ) : null}

        <Card className="border-border/80">
          <CardHeader className="space-y-1 pb-3">
            <CardTitle className="text-base">{copy.filters}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={copy.searchPlaceholder}
            />
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-5">
              <Select value={frameworkFilter} onValueChange={setFrameworkFilter}>
                <SelectTrigger>
                  <SelectValue placeholder={copy.framework} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{`${copy.framework}: ${copy.all}`}</SelectItem>
                  {frameworkOptions.map((framework) => (
                    <SelectItem key={framework} value={framework}>
                      {framework}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder={copy.category} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{`${copy.category}: ${copy.all}`}</SelectItem>
                  {categoryOptions.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={useCaseFilter} onValueChange={setUseCaseFilter}>
                <SelectTrigger>
                  <SelectValue placeholder={copy.useCase} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{`${copy.useCase}: ${copy.all}`}</SelectItem>
                  {useCaseOptions.map((useCase) => (
                    <SelectItem key={useCase} value={useCase}>
                      {useCase}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={priceFilter}
                onValueChange={(value) => setPriceFilter(value as PriceFilter)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={copy.price} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{`${copy.price}: ${copy.all}`}</SelectItem>
                  <SelectItem value="under-300k">{"< Rp300.000"}</SelectItem>
                  <SelectItem value="300k-349k">Rp300.000 - Rp349.999</SelectItem>
                  <SelectItem value="350k-plus">{">= Rp350.000"}</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
                <SelectTrigger>
                  <SelectValue placeholder={copy.sort} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="latest">{copy.latest}</SelectItem>
                  <SelectItem value="oldest">{copy.oldest}</SelectItem>
                  <SelectItem value="price-asc">{copy.cheapest}</SelectItem>
                  <SelectItem value="price-desc">{copy.expensive}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <p className="text-sm text-muted-foreground">
          {copy.templatesFound(displayedTemplates.length)}
        </p>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {displayedTemplates.map((item) => {
            const demoHref = item.project_link?.trim().length
              ? item.project_link
              : item.case_study_link && item.case_study_link !== "#"
                ? item.case_study_link
                : null;

            return (
              <Card key={item.id ?? item.slug} className="overflow-hidden border-border/80">
                <CardHeader className="space-y-2 pb-3">
                  <Badge variant="secondary" className="w-fit rounded-full">
                    {copy.premium}
                  </Badge>
                  <div className="flex flex-wrap gap-2">
                    {item.isBestSeller ? <Badge variant="default">{copy.bestSeller}</Badge> : null}
                    <Badge variant="outline">{item.statusLabel || copy.statusReady}</Badge>
                    <Badge variant="outline">{item.framework}</Badge>
                    <Badge variant="outline">{item.category}</Badge>
                  </div>
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
                  <p className="text-sm font-medium text-foreground">{formatIdr(item.price)}</p>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => void handleBuyTemplate(item.slug)}
                      disabled={processingSlug === item.slug}
                    >
                      {processingSlug === item.slug ? copy.buyProcessing : copy.buyNow}
                    </Button>
                    {demoHref ? (
                      <Button variant="outline" size="sm" asChild>
                        <Link href={demoHref} target="_blank" rel="noopener noreferrer">
                          {copy.liveDemo}
                        </Link>
                      </Button>
                    ) : (
                      <Button variant="outline" size="sm" disabled>
                        {copy.liveDemo}
                      </Button>
                    )}
                    <Button size="sm" asChild>
                      <Link href={`/browse-template/${item.slug}`}>{copy.detail}</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {displayedTemplates.length === 0 ? (
          <div className="rounded-md border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
            {copy.noResults}
          </div>
        ) : null}
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
