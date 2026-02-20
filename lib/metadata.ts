import type { Metadata } from "next";

export const siteConfig = {
  name: "Tamplateku",
  description:
    "Tamplateku menyediakan template website premium siap pakai untuk bisnis, agency, dan personal brand yang ingin tampil profesional lebih cepat.",
  url: "https://tamplateku.store",
  ogImage: "https://res.cloudinary.com/dieth2xb3/image/upload/v1755799085/ssimage_bxr8i6.png",
  logo: "https://tamplateku.store/logo.png",
  keywords: [
    "template website premium",
    "template landing page",
    "template company profile",
    "template website bisnis",
    "jasa website",
    "desain web premium",
    "template siap pakai",
  ],
  authors: [
    {
      name: "Tamplateku Team",
      url: "https://tamplateku.store",
    },
  ],
  creator: "Tamplateku",
  publisher: "Tamplateku",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large" as const,
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: "https://tamplateku.store",
    siteName: "Tamplateku",
    title: "Tamplateku - Template Website Premium",
    description:
      "Temukan template website premium siap pakai untuk mempercepat launch website bisnismu.",
    images: [
      {
        url: "https://res.cloudinary.com/dieth2xb3/image/upload/v1755799085/ssimage_bxr8i6.png",
        width: 1200,
        height: 630,
        alt: "Tamplateku - Template Website Premium",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Tamplateku - Template Website Premium",
    description: "Template website premium untuk bisnis yang ingin tampil profesional lebih cepat.",
    images: ["https://res.cloudinary.com/dieth2xb3/image/upload/v1755799085/ssimage_bxr8i6.png"],
    creator: "@tamplateku",
  },
  verification: {
    google: "your-google-verification-code",
  },
  alternates: {
    canonical: "https://tamplateku.store",
  },
  category: "business",
};

export const pageMetadata = {
  home: {
    title: "Tamplateku - Template Website Premium Siap Pakai",
    description:
      "Pilih template website premium untuk bisnis, agency, dan personal brand. Siap custom, siap publish, dan siap dipakai untuk konversi.",
    keywords: [
      "template website premium",
      "template website bisnis",
      "template landing page",
      "template agency",
      "website siap pakai",
    ],
    openGraph: {
      title: "Tamplateku - Template Website Premium Siap Pakai",
      description: "Pilih template website premium untuk bisnis, agency, dan personal brand.",
      url: "https://tamplateku.store",
      type: "website",
    },
    twitter: {
      title: "Tamplateku - Template Website Premium Siap Pakai",
      description: "Template website premium yang mudah di-custom dan cepat dipublish.",
    },
    alternates: {
      canonical: "https://tamplateku.store",
    },
  },
  about: {
    title: "Tentang Tamplateku - Template Website Premium",
    description:
      "Kenali Tamplateku dan cara kami membantu bisnis go-live lebih cepat lewat template website premium yang terstruktur.",
    keywords: [
      "tentang tamplateku",
      "template website premium",
      "desain web bisnis",
      "brand website",
    ],
    openGraph: {
      title: "Tentang Tamplateku - Template Website Premium",
      description: "Kami membantu bisnis tampil profesional lewat template website premium.",
      url: "https://tamplateku.store/about",
      type: "website",
    },
    twitter: {
      title: "Tentang Tamplateku - Template Website Premium",
      description:
        "Kenali proses dan standar kualitas Tamplateku dalam membuat template website premium.",
    },
    alternates: {
      canonical: "https://tamplateku.store/about",
    },
    structuredData: {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "Tamplateku",
      description:
        "Penyedia template website premium untuk bisnis yang ingin launch cepat dengan tampilan profesional.",
      url: "https://tamplateku.store",
      logo: "https://tamplateku.store/logo.png",
      foundingDate: "2020",
      numberOfEmployees: "10-50",
      address: {
        "@type": "PostalAddress",
        addressCountry: "ID",
      },
      sameAs: ["https://linkedin.com/company/tamplateku", "https://twitter.com/tamplateku"],
      knowsAbout: ["Web Design", "Template Website", "Landing Page", "Brand Website"],
    },
  },
  blog: {
    title: "Blog Tamplateku - Insight Website & Template Premium",
    description:
      "Artikel seputar strategi website, copywriting landing page, dan tips memilih template premium untuk bisnis.",
    keywords: ["blog website", "tips landing page", "copywriting website", "template premium"],
    openGraph: {
      title: "Blog Tamplateku - Insight Website & Template Premium",
      description:
        "Belajar meningkatkan performa website dengan konten, struktur, dan template yang tepat.",
      url: "https://tamplateku.store/blog",
      type: "website",
    },
    twitter: {
      title: "Blog Tamplateku - Insight Website & Template Premium",
      description: "Insight praktis seputar website premium untuk kebutuhan bisnis modern.",
    },
    alternates: {
      canonical: "https://tamplateku.store/blog",
    },
  },
  browseTemplate: {
    title: "Browse Template Premium",
    description:
      "Jelajahi koleksi template website premium Tamplateku. Filter berdasarkan framework, kategori, use case, dan budget.",
    keywords: [
      "browse template website",
      "template website premium",
      "template landing page",
      "template saas",
      "template company profile",
    ],
    openGraph: {
      title: "Browse Template Premium - Tamplateku",
      description: "Temukan template website premium siap pakai untuk berbagai kebutuhan bisnis.",
      url: "https://tamplateku.store/browse-template",
      type: "website",
    },
    twitter: {
      title: "Browse Template Premium - Tamplateku",
      description: "Katalog template premium siap launch untuk bisnis modern.",
    },
    alternates: {
      canonical: "https://tamplateku.store/browse-template",
    },
  },
};

export function generatePageMetadata(
  page: keyof typeof pageMetadata,
  customMetadata?: Partial<Metadata>
): Metadata {
  const baseMetadata = pageMetadata[page];

  return {
    title: baseMetadata.title,
    description: baseMetadata.description,
    keywords: baseMetadata.keywords,
    openGraph: {
      ...siteConfig.openGraph,
      ...baseMetadata.openGraph,
    },
    twitter: {
      ...siteConfig.twitter,
      ...baseMetadata.twitter,
    },
    alternates: baseMetadata.alternates,
    robots: siteConfig.robots,
    verification: siteConfig.verification,
    ...customMetadata,
  };
}

export function generateBlogPostMetadata(
  title: string,
  description: string,
  publishedTime: string,
  slug: string,
  image?: string
): Metadata {
  const blogUrl = `https://tamplateku.store/blog/${slug}`;
  const ogImage = image || siteConfig.ogImage;

  return {
    title: `${title} - Tamplateku Blog`,
    description,
    keywords: [...siteConfig.keywords, "artikel website", "template premium"],
    openGraph: {
      ...siteConfig.openGraph,
      title: `${title} - Tamplateku Blog`,
      description,
      url: blogUrl,
      type: "article",
      publishedTime,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      ...siteConfig.twitter,
      title: `${title} - Tamplateku Blog`,
      description,
      images: [ogImage],
    },
    alternates: {
      canonical: blogUrl,
    },
    robots: siteConfig.robots,
  };
}

export function generateBlogPostStructuredData(
  title: string,
  description: string,
  publishedTime: string,
  slug: string,
  author?: string
) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: title,
    datePublished: publishedTime,
    dateModified: publishedTime,
    description,
    url: `https://tamplateku.store/blog/${slug}`,
    author: {
      "@type": "Person",
      name: author || "Tamplateku Team",
    },
    publisher: {
      "@type": "Organization",
      name: "Tamplateku",
      logo: {
        "@type": "ImageObject",
        url: siteConfig.logo,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://tamplateku.store/blog/${slug}`,
    },
  };
}

