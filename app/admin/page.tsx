"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useSiteContent } from "@/hooks/use-site-content";
import {
  type SiteContent,
  defaultSiteContent,
  resetSiteContentStorage,
  writeSiteContentToStorage,
} from "@/lib/siteContent";
import {
  Bell,
  Download,
  FileText,
  Layers,
  LayoutDashboard,
  MessageSquare,
  PhoneCall,
  Search,
  Sparkles,
} from "lucide-react";
import { type ComponentType, useEffect, useState } from "react";

type SectionId = "hero" | "case-studies" | "process" | "testimonials" | "contact";

const navItems: { id: SectionId; label: string; icon: ComponentType<{ className?: string }> }[] = [
  { id: "hero", label: "Hero", icon: Sparkles },
  { id: "case-studies", label: "Case Studies", icon: Layers },
  { id: "process", label: "Process", icon: FileText },
  { id: "testimonials", label: "Testimonials", icon: MessageSquare },
  { id: "contact", label: "Contact", icon: PhoneCall },
];

function ContentEditor({
  draft,
  setDraft,
}: {
  draft: SiteContent;
  setDraft: React.Dispatch<React.SetStateAction<SiteContent>>;
}) {
  return (
    <div className="space-y-6">
      <Card id="hero">
        <CardHeader>
          <CardTitle>Hero Section</CardTitle>
          <CardDescription>Konten utama di bagian paling atas homepage.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            value={draft.hero.badge}
            onChange={(e) =>
              setDraft((prev) => ({ ...prev, hero: { ...prev.hero, badge: e.target.value } }))
            }
            placeholder="Badge"
          />
          <Input
            value={draft.hero.heading}
            onChange={(e) =>
              setDraft((prev) => ({ ...prev, hero: { ...prev.hero, heading: e.target.value } }))
            }
            placeholder="Heading"
          />
          <Textarea
            rows={3}
            value={draft.hero.description}
            onChange={(e) =>
              setDraft((prev) => ({
                ...prev,
                hero: { ...prev.hero, description: e.target.value },
              }))
            }
            placeholder="Description"
          />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input
              value={draft.hero.primaryCta}
              onChange={(e) =>
                setDraft((prev) => ({
                  ...prev,
                  hero: { ...prev.hero, primaryCta: e.target.value },
                }))
              }
              placeholder="Primary CTA"
            />
            <Input
              value={draft.hero.secondaryCta}
              onChange={(e) =>
                setDraft((prev) => ({
                  ...prev,
                  hero: { ...prev.hero, secondaryCta: e.target.value },
                }))
              }
              placeholder="Secondary CTA"
            />
          </div>
        </CardContent>
      </Card>

      <Card id="case-studies">
        <CardHeader>
          <CardTitle>Case Studies Section</CardTitle>
          <CardDescription>Judul section koleksi template.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            value={draft.caseStudies.badge}
            onChange={(e) =>
              setDraft((prev) => ({
                ...prev,
                caseStudies: { ...prev.caseStudies, badge: e.target.value },
              }))
            }
            placeholder="Badge"
          />
          <Input
            value={draft.caseStudies.heading}
            onChange={(e) =>
              setDraft((prev) => ({
                ...prev,
                caseStudies: { ...prev.caseStudies, heading: e.target.value },
              }))
            }
            placeholder="Heading"
          />
          <Textarea
            rows={3}
            value={draft.caseStudies.description}
            onChange={(e) =>
              setDraft((prev) => ({
                ...prev,
                caseStudies: { ...prev.caseStudies, description: e.target.value },
              }))
            }
            placeholder="Description"
          />
          <Input
            value={draft.caseStudies.buttonLabel}
            onChange={(e) =>
              setDraft((prev) => ({
                ...prev,
                caseStudies: { ...prev.caseStudies, buttonLabel: e.target.value },
              }))
            }
            placeholder="Button label"
          />
        </CardContent>
      </Card>

      <Card id="process">
        <CardHeader>
          <CardTitle>Process Section</CardTitle>
          <CardDescription>Heading dan deskripsi alur kerja.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            value={draft.process.badge}
            onChange={(e) =>
              setDraft((prev) => ({
                ...prev,
                process: { ...prev.process, badge: e.target.value },
              }))
            }
            placeholder="Badge"
          />
          <Input
            value={draft.process.heading}
            onChange={(e) =>
              setDraft((prev) => ({
                ...prev,
                process: { ...prev.process, heading: e.target.value },
              }))
            }
            placeholder="Heading"
          />
          <Textarea
            rows={3}
            value={draft.process.description}
            onChange={(e) =>
              setDraft((prev) => ({
                ...prev,
                process: { ...prev.process, description: e.target.value },
              }))
            }
            placeholder="Description"
          />
        </CardContent>
      </Card>

      <Card id="testimonials">
        <CardHeader>
          <CardTitle>Testimonials Section</CardTitle>
          <CardDescription>Heading + label statistik di bawah testimonial.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            value={draft.testimonials.badge}
            onChange={(e) =>
              setDraft((prev) => ({
                ...prev,
                testimonials: { ...prev.testimonials, badge: e.target.value },
              }))
            }
            placeholder="Badge"
          />
          <Input
            value={draft.testimonials.heading}
            onChange={(e) =>
              setDraft((prev) => ({
                ...prev,
                testimonials: { ...prev.testimonials, heading: e.target.value },
              }))
            }
            placeholder="Heading"
          />
          <Textarea
            rows={2}
            value={draft.testimonials.description}
            onChange={(e) =>
              setDraft((prev) => ({
                ...prev,
                testimonials: { ...prev.testimonials, description: e.target.value },
              }))
            }
            placeholder="Description"
          />
          <Input
            value={draft.testimonials.statOneLabel}
            onChange={(e) =>
              setDraft((prev) => ({
                ...prev,
                testimonials: { ...prev.testimonials, statOneLabel: e.target.value },
              }))
            }
            placeholder="Stat 1 label"
          />
          <Input
            value={draft.testimonials.statTwoLabel}
            onChange={(e) =>
              setDraft((prev) => ({
                ...prev,
                testimonials: { ...prev.testimonials, statTwoLabel: e.target.value },
              }))
            }
            placeholder="Stat 2 label"
          />
          <Input
            value={draft.testimonials.statThreeLabel}
            onChange={(e) =>
              setDraft((prev) => ({
                ...prev,
                testimonials: { ...prev.testimonials, statThreeLabel: e.target.value },
              }))
            }
            placeholder="Stat 3 label"
          />
        </CardContent>
      </Card>

      <Card id="contact">
        <CardHeader>
          <CardTitle>Contact Section</CardTitle>
          <CardDescription>Judul section + label field form kontak.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            value={draft.contact.badge}
            onChange={(e) =>
              setDraft((prev) => ({
                ...prev,
                contact: { ...prev.contact, badge: e.target.value },
              }))
            }
            placeholder="Badge"
          />
          <Input
            value={draft.contact.heading}
            onChange={(e) =>
              setDraft((prev) => ({
                ...prev,
                contact: { ...prev.contact, heading: e.target.value },
              }))
            }
            placeholder="Heading"
          />
          <Textarea
            rows={2}
            value={draft.contact.description}
            onChange={(e) =>
              setDraft((prev) => ({
                ...prev,
                contact: { ...prev.contact, description: e.target.value },
              }))
            }
            placeholder="Description"
          />
          <Separator />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input
              value={draft.contact.nameLabel}
              onChange={(e) =>
                setDraft((prev) => ({
                  ...prev,
                  contact: { ...prev.contact, nameLabel: e.target.value },
                }))
              }
              placeholder="Nama label"
            />
            <Input
              value={draft.contact.namePlaceholder}
              onChange={(e) =>
                setDraft((prev) => ({
                  ...prev,
                  contact: { ...prev.contact, namePlaceholder: e.target.value },
                }))
              }
              placeholder="Nama placeholder"
            />
            <Input
              value={draft.contact.emailLabel}
              onChange={(e) =>
                setDraft((prev) => ({
                  ...prev,
                  contact: { ...prev.contact, emailLabel: e.target.value },
                }))
              }
              placeholder="Email label"
            />
            <Input
              value={draft.contact.emailPlaceholder}
              onChange={(e) =>
                setDraft((prev) => ({
                  ...prev,
                  contact: { ...prev.contact, emailPlaceholder: e.target.value },
                }))
              }
              placeholder="Email placeholder"
            />
            <Input
              value={draft.contact.messageLabel}
              onChange={(e) =>
                setDraft((prev) => ({
                  ...prev,
                  contact: { ...prev.contact, messageLabel: e.target.value },
                }))
              }
              placeholder="Pesan label"
            />
            <Input
              value={draft.contact.submitLabel}
              onChange={(e) =>
                setDraft((prev) => ({
                  ...prev,
                  contact: { ...prev.contact, submitLabel: e.target.value },
                }))
              }
              placeholder="Submit button"
            />
          </div>
          <Textarea
            rows={2}
            value={draft.contact.messagePlaceholder}
            onChange={(e) =>
              setDraft((prev) => ({
                ...prev,
                contact: { ...prev.contact, messagePlaceholder: e.target.value },
              }))
            }
            placeholder="Message placeholder"
          />
        </CardContent>
      </Card>
    </div>
  );
}

