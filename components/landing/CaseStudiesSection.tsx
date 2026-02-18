"use client";

import ImageCarousel from "@/components/custom/ImageCarousel";
import { SectionHeading } from "@/components/custom/SectionHeading";
import { Button } from "@/components/ui/button";
import type { CaseStudyType } from "@/data/caseStudies";
import { useCaseStudies } from "@/hooks/use-case-studies";
import { useSiteContent } from "@/hooks/use-site-content";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/all";
import { useRef } from "react";

// Register ScrollTrigger plugin
gsap.registerPlugin(ScrollTrigger);

interface CaseStudyCardProps {
  caseStudy: CaseStudyType;
  index: number;
}

const CaseStudyCard: React.FC<CaseStudyCardProps> = ({ caseStudy, index }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const content = useSiteContent();

  useGSAP(() => {
    if (cardRef.current && gsap.effects?.fadeUpOnScroll) {
      gsap.effects.fadeUpOnScroll(contentRef.current, {
        start: "top 90%",
        duration: 0.8,
        markers: false,
      });

      gsap.effects.fadeUpOnScroll(imageRef.current, {
        start: "top 90%",
        duration: 0.8,
        delay: 0.2,
        markers: false,
      });
    }
  }, [index]);

  return (
    <section
      ref={cardRef}
      className="grid grid-cols-1 gap-8 rounded-lg p-4 focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-4 lg:grid-cols-12 lg:gap-12"
      aria-labelledby={`case-study-${index}-title`}
      role="article"
    >
      <div ref={contentRef} className="col-span-1 space-y-6 lg:col-span-5">
        <div className="space-y-6">
          <div className="flex items-center">
            <img
              src={caseStudy.logo_src}
              className="aspect-auto max-h-8 w-auto"
              alt={`${caseStudy.name} company logo`}
              loading="lazy"
              decoding="async"
            />
          </div>

          <div className="space-y-3">
            <p className="text-tag text-sm font-normal">{caseStudy.name}</p>

            <h3
              id={`case-study-${index}-title`}
              className="text-h4 text-heading pr-4 text-2xl leading-tight font-semibold lg:text-3xl"
            >
              {caseStudy.project_title}
            </h3>
          </div>

          <div className="space-y-4">
            <h4 className="sr-only">Key Features</h4>
            <ul className="list-disc space-y-3 pl-4" aria-label="Project features and achievements">
              {caseStudy.features.map((feature, featureIndex) => (
                <li key={featureIndex} className="text-label text-sm">
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <Button
          variant="outline"
          className="w-full transition-all duration-200 hover:shadow-md focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:w-auto"
          aria-describedby={`case-study-${index}-description`}
          type="button"
        >
          {content.caseStudies.buttonLabel}
          <span className="sr-only"> for {caseStudy.name}</span>
        </Button>

        <p id={`case-study-${index}-description`} className="sr-only">
          Lihat detail template {caseStudy.name} dan hasil implementasinya
        </p>
      </div>

      <div
        ref={imageRef}
        className="col-span-1 aspect-[4/3] lg:col-span-7"
        role="region"
        aria-label={`${caseStudy.name} project screenshots`}
      >
        <ImageCarousel
          images={caseStudy.demo_images}
          caseStudyId={index}
          caseStudyName={caseStudy.name}
        />
      </div>
    </section>
  );
};

const CaseStudies: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const content = useSiteContent();
  const caseStudies = useCaseStudies();

  useGSAP(() => {
    // Animate the main heading
    if (headingRef.current) {
      gsap.fromTo(
        headingRef.current,
        {
          y: 30,
          opacity: 0,
        },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          ease: "power2.out",
          scrollTrigger: {
            trigger: headingRef.current,
            start: "top 90%",
            end: "bottom 20%",
            toggleActions: "play none none reverse",
            markers: false, // Set to false for production
          },
        }
      );
    }

    // Cleanup function
    return () => {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, []);

  return (
    <>
      <section
        ref={sectionRef}
        className="mx-auto max-w-7xl px-5 py-16 md:py-24"
        aria-labelledby="case-studies-heading"
      >
        {/* Header */}
        <SectionHeading
          ref={headingRef}
          badge={content.caseStudies.badge}
          heading={content.caseStudies.heading}
          description={content.caseStudies.description}
          size="md"
          align="center"
          as="h2"
          id="case-studies-heading"
          className="mb-8 md:mb-14"
        />

        {/* Case Studies */}
        <div className="space-y-8 md:space-y-24" role="main" aria-label="Case studies collection">
          {caseStudies.slice(0, 3).map((caseStudy, index) => (
            <div key={`${caseStudy.name}-${index}`}>
              <CaseStudyCard caseStudy={caseStudy} index={index} />
            </div>
          ))}
        </div>

        {/* Skip link for keyboard users */}
        <a
          href="#main-navigation"
          className="sr-only z-50 rounded-md bg-blue-600 px-4 py-2 text-white focus:not-sr-only focus:absolute focus:top-4 focus:left-4"
        >
          Skip to main navigation
        </a>
      </section>
    </>
  );
};

export default CaseStudies;
