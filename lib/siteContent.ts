export const SITE_CONTENT_STORAGE_KEY = "tamplateku-site-content-v1";
export const SITE_CONTENT_UPDATED_EVENT = "site-content-updated";

export type SiteContent = {
  hero: {
    badge: string;
    heading: string;
    description: string;
    primaryCta: string;
    secondaryCta: string;
  };
  caseStudies: {
    badge: string;
    heading: string;
    description: string;
    buttonLabel: string;
  };
  process: {
    badge: string;
    heading: string;
    description: string;
  };
  testimonials: {
    badge: string;
    heading: string;
    description: string;
    statOneLabel: string;
    statTwoLabel: string;
    statThreeLabel: string;
  };
  contact: {
    badge: string;
    heading: string;
    description: string;
    nameLabel: string;
    namePlaceholder: string;
    emailLabel: string;
    emailPlaceholder: string;
    messageLabel: string;
    messagePlaceholder: string;
    submitLabel: string;
  };
};

export const defaultSiteContent: SiteContent = {
  hero: {
    badge: "Template Website Premium",
    heading: "Template Website Premium Siap Pakai",
    description:
      "Pilih template website premium untuk company profile, agency, landing page, sampai toko online. Tinggal edit konten, publish, dan website kamu langsung terlihat profesional.",
    primaryCta: "Lihat Koleksi Template",
    secondaryCta: "Konsultasi Kebutuhan",
  },
  caseStudies: {
    badge: "Template Pilihan",
    heading: "Template terlaris Tamplateku",
    description:
      "Koleksi template website premium untuk berbagai kebutuhan brand. Semua dirancang untuk tampil profesional, cepat dibuka, dan mudah di-custom.",
    buttonLabel: "Lihat detail template",
  },
  process: {
    badge: "Proses Tamplateku",
    heading: "Dari pilih template sampai siap tayang",
    description:
      "Alur kerja kami sederhana, cepat, dan fokus ke hasil: website premium yang siap bantu brand kamu terlihat lebih kredibel dan lebih mudah closing.",
  },
  testimonials: {
    badge: "Testimonials",
    heading: "Review dari pengguna Tamplateku",
    description:
      "Lihat pengalaman klien setelah menggunakan template premium dari Tamplateku.",
    statOneLabel: "Template premium terpublish",
    statTwoLabel: "Brand dari berbagai niche",
    statThreeLabel: "Nilai transaksi dari implementasi klien",
  },
  contact: {
    badge: "Hubungi Kami",
    heading: "Konsultasi kebutuhan website kamu",
    description:
      "Cerita singkat tentang bisnis kamu, nanti tim Tamplateku bantu rekomendasikan template premium yang paling cocok.",
    nameLabel: "Nama",
    namePlaceholder: "Masukkan nama kamu",
    emailLabel: "Email",
    emailPlaceholder: "Masukkan email kamu",
    messageLabel: "Pesan",
    messagePlaceholder: "Ceritakan kebutuhan website kamu...",
    submitLabel: "Kirim Pesan",
  },
};

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function mergeSiteContent<T extends Record<string, unknown>>(
  base: T,
  override: unknown,
): T {
  if (!isObject(override)) return base;

  const merged: Record<string, unknown> = {
    ...(base as Record<string, unknown>),
  };
  for (const [key, value] of Object.entries(override)) {
    const baseValue = merged[key];
    if (isObject(baseValue) && isObject(value)) {
      merged[key] = mergeSiteContent(baseValue, value);
      continue;
    }

    merged[key] = value;
  }

  return merged as T;
}

export function parseSiteContent(raw: string | null): SiteContent {
  if (!raw) return defaultSiteContent;

  try {
    const parsed = JSON.parse(raw);
    return mergeSiteContent(defaultSiteContent, parsed);
  } catch {
    return defaultSiteContent;
  }
}

export function readSiteContentFromStorage(): SiteContent {
  if (typeof window === "undefined") return defaultSiteContent;
  return parseSiteContent(
    window.localStorage.getItem(SITE_CONTENT_STORAGE_KEY),
  );
}

export function writeSiteContentToStorage(content: SiteContent): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    SITE_CONTENT_STORAGE_KEY,
    JSON.stringify(content),
  );
  window.dispatchEvent(new Event(SITE_CONTENT_UPDATED_EVENT));
}

export function resetSiteContentStorage(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(SITE_CONTENT_STORAGE_KEY);
  window.dispatchEvent(new Event(SITE_CONTENT_UPDATED_EVENT));
}
