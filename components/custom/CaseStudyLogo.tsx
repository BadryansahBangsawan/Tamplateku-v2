"use client";

import { withFrameworkLogoVersion } from "@/lib/frameworkAssets";
import { type ImgHTMLAttributes, forwardRef, useEffect, useMemo, useState } from "react";

type CaseStudyLogoProps = {
  src?: string | null;
  name: string;
} & Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "alt">;

const FALLBACK_LOGO_SRC = "/logo.png";

function normalizeLogoSrc(src?: string | null): string {
  const candidate = typeof src === "string" ? src.trim() : "";
  if (!candidate) return withFrameworkLogoVersion(FALLBACK_LOGO_SRC);

  if (
    candidate.startsWith("http://") ||
    candidate.startsWith("https://") ||
    candidate.startsWith("data:") ||
    candidate.startsWith("/")
  ) {
    return withFrameworkLogoVersion(candidate);
  }

  return withFrameworkLogoVersion(`/${candidate.replace(/^\/+/, "")}`);
}

const CaseStudyLogo = forwardRef<HTMLImageElement, CaseStudyLogoProps>(function CaseStudyLogo(
  { src, name, onError, className, ...rest },
  ref
) {
  const desiredSrc = useMemo(() => normalizeLogoSrc(src), [src]);
  const [currentSrc, setCurrentSrc] = useState(desiredSrc);

  useEffect(() => {
    setCurrentSrc(desiredSrc);
  }, [desiredSrc]);

  return (
    <img
      ref={ref}
      src={currentSrc}
      className={className}
      alt={`${name} company logo`}
      loading="lazy"
      decoding="async"
      onError={(event) => {
        if (currentSrc !== FALLBACK_LOGO_SRC) {
          setCurrentSrc(FALLBACK_LOGO_SRC);
        }
        onError?.(event);
      }}
      {...rest}
    />
  );
});

export default CaseStudyLogo;
