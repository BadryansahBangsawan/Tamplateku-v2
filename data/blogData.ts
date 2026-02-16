export interface BlogPost {
  id: string;
  title: string;
  date: string;
  tag: string;
  image: string;
  excerpt: string;
  slug: string;
  isTopPick?: boolean;
}

export const blogPosts: BlogPost[] = [
  {
    id: "1",
    title: "Cara Memilih Template Landing Page yang Siap Closing",
    date: "16 Aug 2025",
    tag: "Landing Page",
    image: "https://res.cloudinary.com/dieth2xb3/image/upload/v1755804235/aaaimage_zbypst.png",
    excerpt:
      "Panduan memilih template premium berdasarkan tujuan bisnis, audiens, dan target konversi.",
    slug: "future-ai-business-comprehensive-guide",
    isTopPick: true,
  },
  {
    id: "2",
    title: "Checklist Website Company Profile yang Terlihat Premium",
    date: "16 Aug 2025",
    tag: "Company Profile",
    image: "https://res.cloudinary.com/dieth2xb3/image/upload/v1755804235/aaaimage_zbypst.png",
    excerpt:
      "Elemen penting agar website company profile tampak profesional dan mudah dipercaya calon klien.",
    slug: "building-scalable-machine-learning-pipelines",
    isTopPick: true,
  },
  {
    id: "3",
    title: "Struktur Halaman Jasa yang Bikin Visitor Mau Kontak",
    date: "16 Aug 2025",
    tag: "Copywriting",
    image: "https://res.cloudinary.com/dieth2xb3/image/upload/v1755804235/aaaimage_zbypst.png",
    excerpt:
      "Susunan section jasa yang membantu pengunjung memahami value layanan dengan cepat.",
    slug: "custom-llm-development-concept-deployment",
    isTopPick: true,
  },
  {
    id: "4",
    title: "Tips Menulis Hero Section untuk Website Bisnis",
    date: "16 Aug 2025",
    tag: "UI Copy",
    image: "https://res.cloudinary.com/dieth2xb3/image/upload/v1755804235/aaaimage_zbypst.png",
    excerpt:
      "Formula headline dan subheadline agar pesan utama bisnis langsung tertangkap.",
    slug: "data-privacy-ai-compliance-best-practices",
  },
  {
    id: "5",
    title: "Optimasi CTA di Template Website: Praktik Terbaik",
    date: "16 Aug 2025",
    tag: "Conversion",
    image: "https://res.cloudinary.com/dieth2xb3/image/upload/v1755804235/aaaimage_zbypst.png",
    excerpt:
      "Posisi dan wording CTA yang tepat untuk meningkatkan klik tanpa ubah layout.",
    slug: "generative-ai-tools-content-creation",
  },
  {
    id: "6",
    title: "Desain Mobile-First untuk Template Website Modern",
    date: "16 Aug 2025",
    tag: "Mobile UX",
    image: "https://res.cloudinary.com/dieth2xb3/image/upload/v1755804235/aaaimage_zbypst.png",
    excerpt:
      "Pastikan tampilan mobile tetap premium, cepat, dan nyaman untuk pengunjung.",
    slug: "ai-ethics-building-responsible-ai-systems",
  },
  {
    id: "7",
    title: "Cara Menjaga Konsistensi Brand di Seluruh Halaman Website",
    date: "16 Aug 2025",
    tag: "Branding",
    image: "https://res.cloudinary.com/dieth2xb3/image/upload/v1755804235/aaaimage_zbypst.png",
    excerpt:
      "Panduan menjaga warna, tipografi, dan tone konten agar brand terasa konsisten.",
    slug: "edge-ai-bringing-intelligence-edge",
  },
  {
    id: "8",
    title: "Pre-Launch Checklist Sebelum Website Go Live",
    date: "16 Aug 2025",
    tag: "Launch",
    image: "https://res.cloudinary.com/dieth2xb3/image/upload/v1755804235/aaaimage_zbypst.png",
    excerpt:
      "Langkah final sebelum publish agar website siap dipromosikan tanpa kendala.",
    slug: "ai-model-optimization-performance-efficiency",
  },
  {
    id: "9",
    title: "Cara Menentukan Prioritas Halaman Website di Awal",
    date: "16 Aug 2025",
    tag: "Website Strategy",
    image: "https://res.cloudinary.com/dieth2xb3/image/upload/v1755804235/aaaimage_zbypst.png",
    excerpt: "Fokuskan halaman inti dulu agar website bisa live cepat dan tetap efektif.",
    slug: "business-case-ai-investment",
  },
];

export const blogTags = [
  "All",
  "Landing Page",
  "Company Profile",
  "Copywriting",
  "UI Copy",
  "Conversion",
  "Mobile UX",
  "Branding",
  "Launch",
  "Website Strategy",
];
