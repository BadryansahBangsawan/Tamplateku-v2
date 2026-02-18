"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCaseStudies } from "@/hooks/use-case-studies";
import Link from "next/link";

const formatPrice = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);

export default function TemplatesSection() {
  const caseStudies = useCaseStudies();
  const templateItems = caseStudies.slice(0, 6).map((item, index) => ({
    id: `${item.name}-${index}`,
    title: item.project_title,
    category: "Template Premium",
    thumbnail: item.main_image_src,
    description: item.features[0] ?? "Template siap pakai dengan desain modern dan performa cepat.",
    price: 299000 + index * 50000,
    slug: item.name.toLowerCase().replace(/\s+/g, "-"),
  }));

  return (
    <section
      id="templates-section"
      className="mx-auto max-w-7xl px-5 py-16 md:py-24"
      aria-labelledby="templates-heading"
    >
      <div className="mb-8 flex flex-col gap-4 md:mb-12 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl space-y-3">
          <p className="text-tag text-sm font-medium tracking-wide uppercase">Koleksi</p>
          <h2
            id="templates-heading"
            className="text-h3 text-heading text-3xl font-semibold md:text-4xl"
          >
            Koleksi Template Premium
          </h2>
          <p className="text-label">
            Tamplateku adalah website untuk membeli template coding premium. Pilih template siap
            pakai dengan desain modern, struktur rapi, dan performa optimal.
          </p>
        </div>

        <Link href="/blog" aria-label="Lihat semua koleksi template">
          <Button type="button" className="w-full md:w-auto">
            Lihat Koleksi Template
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {templateItems.map((item) => (
          <article
            key={item.id}
            className="group overflow-hidden rounded-2xl border bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
            aria-label={`Template ${item.title}`}
          >
            <div className="bg-tag-bg relative aspect-[16/10] overflow-hidden">
              <img
                src={item.thumbnail}
                alt={`Preview template ${item.title}`}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
                decoding="async"
              />
            </div>

            <div className="space-y-4 p-5">
              <div className="flex items-center justify-between gap-2">
                <Badge variant="secondary" className="rounded-full">
                  {item.category}
                </Badge>
                <p className="text-heading text-sm font-semibold">{formatPrice(item.price)}</p>
              </div>

              <div className="space-y-2">
                <h3 className="text-heading line-clamp-2 text-lg font-semibold">{item.title}</h3>
                <p className="text-label line-clamp-2 text-sm">{item.description}</p>
              </div>

              <div className="flex gap-2">
                <Link href={`/blog/${item.slug}`} className="flex-1">
                  <Button type="button" className="w-full">
                    Lihat Detail
                  </Button>
                </Link>
                <Link href="#" className="flex-1" aria-label={`Lihat demo ${item.title}`}>
                  <Button type="button" variant="outline" className="w-full">
                    Live Demo
                  </Button>
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
