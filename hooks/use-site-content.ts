"use client";

import {
  SITE_CONTENT_STORAGE_KEY,
  SITE_CONTENT_UPDATED_EVENT,
  type SiteContent,
  defaultSiteContent,
  readSiteContentFromStorage,
} from "@/lib/siteContent";
import { useEffect, useState } from "react";

export function useSiteContent(): SiteContent {
  const [content, setContent] = useState<SiteContent>(defaultSiteContent);

  useEffect(() => {
    const sync = async () => {
      try {
        const response = await fetch("/api/cms/content", { cache: "no-store" });
        if (!response.ok) throw new Error("Failed to fetch site content");

        const payload = (await response.json()) as { ok: boolean; data?: SiteContent };
        if (!payload.ok || !payload.data) throw new Error("Invalid site content payload");

        setContent(payload.data);
        window.localStorage.setItem(SITE_CONTENT_STORAGE_KEY, JSON.stringify(payload.data));
        return;
      } catch {
        setContent(readSiteContentFromStorage());
      }
    };

    const handleStorage = () => {
      void sync();
    };

    const handleUpdated = () => {
      void sync();
    };

    void sync();
    window.addEventListener("storage", handleStorage);
    window.addEventListener(SITE_CONTENT_UPDATED_EVENT, handleUpdated);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(SITE_CONTENT_UPDATED_EVENT, handleUpdated);
    };
  }, []);

  return content;
}
