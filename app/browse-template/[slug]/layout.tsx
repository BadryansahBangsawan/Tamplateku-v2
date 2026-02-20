import { generateTemplateDetailMetadata } from "@/lib/metadata";
import { getTemplateBySlugServer } from "@/lib/templateServer";
import type { Metadata } from "next";

export const runtime = "edge";

type Props = {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const template = await getTemplateBySlugServer(slug);

  if (!template) {
    return generateTemplateDetailMetadata({
      title: "Template Premium",
      description: "Template premium siap launch dari Tamplateku.",
      slug,
    });
  }

  return generateTemplateDetailMetadata({
    title: template.project_title,
    description: template.description,
    slug,
    image: template.main_image_src,
  });
}

export default function BrowseTemplateSlugLayout({ children }: Props) {
  return children;
}
