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
import {
  estimateImageStringBytes,
  fileToOptimizedDataUrl,
  validateUploadImageFile,
} from "@/lib/clientImageUpload";
import { useSiteContent } from "@/hooks/use-site-content";
import { defaultCaseStudiesContent, writeCaseStudiesToStorage } from "@/lib/caseStudiesContent";
import { type SiteContent, defaultSiteContent, writeSiteContentToStorage } from "@/lib/siteContent";
import {
  ArrowDown,
  ArrowUp,
  Copy,
  ExternalLink,
  GalleryVerticalEnd,
  LayoutDashboard,
  Link2,
  Plus,
  RotateCcw,
  Save,
  Settings2,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { type ChangeEvent, useEffect, useMemo, useState } from "react";

const MAX_SINGLE_IMAGE_BYTES = 320_000;
const MAX_DEMO_IMAGE_BYTES = 240_000;
const MAX_STORED_IMAGE_BYTES = 420_000;
const MAX_DEMO_IMAGES_PER_TEMPLATE = 8;
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
    status_label: "Siap Dipakai",
    is_best_seller: false,
  };
}

function parseLines(value: string): string[] {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
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

  const optimizeUpload = async (
    file: File,
    targetBytes: number,
    maxDimension = 1600
  ): Promise<string | null> => {
    const validationError = validateUploadImageFile(file);
    if (validationError) {
      setStatus(validationError);
      return null;
    }

    try {
      const dataUrl = await fileToOptimizedDataUrl(file, { maxBytes: targetBytes, maxDimension });
      if (estimateImageStringBytes(dataUrl) > MAX_STORED_IMAGE_BYTES) {
        setStatus(`Gambar "${file.name}" masih terlalu besar. Gunakan file yang lebih kecil.`);
        return null;
      }
      return dataUrl;
    } catch {
      setStatus(`Gagal membaca file "${file.name}".`);
      return null;
    }
  };

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

  const updateHeroFrameworkLogo = (key: (typeof HERO_LOGO_KEYS)[number], value: string) => {
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

  const updateCaseStudyBooleanField = (field: keyof CaseStudyType, value: boolean) => {
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

    const dataUrl = await optimizeUpload(file, MAX_SINGLE_IMAGE_BYTES, 1600);
    if (!dataUrl) return;
    updateCaseStudyField(field, dataUrl);
    setStatus(`"${file.name}" berhasil diupload dan dioptimasi. Klik Simpan Semua untuk menyimpan data.`);
  };

  const handleDemoImagesUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";

    if (files.length === 0) return;

    if ((activeCaseStudy?.demo_images.length ?? 0) + files.length > MAX_DEMO_IMAGES_PER_TEMPLATE) {
      setStatus(`Maksimal ${MAX_DEMO_IMAGES_PER_TEMPLATE} gambar demo per template.`);
      return;
    }

    try {
      const uploaded = await Promise.all(
        files.map((file) => optimizeUpload(file, MAX_DEMO_IMAGE_BYTES, 1440))
      );
      if (uploaded.some((item) => !item)) {
        return;
      }
      const optimized = uploaded.filter((item): item is string => Boolean(item));
      setDraftCaseStudies((prev) =>
        prev.map((item, index) =>
          index === selectedCaseStudy
            ? { ...item, demo_images: [...item.demo_images, ...optimized] }
            : item
        )
      );
      setStatus(
        `${optimized.length} gambar demo berhasil diupload dan dioptimasi. Klik Simpan Semua untuk menyimpan data.`
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

    const dataUrl = await optimizeUpload(file, MAX_SINGLE_IMAGE_BYTES, 1200);
    if (!dataUrl) return;
    updateHeroFrameworkLogo(key, dataUrl);
    setStatus(`Logo ${label} berhasil diupload dan dioptimasi. Klik Simpan Semua untuk menyimpan data.`);
  };

  const handleProcessBackgroundUpload = async (
    event: ChangeEvent<HTMLInputElement>,
    index: number
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const dataUrl = await optimizeUpload(file, MAX_SINGLE_IMAGE_BYTES, 1600);
    if (!dataUrl) return;
    updateProcessBackgroundImage(index, dataUrl);
    setStatus(
      `Gambar latar langkah ${index + 1} berhasil diupload dan dioptimasi. Klik Simpan Semua untuk menyimpan data.`
    );
  };

  const handleContactBackgroundUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const dataUrl = await optimizeUpload(file, MAX_SINGLE_IMAGE_BYTES, 1600);
    if (!dataUrl) return;
    updateContentField("contact", "backgroundImage", dataUrl);
    setStatus("Background contact section berhasil diupload dan dioptimasi. Klik Simpan Semua untuk menyimpan.");
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

    const dataUrl = await optimizeUpload(file, MAX_SINGLE_IMAGE_BYTES, 1600);
    if (!dataUrl) return;
    updateCaseStudyImageFieldByIndex(index, field, dataUrl);
    setStatus(`${label} berhasil diupload dan dioptimasi. Klik Simpan Semua untuk menyimpan data.`);
  };

  const saveAll = async () => {
    if (!isDirty) {
      setStatus("Tidak ada perubahan untuk disimpan.");
      return;
    }

    setIsSaving(true);
    setStatus("Menyimpan perubahan...");

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
        setStatus("Perubahan bagian halaman dan template berhasil disimpan.");
      } else if (isContentDirty) {
        setStatus("Perubahan bagian halaman berhasil disimpan.");
      } else {
        setStatus("Perubahan template berhasil disimpan.");
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
    setStatus("Mengembalikan konten awal dan menyimpan...");

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
        error instanceof Error && error.message ? error.message : "Gagal reset konten.";
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
            <h1 className="text-2xl font-semibold">Kelola Konten Website</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Kelola isi website dan data template. Perubahan akan tampil di beranda, halaman
              template, testimoni, dan kontak.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href="/" target="_blank">
                Lihat Website
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

        <Tabs
          defaultValue="overview"
          className="gap-4 lg:grid lg:grid-cols-[260px_minmax(0,1fr)] lg:items-start"
        >
          <aside className="space-y-4 lg:sticky lg:top-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Sidebar Admin</CardTitle>
                <CardDescription>Pilih bagian yang ingin diubah.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <TabsList className="flex h-auto w-full flex-col items-stretch gap-2 bg-transparent p-0">
                  <TabsTrigger value="overview" className="h-10 w-full justify-start">
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    Ringkasan
                  </TabsTrigger>
                  <TabsTrigger value="sections" className="h-10 w-full justify-start">
                    <Settings2 className="mr-2 h-4 w-4" />
                    Isi Halaman
                  </TabsTrigger>
                  <TabsTrigger value="templates" className="h-10 w-full justify-start">
                    <GalleryVerticalEnd className="mr-2 h-4 w-4" />
                    Kelola Template
                  </TabsTrigger>
                  <TabsTrigger value="links" className="h-10 w-full justify-start">
                    <Link2 className="mr-2 h-4 w-4" />
                    Tautan Halaman
                  </TabsTrigger>
                </TabsList>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Status Perubahan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Badge variant={isDirty ? "destructive" : "secondary"}>
                  {isDirty ? "Belum Disimpan" : "Sudah Tersimpan"}
                </Badge>
                <p className="text-xs text-muted-foreground">
                  {status || "Siap edit dan simpan perubahan."}
                </p>
              </CardContent>
            </Card>
          </aside>

          <div className="space-y-4">
            <TabsContent value="overview" className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Bagian yang Bisa Diubah</CardTitle>
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
                    <CardTitle className="text-sm">Jumlah Template</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-semibold">{draftCaseStudies.length}</p>
                    <p className="text-xs text-muted-foreground">
                      Dipakai untuk carousel, kartu, dan testimoni
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Penyimpanan Data</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-semibold">Database Website</p>
                    <p className="text-xs text-muted-foreground">
                      Data utama website dan cadangan lokal untuk tampilan admin.
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Perubahan Pending</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-semibold">{isDirty ? "Ya" : "Tidak"}</p>
                    <p className="text-xs text-muted-foreground">
                      Gunakan tombol Simpan Semua setelah selesai edit.
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Aksi Cepat</CardTitle>
                  <CardDescription>Pintasan untuk pekerjaan admin harian.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  <Button asChild variant="outline">
                    <Link href="/" target="_blank">
                      Lihat Website
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link href="/browse-template" target="_blank">
                      Buka Browse Template
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link href="/blog" target="_blank">
                      Buka Blog
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="sections" className="space-y-4">
              <div className="grid gap-4 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Bagian Hero</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Label htmlFor="hero-badge">Label Kecil</Label>
                    <Input
                      id="hero-badge"
                      value={draftContent.hero.badge}
                      onChange={(e) => updateContentField("hero", "badge", e.target.value)}
                    />
                    <Label htmlFor="hero-heading">Judul</Label>
                    <Input
                      id="hero-heading"
                      value={draftContent.hero.heading}
                      onChange={(e) => updateContentField("hero", "heading", e.target.value)}
                    />
                    <Label htmlFor="hero-description">Deskripsi</Label>
                    <Textarea
                      id="hero-description"
                      rows={3}
                      value={draftContent.hero.description}
                      onChange={(e) => updateContentField("hero", "description", e.target.value)}
                    />
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="hero-primary">Teks Tombol Utama</Label>
                        <Input
                          id="hero-primary"
                          value={draftContent.hero.primaryCta}
                          onChange={(e) => updateContentField("hero", "primaryCta", e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="hero-secondary">Teks Tombol Kedua</Label>
                        <Input
                          id="hero-secondary"
                          value={draftContent.hero.secondaryCta}
                          onChange={(e) =>
                            updateContentField("hero", "secondaryCta", e.target.value)
                          }
                        />
                      </div>
                    </div>
                    <Separator />
                    <div className="space-y-3">
                      <p className="text-sm font-medium">Logo Framework (Hero)</p>
                      <div className="grid gap-3 md:grid-cols-2">
                        {HERO_LOGO_KEYS.map((key, index) => (
                          <div key={key} className="space-y-2 rounded-md border p-3">
                            <Label>{HERO_LOGO_LABELS[index]} Logo</Label>
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
                    <CardTitle>Bagian Studi Kasus</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Label htmlFor="cs-badge">Label Kecil</Label>
                    <Input
                      id="cs-badge"
                      value={draftContent.caseStudies.badge}
                      onChange={(e) => updateContentField("caseStudies", "badge", e.target.value)}
                    />
                    <Label htmlFor="cs-heading">Judul</Label>
                    <Input
                      id="cs-heading"
                      value={draftContent.caseStudies.heading}
                      onChange={(e) => updateContentField("caseStudies", "heading", e.target.value)}
                    />
                    <Label htmlFor="cs-description">Deskripsi</Label>
                    <Textarea
                      id="cs-description"
                      rows={3}
                      value={draftContent.caseStudies.description}
                      onChange={(e) =>
                        updateContentField("caseStudies", "description", e.target.value)
                      }
                    />
                    <Label htmlFor="cs-button">Teks Tombol</Label>
                    <Input
                      id="cs-button"
                      value={draftContent.caseStudies.buttonLabel}
                      onChange={(e) =>
                        updateContentField("caseStudies", "buttonLabel", e.target.value)
                      }
                    />
                    <Separator />
                    <div className="space-y-3">
                      <p className="text-sm font-medium">Ganti Gambar Cepat - Studi Kasus (3 Teratas)</p>
                      {featuredCaseStudies.map(({ item, index }) => (
                        <div
                          key={`cs-image-${item.id ?? index}`}
                          className="space-y-2 rounded-md border p-3"
                        >
                          <p className="text-sm font-medium">{item.name}</p>
                          <Label>Gambar Utama</Label>
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={(event) =>
                              void handleSectionCaseStudyImageUpload(
                                event,
                                index,
                                "main_image_src",
                                `Gambar utama ${item.name}`
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
                        Untuk mengubah gambar demo dan logo lebih lengkap, buka tab Kelola Template.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Bagian Proses</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Label htmlFor="process-badge">Label Kecil</Label>
                    <Input
                      id="process-badge"
                      value={draftContent.process.badge}
                      onChange={(e) => updateContentField("process", "badge", e.target.value)}
                    />
                    <Label htmlFor="process-heading">Judul</Label>
                    <Input
                      id="process-heading"
                      value={draftContent.process.heading}
                      onChange={(e) => updateContentField("process", "heading", e.target.value)}
                    />
                    <Label htmlFor="process-description">Deskripsi</Label>
                    <Textarea
                      id="process-description"
                      rows={3}
                      value={draftContent.process.description}
                      onChange={(e) => updateContentField("process", "description", e.target.value)}
                    />
                    <Separator />
                    <div className="space-y-3">
                      <p className="text-sm font-medium">Gambar Latar per Langkah</p>
                      <div className="grid gap-3 md:grid-cols-2">
                        {[0, 1, 2, 3].map((index) => (
                          <div
                            key={`process-bg-${index}`}
                            className="space-y-2 rounded-md border p-3"
                          >
                            <Label>{`Gambar Latar Langkah ${index + 1}`}</Label>
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
                    <CardTitle>Bagian Testimoni</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Label htmlFor="testi-badge">Label Kecil</Label>
                    <Input
                      id="testi-badge"
                      value={draftContent.testimonials.badge}
                      onChange={(e) => updateContentField("testimonials", "badge", e.target.value)}
                    />
                    <Label htmlFor="testi-heading">Judul</Label>
                    <Input
                      id="testi-heading"
                      value={draftContent.testimonials.heading}
                      onChange={(e) =>
                        updateContentField("testimonials", "heading", e.target.value)
                      }
                    />
                    <Label htmlFor="testi-description">Deskripsi</Label>
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
                        placeholder="Label statistik 1"
                      />
                      <Input
                        value={draftContent.testimonials.statTwoLabel}
                        onChange={(e) =>
                          updateContentField("testimonials", "statTwoLabel", e.target.value)
                        }
                        placeholder="Label statistik 2"
                      />
                      <Input
                        value={draftContent.testimonials.statThreeLabel}
                        onChange={(e) =>
                          updateContentField("testimonials", "statThreeLabel", e.target.value)
                        }
                        placeholder="Label statistik 3"
                      />
                    </div>
                    <Separator />
                    <div className="space-y-3">
                      <p className="text-sm font-medium">Ganti Gambar Cepat - Testimoni</p>
                      {testimonialCaseStudies.length === 0 ? (
                        <p className="text-xs text-muted-foreground">
                          Belum ada item testimoni. Isi testimoni di tab Kelola Template untuk
                          menampilkan kontrol image di sini.
                        </p>
                      ) : (
                        testimonialCaseStudies.map(({ item, index }) => (
                          <div
                            key={`testimonial-image-${item.id ?? index}`}
                            className="space-y-2 rounded-md border p-3"
                          >
                            <p className="text-sm font-medium">{item.name}</p>
                            <Label>Testimonial Image</Label>
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
                  <CardTitle>Bagian Kontak</CardTitle>
                  <CardDescription>
                    Ubah judul dan label form di bagian kontak.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid gap-3 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label>Label Kecil</Label>
                      <Input
                        value={draftContent.contact.badge}
                        onChange={(e) => updateContentField("contact", "badge", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label>Judul</Label>
                      <Input
                        value={draftContent.contact.heading}
                        onChange={(e) => updateContentField("contact", "heading", e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Deskripsi</Label>
                    <Textarea
                      rows={2}
                      value={draftContent.contact.description}
                      onChange={(e) => updateContentField("contact", "description", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Gambar Latar</Label>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(event) => void handleContactBackgroundUpload(event)}
                    />
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
                      placeholder="Label nama"
                    />
                    <Input
                      value={draftContent.contact.namePlaceholder}
                      onChange={(e) =>
                        updateContentField("contact", "namePlaceholder", e.target.value)
                      }
                      placeholder="Contoh nama"
                    />
                    <Input
                      value={draftContent.contact.emailLabel}
                      onChange={(e) => updateContentField("contact", "emailLabel", e.target.value)}
                      placeholder="Label email"
                    />
                    <Input
                      value={draftContent.contact.emailPlaceholder}
                      onChange={(e) =>
                        updateContentField("contact", "emailPlaceholder", e.target.value)
                      }
                      placeholder="Contoh email"
                    />
                    <Input
                      value={draftContent.contact.messageLabel}
                      onChange={(e) =>
                        updateContentField("contact", "messageLabel", e.target.value)
                      }
                      placeholder="Label pesan"
                    />
                    <Input
                      value={draftContent.contact.submitLabel}
                      onChange={(e) => updateContentField("contact", "submitLabel", e.target.value)}
                      placeholder="Teks tombol kirim"
                    />
                  </div>
                  <Textarea
                    rows={2}
                    value={draftContent.contact.messagePlaceholder}
                    onChange={(e) =>
                      updateContentField("contact", "messagePlaceholder", e.target.value)
                    }
                    placeholder="Contoh isi pesan"
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
                        <CardDescription>Pilih template untuk diubah.</CardDescription>
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
                              aria-label={`Pindahkan ${item.name} ke atas`}
                              disabled={index === 0}
                            >
                              <ArrowUp className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => moveCaseStudy(index, "down")}
                              className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40"
                              aria-label={`Pindahkan ${item.name} ke bawah`}
                              disabled={index === draftCaseStudies.length - 1}
                            >
                              <ArrowDown className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteCaseStudy(index)}
                              className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-destructive"
                              aria-label={`Hapus ${item.name}`}
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
                        <CardTitle>Form Ubah Template</CardTitle>
                        <CardDescription>
                          Ubah data template yang dipakai di beberapa bagian.
                        </CardDescription>
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
                            <Label>Link Studi Kasus</Label>
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
                            <Label>Label Status</Label>
                            <Input
                              value={activeCaseStudy.status_label ?? "Siap Dipakai"}
                              onChange={(e) => updateCaseStudyField("status_label", e.target.value)}
                              placeholder="Siap Dipakai"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="block">Unggulan</Label>
                            <label className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                              <input
                                type="checkbox"
                                checked={Boolean(activeCaseStudy.is_best_seller)}
                                onChange={(event) =>
                                  updateCaseStudyBooleanField(
                                    "is_best_seller",
                                    event.target.checked
                                  )
                                }
                              />
                              Tandai sebagai template unggulan
                            </label>
                          </div>
                        </div>

                        <div className="grid gap-3 md:grid-cols-2">
                          <div className="space-y-2">
                          <Label>Link Proyek</Label>
                            <Input
                              value={activeCaseStudy.project_link ?? ""}
                              onChange={(e) => updateCaseStudyField("project_link", e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Tombol Konsultasi</Label>
                            <Input
                              value={activeCaseStudy.cta_links?.["let's talk"] ?? ""}
                              onChange={(e) =>
                                updateCaseStudyCtaField("let's talk", e.target.value)
                              }
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>Tombol Lihat Studi Kasus</Label>
                          <Input
                            value={activeCaseStudy.cta_links?.["read case study"] ?? ""}
                            onChange={(e) =>
                              updateCaseStudyCtaField("read case study", e.target.value)
                            }
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Judul Proyek</Label>
                          <Input
                            value={activeCaseStudy.project_title}
                            onChange={(e) => updateCaseStudyField("project_title", e.target.value)}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Deskripsi</Label>
                          <Textarea
                            rows={3}
                            value={activeCaseStudy.description}
                            onChange={(e) => updateCaseStudyField("description", e.target.value)}
                          />
                        </div>

                        <div className="grid gap-3 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label>Gambar Utama</Label>
                            <Input
                              type="file"
                              accept="image/*"
                              onChange={(event) =>
                                void handleCaseStudyImageUpload(event, "main_image_src")
                              }
                            />
                            <img
                              src={activeCaseStudy.main_image_src}
                              alt={`${activeCaseStudy.name} main image preview`}
                              className="h-24 w-full rounded border object-cover"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Logo</Label>
                            <Input
                              type="file"
                              accept="image/*"
                              onChange={(event) =>
                                void handleCaseStudyImageUpload(event, "logo_src")
                              }
                            />
                            <div className="bg-muted/40 flex h-24 items-center justify-center rounded border p-2">
                              <img
                                src={activeCaseStudy.logo_src}
                                alt={`${activeCaseStudy.name} logo preview`}
                                className="max-h-16 w-auto object-contain"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="grid gap-3 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label>Nama Pemilik</Label>
                            <Input
                              value={activeCaseStudy.founder_name ?? ""}
                              onChange={(e) => updateCaseStudyField("founder_name", e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Jabatan</Label>
                            <Input
                              value={activeCaseStudy.position ?? ""}
                              onChange={(e) => updateCaseStudyField("position", e.target.value)}
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>Gambar Testimoni</Label>
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={(event) => void handleCaseStudyImageUpload(event, "test_img")}
                          />
                          <img
                            src={activeCaseStudy.test_img ?? ""}
                            alt={`${activeCaseStudy.name} testimonial image preview`}
                            className="h-24 w-full rounded border object-cover"
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
                          <Label>Fitur (1 baris = 1 item)</Label>
                          <Textarea
                            rows={4}
                            value={activeCaseStudy.features.join("\n")}
                            onChange={(e) => updateCaseStudyListField("features", e.target.value)}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Gambar Demo</Label>
                          <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                            {activeCaseStudy.demo_images.map((image, imageIndex) => (
                              <img
                                key={`${activeCaseStudy.id ?? selectedCaseStudy}-${imageIndex}`}
                                src={image}
                                alt={`${activeCaseStudy.name} demo ${imageIndex + 1}`}
                                className="h-20 w-full rounded border object-cover"
                              />
                            ))}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                updateCaseStudyListField("demo_images", "");
                                setStatus("Semua gambar demo pada template ini dihapus.");
                              }}
                            >
                              Hapus Semua Gambar Demo
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
                  <CardDescription>
                    Semua halaman ini membaca data dari admin panel.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3 md:grid-cols-2">
                  <Button asChild variant="outline" className="justify-start">
                    <Link href="/" target="_blank">
                      Beranda (Hero + Carousel + Bagian)
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="justify-start">
                    <Link href="/about" target="_blank">
                      Halaman Tentang
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="justify-start">
                    <Link href="/blog" target="_blank">
                      Blog / Daftar Template
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="justify-start">
                    <Link href="/signup" target="_blank">
                      Halaman Daftar
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="justify-start">
                    <Link href="/login" target="_blank">
                      Halaman Masuk
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="justify-start">
                    <Link href="/admin" target="_blank">
                      Admin (Saat Ini)
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="justify-start">
                    <Link href="/admin-pengelola" target="_blank">
                      Admin Pengelola Template
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="justify-start">
                    <Link href="/super-admin" target="_blank">
                      Superadmin
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </main>
  );
}
