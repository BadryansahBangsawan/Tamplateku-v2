import { type CaseStudyType, caseStudies as defaultCaseStudies } from "@/data/caseStudies";

export const CASE_STUDIES_STORAGE_KEY = "tamplateku-case-studies-v1";
export const CASE_STUDIES_UPDATED_EVENT = "case-studies-updated";

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter((item) => item.length > 0);
}

function pickString(raw: Record<string, unknown>, key: string, fallback: string): string {
  return typeof raw[key] === "string" ? (raw[key] as string) : fallback;
}

function pickOptionalString(
  raw: Record<string, unknown>,
  key: string,
  fallback: string | null | undefined
): string | null | undefined {
  return typeof raw[key] === "string" ? (raw[key] as string) : fallback;
}

function cloneDefaults(): CaseStudyType[] {
  return defaultCaseStudies.map((item) => ({
    ...item,
    features: [...item.features],
    demo_images: [...item.demo_images],
  }));
}

function normalizeCaseStudy(raw: unknown, fallback: CaseStudyType): CaseStudyType {
  if (!isObject(raw)) {
    return {
      ...fallback,
      features: [...fallback.features],
      demo_images: [...fallback.demo_images],
    };
  }

  return {
    id: typeof raw.id === "string" ? raw.id : fallback.id,
    main_image_src: pickString(raw, "main_image_src", fallback.main_image_src),
    project_title: pickString(raw, "project_title", fallback.project_title),
    logo_src: pickString(raw, "logo_src", fallback.logo_src),
    description: pickString(raw, "description", fallback.description),
    features: toStringArray(raw.features).length
      ? toStringArray(raw.features)
      : [...fallback.features],
    case_study_link: pickString(raw, "case_study_link", fallback.case_study_link),
    name: pickString(raw, "name", fallback.name),
    demo_images: toStringArray(raw.demo_images).length
      ? toStringArray(raw.demo_images)
      : [...fallback.demo_images],
    project_link: pickOptionalString(raw, "project_link", fallback.project_link ?? null),
    cta_links:
      isObject(raw.cta_links) &&
      typeof raw.cta_links["let's talk"] === "string" &&
      typeof raw.cta_links["read case study"] === "string"
        ? {
            "let's talk": raw.cta_links["let's talk"],
            "read case study": raw.cta_links["read case study"],
          }
        : fallback.cta_links,
    test_img: typeof raw.test_img === "string" ? raw.test_img : fallback.test_img,
    testimonial: typeof raw.testimonial === "string" ? raw.testimonial : fallback.testimonial,
    founder_name: typeof raw.founder_name === "string" ? raw.founder_name : fallback.founder_name,
    position: typeof raw.position === "string" ? raw.position : fallback.position,
  };
}

export function parseCaseStudies(raw: string | null): CaseStudyType[] {
  const defaults = cloneDefaults();
  if (!raw) return defaults;

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return defaults;

    const normalized = parsed
      .filter((item) => isObject(item))
      .map((item, index) => normalizeCaseStudy(item, defaults[index % defaults.length]));

    return normalized.length > 0 ? normalized : defaults;
  } catch {
    return defaults;
  }
}

export function readCaseStudiesFromStorage(): CaseStudyType[] {
  if (typeof window === "undefined") return cloneDefaults();
  return parseCaseStudies(window.localStorage.getItem(CASE_STUDIES_STORAGE_KEY));
}

export function writeCaseStudiesToStorage(caseStudies: CaseStudyType[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CASE_STUDIES_STORAGE_KEY, JSON.stringify(caseStudies));
  window.dispatchEvent(new Event(CASE_STUDIES_UPDATED_EVENT));
}

export function resetCaseStudiesStorage(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(CASE_STUDIES_STORAGE_KEY);
  window.dispatchEvent(new Event(CASE_STUDIES_UPDATED_EVENT));
}

export const defaultCaseStudiesContent: CaseStudyType[] = cloneDefaults();
