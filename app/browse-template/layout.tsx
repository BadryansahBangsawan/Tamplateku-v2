import { generatePageMetadata } from "@/lib/metadata";
import type { Metadata } from "next";

export const metadata: Metadata = generatePageMetadata("browseTemplate");

export default function BrowseTemplateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
