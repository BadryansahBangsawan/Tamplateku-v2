import { defaultCaseStudiesContent } from "@/lib/caseStudiesContent";
import { getTemplatesFromDb } from "@/lib/cmsDb";
import { enrichTemplates } from "@/lib/templateCatalog";

export async function getEnrichedTemplatesServer() {
  try {
    const templates = await getTemplatesFromDb();
    return enrichTemplates(templates);
  } catch {
    return enrichTemplates(defaultCaseStudiesContent);
  }
}

export async function getTemplateBySlugServer(slug: string) {
  const templates = await getEnrichedTemplatesServer();
  return templates.find((item) => item.slug === slug) ?? null;
}
