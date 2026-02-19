"use client";

import { type AppLanguage, useLanguage } from "@/components/language-provider";
import { Button } from "@/components/ui/button";

export default function LanguageButton() {
  const { language, setLanguage } = useLanguage();
  const nextLanguage: AppLanguage = language === "id" ? "en" : "id";

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      onClick={() => setLanguage(nextLanguage)}
      aria-label={language === "id" ? "Switch language to English" : "Ganti bahasa ke Indonesia"}
      title={language === "id" ? "Indonesia (klik untuk English)" : "English (click for Indonesia)"}
    >
      <span className="text-base leading-none" aria-hidden="true">
        {language === "id" ? "🇮🇩" : "🇺🇸"}
      </span>
    </Button>
  );
}
