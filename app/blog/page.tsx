"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { blogPosts } from "@/data/blogPosts";
import "@/lib/GSAPAnimations";
import { siteConfig } from "@/lib/metadata";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger, SplitText } from "gsap/all";
import Link from "next/link";
import { useRef, useState } from "react";

const blogTags = ["All", ...Array.from(new Set(blogPosts.map((post) => post.tag)))];

const uniqueSchemaPosts = Array.from(new Map(blogPosts.map((post) => [post.slug, post])).values());
const blogStructuredData = [
  {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "Blog Tamplateku",
    url: `${siteConfig.url}/blog`,
    inLanguage: "id-ID",
    publisher: {
      "@type": "Organization",
      name: "Tamplateku",
      logo: {
        "@type": "ImageObject",
        url: `${siteConfig.url}/logo.png`,
      },
    },
    blogPost: uniqueSchemaPosts.map((post) => ({
      "@type": "BlogPosting",
      headline: post.title,
      description: post.excerpt,
      url: `${siteConfig.url}/blog/${post.slug}`,
      datePublished: post.publishedAt,
      image: [
        post.image.startsWith("http")
          ? post.image
          : `${siteConfig.url}${post.image.startsWith("/") ? "" : "/"}${post.image}`,
      ],
    })),
  },
  {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListOrder: "https://schema.org/ItemListOrderDescending",
    numberOfItems: uniqueSchemaPosts.length,
    itemListElement: uniqueSchemaPosts.map((post, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: `${siteConfig.url}/blog/${post.slug}`,
      name: post.title,
    })),
  },
];

// Register ScrollTrigger plugin
gsap.registerPlugin(ScrollTrigger);

