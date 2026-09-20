/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Users, CheckCircle, Award, ExternalLink, User, X, FileText, Download } from "lucide-react";
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
  cover_letter?: string | null; // legacy free-text field, kept for old rows
  resume_path?: string | null;
  cover_letter_path?: string | null;
  resume_url?: string | null; // short-lived signed URL, generated per-request
  cover_letter_url?: string | null;
  status: string;
  created_at: string;
  ip_address?: string | null;
}

const APPLICATION_STATUSES = ["In Review", "Shortlisted", "Selected", "Rejected"] as const;

export default function JobDetailsPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

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

  const updateApplicantStatus = async (applicantId: string, status: string) => {
    setIsUpdatingStatus(true);
    try {
      const res = await fetch(`/api/applications/${applicantId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Failed to update status');
      setApplicants((prev) => prev.map((a) => (a.id === applicantId ? { ...a, status } : a)));
      setSelectedApplicant((prev) => (prev && prev.id === applicantId ? { ...prev, status } : prev));
    } catch (err) {
      console.error(err);
      alert('Failed to update application status.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

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
            className="flex items-center gap-2 text-gray-500 hover:text-violet-600 font-medium mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Jobs
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-2">{job.title}</h1>
              <p className="text-gray-500">{job.department} • {job.location} • {job.type}</p>
            </div>
            <span className={`badge text-sm px-4 py-2 ${job.is_active ? 'badge-primary' : 'badge-neutral'}`}>
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
          <div className="panel">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="thead-row">
                    <th className="px-6 py-4 font-medium">Applicant Name</th>
                    <th className="px-6 py-4 font-medium">Email</th>
                    <th className="px-6 py-4 font-medium">Phone</th>
                    <th className="px-6 py-4 font-medium">Date Applied</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 font-medium text-right">Links & Profile</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {applicants.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="empty-state">
                        No applications received yet.
                      </td>
                    </tr>
                  ) : (
                    applicants.map((applicant) => (
                      <tr key={applicant.id} className="hover:bg-violet-50/30 transition-colors group">
                        <td className="px-6 py-4 text-gray-900 font-medium">{applicant.name}</td>
                        <td className="px-6 py-4 text-gray-600">
                          <a href={`mailto:${applicant.email}`} className="text-violet-600 hover:underline" title="Send Email">{applicant.email}</a>
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          <a href={`tel:${applicant.phone}`} className="text-violet-600 hover:underline" title="Call Phone">{applicant.phone}</a>
                        </td>
                        <td className="px-6 py-4 text-gray-600">{formatDate(applicant.created_at)}</td>
                        <td className="px-6 py-4">
                          <select
                            value={applicant.status}
                            disabled={isUpdatingStatus}
                            onChange={(e) => updateApplicantStatus(applicant.id, e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            className={`badge border-0 cursor-pointer disabled:opacity-50 ${
                              applicant.status === "Selected" ? "badge-primary" :
                              applicant.status === "Shortlisted" ? "badge-primary" :
                              applicant.status === "In Review" ? "badge-warning" :
                              "badge-danger"
                            }`}
                          >
                            {APPLICATION_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end items-center gap-3">
                            {applicant.resume_url && (
                              <Link href={applicant.resume_url} target="_blank" rel="noopener noreferrer" className="icon-btn" title="Download Resume">
                                <FileText className="w-4 h-4" />
                              </Link>
                            )}
                            {applicant.linkedin && (
                              <Link href={applicant.linkedin} target="_blank" rel="noopener noreferrer" className="icon-btn" title="View LinkedIn">
                                <LinkedinIcon className="w-4 h-4" />
                              </Link>
                            )}
                            <button onClick={() => setSelectedApplicant(applicant)} className="icon-btn" title="View Profile">
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
        <div className="modal-overlay">
          <div className="modal-panel w-full max-w-lg p-6 relative animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => setSelectedApplicant(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-violet-100 text-violet-600 rounded-full flex items-center justify-center text-2xl font-bold">
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
                  <a href={`mailto:${selectedApplicant.email}`} className="text-violet-600 hover:underline font-medium block truncate" title="Send Email">{selectedApplicant.email}</a>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Phone</label>
                  <a href={`tel:${selectedApplicant.phone}`} className="text-violet-600 hover:underline font-medium block" title="Call">{selectedApplicant.phone}</a>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Experience</label>
                  <p className="text-gray-900 font-medium">{selectedApplicant.experience}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Status</label>
                  <select
                    value={selectedApplicant.status}
                    disabled={isUpdatingStatus}
                    onChange={(e) => updateApplicantStatus(selectedApplicant.id, e.target.value)}
                    className="input-field py-1.5 text-sm font-medium disabled:opacity-50"
                  >
                    {APPLICATION_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Resume</label>
                  {selectedApplicant.resume_url ? (
                    <Link
                      href={selectedApplicant.resume_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-violet-600 bg-violet-50 hover:bg-violet-100 rounded-lg transition-colors"
                    >
                      <Download className="w-4 h-4" /> Download PDF
                    </Link>
                  ) : (
                    <p className="text-sm text-gray-400">Not provided</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Cover Letter</label>
                  {selectedApplicant.cover_letter_url ? (
                    <Link
                      href={selectedApplicant.cover_letter_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-violet-600 bg-violet-50 hover:bg-violet-100 rounded-lg transition-colors"
                    >
                      <Download className="w-4 h-4" /> Download PDF
                    </Link>
                  ) : (
                    <p className="text-sm text-gray-400">Not provided</p>
                  )}
                </div>
              </div>
              {selectedApplicant.cover_letter && (
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Notes (legacy text submission)</label>
                  <div className="p-4 bg-gray-50 rounded-lg text-gray-700 text-sm whitespace-pre-wrap">
                    {selectedApplicant.cover_letter}
                  </div>
                </div>
              )}
              <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
                <span>Privacy-policy consent recorded at submission</span>
                <span className="font-mono">
                  {new Date(selectedApplicant.created_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                  {selectedApplicant.ip_address ? ` · ${selectedApplicant.ip_address}` : ""}
                </span>
              </div>
              {selectedApplicant.linkedin && (
                <div className="pt-4 flex justify-end gap-3">
                  <Link
                    href={selectedApplicant.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 text-violet-600 bg-violet-50 hover:bg-violet-100 rounded-lg font-medium transition-colors"
                  >
                    <LinkedinIcon className="w-4 h-4" />
                    Visit LinkedIn
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
