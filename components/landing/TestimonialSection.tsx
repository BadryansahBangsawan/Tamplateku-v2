"use client";

import { SectionHeading } from "@/components/custom/SectionHeading";
import CaseStudyLogo from "@/components/custom/CaseStudyLogo";
import type { CaseStudyType } from "@/data/caseStudies";
import { useCaseStudies } from "@/hooks/use-case-studies";
import { useSiteContent } from "@/hooks/use-site-content";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/all";
import { useRef } from "react";

gsap.registerPlugin(ScrollTrigger);

interface TestimonialCardProps {
  item: CaseStudyType;
  index: number;
}

const TestimonialCard: React.FC<TestimonialCardProps> = ({ item, index }) => {
  const hasTestimonial = Boolean(item.testimonial && item.testimonial.trim().length > 0);
  if (!hasTestimonial) return null;

  return (
    <article
      key={`${item.name}-testimonial-${index}`}
      className="testimonial-card-bg flex h-full w-full flex-col space-y-3 rounded-2xl text-left sm:space-y-4"
      aria-labelledby={`testimonial-${index}-title`}
    >
      <div className="flex aspect-video items-center justify-center overflow-hidden rounded-t-md">
        <img
          src={item.test_img}
          className="aspect-video h-full w-full object-cover"
          alt={`${item.name} project preview image`}
          loading="lazy"
          decoding="async"
        />
      </div>
      <div className="relative flex flex-1 flex-col space-y-3 px-3 pb-3 sm:space-y-4 sm:px-4 sm:pb-4">
        <blockquote
          className="text-heading/90 text-sm leading-tight font-bold tracking-wide sm:text-base md:text-lg"
          cite={item.case_study_link}
        >
          <p id={`testimonial-${index}-title`}>{item.testimonial}</p>
        </blockquote>
        <div className="mt-auto space-y-1 sm:space-y-1.5" aria-label="Client details">
          <div className="flex items-center">
            <CaseStudyLogo
              src={item.logo_src}
              className="aspect-auto max-h-5 w-auto sm:max-h-6"
              name={item.name}
            />
          </div>
          <p className="text-heading text-xs font-medium sm:text-sm">
            {item.founder_name}
            {item.position ? (
              <span className="text-tag ml-1 text-xs font-normal sm:ml-2 sm:text-sm">
                {item.position}
              </span>
            ) : null}
          </p>
        </div>
      </div>
    </article>
  );
};

function Testimonial() {
  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLElement>(null);
  const content = useSiteContent();
  const caseStudies = useCaseStudies();

  const testimonials = caseStudies.filter((cs) => cs.testimonial);

  useGSAP(() => {
    if (headingRef.current) {
      gsap.effects.fadeUpOnScroll(headingRef.current, {
        start: "top 80%",
        duration: 0.8,
        markers: false,
      });
    }

    // Cards fade-up (staggered, on scroll)
    if (gridRef.current && gsap.effects?.fadeUpOnScroll) {
      const cards = gridRef.current.querySelectorAll("article");
      cards.forEach((card, index) => {
        gsap.effects.fadeUpOnScroll(card as Element, {
          start: "top 92%",
          duration: 0.7,
          delay: Math.min(index * 0.04, 0.3),
          markers: false,
        });
      });
    }

    if (statsRef.current && gsap.effects?.fadeUpOnScroll) {
      const items = statsRef.current.querySelectorAll('[data-stat-item="true"]');
      items.forEach((el) => {
        gsap.effects.fadeUpOnScroll(el as Element, {
          start: "top 95%",
          duration: 0.6,
          // delay: index * 0.08,
          markers: false,
        });
      });
    }

    return () => {
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, []);

  return (
    <>
      <section
        ref={sectionRef}
        className="px-4 py-12 sm:px-6 sm:py-16 md:px-8 md:py-20 lg:px-12 lg:py-24"
        aria-labelledby="testimonials-heading"
      >
        {/* Header */}
        <SectionHeading
          ref={headingRef}
          badge={content.testimonials.badge}
          heading={content.testimonials.heading}
          description={content.testimonials.description}
          size="md"
          align="center"
          as="h2"
          id="testimonials-heading"
          className="mb-6 sm:mb-8 md:mb-14"
          showDescriptionToScreenReaders={true}
        />

        <div
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 md:gap-8 lg:grid-cols-3 xl:gap-10"
          ref={gridRef}
          role="list"
          aria-label="Client testimonials"
        >
          {testimonials.map((item, index) => (
            <div role="listitem" key={item.id ?? `${item.name}-${index}`}>
              <TestimonialCard item={item} index={index} />
            </div>
          ))}
        </div>

        <section
          className="mt-10 sm:mt-12 md:mt-14 lg:mt-16"
          aria-labelledby="stats-heading"
          ref={statsRef}
        >
          <h3 id="stats-heading" className="sr-only">
            Impact metrics
          </h3>
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-col divide-y divide-gray-200 sm:divide-y-0 sm:flex-row sm:divide-x">
              <div
                className="flex flex-1 flex-col items-start px-4 py-4 sm:items-center sm:px-6 sm:py-6 md:py-0"
                data-stat-item="true"
              >
                <div className="text-heading text-3xl font-semibold sm:text-4xl md:text-5xl">
                  120+
                </div>
                <p className="text-label mt-1 text-sm sm:mt-2 sm:text-base">
                  {content.testimonials.statOneLabel}
                </p>
              </div>

              <div
                className="flex flex-1 flex-col items-start px-4 py-4 sm:items-center sm:px-6 sm:py-6 md:py-0"
                data-stat-item="true"
              >
                <div className="text-heading text-3xl font-semibold sm:text-4xl md:text-5xl">
                  50+
                </div>
                <p className="text-label mt-1 text-sm sm:mt-2 sm:text-base">
                  {content.testimonials.statTwoLabel}
                </p>
              </div>

              <div
                className="flex flex-1 flex-col items-start px-4 py-4 sm:items-center sm:px-6 sm:py-6 md:py-0"
                data-stat-item="true"
              >
                <div className="text-heading text-3xl font-semibold sm:text-4xl md:text-5xl">
                  $50k+
                </div>
                <p className="text-label mt-1 text-sm sm:mt-2 sm:text-base">
                  {content.testimonials.statThreeLabel}
                </p>
              </div>
            </div>
          </div>
        </section>
      </section>
    </>
  );
}

export default Testimonial;
