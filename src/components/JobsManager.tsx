"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Edit2, Trash2, Eye, EyeOff, X, ChevronRight } from "lucide-react";

const JOB_TYPES = ["Full-Time", "Contract", "Internship"] as const;
const JOB_EXPERIENCE_LEVELS = ["Fresher", "Mid-Level", "Experienced"] as const;

interface Job {
  id: string;
  slug: string;
  title: string;
  department: string;
  location: string;
  type: string;
  experience: string;
  is_active: boolean;
  description?: string;
}

const slugify = (text: string) =>
  text.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");

export default function JobsManager() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    department: "",
    location: "",
    type: "Full-Time" as string,
    experience: "",
  });

  const fetchJobs = async () => {
    try {
      const response = await fetch('/api/jobs');
      if (!response.ok) throw new Error('Failed to fetch jobs');
      const data = await response.json();
      setJobs(data);
    } catch (error) {
      console.error("Error fetching jobs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchJobs();
  }, []);

  const toggleStatus = async (job: Job) => {
    try {
      const response = await fetch(`/api/jobs/${job.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !job.is_active }),
      });
      if (response.ok) fetchJobs();
    } catch (error) {
      console.error("Error toggling status:", error);
    }
  };

  const deleteJob = async (id: string) => {
    if (!confirm('Are you sure you want to delete this job post?')) return;
    try {
      const response = await fetch(`/api/jobs/${id}`, { method: 'DELETE' });
      if (response.ok) fetchJobs();
    } catch (error) {
      console.error("Error deleting job:", error);
    }
  };

  const openAddModal = () => {
    setEditingJob(null);
    setFormData({ title: "", slug: "", department: "", location: "", type: "Full-Time", experience: "" });
    setIsModalOpen(true);
  };

  const openEditModal = (job: Job) => {
    setEditingJob(job);
    setFormData({
      title: job.title,
      slug: job.slug || "",
      department: job.department,
      location: job.location,
      type: job.type,
      experience: job.experience,
    });
    setIsModalOpen(true);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    setFormData((prev) => ({
      ...prev,
      title,
      // Only auto-follow the title for brand-new jobs — once a job exists
      // (or the admin has hand-edited the slug) its public URL shouldn't
      // silently change out from under it.
      slug: !editingJob ? slugify(title) : prev.slug,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingJob) {
        // Edit existing
        const response = await fetch(`/api/jobs/${editingJob.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        if (response.ok) {
          setIsModalOpen(false);
          fetchJobs();
        }
      } else {
        // Add new
        const response = await fetch('/api/jobs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...formData, is_active: true }),
        });
        if (response.ok) {
          setIsModalOpen(false);
          fetchJobs();
        }
      }
    } catch (error) {
      console.error("Error saving job:", error);
    }
  };

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-2">Job Posts</h1>
          <p className="text-gray-500">Manage careers, job postings, and active listings.</p>
        </div>
        <button
          onClick={openAddModal}
          className="btn btn-primary"
        >
          <Plus className="w-5 h-5" />
          Add New Job
        </button>
      </header>

      {/* Table */}
      <div className="panel hover-lift">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="thead-row">
                <th className="px-6 py-4 font-medium">Title</th>
                <th className="px-6 py-4 font-medium">Department</th>
                <th className="px-6 py-4 font-medium">Location</th>
                <th className="px-6 py-4 font-medium">Type</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={6} className="empty-state">Loading jobs...</td></tr>
              ) : jobs.length === 0 ? (
                <tr><td colSpan={6} className="empty-state">No job posts found. Click &quot;Add New Job&quot; to create one.</td></tr>
              ) : (
                jobs.map((job) => (
                  <tr key={job.id} className="hover:bg-violet-50/30 transition-colors group">
                    <td className="px-6 py-4">
                      <p className="text-gray-900 font-medium">{job.title}</p>
                      <p className="text-gray-500 text-xs mt-1">/career/{job.slug}</p>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{job.department}</td>
                    <td className="px-6 py-4 text-gray-600">{job.location}</td>
                    <td className="px-6 py-4 text-gray-600">{job.type}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`badge ${job.is_active ? "badge-primary" : "badge-neutral"}`}
                      >
                        {job.is_active ? "Active" : "Hidden"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => toggleStatus(job)}
                          className="icon-btn"
                          title={job.is_active ? "Hide Job" : "Publish Job"}
                        >
                          {job.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => openEditModal(job)}
                          className="icon-btn"
                          title="Edit Job"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteJob(job.id)}
                          className="icon-btn-danger"
                          title="Delete Job"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <Link
                          href={`/jobs/${job.id}`}
                          className="icon-btn"
                          title="View Details"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-panel w-full max-w-lg p-6 relative animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              {editingJob ? "Edit Job Post" : "Add New Job Post"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Job Title</label>
                <input
                  required
                  type="text"
                  value={formData.title}
                  onChange={handleTitleChange}
                  className="input-field"
                  placeholder="e.g. Senior Go Engineer"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Slug (public URL)</label>
                <input
                  required
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })}
                  className="input-field bg-gray-50 font-mono text-sm"
                  placeholder="e.g. senior-go-engineer"
                />
                <p className="text-xs text-gray-500 mt-1">Shown as /career/{formData.slug || "..."} and used to match applications to this job.</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                  <input 
                    required
                    type="text" 
                    value={formData.department}
                    onChange={(e) => setFormData({...formData, department: e.target.value})}
                    className="input-field"
                    placeholder="e.g. Engineering"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <input 
                    required
                    type="text" 
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    className="input-field"
                    placeholder="e.g. Remote"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    required
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                    className="input-field"
                  >
                    {JOB_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Experience</label>
                  <select
                    required
                    value={formData.experience}
                    onChange={(e) => setFormData({...formData, experience: e.target.value})}
                    className="input-field"
                  >
                    <option value="" disabled>Select level...</option>
                    {JOB_EXPERIENCE_LEVELS.map((lvl) => <option key={lvl} value={lvl}>{lvl}</option>)}
                  </select>
                </div>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                >
                  {editingJob ? "Save Changes" : "Create Job"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
