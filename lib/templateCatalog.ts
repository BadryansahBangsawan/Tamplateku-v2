import type { CaseStudyType } from "@/data/caseStudies";

export type PriceFilter = "all" | "under-300k" | "300k-349k" | "350k-plus";
export type SortOption = "latest" | "oldest" | "price-asc" | "price-desc";

export type EnrichedTemplate = CaseStudyType & {
  catalogIndex: number;
  slug: string;
  framework: string;
  category: string;
  useCase: string;
  price: number;
  statusLabel: string;
  isBestSeller: boolean;
};

const PRICE_BASE = 299_000;
const PRICE_STEP = 50_000;

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function parseFramework(logoSrc: string): string {
  const value = logoSrc.toLowerCase();
  if (value.includes("nextjs")) return "Next.js";
  if (value.includes("react")) return "React";
  if (value.includes("vue")) return "Vue";
  if (value.includes("nuxt")) return "Nuxt";
  if (value.includes("remix")) return "Remix";
  if (value.includes("gatsby")) return "Gatsby";
  return "Web";
}

function parseCategory(item: CaseStudyType): string {
  const text = `${item.name} ${item.project_title}`.toLowerCase();
  if (text.includes("landing")) return "Landing Page";
  if (text.includes("saas")) return "SaaS";
  if (text.includes("company profile") || text.includes("brand profile")) return "Company Profile";
  if (text.includes("dashboard")) return "Dashboard";
  if (text.includes("portfolio")) return "Portfolio";
  return "Business Website";
}

function parseUseCase(item: CaseStudyType): string {
  const text = `${item.name} ${item.project_title} ${item.description}`.toLowerCase();
  if (text.includes("b2b")) return "B2B Lead Generation";
  if (text.includes("startup")) return "Startup Launch";
  if (text.includes("agency")) return "Agency Website";
  if (text.includes("personal brand")) return "Personal Branding";
  if (text.includes("company profile")) return "Brand Profile";
  return "General Business";
}

export function enrichTemplate(item: CaseStudyType, index: number): EnrichedTemplate {
  const slugBase = `${item.name}-${index + 1}`;
  const statusLabel = item.status_label?.trim().length ? item.status_label.trim() : "Ready to Use";
  const isBestSeller = Boolean(item.is_best_seller) || index < 2;

  return {
    ...item,
    catalogIndex: index,
    slug: slugify(slugBase),
    framework: parseFramework(item.logo_src),
    category: parseCategory(item),
    useCase: parseUseCase(item),
    price: PRICE_BASE + index * PRICE_STEP,
    statusLabel,
    isBestSeller,
  };
}

export function enrichTemplates(items: CaseStudyType[]): EnrichedTemplate[] {
  return items.map((item, index) => enrichTemplate(item, index));
}

export function priceMatchesFilter(price: number, filter: PriceFilter): boolean {
  if (filter === "under-300k") return price < 300_000;
  if (filter === "300k-349k") return price >= 300_000 && price < 350_000;
  if (filter === "350k-plus") return price >= 350_000;
  return true;
}

export function formatIdr(price: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(price);
}

export function sortTemplates(items: EnrichedTemplate[], sortBy: SortOption): EnrichedTemplate[] {
  const sorted = [...items];

  if (sortBy === "latest") {
    sorted.sort((a, b) => b.catalogIndex - a.catalogIndex);
    return sorted;
  }
  if (sortBy === "oldest") {
    sorted.sort((a, b) => a.catalogIndex - b.catalogIndex);
    return sorted;
  }
  if (sortBy === "price-desc") {
    sorted.sort((a, b) => b.price - a.price);
    return sorted;
  }

  sorted.sort((a, b) => a.price - b.price);
  return sorted;
}
