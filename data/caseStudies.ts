export const caseStudies = [
  {
    main_image_src: "/tamplate/tamplate-1.png",
    project_title: "Template landing page premium untuk jasa B2B dengan fokus lead generation.",
    logo_src: "/frameworks/react.svg?v=20260219",
    description:
      "Tamplateku membantu brand B2B meluncurkan landing page premium dalam waktu singkat tanpa membangun website dari nol.",
    features: [
      "Struktur section dibuat untuk mengarahkan pengunjung ke CTA utama.",
      "Visual modern dan clean agar brand tampil lebih kredibel di first impression.",
    ],
    case_study_link: "#",
    name: "B2B Leadflow",
    demo_images: [
      "/tamplate/tamplate-1.png",
      "/tamplate/tamplate-2.png",
      "/tamplate/tamplate-3.png",
    ],
    test_img: "/tamplate/tamplate-1.png",
    testimonial:
      '"Template dari Tamplateku bikin proses launch website kami jauh lebih cepat. Tim marketing langsung bisa pakai tanpa revisi besar."',
    founder_name: "Ryan Samii",
    position: "Founder & CEO",
    status_label: "Ready to Use",
    is_best_seller: true,
  },
  {
    main_image_src: "/tamplate/tamplate-2.png",
    project_title: "Template SaaS showcase untuk menampilkan fitur produk lebih jelas.",
    logo_src: "/frameworks/nextjs.svg?v=20260219",
    description:
      "Kami pilihkan template yang menonjolkan value proposition, demo flow, dan paket harga agar lebih mudah closing.",
    features: [
      "Blok fitur dibuat ringkas agar user cepat paham manfaat produk.",
      "Section pricing disusun agar perbandingan paket terlihat jelas.",
      "Komponen CTA ditempatkan strategis di beberapa titik halaman.",
    ],
    case_study_link: "#",
    name: "SaaS Growth",
    demo_images: [
      "/tamplate/tamplate-2.png",
      "/tamplate/tamplate-3.png",
      "/tamplate/tamplate-1.png",
    ],
    test_img: "/tamplate/tamplate-2.png",
    testimonial:
      '"Yang saya suka, templatenya premium tapi tetap fleksibel. Tinggal ganti copy dan visual, langsung siap dipromosikan."',
    founder_name: "Reid Chong",
    position: "Founder & CEO",
    status_label: "Ready to Use",
    is_best_seller: true,
  },
  {
    main_image_src: "/tamplate/tamplate-3.png",
    project_title: "Template company profile modern untuk meningkatkan trust brand.",
    logo_src: "/frameworks/vue.svg?v=20260219",
    description:
      "Tamplateku merapikan alur informasi dari hero sampai contact section agar website mudah dipahami calon klien.",
    features: [
      "Layout informatif dengan hierarchy konten yang jelas.",
      "Desain responsif untuk desktop dan mobile tanpa penyesuaian rumit.",
    ],
    case_study_link: "#",
    name: "Brand Profile",
    demo_images: [
      "/tamplate/tamplate-3.png",
      "/tamplate/tamplate-1.png",
      "/tamplate/tamplate-2.png",
    ],
    test_img: "/tamplate/tamplate-3.png",
    testimonial:
      '"Komunikasi tim Tamplateku cepat dan jelas. Kami jadi punya website yang tampil premium tanpa harus develop dari nol."',
    founder_name: "TJ Gottfried",
    position: "Founder",
    status_label: "Ready to Use",
    is_best_seller: false,
  },
  {
    main_image_src: "/tamplate/tamplate-1.png",
    project_title: "Template dashboard product untuk startup tahap awal.",
    logo_src: "/frameworks/nuxt.svg?v=20260219",
    description:
      "Kombinasi template dan customisasi cepat membuat tim bisa go-live lebih awal dan fokus ke validasi pasar.",
    features: [
      "Komponen UI konsisten agar pengalaman pengguna lebih nyaman.",
      "Halaman inti diprioritaskan untuk mempercepat time-to-market.",
    ],
    case_study_link: "#",
    name: "Startup Launch",
    demo_images: [
      "/tamplate/tamplate-1.png",
      "/tamplate/tamplate-2.png",
      "/tamplate/tamplate-3.png",
    ],
    test_img: "/tamplate/tamplate-1.png",
    testimonial:
      '"Tamplateku profesional dari awal sampai rilis. Prosesnya cepat, rapi, dan hasil akhirnya sesuai ekspektasi kami."',
    founder_name: "Brad Milne",
    position: "Co-Founder",
    status_label: "Ready to Use",
    is_best_seller: false,
  },
  {
    main_image_src: "/tamplate/tamplate-2.png",
    project_title: "Template portfolio kreatif untuk personal brand dan agency.",
    logo_src: "/frameworks/remix.svg?v=20260219",
    description:
      "Template ini dirancang untuk menampilkan karya, layanan, dan testimoni dengan visual premium yang tetap ringan.",
    features: [
      "Section portfolio siap pakai untuk menampilkan hasil kerja terbaik.",
      "Struktur halaman mendukung storytelling brand yang lebih kuat.",
    ],
    case_study_link: "#",
    name: "Creative Portfolio",
    demo_images: [
      "/tamplate/tamplate-2.png",
      "/tamplate/tamplate-3.png",
      "/tamplate/tamplate-1.png",
    ],
    test_img: "/tamplate/tamplate-2.png",
    testimonial:
      '"Setelah pakai template Tamplateku, presentasi brand kami jadi jauh lebih meyakinkan di mata calon klien."',
    founder_name: "Michael Guimarin",
    position: "Founder",
    status_label: "Ready to Use",
    is_best_seller: false,
  },
];

export interface CaseStudyType {
  id?: string;
  main_image_src: string;
  project_title: string;
  logo_src: string;
  description: string;
  features: string[];
  case_study_link: string;
  name: string;
  demo_images: string[];
  project_link?: string | null;
  cta_links?: {
    "let's talk": string;
    "read case study": string;
  };
  test_img?: string;
  testimonial?: string;
  founder_name?: string;
  position?: string;
  status_label?: string | null;
  is_best_seller?: boolean | null;
}