function BlogPage() {
  const [selectedTag, setSelectedTag] = useState("All");
  const heroRef = useRef(null);
  const topPicksRef = useRef(null);
  const blogGridRef = useRef(null);

  // Filter blog posts based on selected tag
  const filteredPosts =
    selectedTag === "All"
      ? blogPosts.filter((post) => !post.isTopPick)
      : blogPosts.filter((post) => !post.isTopPick && post.tag === selectedTag);

  const topPicks = blogPosts.filter((post) => post.isTopPick);

  useGSAP(() => {
    // Hero section animation
    SplitText.create(".blog-heading", {
      type: "lines, words",
      mask: "lines",
      autoSplit: true,
      onSplit(self) {
        return gsap.from(self.words, {
          duration: 0.6,
          y: 10,
          opacity: 0.5,
          filter: "blur(6px)",
          autoAlpha: 0,
          stagger: 0.06,
        });
      },
    });

    // Top picks section animation
    if (topPicksRef.current) {
      gsap.effects.fadeUpOnScroll(topPicksRef.current, {
        start: "top 80%",
        duration: 0.8,
        markers: false,
      });
    }

    // Blog grid section animation
    if (blogGridRef.current) {
      gsap.effects.staggerFadeUpOnScroll(blogGridRef.current, {
        start: "top 85%",
        duration: 0.7,
        stagger: 0.1,
        childSelector: ".blog-card",
        markers: false,
      });
    }

    // Cleanup function
    return () => {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, []);

  return (
    <div className="min-h-screen w-full">
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(blogStructuredData),
        }}
      />
      <main id="main-content">
        <div className="mx-auto max-w-6xl px-5">
          {/* Hero Section */}
          <section
            ref={heroRef}
            className="hero space-y-4 text-center pt-[116px] pb-[48px] md:pt-[128px] md:pb-[64px] lg:pt-[140px] lg:pb-[80px]"
            role="banner"
            aria-label="Blog introduction"
          >
            <div className="bg-tag-bg w-fit rounded-3xl px-6 py-1 mx-auto">
              <p className="text-tag align-middle text-sm ">
                <span className="mt-1.5 mr-2 inline-block self-center" aria-hidden="true">
                  📝
                </span>
                Blog Tamplateku
              </p>
            </div>

            <h1 className="blog-heading text-h1 text-text-heading !text-center font-semibold md:mx-auto md:w-2/3">
              Insight Website & Template Premium
            </h1>

            <p className="text-caption text-label md:mx-auto md:w-2/3">
              Baca panduan praktis seputar desain website, struktur konten, dan optimasi template
              premium untuk meningkatkan kredibilitas serta konversi bisnis kamu.
            </p>
          </section>

          {/* Top Picks Section */}
          <section ref={topPicksRef} className="mb-16" aria-labelledby="top-picks-heading">
            <div className="mb-8">
              <h2 id="top-picks-heading" className="text-h2 text-text-heading font-semibold mb-2">
                Pilihan Editor
              </h2>
              <div className="h-px bg-border" />
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {topPicks.map((post, index) => (
                <Link
                  key={post.id}
                  href={`/blog/${post.slug}`}
                  className="group cursor-pointer space-y-4 block"
                  role="article"
                  aria-labelledby={`top-pick-title-${post.id}`}
                  aria-describedby={`top-pick-excerpt-${post.id}`}
                >
                  <div className="aspect-video overflow-hidden rounded-lg bg-muted">
                    <img
                      src={post.image}
                      alt={`${post.title} - Featured image`}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading={index < 2 ? "eager" : "lazy"}
                      decoding={index < 2 ? "sync" : "async"}
                    />
                  </div>

                  <div className="space-y-2">
                    <h3
                      id={`top-pick-title-${post.id}`}
                      className="text-h5 text-text-heading font-medium leading-tight group-hover:text-primary transition-colors"
                    >
                      {post.title}
                    </h3>

                    <div className="flex items-center gap-3 text-sm text-label">
                      <time dateTime={post.publishedAt} className="font-medium">
                        {post.date}
                      </time>
                      <Badge variant="secondary" className="text-xs">
                        {post.tag}
                      </Badge>
                    </div>

                    <p
                      id={`top-pick-excerpt-${post.id}`}
                      className="text-caption text-label line-clamp-2"
                    >
                      {post.excerpt}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {/* Research/Blogs Section */}
          <section ref={blogGridRef} className="mb-16" aria-labelledby="research-blogs-heading">
            <div className="mb-8">
              <h2
                id="research-blogs-heading"
                className="text-h2 text-text-heading font-semibold mb-6"
              >
                Artikel Terbaru
              </h2>

              {/* Filter Tags */}
              <div className="mb-8">
                <div
                  className="flex flex-wrap gap-2"
                  role="tablist"
                  aria-label="Blog category filters"
                >
                  {blogTags.map((tag) => (
                    <Button
                      key={tag}
                      variant={selectedTag === tag ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedTag(tag)}
                      className="text-sm"
                      role="tab"
                      aria-selected={selectedTag === tag}
                      aria-controls={`blog-content-${tag.toLowerCase().replace(/\s+/g, "-")}`}
                    >
                      {tag}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="h-px bg-border" />
            </div>

            {/* Blog Grid */}
            <div
              id={`blog-content-${selectedTag.toLowerCase().replace(/\s+/g, "-")}`}
              className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
              role="tabpanel"
              aria-labelledby={`${selectedTag.toLowerCase().replace(/\s+/g, "-")}-tab`}
            >
              {filteredPosts.map((post, index) => (
                <Link
                  key={post.id}
                  href={`/blog/${post.slug}`}
                  className="blog-card group cursor-pointer space-y-4 block"
                  role="article"
                  aria-labelledby={`blog-title-${post.id}`}
                  aria-describedby={`blog-excerpt-${post.id}`}
                >
                  <div className="aspect-video overflow-hidden rounded-lg bg-muted">
                    <img
                      src={post.image}
                      alt={`${post.title} - Featured image`}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading={index < 3 ? "eager" : "lazy"}
                      decoding={index < 3 ? "sync" : "async"}
                    />
                  </div>

                  <div className="space-y-2">
                    <h3
                      id={`blog-title-${post.id}`}
                      className="text-h5 text-text-heading font-medium leading-tight group-hover:text-primary transition-colors"
                    >
                      {post.title}
                    </h3>

                    <div className="flex items-center gap-3 text-sm text-label">
                      <time dateTime={post.publishedAt} className="font-medium">
                        {post.date}
                      </time>
                      <Badge variant="secondary" className="text-xs">
                        {post.tag}
                      </Badge>
                    </div>

                    <p
                      id={`blog-excerpt-${post.id}`}
                      className="text-caption text-label line-clamp-2"
                    >
                      {post.excerpt}
                    </p>
                  </div>
                </Link>
              ))}
            </div>

            {/* No results message */}
            {filteredPosts.length === 0 && (
              <div className="text-center py-12" role="status" aria-live="polite">
                <p className="text-label text-lg">Belum ada artikel di kategori ini.</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => setSelectedTag("All")}
                  aria-label="Clear filter and show all blog posts"
                >
                  Tampilkan Semua
                </Button>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

export default BlogPage;
