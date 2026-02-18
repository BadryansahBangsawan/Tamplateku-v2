"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/all";
import { useRef } from "react";
import { TableOfContents } from "./TableOfContents";

interface AnimatedMainContentProps {
  content: string;
}

export function AnimatedMainContent({ content }: AnimatedMainContentProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const tocRef = useRef<HTMLElement>(null);
  const mainRef = useRef<HTMLElement>(null);

  useGSAP(() => {
    if (!sectionRef.current) return;

    // Register ScrollTrigger plugin
    gsap.registerPlugin(ScrollTrigger);

    // Animate the main section
    gsap.effects.fadeUpOnScroll(sectionRef.current, {
      start: "top 80%",
      duration: 0.2,
      markers: false,
    });

    // Animate TOC sidebar
    if (tocRef.current) {
      gsap.effects.fadeUpOnScroll(tocRef.current, {
        start: "top 80%",
        duration: 0.2,
        markers: false,
      });
    }

    // Animate main content
    if (mainRef.current) {
      gsap.effects.fadeUpOnScroll(mainRef.current, {
        start: "top 80%",
        duration: 0.2,
        markers: false,
      });

      const proseElements = mainRef.current.querySelectorAll(
        "h1, h2, h3, h4, h5, h6, p, ul, ol, blockquote, pre, img"
      );

      gsap.fromTo(
        proseElements,
        {
          opacity: 0,
          y: 20,
        },
        {
          opacity: 1,
          y: 0,
          duration: 0.5,
          stagger: 0.05,
          ease: "power2.out",
          scrollTrigger: {
            trigger: mainRef.current,
            start: "top 85%",
            end: "bottom 20%",
            toggleActions: "play none none reverse",
          },
        }
      );
    }

    // Cleanup
    return () => {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, []);

  return (
    <section ref={sectionRef} className="mx-auto max-w-6xl px-4 sm:px-5 py-8 md:py-12">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">
        {/* Table of Contents - Left Sidebar */}
        <aside ref={tocRef} className="lg:col-span-1 order-2 lg:order-1">
          <div className="lg:sticky lg:top-24">
            <TableOfContents content={content} />
          </div>
        </aside>

        {/* Blog Content - Right Side */}
        <main ref={mainRef} className="lg:col-span-3 order-1 lg:order-2">
          <div
            className="prose prose-sm sm:prose-base lg:prose-lg dark:prose-invert max-w-none 
              [&_h1]:scroll-mt-24 [&_h2]:scroll-mt-24 [&_h3]:scroll-mt-24 [&_h4]:scroll-mt-24 [&_h5]:scroll-mt-24 [&_h6]:scroll-mt-24
              [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:text-text-heading [&_h1]:mb-6 [&_h1]:mt-8
              [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:text-text-heading [&_h2]:mb-4 [&_h2]:mt-6
              [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:text-text-heading [&_h3]:mb-3 [&_h3]:mt-5
              [&_h4]:text-lg [&_h4]:font-medium [&_h4]:text-text-heading [&_h4]:mb-2 [&_h4]:mt-4
              [&_h5]:text-base [&_h5]:font-medium [&_h5]:text-text-heading [&_h5]:mb-2 [&_h5]:mt-3
              [&_h6]:text-sm [&_h6]:font-medium [&_h6]:text-text-heading [&_h6]:mb-2 [&_h6]:mt-3
              [&_p]:text-label [&_p]:leading-relaxed [&_p]:mb-4
              [&_ul]:mb-4 [&_ul]:pl-6 [&_ul]:space-y-2
              [&_ol]:mb-4 [&_ol]:pl-6 [&_ol]:space-y-2
              [&_li]:text-label [&_li]:leading-relaxed
              [&_blockquote]:border-l-4 [&_blockquote]:border-primary [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-label [&_blockquote]:my-6
              [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-sm [&_code]:font-mono
              [&_pre]:bg-muted [&_pre]:p-4 [&_pre]:rounded-lg [&_pre]:overflow-x-auto [&_pre]:my-4
              [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-sm
              [&_img]:rounded-lg [&_img]:shadow-md [&_img]:my-6
              [&_a]:text-primary [&_a]:hover:underline [&_a]:transition-colors
              [&_strong]:font-semibold [&_strong]:text-text-heading
              [&_em]:italic
              [&_hr]:border-border [&_hr]:my-8"
            dangerouslySetInnerHTML={{
              __html: content.replace(
                /<h([1-6])([^>]*)>(.*?)<\/h[1-6]>/gi,
                (_match, level, attrs, content) => {
                  const id = content
                    .replace(/<[^>]*>/g, "") // Remove HTML tags
                    .toLowerCase()
                    .replace(/[^\w\s-]/g, "")
                    .replace(/\s+/g, "-")
                    .replace(/-+/g, "-")
                    .trim();
                  return `<h${level}${attrs} id="${id}">${content}</h${level}>`;
                }
              ),
            }}
          />
        </main>
      </div>
    </section>
  );
}
