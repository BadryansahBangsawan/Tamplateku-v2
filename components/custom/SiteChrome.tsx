"use client";

import Footer from "@/components/custom/Footer";
import Navbar from "@/components/custom/Navbar";
import { usePathname } from "next/navigation";

export default function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith("/admin");

  if (isAdminRoute) {
    return <div className="min-h-screen w-full">{children}</div>;
  }

  return (
    <div className="min-h-screen w-full">
      <Navbar />
      {children}
      <Footer />
    </div>
  );
}