export default function AdminPage() {
  const liveContent = useSiteContent();
  const [draft, setDraft] = useState<SiteContent>(liveContent);
  const [status, setStatus] = useState<string>("");

  useEffect(() => {
    setDraft(liveContent);
  }, [liveContent]);

  const save = () => {
    writeSiteContentToStorage(draft);
    setStatus("Perubahan disimpan. Refresh homepage untuk melihat update terbaru.");
  };

  const reset = () => {
    resetSiteContentStorage();
    setDraft(defaultSiteContent);
    setStatus("Konten berhasil dikembalikan ke default.");
  };

  return (
    <main className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <aside className="hidden border-r bg-muted/40 md:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
            <a href="/admin" className="flex items-center gap-2 font-semibold">
              <LayoutDashboard className="h-4 w-4" />
              <span>Admin Panel</span>
            </a>
          </div>
          <div className="flex-1 px-3 py-4">
            <nav className="grid items-start gap-1 text-sm font-medium">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    className="text-muted-foreground hover:text-primary hover:bg-muted flex items-center gap-3 rounded-lg px-3 py-2 transition-all"
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </a>
                );
              })}
            </nav>
          </div>
          <div className="mt-auto p-4">
            <Card>
              <CardHeader className="p-3">
                <CardTitle className="text-sm">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-0">
                <Button className="mb-2 w-full" size="sm" onClick={save}>
                  Simpan
                </Button>
                <Button className="w-full" size="sm" variant="outline" onClick={reset}>
                  Reset
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </aside>

      <div className="flex flex-col">
        <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
          <div className="flex flex-1 items-center justify-between gap-3">
            <div>
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>Dashboard</BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>Content Editor</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
              <h1 className="mt-1 text-base font-semibold">Tamplateku Admin</h1>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative hidden md:block">
                <Search className="text-muted-foreground absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2" />
                <Input className="h-8 w-56 pl-8" placeholder="Search..." />
              </div>
              <Button size="icon" variant="outline" className="h-8 w-8">
                <Bell className="h-4 w-4" />
              </Button>
              <Avatar className="h-8 w-8 border">
                <AvatarFallback>TK</AvatarFallback>
              </Avatar>
              <Badge variant="outline">shadcn-admin</Badge>
            </div>
          </div>
        </header>

        <section className="flex-1 space-y-6 p-4 md:p-6 lg:p-8">
          <div className="mb-2 flex items-center justify-between space-y-2">
            <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
            <div className="flex items-center space-x-2">
              <Button size="sm">
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
            </div>
          </div>

          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="content">Content</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Total Sections</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">5</div>
                    <p className="text-muted-foreground text-xs">Section editable di homepage</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Storage</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">Local</div>
                    <p className="text-muted-foreground text-xs">
                      Disimpan di browser localStorage
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{status ? "Updated" : "Ready"}</div>
                    <p className="text-muted-foreground text-xs">Siap publish perubahan konten</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Brand</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">Tamplateku</div>
                    <p className="text-muted-foreground text-xs">Template website premium</p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-7">
                <Card className="lg:col-span-4">
                  <CardHeader>
                    <CardTitle>Content Overview</CardTitle>
                    <CardDescription>
                      Ringkasan area yang saat ini bisa kamu update.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <p>1. Hero section (badge, heading, deskripsi, CTA).</p>
                    <p>2. Case studies section (judul, deskripsi, label tombol).</p>
                    <p>3. Process, testimonial, dan contact section.</p>
                  </CardContent>
                </Card>
                <Card className="lg:col-span-3">
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                    <CardDescription>Aksi cepat seperti di admin template.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button className="w-full" onClick={save}>
                      Simpan Perubahan
                    </Button>
                    <Button className="w-full" variant="outline" onClick={reset}>
                      Reset ke Default
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Analytics</CardTitle>
                  <CardDescription>
                    Placeholder panel analytics ala dashboard template.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-muted-foreground rounded-md border border-dashed p-8 text-center text-sm">
                    Hubungkan data analytics kamu di sini jika diperlukan.
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="content" className="space-y-6">
              <ContentEditor draft={draft} setDraft={setDraft} />
              <Card>
                <CardHeader>
                  <CardTitle>Aksi</CardTitle>
                  <CardDescription>Simpan atau reset semua perubahan konten.</CardDescription>
                </CardHeader>
                <CardFooter className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
                  <Button onClick={save}>Simpan Perubahan</Button>
                  <Button variant="outline" onClick={reset}>
                    Reset ke Default
                  </Button>
                  {status ? <p className="text-muted-foreground text-sm">{status}</p> : null}
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </section>
      </div>
    </main>
  );
}
