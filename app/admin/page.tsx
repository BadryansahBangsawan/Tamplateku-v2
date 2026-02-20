"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import type { CaseStudyType } from "@/data/caseStudies";
import { useCaseStudies } from "@/hooks/use-case-studies";
import { useSiteContent } from "@/hooks/use-site-content";
import { defaultCaseStudiesContent, writeCaseStudiesToStorage } from "@/lib/caseStudiesContent";
import { type SiteContent, defaultSiteContent, writeSiteContentToStorage } from "@/lib/siteContent";
import { ArrowDown, ArrowUp, Copy, ExternalLink, Plus, RotateCcw, Save, Trash2 } from "lucide-react";
import Link from "next/link";
import { type ChangeEvent, useEffect, useMemo, useState } from "react";

const MAX_IMAGE_FILE_SIZE_BYTES = 1_500_000;
const HERO_LOGO_KEYS = ["nextjs", "vue", "react", "nuxt"] as const;
const HERO_LOGO_LABELS = ["Next.js", "Vue", "React", "Nuxt"] as const;

function cloneSiteContent(content: SiteContent): SiteContent {
  return {
    ...content,
    hero: {
      ...content.hero,
      frameworkLogos: {
        ...content.hero.frameworkLogos,
      },
    },
    process: {
      ...content.process,
      backgroundImages: [...content.process.backgroundImages],
    },
    contact: {
      ...content.contact,
    },
  };
}

function cloneCaseStudy(item: CaseStudyType): CaseStudyType {
  return {
    ...item,
    features: [...item.features],
    demo_images: [...item.demo_images],
    cta_links: item.cta_links ? { ...item.cta_links } : undefined,
  };
}

function createNewCaseStudy(seed: number): CaseStudyType {
  const base = cloneCaseStudy(defaultCaseStudiesContent[0]);
  return {
    ...base,
    id: crypto.randomUUID(),
    name: `Template ${seed}`,
    project_title: "Template baru siap pakai",
    description: "Deskripsi singkat template baru.",
    testimonial: "",
    founder_name: "",
    position: "",
  };
}

function parseLines(value: string): string[] {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }

      reject(new Error("invalid_result"));
    };

    reader.onerror = () => reject(reader.error ?? new Error("read_failed"));
    reader.readAsDataURL(file);
  });
}

function validateImageFile(file: File): string | null {
  if (!file.type.startsWith("image/")) {
    return `File "${file.name}" bukan gambar.`;
  }

  if (file.size > MAX_IMAGE_FILE_SIZE_BYTES) {
    return `Ukuran "${file.name}" terlalu besar. Maksimal 1.5 MB per gambar.`;
  }

  return null;
}

async function getApiErrorMessage(response: Response, fallback: string): Promise<string> {
  try {
    const payload = (await response.json()) as { message?: string };
    if (typeof payload.message === "string" && payload.message.trim().length > 0) {
      return payload.message;
    }
  } catch {}

  return fallback;
}

