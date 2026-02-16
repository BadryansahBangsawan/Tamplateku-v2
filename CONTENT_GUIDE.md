# Panduan Mengubah Konten Tanpa Merusak Styling

## 📋 Daftar File Konten yang Bisa Diubah

### 1. **Data Files** (`/data/`)
File-file ini berisi data yang digunakan oleh komponen. Anda bisa mengubah isinya tanpa mengubah struktur.

#### `/data/caseStudies.ts`
- **Struktur**: Array `caseStudies` dengan interface `CaseStudyType`
- **Yang bisa diubah**: 
  - Semua field dalam setiap object case study
  - Jumlah case studies (tambah/kurang)
- **Yang TIDAK boleh diubah**: 
  - Nama interface `CaseStudyType`
  - Struktur object (field names)
  - Export statement

#### `/data/blogData.ts`
- **Struktur**: Array `blogPosts` dengan interface `BlogPost`
- **Yang bisa diubah**: 
  - Semua field dalam setiap blog post
  - Jumlah blog posts
- **Yang TIDAK boleh diubah**: 
  - Nama interface `BlogPost`
  - Struktur object (field names)
  - Export statement

### 2. **Hardcoded Content di Komponen**

#### `/components/landing/HeroSection.tsx`
**Baris 70-72**: Hero section content
```tsx
badge="AI Strategy & Development"
heading="AI Transformation Partner for Growing Businesses"
description="We build, train, & deploy custom-LLMs..."
```
✅ **Bisa diubah**: Teks badge, heading, description

#### `/components/landing/ProcessSection.tsx`
**Baris 28-77**: Process steps array
```tsx
const process: processType[] = [
  {
    title: "Discovery & Strategy",
    tagline: "Getting to Know Your Big Idea",
    description: "...",
    deliverables: [...],
    bg_image: "..."
  },
  // ... 3 more steps
]
```
✅ **Bisa diubah**: 
- Semua field dalam setiap process step
- Jumlah steps (tambah/kurang)
- Background images

**Baris 192-194**: Section heading
```tsx
badge="Our Proven Process"
heading="How We Bring Ideas to Life"
description="..."
```
✅ **Bisa diubah**: Teks badge, heading, description

#### `/components/landing/TestimonialSection.tsx`
**Baris 127-129**: Section heading
```tsx
badge="Testimonials"
heading="Meet our happy clients"
description="Read what our clients say..."
```
✅ **Bisa diubah**: Teks badge, heading, description

**Baris 166-196**: Stats section
```tsx
<div>120+</div>
<p>AI-powered projects delivered</p>
// ... 2 more stats
```
✅ **Bisa diubah**: Angka dan deskripsi stats

#### `/components/landing/ContactSection.tsx`
**Baris 148-150**: Section heading
```tsx
badge="Contact Us"
heading="Get in Touch"
description="Contact Ionio to discuss..."
```
✅ **Bisa diubah**: Teks badge, heading, description

**Baris 180-232**: Form labels dan placeholders
```tsx
<label>Name</label>
<Input placeholder="Enter your name" />
// ... email, message fields
```
✅ **Bisa diubah**: Label dan placeholder text

#### `/components/landing/CaseStudiesSection.tsx`
**Baris 166-169**: Section heading
```tsx
badge="Designs That Drive Growth"
heading="Recent case studies"
description="Explore our latest projects..."
```
✅ **Bisa diubah**: Teks badge, heading, description

### 3. **Metadata & SEO** (`/lib/metadata.ts`)

#### Site Configuration (Baris 3-68)
```tsx
export const siteConfig = {
  name: "Ionio",
  description: "...",
  url: "https://ionio.com",
  // ... dll
}
```
✅ **Bisa diubah**: 
- name, description, url
- keywords array
- OG images
- Social media handles

#### Page Metadata (Baris 71-176)
Setiap halaman memiliki metadata sendiri:
- `home`: Homepage metadata
- `about`: About page metadata  
- `blog`: Blog page metadata

✅ **Bisa diubah**: Semua teks dalam metadata

## 🎨 Yang TIDAK Boleh Diubah (Styling)

### ❌ Jangan ubah:
1. **CSS Classes** - Semua className dengan Tailwind CSS
2. **Component Structure** - Struktur HTML/JSX
3. **TypeScript Interfaces** - Nama interface dan field names
4. **Component Props** - Nama props dan strukturnya
5. **GSAP Animations** - Logic animasi (kecuali ingin mengubah animasi)
6. **Layout Structure** - Grid, flex, spacing

## ✅ Contoh Perubahan yang Aman

### Contoh 1: Mengubah Hero Section
```tsx
// SEBELUM
badge="AI Strategy & Development"
heading="AI Transformation Partner for Growing Businesses"

// SESUDAH (ubah teks saja)
badge="Digital Marketing Agency"
heading="We Help Brands Grow Online"
```

### Contoh 2: Mengubah Case Study
```tsx
// Di /data/caseStudies.ts
{
  name: "Standard Draft",  // ✅ Bisa diubah
  project_title: "Reimagining business insurance...", // ✅ Bisa diubah
  description: "We designed, built & deployed...", // ✅ Bisa diubah
  // ... semua field bisa diubah
}
```

### Contoh 3: Menambah Case Study Baru
```tsx
// Di /data/caseStudies.ts
export const caseStudies = [
  // ... case studies yang ada
  {
    main_image_src: "https://...",
    project_title: "Project Baru",
    logo_src: "https://...",
    // ... lengkapi semua required fields
  }
]
```

## 🚀 Langkah-Langkah Merombak Konten

1. **Backup dulu** - Pastikan ada backup sebelum perubahan besar
2. **Ubah data files** (`/data/`) terlebih dahulu
3. **Ubah hardcoded content** di komponen
4. **Update metadata** untuk SEO
5. **Test** - Pastikan tidak ada error TypeScript
6. **Preview** - Cek di browser apakah styling masih sama

## ⚠️ Tips Penting

- **Jaga struktur data** - Pastikan semua required fields ada
- **Gunakan TypeScript** - TypeScript akan warning jika struktur salah
- **Test incrementally** - Ubah sedikit-sedikit, test, lalu lanjut
- **Perhatikan image URLs** - Pastikan URL gambar valid
- **Cek console** - Lihat apakah ada error di browser console

## 📝 Checklist Perubahan

- [ ] Backup project
- [ ] Ubah `/data/caseStudies.ts`
- [ ] Ubah `/data/blogData.ts`
- [ ] Ubah HeroSection content
- [ ] Ubah ProcessSection content
- [ ] Ubah TestimonialSection content
- [ ] Ubah ContactSection content
- [ ] Ubah CaseStudiesSection content
- [ ] Update metadata di `/lib/metadata.ts`
- [ ] Test TypeScript compilation
- [ ] Test di browser
- [ ] Cek responsive design
- [ ] Verify semua images load dengan benar
