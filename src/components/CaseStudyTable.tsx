/* eslint-disable @next/next/no-img-element */
"use client";

import { Edit2, Trash2 } from "lucide-react";

interface Metric {
  label: string;
  value: string;
}

export interface CaseStudy {
  id: string;
  tag: string;
  title: string;
  description: string;
  metrics: Metric[];
  tech: string[];
  gradient: string;
  accentColor: string;
  image: string;
  is_published: boolean;
  created_at?: string;
  client?: string;
  overview?: string;
  role?: string;
  timeline?: number;
  industry?: string;
  challenge?: string;
  solution?: string;
  impact?: string;
}

interface CaseStudyTableProps {
  caseStudies: CaseStudy[];
  onEdit: (caseStudy: CaseStudy) => void;
  onDelete: (id: string) => void;
  isLoading?: boolean;
}

export default function CaseStudyTable({ caseStudies, onEdit, onDelete, isLoading = false }: CaseStudyTableProps) {
  if (isLoading) {
    return (
      <div className="panel empty-state">
        Loading case studies...
      </div>
    );
  }

  return (
    <div className="panel hover-lift">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="thead-row">
              <th className="px-6 py-4 font-medium">Title</th>
              <th className="px-6 py-4 font-medium">Tag</th>
              <th className="px-6 py-4 font-medium">Tech Stack</th>
              <th className="px-6 py-4 font-medium">Status</th>
              <th className="px-6 py-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {caseStudies.map((item) => (
              <tr key={item.id} className="hover:bg-violet-50/30 transition-colors group">
                <td className="px-6 py-4 text-gray-900 font-medium">
                  <div className="flex items-center gap-3">
                    {item.image && (
                      
                      <img src={item.image} alt={item.title} className="w-10 h-10 rounded-md object-cover border border-gray-200" />
                    )}
                    <span className="truncate max-w-[200px]" title={item.title}>{item.title}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-600">{item.tag}</td>
                <td className="px-6 py-4 text-gray-600">
                  <div className="flex flex-wrap gap-1 max-w-[200px]">
                    {item.tech.slice(0, 3).map((t) => (
                      <span key={t} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md truncate max-w-[80px]">
                        {t}
                      </span>
                    ))}
                    {item.tech.length > 3 && (
                      <span className="text-xs text-gray-500 px-1 py-0.5">+{item.tech.length - 3}</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`badge ${
                      item.is_published
                        ? "badge-primary"
                        : "badge-warning"
                    }`}
                  >
                    {item.is_published ? "Published" : "Draft"}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => onEdit(item)}
                      className="icon-btn"
                      title="Edit Case Study"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm("Are you sure you want to delete this case study?")) {
                          onDelete(item.id);
                        }
                      }}
                      className="icon-btn-danger"
                      title="Delete Case Study"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {caseStudies.length === 0 && (
        <div className="empty-state">
          No case studies found. Create your first one!
        </div>
      )}
    </div>
  );
}
