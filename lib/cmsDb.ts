import type { CaseStudyType } from "@/data/caseStudies";
import { defaultCaseStudiesContent, parseCaseStudies } from "@/lib/caseStudiesContent";
import { runD1Query } from "@/lib/cloudflareD1";
import { type SiteContent, defaultSiteContent, mergeSiteContent } from "@/lib/siteContent";

type SiteContentRow = {
  content_json: string;
};

type TemplateRow = {
  id: string;
  sort_order: number;
  name: string;
  project_title: string;
  main_image_src: string;
  logo_src: string;
  description: string;
  features_json: string;
  case_study_link: string;
  demo_images_json: string;
  project_link: string | null;
  cta_talk: string | null;
  cta_read_case_study: string | null;
  test_img: string | null;
  testimonial: string | null;
  founder_name: string | null;
  position: string | null;
  status_label: string | null;
  is_best_seller: number | null;
};

function parseJsonArray(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is string => typeof item === "string");
  } catch {
    return [];
  }
}

function rowToCaseStudy(row: TemplateRow): CaseStudyType {
  const ctaLinks =
    row.cta_talk && row.cta_read_case_study
      ? {
          "let's talk": row.cta_talk,
          "read case study": row.cta_read_case_study,
        }
      : undefined;

  return {
    id: row.id,
    name: row.name,
    project_title: row.project_title,
    main_image_src: row.main_image_src,
    logo_src: row.logo_src,
    description: row.description,
    features: parseJsonArray(row.features_json),
    case_study_link: row.case_study_link,
    demo_images: parseJsonArray(row.demo_images_json),
    project_link: row.project_link,
    cta_links: ctaLinks,
    test_img: row.test_img ?? undefined,
    testimonial: row.testimonial ?? undefined,
    founder_name: row.founder_name ?? undefined,
    position: row.position ?? undefined,
    status_label: row.status_label ?? undefined,
    is_best_seller: row.is_best_seller === 1,
  };
}

function toNullableString(value: string | null | undefined): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeTemplates(input: CaseStudyType[]): CaseStudyType[] {
  const parsed = parseCaseStudies(JSON.stringify(input));
  return parsed.length > 0 ? parsed : defaultCaseStudiesContent;
}

export async function ensureCmsTables(): Promise<void> {
  await runD1Query(`
    CREATE TABLE IF NOT EXISTS cms_site_content (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      content_json TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  await runD1Query(`
    CREATE TABLE IF NOT EXISTS cms_templates (
      id TEXT PRIMARY KEY,
      sort_order INTEGER NOT NULL,
      name TEXT NOT NULL,
      project_title TEXT NOT NULL,
      main_image_src TEXT NOT NULL,
      logo_src TEXT NOT NULL,
      description TEXT NOT NULL,
      features_json TEXT NOT NULL,
      case_study_link TEXT NOT NULL,
      demo_images_json TEXT NOT NULL,
      project_link TEXT,
      cta_talk TEXT,
      cta_read_case_study TEXT,
      test_img TEXT,
      testimonial TEXT,
      founder_name TEXT,
      position TEXT,
      status_label TEXT,
      is_best_seller INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  await runD1Query(`
    CREATE INDEX IF NOT EXISTS idx_cms_templates_sort_order
    ON cms_templates(sort_order);
  `);

  const templateColumns = await runD1Query<{ name: string }>("PRAGMA table_info(cms_templates)");
  const hasStatusLabel = templateColumns.some((column) => column.name === "status_label");
  if (!hasStatusLabel) {
    await runD1Query("ALTER TABLE cms_templates ADD COLUMN status_label TEXT");
  }
  const hasBestSeller = templateColumns.some((column) => column.name === "is_best_seller");
  if (!hasBestSeller) {
    await runD1Query(
      "ALTER TABLE cms_templates ADD COLUMN is_best_seller INTEGER NOT NULL DEFAULT 0"
    );
  }
}

export async function getSiteContentFromDb(): Promise<SiteContent> {
  await ensureCmsTables();

  const rows = await runD1Query<SiteContentRow>(
    "SELECT content_json FROM cms_site_content WHERE id = 1 LIMIT 1"
  );

  if (rows.length === 0) {
    await saveSiteContentToDb(defaultSiteContent);
    return defaultSiteContent;
  }

  try {
    const parsed = JSON.parse(rows[0].content_json);
    return mergeSiteContent(defaultSiteContent, parsed);
  } catch {
    return defaultSiteContent;
  }
}

export async function saveSiteContentToDb(content: SiteContent): Promise<void> {
  await ensureCmsTables();
  const merged = mergeSiteContent(defaultSiteContent, content);
  const now = new Date().toISOString();

  await runD1Query(
    "INSERT OR REPLACE INTO cms_site_content (id, content_json, updated_at) VALUES (1, ?, ?)",
    [JSON.stringify(merged), now]
  );
}

export async function getTemplatesFromDb(): Promise<CaseStudyType[]> {
  await ensureCmsTables();

  const rows = await runD1Query<TemplateRow>(
    `SELECT id, sort_order, name, project_title, main_image_src, logo_src, description,
            features_json, case_study_link, demo_images_json, project_link, cta_talk,
            cta_read_case_study, test_img, testimonial, founder_name, position,
            status_label, is_best_seller
     FROM cms_templates
     ORDER BY sort_order ASC`
  );

  if (rows.length === 0) {
    return saveTemplatesToDb(defaultCaseStudiesContent);
  }

  return rows.map(rowToCaseStudy);
}

export async function saveTemplatesToDb(templates: CaseStudyType[]): Promise<CaseStudyType[]> {
  await ensureCmsTables();

  const normalized = normalizeTemplates(templates);
  const now = new Date().toISOString();

  await runD1Query("DELETE FROM cms_templates");

  const saved: CaseStudyType[] = [];
  for (let index = 0; index < normalized.length; index += 1) {
    const item = normalized[index];
    const id = item.id && item.id.trim().length > 0 ? item.id : crypto.randomUUID();

    await runD1Query(
      `INSERT INTO cms_templates (
        id, sort_order, name, project_title, main_image_src, logo_src, description,
        features_json, case_study_link, demo_images_json, project_link, cta_talk,
        cta_read_case_study, test_img, testimonial, founder_name, position,
        status_label, is_best_seller,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        index,
        item.name,
        item.project_title,
        item.main_image_src,
        item.logo_src,
        item.description,
        JSON.stringify(item.features),
        item.case_study_link,
        JSON.stringify(item.demo_images),
        toNullableString(item.project_link),
        toNullableString(item.cta_links?.["let's talk"]),
        toNullableString(item.cta_links?.["read case study"]),
        toNullableString(item.test_img),
        toNullableString(item.testimonial),
        toNullableString(item.founder_name),
        toNullableString(item.position),
        toNullableString(item.status_label),
        item.is_best_seller ? 1 : 0,
        now,
        now,
      ]
    );

    saved.push({
      ...item,
      id,
    });
  }

  return saved;
}

export async function deleteAllTemplatesFromDb(): Promise<void> {
  await ensureCmsTables();
  await runD1Query("DELETE FROM cms_templates");
}
