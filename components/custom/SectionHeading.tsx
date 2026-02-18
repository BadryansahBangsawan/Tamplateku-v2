"use client";

import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import { forwardRef } from "react";

export interface SectionHeadingProps {
  /**
   * Deprecated: no longer rendered
   */
  badge?: string;
  /**
   * The main heading text
   */
  heading: string;
  /**
   * Optional description text (hidden from screen readers by default)
   */
  description?: string;
  /**
   * Deprecated: no longer rendered
   */
  icon?: LucideIcon;
  /**
   * Size variant for the heading
   * @default "md"
   */
  size?: "sm" | "md" | "lg" | "xl";
  /**
   * Text alignment
   * @default "center"
   */
  align?: "left" | "center" | "right";
  /**
   * Additional CSS classes for the container
   */
  className?: string;
  /**
   * Additional CSS classes for the heading
   */
  headingClassName?: string;
  /**
   * Deprecated: no longer rendered
   */
  badgeClassName?: string;
  /**
   * HTML heading level (h1, h2, h3, h4, h5, h6)
   * @default "h2"
   */
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
  /**
   * ID for the heading element (useful for anchor links)
   */
  id?: string;
  /**
   * Whether to show the description to screen readers
   * @default false
   */
  showDescriptionToScreenReaders?: boolean;
}

const sizeVariants = {
  sm: {
    heading: "text-xl sm:text-2xl leading-tight",
    description: "text-sm leading-snug",
    spacing: "space-y-1.5",
  },
  md: {
    heading: "text-2xl sm:text-3xl md:text-4xl leading-tight",
    description: "text-sm sm:text-base leading-snug",
    spacing: "space-y-2",
  },
  lg: {
    heading: "text-3xl sm:text-4xl md:text-5xl leading-tight",
    description: "text-base sm:text-md leading-snug",
    spacing: "space-y-3 sm:space-y-4",
  },
  xl: {
    heading: "text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl leading-tight",
    description: "text-lg sm:text-xl leading-snug",
    spacing: "space-y-4 sm:space-y-6",
  },
};

const alignVariants = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
};

const SectionHeading = forwardRef<HTMLDivElement, SectionHeadingProps>(
  (
    {
      heading,
      description,
      size = "md",
      align = "center",
      className,
      headingClassName,
      as: Component = "h2",
      id,
      showDescriptionToScreenReaders = false,
      ...props
    },
    ref
  ) => {
    const variant = sizeVariants[size];
    const alignment = alignVariants[align];

    return (
      <header ref={ref} className={cn("z-10", variant.spacing, alignment, className)} {...props}>
        {/* Heading */}
        <Component
          id={id}
          className={cn(
            "text-foreground font-semibold",
            variant.heading,
            align === "center" && "md:mx-auto",
            headingClassName
          )}
        >
          {heading}
        </Component>

        {/* Description */}
        {description && (
          <p
            className={cn(
              "text-muted-foreground",
              variant.description,
              align === "center" && "md:mx-auto",
              !showDescriptionToScreenReaders && "sr-only"
            )}
            aria-live="polite"
          >
            {description}
          </p>
        )}
      </header>
    );
  }
);

SectionHeading.displayName = "SectionHeading";

export { SectionHeading };
