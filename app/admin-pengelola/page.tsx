"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { CaseStudyType } from "@/data/caseStudies";
import { useCaseStudies } from "@/hooks/use-case-studies";
import { defaultCaseStudiesContent, writeCaseStudiesToStorage } from "@/lib/caseStudiesContent";
import {
  estimateImageStringBytes,
  fileToOptimizedDataUrl,
  validateUploadImageFile,
} from "@/lib/clientImageUpload";
import { enrichTemplates, formatIdr } from "@/lib/templateCatalog";
import { ArrowDown, ArrowUp, Copy, Plus, Save, Trash2 } from "lucide-react";
import Link from "next/link";
import { type ChangeEvent, useEffect, useMemo, useState } from "react";

const MAX_SINGLE_IMAGE_BYTES = 320_000;
const MAX_DEMO_IMAGE_BYTES = 240_000;
const MAX_STORED_IMAGE_BYTES = 420_000;
const MAX_DEMO_IMAGES_PER_TEMPLATE = 8;

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

export default function AdminPengelolaPage() {
  const liveCaseStudies = useCaseStudies();
  const [draftCaseStudies, setDraftCaseStudies] = useState<CaseStudyType[]>(liveCaseStudies);
  const [selectedCaseStudy, setSelectedCaseStudy] = useState(0);
  const [status, setStatus] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setDraftCaseStudies(liveCaseStudies);
    setSelectedCaseStudy((prev) => Math.min(prev, Math.max(liveCaseStudies.length - 1, 0)));
  }, [liveCaseStudies]);

  const isDirty = useMemo(
    () => JSON.stringify(draftCaseStudies) !== JSON.stringify(liveCaseStudies),
    [draftCaseStudies, liveCaseStudies]
  );
  const enrichedDraftCaseStudies = useMemo(
    () => enrichTemplates(draftCaseStudies),
    [draftCaseStudies]
  );

  const activeCaseStudy = draftCaseStudies[selectedCaseStudy];
  const activeTemplateMeta = enrichedDraftCaseStudies[selectedCaseStudy];

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
        const current = item.cta_links ?? { "let's talk": "", "read case study": "" };
        return { ...item, cta_links: { ...current, [field]: value } };
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

    const validationError = validateUploadImageFile(file);
    if (validationError) {
      setStatus(validationError);
      return;
    }

    try {
      const dataUrl = await fileToOptimizedDataUrl(file, {
        maxBytes: MAX_SINGLE_IMAGE_BYTES,
        maxDimension: 1600,
      });
      if (estimateImageStringBytes(dataUrl) > MAX_STORED_IMAGE_BYTES) {
        setStatus(`Gambar "${file.name}" masih terlalu besar. Coba file lain yang lebih kecil.`);
        return;
      }
      updateCaseStudyField(field, dataUrl);
      setStatus(`"${file.name}" berhasil diupload dan dioptimasi. Klik Simpan Template.`);
    } catch {
      setStatus(`Gagal membaca file "${file.name}".`);
    }
  };

  const handleDemoImagesUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (files.length === 0) return;

    if ((activeCaseStudy?.demo_images.length ?? 0) + files.length > MAX_DEMO_IMAGES_PER_TEMPLATE) {
      setStatus(`Maksimal ${MAX_DEMO_IMAGES_PER_TEMPLATE} gambar demo per template.`);
      return;
    }

    for (const file of files) {
      const validationError = validateUploadImageFile(file);
      if (validationError) {
        setStatus(validationError);
        return;
      }
    }

    try {
      const uploaded = await Promise.all(
        files.map((file) =>
          fileToOptimizedDataUrl(file, { maxBytes: MAX_DEMO_IMAGE_BYTES, maxDimension: 1440 })
        )
      );
      if (uploaded.some((item) => estimateImageStringBytes(item) > MAX_STORED_IMAGE_BYTES)) {
        setStatus(
          "Ada gambar demo yang masih terlalu besar setelah optimasi. Coba file lebih kecil."
        );
        return;
      }
      setDraftCaseStudies((prev) =>
        prev.map((item, index) =>
          index === selectedCaseStudy
            ? { ...item, demo_images: [...item.demo_images, ...uploaded] }
            : item
        )
      );
      setStatus(`${uploaded.length} gambar demo berhasil diupload dan dioptimasi.`);
    } catch {
      setStatus("Gagal membaca salah satu file gambar demo.");
    }
  };

  const saveTemplates = async () => {
    if (!isDirty) {
      setStatus("Tidak ada perubahan untuk disimpan.");
      return;
    }

    setIsSaving(true);
    setStatus("Menyimpan data template...");
    try {
      const response = await fetch("/api/cms/templates", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templates: draftCaseStudies }),
      });

      if (!response.ok) {
        const message = await getApiErrorMessage(response, "Gagal simpan template.");
        throw new Error(message);
      }

      const payload = (await response.json()) as { ok: boolean; data?: CaseStudyType[] };
      const saved = payload.data ?? draftCaseStudies;
      setDraftCaseStudies(saved);
      writeCaseStudiesToStorage(saved);
      setStatus("Template berhasil disimpan.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Gagal menyimpan template.");
    } finally {
      setIsSaving(false);
    }
  };

  const addCaseStudy = () => {
    const newItem = createNewCaseStudy(draftCaseStudies.length + 1);
    setDraftCaseStudies((prev) => [...prev, newItem]);
    setSelectedCaseStudy(draftCaseStudies.length);
    setStatus("Template baru ditambahkan.");
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
      setStatus("Minimal harus ada 1 template.");
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

  return (
    <main className="min-h-screen bg-muted/30 px-4 py-6 md:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col gap-4 rounded-xl border bg-background p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Tamplateku Admin Pengelola</p>
            <h1 className="text-2xl font-semibold">Kelola Template Tampil</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Fokus mengelola data template yang tampil di halaman pilih template.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" asChild>
              <Link href="/browse-template" target="_blank">
                Lihat Halaman Template
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/admin">Buka Admin Utama</Link>
            </Button>
            <Button onClick={saveTemplates} disabled={!isDirty || isSaving}>
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? "Menyimpan..." : "Simpan Template"}
            </Button>
          </div>
        </header>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Status Perubahan</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-3">
            <Badge variant={isDirty ? "destructive" : "secondary"}>
              {isDirty ? "Belum Disimpan" : "Sudah Tersimpan"}
            </Badge>
            <p className="text-sm text-muted-foreground">{status || "Siap mengubah template."}</p>
          </CardContent>
        </Card>

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
              {enrichedDraftCaseStudies.map((item, index) => (
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
                      <p className="line-clamp-2 text-xs text-muted-foreground">
                        {item.project_title}
                      </p>
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        {formatIdr(item.price)} • {item.slug}
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
                  <CardDescription>Kelola isi kartu dan detail template.</CardDescription>
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
                        onChange={(e) => updateCaseStudyField("case_study_link", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Label Status</Label>
                      <Input
                        value={activeCaseStudy.status_label ?? "Siap Dipakai"}
                        onChange={(e) => updateCaseStudyField("status_label", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="block">Unggulan</Label>
                      <label className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                        <input
                          type="checkbox"
                          checked={Boolean(activeCaseStudy.is_best_seller)}
                          onChange={(event) =>
                            updateCaseStudyBooleanField("is_best_seller", event.target.checked)
                          }
                        />
                        Tandai sebagai template unggulan
                      </label>
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Slug Halaman (Otomatis)</Label>
                      <Input value={activeTemplateMeta?.slug ?? "-"} readOnly />
                      <p className="text-xs text-muted-foreground">
                        Dipakai untuk URL halaman detail template dan proses checkout.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label>Harga Jual (Otomatis)</Label>
                      <Input
                        value={activeTemplateMeta ? formatIdr(activeTemplateMeta.price) : "-"}
                        readOnly
                      />
                      <p className="text-xs text-muted-foreground">
                        Harga mengikuti urutan template di daftar kiri.
                      </p>
                    </div>
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
                        onChange={(event) => void handleCaseStudyImageUpload(event, "logo_src")}
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

                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Link Proyek</Label>
                      <Input
                        value={activeCaseStudy.project_link ?? ""}
                        onChange={(e) => updateCaseStudyField("project_link", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>URL Download</Label>
                      <Input
                        value={activeCaseStudy.download_url ?? ""}
                        onChange={(e) => updateCaseStudyField("download_url", e.target.value)}
                        placeholder="https://github.com/owner/repo atau link file zip"
                      />
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Tombol Konsultasi</Label>
                      <Input
                        value={activeCaseStudy.cta_links?.["let's talk"] ?? ""}
                        onChange={(e) => updateCaseStudyCtaField("let's talk", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Tombol Lihat Studi Kasus</Label>
                    <Input
                      value={activeCaseStudy.cta_links?.["read case study"] ?? ""}
                      onChange={(e) => updateCaseStudyCtaField("read case study", e.target.value)}
                    />
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
                      onChange={handleDemoImagesUpload}
                    />
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Tidak ada template untuk diedit.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
