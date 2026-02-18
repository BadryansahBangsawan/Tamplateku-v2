"use client";

import type { CaseStudyType } from "@/data/caseStudies";
import {
  CASE_STUDIES_UPDATED_EVENT,
  defaultCaseStudiesContent,
  readCaseStudiesFromStorage,
} from "@/lib/caseStudiesContent";
import { useEffect, useState } from "react";

export function useCaseStudies(): CaseStudyType[] {
  const [caseStudies, setCaseStudies] = useState<CaseStudyType[]>(defaultCaseStudiesContent);

  useEffect(() => {
    const sync = () => setCaseStudies(readCaseStudiesFromStorage());

    sync();
    window.addEventListener("storage", sync);
    window.addEventListener(CASE_STUDIES_UPDATED_EVENT, sync);

    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(CASE_STUDIES_UPDATED_EVENT, sync);
    };
  }, []);

  return caseStudies;
}
