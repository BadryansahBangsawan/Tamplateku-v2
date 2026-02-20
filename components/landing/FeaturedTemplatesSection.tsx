"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useCaseStudies } from "@/hooks/use-case-studies";
import { enrichTemplates, formatIdr } from "@/lib/templateCatalog";
import Link from "next/link";
import { useMemo } from "react";

export default function FeaturedTemplatesSection() {
  const caseStudies = useCaseStudies();
  const featured = useMemo(() => {
    return [...enrichTemplates(caseStudies)]
      .sort((a, b) => {
        if (a.isBestSeller !== b.isBestSeller) return a.isBestSeller ? -1 : 1;
        return a.catalogIndex - b.catalogIndex;
      })
      .slice(0, 3);
  }, [caseStudies]);

  if (featured.length === 0) return null;

  return (
    <section
      className="mx-auto max-w-7xl space-y-6 px-5 py-10 md:py-14"
      aria-labelledby="featured-templates-heading"
    >
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-2">
          <Badge variant="outline">Featured Template</Badge>
          <h2 id="featured-templates-heading" className="text-2xl font-semibold text-foreground">
            Template pilihan untuk launch lebih cepat
          </h2>
          <p className="max-w-2xl text-sm text-muted-foreground md:text-base">
            Koleksi template terbaik Tamplateku yang paling sering dipilih untuk website bisnis.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/browse-template">Lihat semua template</Link>
        </Button>
      </header>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {featured.map((item, index) => (
          <Card key={item.id ?? item.slug} className="overflow-hidden border-border/80">
            <div className="overflow-hidden rounded-xl border bg-muted/30">
              <img
                src={item.main_image_src}
                alt={`Preview ${item.project_title}`}
                className="aspect-[16/10] h-full w-full object-cover"
                loading={index === 0 ? "eager" : "lazy"}
                decoding={index === 0 ? "sync" : "async"}
              />
            </div>
            <CardHeader className="space-y-2 pb-2">
              <div className="flex flex-wrap gap-2">
                {item.isBestSeller ? <Badge>Best Seller</Badge> : null}
                <Badge variant="outline">{item.statusLabel}</Badge>
                <Badge variant="secondary">{item.framework}</Badge>
              </div>
              <CardTitle className="line-clamp-2 text-lg">{item.project_title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="line-clamp-2 text-sm text-muted-foreground">{item.description}</p>
              <p className="text-sm font-medium text-foreground">{formatIdr(item.price)}</p>
            </CardContent>
            <CardFooter className="gap-2">
              <Button size="sm" asChild>
                <Link href={`/browse-template/${item.slug}`}>Detail</Link>
              </Button>
              <Button size="sm" variant="outline" asChild>
                <Link href="/browse-template">Browse</Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </section>
  );
}
