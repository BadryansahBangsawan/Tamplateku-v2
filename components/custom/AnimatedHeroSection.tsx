"use client";

import { Badge } from "@/components/ui/badge";
import "@/lib/GSAPAnimations";
import { formatDate } from "@/lib/utils";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/all";
import { Calendar, Clock } from "lucide-react";
import { Suspense, useRef } from "react";
import { BackButton } from "./BackButton";

interface AnimatedHeroSectionProps {
  post: {
    metadata: {
      title?: string;
      summary?: string;
      publishedAt?: string;
      image?: string;
      tag?: string[];
      [key: string]: any; // Allow additional properties from frontmatter
    };
  };
}

export function AnimatedHeroSection({ post }: AnimatedHeroSectionProps) {
  const heroRef = useRef<HTMLElement>(null);
  const backgroundRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!heroRef.current) return;

    // Register ScrollTrigger plugin
    gsap.registerPlugin(ScrollTrigger);

    // Fast background load (immediate)
    if (backgroundRef.current) {
      gsap.set(backgroundRef.current, { opacity: 0 });
      gsap.to(backgroundRef.current, {
        opacity: 1,
        duration: 0.3,
        ease: "power2.out",
      });
    }

    // Staggered content fade-in
    if (contentRef.current) {
      gsap.effects.staggerFadeUpOnScroll(contentRef.current, {
        start: "top 90%",
        duration: 0.8,
        yOffset: 30,
        stagger: 0.15,
        childSelector: ".hero-content-item",
        markers: false,
      });
    }

    // Cleanup
    return () => {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, []);

  return (
    <section
      ref={heroRef}
      className="relative flex min-h-[80vh] items-center justify-center overflow-hidden"
    >
      {/* Background Image */}
      {post.metadata.image && (
        <div ref={backgroundRef} className="absolute inset-0">
          <img
            src={post.metadata.image}
            alt={post.metadata.title}
            className="h-full w-full object-cover"
            loading="eager"
            decoding="sync"
          />
          {/* Dark overlay for better text readability */}
          <div className="absolute inset-0 bg-black/30" />
        </div>
      )}

      {/* Hero Content */}
      <div
        ref={contentRef}
        className="relative z-10 container mx-auto flex min-h-screen flex-col justify-center px-4 py-20 lg:py-32"
      >
        {/* Back Navigation */}
        <div className="hero-content-item mb-8">
          <BackButton />
        </div>

        <div className="mx-auto max-w-4xl space-y-2 text-center">
          <div className="hero-content-item mb-4 flex items-center justify-center gap-6 text-sm text-white/80">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>5 min read</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <Suspense fallback={<span>Loading...</span>}>
                <span>
                  {post.metadata.publishedAt
                    ? formatDate(post.metadata.publishedAt)
                    : "Unknown date"}
                </span>
              </Suspense>
            </div>
          </div>

          {/* Title */}
          <h1 className="hero-content-item text-4xl leading-tight font-bold drop-shadow-lg text-white md:text-5xl">
            {post.metadata.title || "Untitled"}
          </h1>

          {/* Subtitle */}
          {post.metadata.summary && (
            <p className="hero-content-item mx-auto mb-6 max-w-3xl text-lg leading-relaxed drop-shadow-md text-white/90">
              {post.metadata.summary}
            </p>
          )}

          {post.metadata.tag && Array.isArray(post.metadata.tag) && (
            <div className="hero-content-item flex justify-center gap-2">
              {post.metadata.tag.map((tag: string, index: number) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="py-1.5 border-white/30 bg-white/20 px-4 text-xs font-medium text-white backdrop-blur-sm"
                >
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
