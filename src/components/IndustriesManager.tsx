"use client";

import { useState } from "react";
import { Plus, Edit2, Trash2, X, Image as ImageIcon, Loader2 } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

interface Industry {
  id: string;
  name: string;
  slug: string;
  description: string;
  image_url?: string;
  icon_name?: string;
  stats?: string[];
  created_at?: string;
}

export default function IndustriesManager({ initialIndustries }: { initialIndustries: Industry[] }) {
  const [industries, setIndustries] = useState<Industry[]>(initialIndustries);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIndustry, setEditingIndustry] = useState<Industry | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    image_url: "",
    icon_name: "Building2",
  });

  const [stats, setStats] = useState<string[]>(["", "", ""]);

  const supabase = createClient();

  const fetchIndustries = async () => {
    const { data } = await supabase.from('industries').select('*').order('created_at', { ascending: false });
    if (data) setIndustries(data);
  };

  const openAddModal = () => {
    setEditingIndustry(null);
    setFormData({ name: "", slug: "", description: "", image_url: "", icon_name: "Building2" });
    setStats(["", "", ""]);
    setIsModalOpen(true);
  };

  const openEditModal = (industry: Industry) => {
    setEditingIndustry(industry);
    setFormData({
      name: industry.name,
      slug: industry.slug,
      description: industry.description || "",
      image_url: industry.image_url || "",
      icon_name: industry.icon_name || "Building2",
    });
    const loadedStats = industry.stats || [];
    setStats([loadedStats[0] || "", loadedStats[1] || "", loadedStats[2] || ""]);
    setIsModalOpen(true);
  };

  const deleteIndustry = async (id: string) => {
    if (!confirm('Are you sure you want to delete this industry?')) return;
    try {
      await supabase.from('industries').delete().eq('id', id);
      fetchIndustries();
    } catch (error) {
      console.error("Error deleting industry:", error);
    }
  };

  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setFormData(prev => ({
      ...prev,
      name,
      slug: !editingIndustry ? generateSlug(name) : prev.slug
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    
    if (file.size > 2 * 1024 * 1024) {
      alert("Image size exceeds 2MB.");
      return;
    }

    setIsUploading(true);
    try {
      const fileName = `industries/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '')}`;
      const { error: uploadError } = await supabase.storage.from('images').upload(fileName, file);
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from('images').getPublicUrl(fileName);
      setFormData(prev => ({ ...prev, image_url: data.publicUrl }));
    } catch (error) {
      console.error("Upload error:", error);
      alert("Failed to upload image. Please ensure the 'images' storage bucket is created and public.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleStatChange = (index: number, value: string) => {
    const newStats = [...stats];
    newStats[index] = value;
    setStats(newStats);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Filter out empty stats
    const validStats = stats.filter(s => s.trim() !== "");

    try {
      const payload = { ...formData, stats: validStats };
      
      if (editingIndustry) {
        await supabase.from('industries').update(payload).eq('id', editingIndustry.id);
      } else {
        await supabase.from('industries').insert([payload]);
      }
      setIsModalOpen(false);
      fetchIndustries();
    } catch (error: any) {
      console.error("Error saving industry:", error);
      alert(error.message.includes('unique') ? "An industry with this slug already exists!" : "Failed to save industry. Did you run the SQL upgrade script?");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-2">Industries</h1>
          <p className="text-gray-500">Manage industry categories for your website showcase.</p>
        </div>
        <button 
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors shadow-sm whitespace-nowrap"
        >
          <Plus className="w-5 h-5" />
          Add New Industry
        </button>
      </header>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-gray-500 text-sm tracking-wider uppercase">
                <th className="px-6 py-4 font-medium w-16">Cover</th>
                <th className="px-6 py-4 font-medium">Name</th>
                <th className="px-6 py-4 font-medium">Icon</th>
                <th className="px-6 py-4 font-medium">Description</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {industries.length === 0 ? (
                <tr><td colSpan={5} className="p-12 text-center text-gray-500">No industries found. Click &quot;Add New Industry&quot; to create one.</td></tr>
              ) : (
                industries.map((industry) => (
                  <tr key={industry.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-6 py-4">
                      {industry.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={industry.image_url} alt={industry.name} className="w-12 h-12 object-cover rounded-md border border-gray-200" />
                      ) : (
                        <div className="w-12 h-12 rounded-md bg-gray-100 text-gray-400 flex items-center justify-center">
                          <ImageIcon className="w-5 h-5" />
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-900 font-medium">{industry.name}</td>
                    <td className="px-6 py-4 text-gray-500 font-mono text-sm">{industry.icon_name || "-"}</td>
                    <td className="px-6 py-4 text-gray-500 text-sm max-w-xs truncate">{industry.description || "-"}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEditModal(industry)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit Industry">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => deleteIndustry(industry.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete Industry">
                          <Trash2 className="w-4 h-4" />
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

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl p-6 relative flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-2xl font-bold text-gray-900 mb-6 shrink-0">{editingIndustry ? "Edit Industry" : "Add New Industry"}</h2>
            
            <form onSubmit={handleSubmit} className="flex flex-col overflow-hidden h-full">
              <div className="overflow-y-auto pr-2 space-y-6 flex-1 custom-scrollbar pb-6">
                
                {/* Image Upload */}
                <div className="relative w-full h-40 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden bg-gray-50 group hover:border-blue-500 transition-colors">
                  {isUploading ? (
                    <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                  ) : formData.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={formData.image_url} alt="Cover Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center">
                      <ImageIcon className="w-10 h-10 text-gray-400 group-hover:text-blue-500 transition-colors" />
                      <span className="text-sm text-gray-500 mt-2 font-medium">Upload Showcase Image (Max 2MB)</span>
                    </div>
                  )}
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Industry Name</label>
                    <input required type="text" value={formData.name} onChange={handleNameChange} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900" placeholder="e.g. FinTech & Banking" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Slug URL</label>
                    <input required type="text" value={formData.slug} onChange={(e) => setFormData({...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')})} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-gray-50 font-mono text-sm" placeholder="e.g. fintech-banking" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Lucide Icon Name</label>
                  <input required type="text" value={formData.icon_name} onChange={(e) => setFormData({...formData, icon_name: e.target.value})} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 font-mono text-sm" placeholder="e.g. Building2, HeartPulse" />
                  <p className="text-xs text-gray-500 mt-1">Must be a valid Lucide icon component name.</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Short Description</label>
                  <textarea rows={3} value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 resize-none" placeholder="Short description for the showcase..." />
                </div>

                <div className="bg-gray-50 -mx-6 px-6 py-4 border-y border-gray-200">
                  <label className="block text-sm font-bold text-gray-900 mb-3">Key Stats (Max 3)</label>
                  <div className="space-y-3">
                    {[0, 1, 2].map(index => (
                      <input 
                        key={index}
                        type="text" 
                        value={stats[index]} 
                        onChange={(e) => handleStatChange(index, e.target.value)} 
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900" 
                        placeholder={`Stat ${index + 1} (e.g. Bank-grade Security)`} 
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-5 pb-2 shrink-0 flex justify-end gap-3 border-t border-gray-100 mt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors">Cancel</button>
                <button type="submit" disabled={isSubmitting || isUploading} className="px-6 py-2.5 text-white bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors disabled:opacity-50">
                  {isSubmitting ? "Saving..." : (editingIndustry ? "Save Changes" : "Create Industry")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
