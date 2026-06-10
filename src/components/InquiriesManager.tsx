"use client";

import { useState, useEffect } from "react";
import { MessageSquare, Trash2, Eye, X, Mail, Globe, Briefcase, Factory } from "lucide-react";

export interface Inquiry {
  id: string;
  name: string;
  email: string;
  country: string | null;
  industry: string | null;
  service: string | null;
  project_info: string;
  status: string;
  created_at: string;
}

export default function InquiriesManager() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);

  useEffect(() => {
    fetchInquiries();
  }, []);

  const fetchInquiries = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/inquiries");
      if (res.ok) {
        const data = await res.json();
        setInquiries(data);
      }
    } catch (error) {
      console.error("Failed to fetch inquiries:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this inquiry?")) return;

    try {
      const res = await fetch(`/api/inquiries/${id}`, { method: "DELETE" });
      if (res.ok) {
        setInquiries(inquiries.filter((inq) => inq.id !== id));
      } else {
        alert("Failed to delete inquiry.");
      }
    } catch (error) {
      console.error("Error deleting inquiry:", error);
      alert("Error deleting inquiry.");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-blue-600" />
            Inquiries
          </h2>
          <p className="text-gray-500 mt-1">Manage project inquiries from your website visitors.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-12 text-center text-gray-500">Loading inquiries...</div>
        ) : inquiries.length === 0 ? (
          <div className="p-12 text-center text-gray-500">No inquiries found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-gray-500 text-sm tracking-wider uppercase">
                  <th className="px-6 py-4 font-medium">Name</th>
                  <th className="px-6 py-4 font-medium">Email</th>
                  <th className="px-6 py-4 font-medium">Date</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {inquiries.map((inq) => (
                  <tr key={inq.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-6 py-4 text-gray-900 font-medium">{inq.name}</td>
                    <td className="px-6 py-4 text-gray-600">
                      <a href={`mailto:${inq.email}`} className="text-blue-600 hover:underline">
                        {inq.email}
                      </a>
                    </td>
                    <td className="px-6 py-4 text-gray-500">{formatDate(inq.created_at)}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 text-xs rounded-full font-medium ${inq.status === 'New' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
                        {inq.status || "New"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setSelectedInquiry(inq)}
                          className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(inq.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Inquiry"
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
        )}
      </div>

      {/* View Details Modal */}
      {selectedInquiry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                Inquiry Details
              </h3>
              <button
                onClick={() => setSelectedInquiry(null)}
                className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Name</p>
                  <p className="font-medium text-gray-900">{selectedInquiry.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1 flex items-center gap-1">
                    <Mail className="w-4 h-4" /> Email
                  </p>
                  <a href={`mailto:${selectedInquiry.email}`} className="font-medium text-blue-600 hover:underline">
                    {selectedInquiry.email}
                  </a>
                </div>
                {selectedInquiry.country && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1 flex items-center gap-1">
                      <Globe className="w-4 h-4" /> Country
                    </p>
                    <p className="font-medium text-gray-900">{selectedInquiry.country}</p>
                  </div>
                )}
                {selectedInquiry.industry && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1 flex items-center gap-1">
                      <Factory className="w-4 h-4" /> Industry
                    </p>
                    <p className="font-medium text-gray-900">{selectedInquiry.industry}</p>
                  </div>
                )}
                {selectedInquiry.service && (
                  <div className="col-span-1 md:col-span-2">
                    <p className="text-sm text-gray-500 mb-1 flex items-center gap-1">
                      <Briefcase className="w-4 h-4" /> Service Interested In
                    </p>
                    <p className="font-medium text-gray-900">{selectedInquiry.service}</p>
                  </div>
                )}
              </div>
              
              <div className="pt-4 border-t border-gray-100">
                <p className="text-sm text-gray-500 mb-2 font-medium">Project Information</p>
                <div className="bg-gray-50 p-4 rounded-xl text-gray-700 whitespace-pre-wrap">
                  {selectedInquiry.project_info}
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-100 flex justify-end">
              <a 
                href={`mailto:${selectedInquiry.email}`}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <Mail className="w-4 h-4" />
                Reply via Email
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