export default function AdminPage() {
  const liveContent = useSiteContent();
  const liveCaseStudies = useCaseStudies();

  const [draftContent, setDraftContent] = useState<SiteContent>(cloneSiteContent(liveContent));
  const [draftCaseStudies, setDraftCaseStudies] = useState<CaseStudyType[]>(liveCaseStudies);
  const [selectedCaseStudy, setSelectedCaseStudy] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<string>("");

  useEffect(() => {
    setDraftContent(cloneSiteContent(liveContent));
  }, [liveContent]);

  useEffect(() => {
    setDraftCaseStudies(liveCaseStudies);
    setSelectedCaseStudy((prev) => Math.min(prev, Math.max(liveCaseStudies.length - 1, 0)));
  }, [liveCaseStudies]);

  const isContentDirty = useMemo(
    () => JSON.stringify(draftContent) !== JSON.stringify(liveContent),
    [draftContent, liveContent]
  );

  const isTemplatesDirty = useMemo(
    () => JSON.stringify(draftCaseStudies) !== JSON.stringify(liveCaseStudies),
    [draftCaseStudies, liveCaseStudies]
  );

  const isDirty = isContentDirty || isTemplatesDirty;

  const updateContentField = (section: keyof SiteContent, field: string, value: string) => {
    setDraftContent((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  const updateHeroFrameworkLogo = (
    key: (typeof HERO_LOGO_KEYS)[number],
    value: string
  ) => {
    setDraftContent((prev) => ({
      ...prev,
      hero: {
        ...prev.hero,
        frameworkLogos: {
          ...prev.hero.frameworkLogos,
          [key]: value,
        },
      },
    }));
  };

  const updateProcessBackgroundImage = (index: number, value: string) => {
    setDraftContent((prev) => {
      const next = [...prev.process.backgroundImages];
      while (next.length <= index) {
        next.push("");
      }
      next[index] = value;
      return {
        ...prev,
        process: {
          ...prev.process,
          backgroundImages: next,
        },
      };
    });
  };

  const updateCaseStudyImageFieldByIndex = (
    index: number,
    field: "main_image_src" | "logo_src" | "test_img",
    value: string
  ) => {
    setDraftCaseStudies((prev) =>
      prev.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              [field]: value,
            }
          : item
      )
    );
  };

  const activeCaseStudy = draftCaseStudies[selectedCaseStudy];

  const updateCaseStudyField = (field: keyof CaseStudyType, value: string) => {
    setDraftCaseStudies((prev) =>
      prev.map((item, index) =>
        index === selectedCaseStudy
          ? {
              ...item,
              [field]: value,
            }
          : item
      )
    );
  };

  const updateCaseStudyListField = (field: "features" | "demo_images", value: string) => {
    const parsed = parseLines(value);
    setDraftCaseStudies((prev) =>
      prev.map((item, index) => (index === selectedCaseStudy ? { ...item, [field]: parsed } : item))
    );
  };

  const updateCaseStudyCtaField = (field: "let's talk" | "read case study", value: string) => {
    setDraftCaseStudies((prev) =>
      prev.map((item, index) => {
        if (index !== selectedCaseStudy) return item;
        const current = item.cta_links ?? {
          "let's talk": "",
          "read case study": "",
        };
        return {
          ...item,
          cta_links: {
            ...current,
            [field]: value,
          },
        };
      })
    );
  };

  const handleCaseStudyImageUpload = async (
    event: ChangeEvent<HTMLInputElement>,
    field: "main_image_src" | "logo_src" | "test_img"
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    const validationError = validateImageFile(file);
    if (validationError) {
      setStatus(validationError);
      return;
    }

    try {
      const dataUrl = await fileToDataUrl(file);
      updateCaseStudyField(field, dataUrl);
      setStatus(`"${file.name}" berhasil diupload. Klik Simpan Semua untuk menyimpan ke database.`);
    } catch {
      setStatus(`Gagal membaca file "${file.name}".`);
    }
  };

  const handleDemoImagesUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";

    if (files.length === 0) return;

    for (const file of files) {
      const validationError = validateImageFile(file);
      if (validationError) {
        setStatus(validationError);
        return;
      }
    }

    try {
      const uploaded = await Promise.all(files.map((file) => fileToDataUrl(file)));
      setDraftCaseStudies((prev) =>
        prev.map((item, index) =>
          index === selectedCaseStudy
            ? { ...item, demo_images: [...item.demo_images, ...uploaded] }
            : item
        )
      );
      setStatus(
        `${uploaded.length} gambar demo berhasil diupload. Klik Simpan Semua untuk menyimpan ke database.`
      );
    } catch {
      setStatus("Gagal membaca salah satu file gambar demo.");
    }
  };

  const handleHeroLogoUpload = async (
    event: ChangeEvent<HTMLInputElement>,
    key: (typeof HERO_LOGO_KEYS)[number],
    label: string
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const validationError = validateImageFile(file);
    if (validationError) {
      setStatus(validationError);
      return;
    }

    try {
      const dataUrl = await fileToDataUrl(file);
      updateHeroFrameworkLogo(key, dataUrl);
      setStatus(
        `Logo ${label} berhasil diupload. Klik Simpan Semua untuk menyimpan ke database.`
      );
    } catch {
      setStatus(`Gagal membaca file "${file.name}".`);
    }
  };

  const handleProcessBackgroundUpload = async (
    event: ChangeEvent<HTMLInputElement>,
    index: number
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const validationError = validateImageFile(file);
    if (validationError) {
      setStatus(validationError);
      return;
    }

    try {
      const dataUrl = await fileToDataUrl(file);
      updateProcessBackgroundImage(index, dataUrl);
      setStatus(
        `Background proses step ${index + 1} berhasil diupload. Klik Simpan Semua untuk menyimpan ke database.`
      );
    } catch {
      setStatus(`Gagal membaca file "${file.name}".`);
    }
  };

  const handleContactBackgroundUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const validationError = validateImageFile(file);
    if (validationError) {
      setStatus(validationError);
      return;
    }

    try {
      const dataUrl = await fileToDataUrl(file);
      updateContentField("contact", "backgroundImage", dataUrl);
      setStatus("Background contact section berhasil diupload. Klik Simpan Semua untuk menyimpan.");
    } catch {
      setStatus(`Gagal membaca file "${file.name}".`);
    }
  };

  const handleSectionCaseStudyImageUpload = async (
    event: ChangeEvent<HTMLInputElement>,
    index: number,
    field: "main_image_src" | "logo_src" | "test_img",
    label: string
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const validationError = validateImageFile(file);
    if (validationError) {
      setStatus(validationError);
      return;
    }

    try {
      const dataUrl = await fileToDataUrl(file);
      updateCaseStudyImageFieldByIndex(index, field, dataUrl);
      setStatus(`${label} berhasil diupload. Klik Simpan Semua untuk menyimpan ke database.`);
    } catch {
      setStatus(`Gagal membaca file "${file.name}".`);
    }
  };

  const saveAll = async () => {
    if (!isDirty) {
      setStatus("Tidak ada perubahan untuk disimpan.");
      return;
    }

    setIsSaving(true);
    setStatus("Menyimpan perubahan ke database...");

    try {
      let savedContent = draftContent;
      let savedTemplates = draftCaseStudies;

      if (isContentDirty) {
        const contentResponse = await fetch("/api/cms/content", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: draftContent }),
        });

        if (!contentResponse.ok) {
          const message = await getApiErrorMessage(contentResponse, "Gagal simpan section.");
          throw new Error(message);
        }

        const contentPayload = (await contentResponse.json()) as {
          ok: boolean;
          data?: SiteContent;
        };
        savedContent = contentPayload.data ?? draftContent;
        setDraftContent(savedContent);
        writeSiteContentToStorage(savedContent);
      }

      if (isTemplatesDirty) {
        const templatesResponse = await fetch("/api/cms/templates", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ templates: draftCaseStudies }),
        });

        if (!templatesResponse.ok) {
          const message = await getApiErrorMessage(templatesResponse, "Gagal simpan template.");
          throw new Error(message);
        }

        const templatesPayload = (await templatesResponse.json()) as {
          ok: boolean;
          data?: CaseStudyType[];
        };
        savedTemplates = templatesPayload.data ?? draftCaseStudies;
        setDraftCaseStudies(savedTemplates);
        writeCaseStudiesToStorage(savedTemplates);
      }

      if (isContentDirty && isTemplatesDirty) {
        setStatus("Perubahan section dan template berhasil disimpan ke database.");
      } else if (isContentDirty) {
        setStatus("Perubahan section berhasil disimpan ke database.");
      } else {
        setStatus("Perubahan template berhasil disimpan ke database.");
      }
    } catch (error) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : "Gagal menyimpan perubahan. Pastikan login admin aktif.";
      setStatus(message);
    } finally {
      setIsSaving(false);
    }
  };

  const resetAll = async () => {
    const resetContent = cloneSiteContent(defaultSiteContent);
    const resetTemplates = defaultCaseStudiesContent.map((item) => ({
      ...cloneCaseStudy(item),
      id: crypto.randomUUID(),
    }));

    setDraftContent(resetContent);
    setDraftCaseStudies(resetTemplates);
    setSelectedCaseStudy(0);

    setIsSaving(true);
    setStatus("Mereset konten ke default dan menyimpan ke database...");

    try {
      const [contentResponse, templatesResponse] = await Promise.all([
        fetch("/api/cms/content", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: resetContent }),
        }),
        fetch("/api/cms/templates", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ templates: resetTemplates }),
        }),
      ]);

      if (!contentResponse.ok || !templatesResponse.ok) {
        const message = !contentResponse.ok
          ? await getApiErrorMessage(contentResponse, "Gagal reset section.")
          : await getApiErrorMessage(templatesResponse, "Gagal reset template.");
        throw new Error(message);
      }

      const templatesPayload = (await templatesResponse.json()) as {
        ok: boolean;
        data?: CaseStudyType[];
      };
      const savedTemplates = templatesPayload.data ?? resetTemplates;

      setDraftCaseStudies(savedTemplates);
      writeSiteContentToStorage(resetContent);
      writeCaseStudiesToStorage(savedTemplates);
      setStatus("Semua konten berhasil direset ke default.");
    } catch (error) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : "Gagal reset konten ke database.";
      setStatus(message);
    } finally {
      setIsSaving(false);
    }
  };

  const addCaseStudy = () => {
    const newItem = createNewCaseStudy(draftCaseStudies.length + 1);
    setDraftCaseStudies((prev) => [...prev, newItem]);
    setSelectedCaseStudy(draftCaseStudies.length);
    setStatus("Template baru ditambahkan. Lengkapi detail lalu simpan.");
  };

  const duplicateCaseStudy = () => {
    if (!activeCaseStudy) return;
    const duplicated = cloneCaseStudy(activeCaseStudy);
    duplicated.id = crypto.randomUUID();
    duplicated.name = `${duplicated.name} Copy`;
    setDraftCaseStudies((prev) => [...prev, duplicated]);
    setSelectedCaseStudy(draftCaseStudies.length);
    setStatus("Template berhasil diduplikasi.");
  };

  const deleteCaseStudy = (index: number) => {
    if (draftCaseStudies.length <= 1) {
      setStatus("Minimal harus ada 1 template. Tambah template baru dulu sebelum menghapus.");
      return;
    }

    setDraftCaseStudies((prev) => prev.filter((_, itemIndex) => itemIndex !== index));
    setSelectedCaseStudy((prev) => Math.max(0, Math.min(prev, draftCaseStudies.length - 2)));
    setStatus("Template berhasil dihapus.");
  };

  const moveCaseStudy = (fromIndex: number, direction: "up" | "down") => {
    const toIndex = direction === "up" ? fromIndex - 1 : fromIndex + 1;
    if (toIndex < 0 || toIndex >= draftCaseStudies.length) return;

    setDraftCaseStudies((prev) => {
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
    setSelectedCaseStudy(toIndex);
    setStatus("Urutan template diperbarui.");
  };

  const featuredCaseStudies = useMemo(
    () => draftCaseStudies.slice(0, 3).map((item, index) => ({ item, index })),
    [draftCaseStudies]
  );

  const testimonialCaseStudies = useMemo(
    () =>
      draftCaseStudies
        .map((item, index) => ({ item, index }))
        .filter(({ item }) => Boolean(item.testimonial && item.testimonial.trim().length > 0)),
    [draftCaseStudies]
  );

  return (
    <main className="min-h-screen bg-muted/30 px-4 py-6 md:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col gap-4 rounded-xl border bg-background p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Tamplateku CMS</p>
            <h1 className="text-2xl font-semibold">Admin Konten & CRUD Section</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Kelola konten global dan item template. Perubahan akan dipakai di Home, Templates,
              Testimonial, dan Contact section.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href="/" target="_blank">
                Preview Website
                <ExternalLink className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button onClick={saveAll} disabled={!isDirty || isSaving}>
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? "Menyimpan..." : "Simpan Semua"}
            </Button>
            <Button variant="outline" onClick={resetAll} disabled={isSaving}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Reset Semua
            </Button>
          </div>
        </header>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Section Editable</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">5</p>
              <p className="text-xs text-muted-foreground">
                Hero, Case Studies, Process, Testimonials, Contact
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Template Items</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{draftCaseStudies.length}</p>
              <p className="text-xs text-muted-foreground">
                Dipakai untuk carousel, cards, dan testimonial
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Storage</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">Cloudflare D1</p>
              <p className="text-xs text-muted-foreground">
                Database utama + local sync untuk realtime update UI
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Badge variant={isDirty ? "destructive" : "secondary"}>
                  {isDirty ? "Unsaved" : "Synced"}
                </Badge>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {status || "Siap edit dan simpan perubahan."}
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="sections" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="sections">Sections</TabsTrigger>
            <TabsTrigger value="templates">Templates CRUD</TabsTrigger>
            <TabsTrigger value="links">Page Links</TabsTrigger>
          </TabsList>

          <TabsContent value="sections" className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Hero Section</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Label htmlFor="hero-badge">Badge</Label>
                  <Input
                    id="hero-badge"
                    value={draftContent.hero.badge}
                    onChange={(e) => updateContentField("hero", "badge", e.target.value)}
                  />
                  <Label htmlFor="hero-heading">Heading</Label>
                  <Input
                    id="hero-heading"
                    value={draftContent.hero.heading}
                    onChange={(e) => updateContentField("hero", "heading", e.target.value)}
                  />
                  <Label htmlFor="hero-description">Description</Label>
                  <Textarea
                    id="hero-description"
                    rows={3}
                    value={draftContent.hero.description}
                    onChange={(e) => updateContentField("hero", "description", e.target.value)}
                  />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="hero-primary">Primary CTA</Label>
                      <Input
                        id="hero-primary"
                        value={draftContent.hero.primaryCta}
                        onChange={(e) => updateContentField("hero", "primaryCta", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="hero-secondary">Secondary CTA</Label>
                      <Input
                        id="hero-secondary"
                        value={draftContent.hero.secondaryCta}
                        onChange={(e) => updateContentField("hero", "secondaryCta", e.target.value)}
                      />
                    </div>
                  </div>
                  <Separator />
                  <div className="space-y-3">
                    <p className="text-sm font-medium">Framework Logo Bar (Hero)</p>
                    <div className="grid gap-3 md:grid-cols-2">
                      {HERO_LOGO_KEYS.map((key, index) => (
                        <div key={key} className="space-y-2 rounded-md border p-3">
                          <Label>{HERO_LOGO_LABELS[index]} Logo URL</Label>
                          <Input
                            value={draftContent.hero.frameworkLogos[key]}
                            onChange={(e) => updateHeroFrameworkLogo(key, e.target.value)}
                          />
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={(event) =>
                              void handleHeroLogoUpload(event, key, HERO_LOGO_LABELS[index])
                            }
                          />
                          <div className="bg-muted/40 flex h-16 items-center justify-center rounded border p-2">
                            <img
                              src={draftContent.hero.frameworkLogos[key]}
                              alt={`${HERO_LOGO_LABELS[index]} preview`}
                              className="max-h-10 w-auto object-contain"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Case Studies Section</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Label htmlFor="cs-badge">Badge</Label>
                  <Input
                    id="cs-badge"
                    value={draftContent.caseStudies.badge}
                    onChange={(e) => updateContentField("caseStudies", "badge", e.target.value)}
                  />
                  <Label htmlFor="cs-heading">Heading</Label>
                  <Input
                    id="cs-heading"
                    value={draftContent.caseStudies.heading}
                    onChange={(e) => updateContentField("caseStudies", "heading", e.target.value)}
                  />
                  <Label htmlFor="cs-description">Description</Label>
                  <Textarea
                    id="cs-description"
                    rows={3}
                    value={draftContent.caseStudies.description}
                    onChange={(e) =>
                      updateContentField("caseStudies", "description", e.target.value)
                    }
                  />
                  <Label htmlFor="cs-button">Button Label</Label>
                  <Input
                    id="cs-button"
                    value={draftContent.caseStudies.buttonLabel}
                    onChange={(e) =>
                      updateContentField("caseStudies", "buttonLabel", e.target.value)
                    }
                  />
                  <Separator />
                  <div className="space-y-3">
                    <p className="text-sm font-medium">Quick Image CRUD - Case Studies (Top 3)</p>
                    {featuredCaseStudies.map(({ item, index }) => (
                      <div key={`cs-image-${item.id ?? index}`} className="space-y-2 rounded-md border p-3">
                        <p className="text-sm font-medium">{item.name}</p>
                        <Label>Main Image URL</Label>
                        <Input
                          value={item.main_image_src}
                          onChange={(e) =>
                            updateCaseStudyImageFieldByIndex(index, "main_image_src", e.target.value)
                          }
                        />
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(event) =>
                            void handleSectionCaseStudyImageUpload(
                              event,
                              index,
                              "main_image_src",
                              `Main image ${item.name}`
                            )
                          }
                        />
                        <img
                          src={item.main_image_src}
                          alt={`Case study ${item.name} preview`}
                          className="h-24 w-full rounded border object-cover"
                        />
                      </div>
                    ))}
                    <p className="text-xs text-muted-foreground">
                      Untuk edit demo images dan logo lebih lengkap, gunakan tab Templates CRUD.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Process Section</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Label htmlFor="process-badge">Badge</Label>
                  <Input
                    id="process-badge"
                    value={draftContent.process.badge}
                    onChange={(e) => updateContentField("process", "badge", e.target.value)}
                  />
                  <Label htmlFor="process-heading">Heading</Label>
                  <Input
                    id="process-heading"
                    value={draftContent.process.heading}
                    onChange={(e) => updateContentField("process", "heading", e.target.value)}
                  />
                  <Label htmlFor="process-description">Description</Label>
                  <Textarea
                    id="process-description"
                    rows={3}
                    value={draftContent.process.description}
                    onChange={(e) => updateContentField("process", "description", e.target.value)}
                  />
                  <Separator />
                  <div className="space-y-3">
                    <p className="text-sm font-medium">Background Image per Step</p>
                    <div className="grid gap-3 md:grid-cols-2">
                      {[0, 1, 2, 3].map((index) => (
                        <div key={`process-bg-${index}`} className="space-y-2 rounded-md border p-3">
                          <Label>{`Step ${index + 1} Background URL`}</Label>
                          <Input
                            value={draftContent.process.backgroundImages[index] ?? ""}
                            onChange={(e) =>
                              updateProcessBackgroundImage(index, e.target.value)
                            }
                          />
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={(event) => void handleProcessBackgroundUpload(event, index)}
                          />
                          <img
                            src={draftContent.process.backgroundImages[index] ?? ""}
                            alt={`Process step ${index + 1} background preview`}
                            className="h-24 w-full rounded border object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Testimonials Section</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Label htmlFor="testi-badge">Badge</Label>
                  <Input
                    id="testi-badge"
                    value={draftContent.testimonials.badge}
                    onChange={(e) => updateContentField("testimonials", "badge", e.target.value)}
                  />
                  <Label htmlFor="testi-heading">Heading</Label>
                  <Input
                    id="testi-heading"
                    value={draftContent.testimonials.heading}
                    onChange={(e) => updateContentField("testimonials", "heading", e.target.value)}
                  />
                  <Label htmlFor="testi-description">Description</Label>
                  <Textarea
                    id="testi-description"
                    rows={2}
                    value={draftContent.testimonials.description}
                    onChange={(e) =>
                      updateContentField("testimonials", "description", e.target.value)
                    }
                  />
                  <div className="grid gap-3">
                    <Input
                      value={draftContent.testimonials.statOneLabel}
                      onChange={(e) =>
                        updateContentField("testimonials", "statOneLabel", e.target.value)
                      }
                      placeholder="Stat 1 label"
                    />
                    <Input
                      value={draftContent.testimonials.statTwoLabel}
                      onChange={(e) =>
                        updateContentField("testimonials", "statTwoLabel", e.target.value)
                      }
                      placeholder="Stat 2 label"
                    />
                    <Input
                      value={draftContent.testimonials.statThreeLabel}
                      onChange={(e) =>
                        updateContentField("testimonials", "statThreeLabel", e.target.value)
                      }
                      placeholder="Stat 3 label"
                    />
                  </div>
                  <Separator />
                  <div className="space-y-3">
                    <p className="text-sm font-medium">Quick Image CRUD - Testimonials</p>
                    {testimonialCaseStudies.length === 0 ? (
                      <p className="text-xs text-muted-foreground">
                        Belum ada item testimonial. Isi testimonial di tab Templates CRUD untuk
                        menampilkan kontrol image di sini.
                      </p>
                    ) : (
                      testimonialCaseStudies.map(({ item, index }) => (
                        <div key={`testimonial-image-${item.id ?? index}`} className="space-y-2 rounded-md border p-3">
                          <p className="text-sm font-medium">{item.name}</p>
                          <Label>Testimonial Image URL</Label>
                          <Input
                            value={item.test_img ?? ""}
                            onChange={(e) =>
                              updateCaseStudyImageFieldByIndex(index, "test_img", e.target.value)
                            }
                          />
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={(event) =>
                              void handleSectionCaseStudyImageUpload(
                                event,
                                index,
                                "test_img",
                                `Testimonial image ${item.name}`
                              )
                            }
                          />
                          <img
                            src={item.test_img ?? ""}
                            alt={`Testimonial ${item.name} preview`}
                            className="h-24 w-full rounded border object-cover"
                          />
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Contact Section</CardTitle>
                <CardDescription>Kontrol heading dan label form di section kontak.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-3 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Badge</Label>
                    <Input
                      value={draftContent.contact.badge}
                      onChange={(e) => updateContentField("contact", "badge", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Heading</Label>
                    <Input
                      value={draftContent.contact.heading}
                      onChange={(e) => updateContentField("contact", "heading", e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    rows={2}
                    value={draftContent.contact.description}
                    onChange={(e) => updateContentField("contact", "description", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Background Image URL</Label>
                  <Input
                    value={draftContent.contact.backgroundImage}
                    onChange={(e) =>
                      updateContentField("contact", "backgroundImage", e.target.value)
                    }
                  />
                  <Input type="file" accept="image/*" onChange={(event) => void handleContactBackgroundUpload(event)} />
                  <img
                    src={draftContent.contact.backgroundImage}
                    alt="Contact background preview"
                    className="h-24 w-full rounded border object-cover"
                  />
                </div>
                <Separator />
                <div className="grid gap-3 md:grid-cols-2">
                  <Input
                    value={draftContent.contact.nameLabel}
                    onChange={(e) => updateContentField("contact", "nameLabel", e.target.value)}
                    placeholder="Name label"
                  />
                  <Input
                    value={draftContent.contact.namePlaceholder}
                    onChange={(e) =>
                      updateContentField("contact", "namePlaceholder", e.target.value)
                    }
                    placeholder="Name placeholder"
                  />
                  <Input
                    value={draftContent.contact.emailLabel}
                    onChange={(e) => updateContentField("contact", "emailLabel", e.target.value)}
                    placeholder="Email label"
                  />
                  <Input
                    value={draftContent.contact.emailPlaceholder}
                    onChange={(e) =>
                      updateContentField("contact", "emailPlaceholder", e.target.value)
                    }
                    placeholder="Email placeholder"
                  />
                  <Input
                    value={draftContent.contact.messageLabel}
                    onChange={(e) => updateContentField("contact", "messageLabel", e.target.value)}
                    placeholder="Message label"
                  />
                  <Input
                    value={draftContent.contact.submitLabel}
                    onChange={(e) => updateContentField("contact", "submitLabel", e.target.value)}
                    placeholder="Submit label"
                  />
                </div>
                <Textarea
                  rows={2}
                  value={draftContent.contact.messagePlaceholder}
                  onChange={(e) =>
                    updateContentField("contact", "messagePlaceholder", e.target.value)
                  }
                  placeholder="Message placeholder"
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="templates" className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <CardTitle>Daftar Template</CardTitle>
                      <CardDescription>Pilih item untuk edit detail.</CardDescription>
                    </div>
                    <Button size="sm" onClick={addCaseStudy}>
                      <Plus className="mr-1 h-4 w-4" /> Tambah
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {draftCaseStudies.map((item, index) => (
                    <div
                      key={item.id ?? `${item.name}-${index}`}
                      className={`w-full rounded-md border px-3 py-2 text-left transition ${
                        selectedCaseStudy === index
                          ? "border-primary bg-primary/5"
                          : "hover:border-muted-foreground/40"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedCaseStudy(index)}
                          className="w-full text-left"
                        >
                          <p className="text-sm font-medium text-foreground">{item.name}</p>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {item.project_title}
                          </p>
                        </button>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => moveCaseStudy(index, "up")}
                            className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40"
                            aria-label={`Move ${item.name} up`}
                            disabled={index === 0}
                          >
                            <ArrowUp className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveCaseStudy(index, "down")}
                            className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40"
                            aria-label={`Move ${item.name} down`}
                            disabled={index === draftCaseStudies.length - 1}
                          >
                            <ArrowDown className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteCaseStudy(index)}
                            className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-destructive"
                            aria-label={`Delete ${item.name}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <CardTitle>Editor Template</CardTitle>
                      <CardDescription>CRUD item yang dipakai di beberapa section.</CardDescription>
                    </div>
                    <Button size="sm" variant="outline" onClick={duplicateCaseStudy}>
                      <Copy className="mr-1 h-4 w-4" /> Duplikat
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {activeCaseStudy ? (
                    <>
                      <div className="grid gap-3 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Nama Template</Label>
                          <Input
                            value={activeCaseStudy.name}
                            onChange={(e) => updateCaseStudyField("name", e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Case Study Link</Label>
                          <Input
                            value={activeCaseStudy.case_study_link}
                            onChange={(e) =>
                              updateCaseStudyField("case_study_link", e.target.value)
                            }
                          />
                        </div>
                      </div>

                      <div className="grid gap-3 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Project Link</Label>
                          <Input
                            value={activeCaseStudy.project_link ?? ""}
                            onChange={(e) => updateCaseStudyField("project_link", e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>CTA Let's Talk</Label>
                          <Input
                            value={activeCaseStudy.cta_links?.["let's talk"] ?? ""}
                            onChange={(e) => updateCaseStudyCtaField("let's talk", e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>CTA Read Case Study</Label>
                        <Input
                          value={activeCaseStudy.cta_links?.["read case study"] ?? ""}
                          onChange={(e) =>
                            updateCaseStudyCtaField("read case study", e.target.value)
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Project Title</Label>
                        <Input
                          value={activeCaseStudy.project_title}
                          onChange={(e) => updateCaseStudyField("project_title", e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea
                          rows={3}
                          value={activeCaseStudy.description}
                          onChange={(e) => updateCaseStudyField("description", e.target.value)}
                        />
                      </div>

                      <div className="grid gap-3 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Main Image URL</Label>
                          <Input
                            value={activeCaseStudy.main_image_src}
                            onChange={(e) => updateCaseStudyField("main_image_src", e.target.value)}
                          />
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={(event) =>
                              void handleCaseStudyImageUpload(event, "main_image_src")
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Logo URL</Label>
                          <Input
                            value={activeCaseStudy.logo_src}
                            onChange={(e) => updateCaseStudyField("logo_src", e.target.value)}
                          />
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={(event) => void handleCaseStudyImageUpload(event, "logo_src")}
                          />
                        </div>
                      </div>

                      <div className="grid gap-3 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Founder Name</Label>
                          <Input
                            value={activeCaseStudy.founder_name ?? ""}
                            onChange={(e) => updateCaseStudyField("founder_name", e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Position</Label>
                          <Input
                            value={activeCaseStudy.position ?? ""}
                            onChange={(e) => updateCaseStudyField("position", e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Testimonial Image URL</Label>
                        <Input
                          value={activeCaseStudy.test_img ?? ""}
                          onChange={(e) => updateCaseStudyField("test_img", e.target.value)}
                        />
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(event) => void handleCaseStudyImageUpload(event, "test_img")}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Testimonial</Label>
                        <Textarea
                          rows={3}
                          value={activeCaseStudy.testimonial ?? ""}
                          onChange={(e) => updateCaseStudyField("testimonial", e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Features (1 baris = 1 item)</Label>
                        <Textarea
                          rows={4}
                          value={activeCaseStudy.features.join("\n")}
                          onChange={(e) => updateCaseStudyListField("features", e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Demo Images (1 baris = 1 URL/path)</Label>
                        <Textarea
                          rows={4}
                          value={activeCaseStudy.demo_images.join("\n")}
                          onChange={(e) => updateCaseStudyListField("demo_images", e.target.value)}
                        />
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              updateCaseStudyListField("demo_images", "");
                              setStatus("Semua demo images pada template ini dikosongkan.");
                            }}
                          >
                            Kosongkan Demo Images
                          </Button>
                        </div>
                        <Input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={(event) => void handleDemoImagesUpload(event)}
                        />
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Tidak ada template untuk diedit.
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="links" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Halaman yang Terkoneksi</CardTitle>
                <CardDescription>Semua halaman ini membaca data dari admin panel.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-2">
                <Button asChild variant="outline" className="justify-start">
                  <Link href="/" target="_blank">
                    Homepage (Hero + Carousel + Sections)
                  </Link>
                </Button>
                <Button asChild variant="outline" className="justify-start">
                  <Link href="/about" target="_blank">
                    About Page
                  </Link>
                </Button>
                <Button asChild variant="outline" className="justify-start">
                  <Link href="/blog" target="_blank">
                    Blog / Templates List
                  </Link>
                </Button>
                <Button asChild variant="outline" className="justify-start">
                  <Link href="/signup" target="_blank">
                    Signup Page
                  </Link>
                </Button>
                <Button asChild variant="outline" className="justify-start">
                  <Link href="/login" target="_blank">
                    Login Page
                  </Link>
                </Button>
                <Button asChild variant="outline" className="justify-start">
                  <Link href="/admin" target="_blank">
                    Admin (Current)
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
