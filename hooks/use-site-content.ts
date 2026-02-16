"use client";

import {
  SITE_CONTENT_UPDATED_EVENT,
  defaultSiteContent,
  readSiteContentFromStorage,
  type SiteContent,
} from "@/lib/siteContent";
import { useEffect, useState } from "react";

export function useSiteContent(): SiteContent {
  const [content, setContent] = useState<SiteContent>(defaultSiteContent);

  useEffect(() => {
    const sync = () => {
      setContent(readSiteContentFromStorage());
    };

    sync();
    window.addEventListener("storage", sync);
    window.addEventListener(SITE_CONTENT_UPDATED_EVENT, sync);

    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(SITE_CONTENT_UPDATED_EVENT, sync);
    };
  }, []);

  return content;
}
