"use client";

import type { CaseStudyType } from "@/data/caseStudies";
import {
  CASE_STUDIES_STORAGE_KEY,
  CASE_STUDIES_UPDATED_EVENT,
  defaultCaseStudiesContent,
  readCaseStudiesFromStorage,
} from "@/lib/caseStudiesContent";
import { useEffect, useState } from "react";

export function useCaseStudies(): CaseStudyType[] {
  const [caseStudies, setCaseStudies] = useState<CaseStudyType[]>(defaultCaseStudiesContent);

  useEffect(() => {
    const sync = async () => {
      try {
        const response = await fetch("/api/cms/templates", { cache: "no-store" });
        if (!response.ok) throw new Error("Failed to fetch templates");

        const payload = (await response.json()) as { ok: boolean; data?: CaseStudyType[] };
        if (!payload.ok || !payload.data) throw new Error("Invalid templates payload");

        setCaseStudies(payload.data);
        window.localStorage.setItem(CASE_STUDIES_STORAGE_KEY, JSON.stringify(payload.data));
        return;
      } catch {
        setCaseStudies(readCaseStudiesFromStorage());
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
    window.addEventListener(CASE_STUDIES_UPDATED_EVENT, handleUpdated);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(CASE_STUDIES_UPDATED_EVENT, handleUpdated);
    };
  }, []);

  return caseStudies;
}
