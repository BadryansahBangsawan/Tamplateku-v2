export type BlogPostItem = {
  id: number;
  title: string;
  excerpt: string;
  image: string;
  date: string;
  publishedAt: string;
  tag: string;
  slug: string;
  isTopPick: boolean;
};

export const blogPosts: BlogPostItem[] = [
  {
    id: 1,
    title: "Cara Memilih Template Landing Page yang Siap Closing",
    excerpt:
      "Panduan memilih template premium berdasarkan tujuan bisnis, audiens, dan target konversi.",
    image: "/tamplate/tamplate-1.png",
    date: "Aug 16, 2025",
    publishedAt: "2025-08-16",
    tag: "Landing Page",
    slug: "cara-memilih-template-landing-page-siap-closing",
    isTopPick: true,
  },
  {
    id: 2,
    title: "Checklist Website Company Profile yang Terlihat Premium",
    excerpt:
      "Elemen penting agar website company profile tampak profesional dan mudah dipercaya calon klien.",
    image: "/tamplate/tamplate-2.png",
    date: "Aug 14, 2025",
    publishedAt: "2025-08-14",
    tag: "Company Profile",
    slug: "checklist-website-company-profile-premium",
    isTopPick: true,
  },
  {
    id: 3,
    title: "Struktur Halaman Jasa yang Bikin Visitor Mau Kontak",
    excerpt:
      "Susunan section jasa yang terbukti membantu pengunjung memahami nilai layanan dengan cepat.",
    image: "/tamplate/tamplate-3.png",
    date: "Aug 12, 2025",
    publishedAt: "2025-08-12",
    tag: "Copywriting",
    slug: "struktur-halaman-jasa-bikin-visitor-kontak",
    isTopPick: true,
  },
  {
    id: 4,
    title: "Tips Menulis Hero Section untuk Website Bisnis",
    excerpt:
      "Formula sederhana untuk menulis headline dan subheadline yang langsung menjelaskan value bisnis kamu.",
    image: "/tamplate/tamplate-1.png",
    date: "Aug 10, 2025",
    publishedAt: "2025-08-10",
    tag: "UI Copy",
    slug: "tips-menulis-hero-section-website-bisnis",
    isTopPick: false,
  },
  {
    id: 5,
    title: "Optimasi CTA di Template Website: Praktik Terbaik",
    excerpt:
      "Posisi dan wording CTA yang tepat bisa meningkatkan rasio klik tanpa mengubah layout desain.",
    image: "/tamplate/tamplate-2.png",
    date: "Aug 9, 2025",
    publishedAt: "2025-08-09",
    tag: "Conversion",
    slug: "optimasi-cta-template-website-praktik-terbaik",
    isTopPick: false,
  },
  {
    id: 6,
    title: "Desain Mobile-First untuk Template Website Modern",
    excerpt: "Cara memastikan tampilan mobile tetap premium, cepat, dan nyaman dipakai pengunjung.",
    image: "/tamplate/tamplate-3.png",
    date: "Aug 7, 2025",
    publishedAt: "2025-08-07",
    tag: "Mobile UX",
    slug: "desain-mobile-first-template-website-modern",
    isTopPick: false,
  },
  {
    id: 7,
    title: "Cara Menjaga Konsistensi Brand di Seluruh Halaman Website",
    excerpt: "Panduan menjaga warna, tipografi, dan tone konten agar pengalaman brand tetap kuat.",
    image: "/tamplate/tamplate-1.png",
    date: "Aug 5, 2025",
    publishedAt: "2025-08-05",
    tag: "Branding",
    slug: "cara-menjaga-konsistensi-brand-di-seluruh-halaman-website",
    isTopPick: false,
  },
  {
    id: 8,
    title: "Pre-Launch Checklist Sebelum Website Go Live",
    excerpt:
      "Langkah final sebelum publish agar website siap dipromosikan tanpa kendala dasar teknis.",
    image: "/tamplate/tamplate-2.png",
    date: "Aug 3, 2025",
    publishedAt: "2025-08-03",
    tag: "Launch",
    slug: "pre-launch-checklist-sebelum-website-go-live",
    isTopPick: false,
  },
];