export function generateTemplateDetailMetadata(params: {
  title: string;
  description: string;
  slug: string;
  image?: string;
}): Metadata {
  const pageUrl = `https://tamplateku.store/browse-template/${params.slug}`;
  const image = params.image || siteConfig.ogImage;
  const pageTitle = `${params.title} - Template Premium | Tamplateku`;

  return {
    title: pageTitle,
    description: params.description,
    keywords: [...siteConfig.keywords, "template premium", "browse template"],
    openGraph: {
      ...siteConfig.openGraph,
      title: pageTitle,
      description: params.description,
      url: pageUrl,
      type: "website",
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: params.title,
        },
      ],
    },
    twitter: {
      ...siteConfig.twitter,
      title: pageTitle,
      description: params.description,
      images: [image],
    },
    alternates: {
      canonical: pageUrl,
    },
    robots: siteConfig.robots,
  };
}

export const defaultMetadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.name,
    template: `%s - ${siteConfig.name}`,
  },
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
  description: siteConfig.description,
  keywords: siteConfig.keywords,
  authors: siteConfig.authors,
  creator: siteConfig.creator,
  publisher: siteConfig.publisher,
  robots: siteConfig.robots,
  openGraph: siteConfig.openGraph,
  twitter: siteConfig.twitter,
  verification: siteConfig.verification,
  alternates: siteConfig.alternates,
  category: siteConfig.category,
};
