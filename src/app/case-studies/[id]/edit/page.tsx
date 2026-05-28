"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import CaseStudyForm from "@/components/CaseStudyForm";
import { CaseStudy } from "@/components/CaseStudyTable";

export default function EditCaseStudyPage() {
  const { id } = useParams();
  const [caseStudy, setCaseStudy] = useState<CaseStudy | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCaseStudy = async () => {
      try {
        const res = await fetch(`/api/case-studies`);
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        // Simple filter on client side since we don't have a GET /api/case-studies/[id]
        const found = data.find((c: CaseStudy) => c.id.toString() === id);
        if (found) {
          setCaseStudy(found);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchCaseStudy();
    }
  }, [id]);

  if (isLoading) {
    return <div className="p-12 text-center text-gray-500">Loading case study details...</div>;
  }

  if (!caseStudy) {
    return <div className="p-12 text-center text-gray-500">Case study not found.</div>;
  }

  return <CaseStudyForm initialData={caseStudy} isEdit={true} />;
}
