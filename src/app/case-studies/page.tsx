"use client";

import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import Link from "next/link";
import CaseStudyTable, { CaseStudy } from "@/components/CaseStudyTable";
import { useRouter } from "next/navigation";

export default function CaseStudiesPage() {
  const [caseStudies, setCaseStudies] = useState<CaseStudy[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchCaseStudies();
  }, []);

  const fetchCaseStudies = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/case-studies");
      if (!res.ok) throw new Error("Failed to fetch case studies");
      const data = await res.json();
      setCaseStudies(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (study: CaseStudy) => {
    router.push(`/case-studies/${study.id}/edit`);
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/case-studies/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete case study");
      fetchCaseStudies();
    } catch (error) {
      console.error(error);
      alert("Failed to delete case study");
    }
  };

  return (
    <div className="flex-1 p-8 overflow-y-auto">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-2">Case Studies</h1>
            <p className="text-gray-500">Manage your portfolio items and project highlights.</p>
          </div>
          <Link 
            href="/case-studies/new"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors shadow-sm"
          >
            <Plus className="w-5 h-5" />
            Add New Case Study
          </Link>
        </header>

        <div className="pt-4">
          <CaseStudyTable 
            caseStudies={caseStudies} 
            onEdit={handleEdit} 
            onDelete={handleDelete} 
            isLoading={isLoading} 
          />
        </div>
      </div>
    </div>
  );
}
