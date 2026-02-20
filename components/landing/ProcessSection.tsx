"use client";

import { SectionHeading } from "@/components/custom/SectionHeading";
import { useSiteContent } from "@/hooks/use-site-content";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/all";
import { useRef } from "react";

// Register ScrollTrigger plugin
gsap.registerPlugin(ScrollTrigger);

interface processType {
  title: string;
  tagline: string;
  description: string;
  bg_image: string;
  deliverables: {
    item: string;
  }[];
}

function toCssBackgroundImage(src: string): string {
  // Wrap url in quotes so custom paths from CMS always render safely.
  const safe = src.replace(/"/g, "%22");
  return `url("${safe}")`;
}

const processFallbackImages = [
  "/tamplate/tamplate-1.png",
  "/tamplate/tamplate-2.png",
  "/tamplate/tamplate-3.png",
  "/tamplate/tamplate-2.png",
];

const ProcessCards: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const slidesRef = useRef<HTMLDivElement[]>([]);
  const headingRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLDivElement>(null);
  const content = useSiteContent();

  const processBackgroundImages =
    content.process.backgroundImages.length > 0
      ? content.process.backgroundImages
      : processFallbackImages;

  const process: processType[] = [
    {
      title: "Riset Niche & Tujuan",
      tagline: "Mulai dari objektif bisnismu",
      description:
        "Kami petakan kebutuhan website kamu, audiens utama, dan target konversinya. Dari sini kamu dapat rekomendasi template yang paling cocok untuk brand positioning dan funnel penjualanmu.",
      deliverables: [
        { item: "Analisis kebutuhan bisnis" },
        { item: "Rekomendasi tipe template" },
        { item: "Struktur halaman prioritas" },
      ],
      bg_image: processBackgroundImages[0] ?? processFallbackImages[0],
    },
    {
      title: "Kurasi Template Terbaik",
      tagline: "Pilih dari koleksi premium",
      description:
        "Tim Tamplateku menyiapkan shortlist template terbaik sesuai kebutuhan brand kamu. Setiap template sudah memikirkan hierarchy konten, section konversi, dan flow yang mudah dioptimasi.",
      deliverables: [
        { item: "Pilihan template terkurasi" },
        { item: "Preview desktop dan mobile" },
        { item: "Arah copy section utama" },
      ],
      bg_image: processBackgroundImages[1] ?? processFallbackImages[1],
    },
    {
      title: "Customisasi Cepat",
      tagline: "Branding langsung masuk",
      description:
        "Template dipoles sesuai identitas brand kamu: warna, tipografi, konten utama, dan CTA. Hasilnya tetap cepat, tetap rapi, dan tetap premium tanpa perlu bangun website dari nol.",
      deliverables: [
        { item: "Penyesuaian brand guideline" },
        { item: "Konten inti siap publish" },
        { item: "Optimasi performa dasar" },
      ],
      bg_image: processBackgroundImages[2] ?? processFallbackImages[2],
    },
    {
      title: "Launch & Scale",
      tagline: "Website siap dipakai jualan",
      description:
        "Setelah final, website kamu siap tayang dengan struktur yang siap dikembangkan. Kamu juga dapat panduan update konten supaya timmu bisa maintain website dengan cepat dan mandiri.",
      deliverables: [
        { item: "Checklist pre-launch" },
        { item: "Panduan edit konten" },
        { item: "Dukungan pasca go-live" },
      ],
      bg_image: processBackgroundImages[3] ?? processFallbackImages[3],
    },
  ];

  useGSAP(() => {
    const slides = slidesRef.current;
    if (!slides.length || !headingRef.current || !sectionRef.current) return;

    const headerPin = ScrollTrigger.create({
      trigger: sectionRef.current,
      start: "top 5%",
      endTrigger: slidesRef.current[slidesRef.current.length - 2],
      end: "center top",
      pin: headingRef.current,
      pinSpacing: false,
      anticipatePin: 1,
    });

    slides.slice(0, 3).forEach((slide) => {
      if (!slide) return;

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: slide,
          start: "top 25%",
          end: "bottom top",
          scrub: 1,
          pin: true,
          pinSpacing: false,
          anticipatePin: 1,
        },
      });

      // Responsive animation values
      const getAnimationValues = () => {
        const isMobile = window.innerWidth < 768;
        const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024;

        if (isMobile) {
          return {
            scale: 0.8,
            z: -50,
            rotationX: 8,
            opacity: 0,
          };
        }
        if (isTablet) {
          return {
            scale: 0.7,
            z: -75,
            rotationX: 12,
            opacity: 0,
          };
        }
        return {
          scale: 0.6,
          z: -100,
          rotationX: 15,
          opacity: 0,
        };
      };

      tl.to(slide, {
        ...getAnimationValues(),
        duration: 0.7,
        ease: "power2.inOut",
      });
    });

    // Add responsive behavior
    const updatePinning = () => {
      const isMobile = window.innerWidth < 768;
      const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024;

      if (isMobile) {
        // Disable header pinning on mobile for better UX
        headerPin.disable();
      } else if (isTablet) {
        // Reduce pinning intensity on tablet
        headerPin.enable();
      } else {
        // Full pinning on desktop
        headerPin.enable();
      }
    };

    if (headingRef.current) {
      gsap.effects.fadeUpOnScroll(headingRef.current, {
        start: "top 80%",
        duration: 0.8,
        markers: false,
      });
    }

    // Initial call
    updatePinning();

    // Update on window resize
    window.addEventListener("resize", updatePinning);

    // Cleanup function
    return () => {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
      window.removeEventListener("resize", updatePinning);
    };
  }, []);

  const addSlideRef = (el: HTMLDivElement | null, index: number) => {
    if (el) {
      slidesRef.current[index] = el;
    }
  };

  return (
    <div ref={sectionRef} className="relative space-y-4 px-4 sm:px-6 lg:px-8">
      <SectionHeading
        ref={headingRef}
        badge={content.process.badge}
        heading={content.process.heading}
        description={content.process.description}
        size="md"
        align="center"
        as="h2"
        id="process-heading"
        className="mb-6 md:mb-14"
      />

      <div ref={containerRef} className="relative">
        {process.map((slide, index) => (
          <div
            key={`slide-main-${index}`}
            ref={(el) => addSlideRef(el, index)}
            className="relative mb-6 flex h-fit w-full items-center justify-center sm:mb-8 md:mb-10"
          >
            <div
              className={"relative h-fit w-full rounded-lg bg-cover p-4 sm:p-6 md:p-8 lg:p-10"}
              style={{ backgroundImage: toCssBackgroundImage(slide.bg_image) }}
            >
              <div className="w-full space-y-3 rounded-md bg-background/70 p-4 backdrop-blur-lg sm:space-y-4 sm:p-6 md:max-w-7/12">
                <div className="space-y-2 sm:space-y-3">
                  <h3 className="heading text-h4 text-heading font-semibold">{slide.title}</h3>
                  <p className="text-xs font-normal tracking-wide text-muted-foreground sm:text-sm">
                    <span> 💡</span> {slide.tagline}
                  </p>
                </div>

                <p className="text-p text-sm leading-snug text-foreground/75 sm:text-base lg:max-w-4/5">
                  {slide.description}
                </p>

                <ul className="mt-4 flex flex-wrap gap-2 sm:mt-6 sm:gap-3 md:mt-8">
                  {slide.deliverables.map((dl, ix) => (
                    <li
                      key={`deliverable-${dl.item}-${ix}`}
                      className="text-heading bg-tag-bg/20 rounded-4xl px-3 py-1 text-xs tracking-wide backdrop-blur-lg sm:px-4"
                    >
                      {dl.item}
                    </li>
                  ))}
                  <li className="text-heading bg-tag-bg/20 rounded-4xl px-3 py-1 text-xs tracking-wide backdrop-blur-lg sm:px-4">
                    Siap dijalankan tim internal
                  </li>
                  <li className="text-heading bg-tag-bg/20 rounded-4xl px-3 py-1 text-xs tracking-wide backdrop-blur-lg sm:px-4">
                    Fokus ke konversi
                  </li>
                </ul>
              </div>
              <div className="absolute right-4 bottom-4 sm:right-8 sm:bottom-6 md:right-12 md:bottom-8 lg:right-16 lg:bottom-10">
                <div className={"relative"}>
                  <span
                    className={
                      "text-6xl font-extrabold text-transparent sm:text-7xl md:text-8xl lg:text-9xl"
                    }
                    style={{
                      WebkitTextStroke: "2px rgb(225,225,225,0.9",
                      textShadow: "0 1px 2px rgba(225, 225, 225, 0.05)",
                      color: "rgb(0,0,0,0.09)",
                    }}
                  >
                    {index + 1}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProcessCards;
