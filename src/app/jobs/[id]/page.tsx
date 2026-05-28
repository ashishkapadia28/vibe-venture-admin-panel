"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Users, CheckCircle, Award, ExternalLink, User, X } from "lucide-react";
import Link from "next/link";
import StatCard from "@/components/StatCard";

const LinkedinIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect x="2" y="9" width="4" height="12" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

interface Job {
  id: string;
  title: string;
  department: string;
  location: string;
  type: string;
  is_active: boolean;
}

interface Applicant {
  id: string;
  job_id: string;
  name: string;
  email: string;
  phone: string;
  linkedin: string;
  experience: string;
  cover_letter: string;
  status: string;
  created_at: string;
}

export default function JobDetailsPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(null);

  const [applicants, setApplicants] = useState<Applicant[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const [jobRes, appsRes] = await Promise.all([
          fetch(`/api/jobs/${id}`),
          fetch(`/api/applications?job_id=${id}`)
        ]);
        
        if (!jobRes.ok) throw new Error("Job not found");
        
        const jobData = await jobRes.json();
        const appsData = await appsRes.json();
        
        setJob(jobData);
        setApplicants(appsData || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  const totalApplications = applicants.length;
  const shortlisted = applicants.filter(a => a.status === "Shortlisted").length;
  const selected = applicants.filter(a => a.status === "Selected").length;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    });
  };

  if (loading) return <div className="p-12 text-center text-gray-500">Loading details...</div>;
  if (!job) return <div className="p-12 text-center text-red-500">Job not found</div>;

  return (
    <div className="flex-1 p-8 overflow-y-auto">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <header>
          <button 
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-500 hover:text-blue-600 font-medium mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Jobs
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-2">{job.title}</h1>
              <p className="text-gray-500">{job.department} • {job.location} • {job.type}</p>
            </div>
            <span className={`px-4 py-2 text-sm rounded-full font-medium ${job.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
              {job.is_active ? "Currently Accepting Applications" : "Hidden / Closed"}
            </span>
          </div>
        </header>

        {/* Metrics Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard title="Total Applications" value={totalApplications.toString()} icon={Users} />
          <StatCard title="Shortlisted" value={shortlisted.toString()} icon={CheckCircle} />
          <StatCard title="Final Selected" value={selected.toString()} icon={Award} />
        </div>

        {/* Applicants History Table */}
        <div className="pt-4">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Applicant History</h2>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50 text-gray-500 text-sm tracking-wider uppercase">
                    <th className="px-6 py-4 font-medium">Applicant Name</th>
                    <th className="px-6 py-4 font-medium">Email</th>
                    <th className="px-6 py-4 font-medium">Phone</th>
                    <th className="px-6 py-4 font-medium">Date Applied</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 font-medium text-right">Links & Profile</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {applicants.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                        No applications received yet.
                      </td>
                    </tr>
                  ) : (
                    applicants.map((applicant) => (
                      <tr key={applicant.id} className="hover:bg-gray-50 transition-colors group">
                        <td className="px-6 py-4 text-gray-900 font-medium">{applicant.name}</td>
                        <td className="px-6 py-4 text-gray-600">
                          <a href={`mailto:${applicant.email}`} className="text-blue-600 hover:underline" title="Send Email">{applicant.email}</a>
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          <a href={`tel:${applicant.phone}`} className="text-blue-600 hover:underline" title="Call Phone">{applicant.phone}</a>
                        </td>
                        <td className="px-6 py-4 text-gray-600">{formatDate(applicant.created_at)}</td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-3 py-1 text-xs rounded-full font-medium ${
                              applicant.status === "Selected" ? "bg-emerald-100 text-emerald-700" :
                              applicant.status === "Shortlisted" ? "bg-blue-100 text-blue-700" :
                              applicant.status === "In Review" ? "bg-amber-100 text-amber-700" :
                              "bg-red-100 text-red-700"
                            }`}
                          >
                            {applicant.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end items-center gap-3">
                            <Link href={applicant.linkedin} target="_blank" className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="View LinkedIn">
                              <LinkedinIcon className="w-4 h-4" />
                            </Link>
                            <button onClick={() => setSelectedApplicant(applicant)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="View Profile">
                              <User className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>

      {/* Profile Modal */}
      {selectedApplicant && (
        <div className="fixed inset-0 bg-gray-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-lg p-6 relative">
            <button 
              onClick={() => setSelectedApplicant(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-2xl font-bold">
                {selectedApplicant.name.charAt(0)}
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">{selectedApplicant.name}</h2>
                <p className="text-gray-500">{job.title}</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Email</label>
                  <a href={`mailto:${selectedApplicant.email}`} className="text-blue-600 hover:underline font-medium block truncate" title="Send Email">{selectedApplicant.email}</a>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Phone</label>
                  <a href={`tel:${selectedApplicant.phone}`} className="text-blue-600 hover:underline font-medium block" title="Call">{selectedApplicant.phone}</a>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Experience</label>
                  <p className="text-gray-900 font-medium">{selectedApplicant.experience}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Status</label>
                  <p className="text-gray-900 font-medium">{selectedApplicant.status}</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Cover Letter / Notes</label>
                <div className="p-4 bg-gray-50 rounded-lg text-gray-700 text-sm whitespace-pre-wrap">
                  {selectedApplicant.cover_letter || "No cover letter provided."}
                </div>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <Link 
                  href={selectedApplicant.linkedin}
                  target="_blank"
                  className="flex items-center gap-2 px-4 py-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg font-medium transition-colors"
                >
                  <LinkedinIcon className="w-4 h-4" />
                  Visit LinkedIn
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
