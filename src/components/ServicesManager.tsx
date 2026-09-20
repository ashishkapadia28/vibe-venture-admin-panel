"use client";

import { useState } from "react";
import { Plus, Edit2, Trash2, X, Image as ImageIcon, Loader2, Eye, EyeOff } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

interface Service {
  id: string;
  title: string;
  description: string;
  image_url: string;
  is_active: boolean;
  created_at?: string;
}

export default function ServicesManager({ initialServices }: { initialServices: Service[] }) {
  const [services, setServices] = useState<Service[]>(initialServices);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    image_url: "",
    is_active: true,
  });

  const supabase = createClient();

  const fetchServices = async () => {
    const { data } = await supabase.from('services').select('*').order('created_at', { ascending: false });
    if (data) setServices(data);
  };

  const openAddModal = () => {
    setEditingService(null);
    setFormData({ title: "", description: "", image_url: "", is_active: true });
    setIsModalOpen(true);
  };

  const openEditModal = (service: Service) => {
    setEditingService(service);
    setFormData({
      title: service.title,
      description: service.description || "",
      image_url: service.image_url || "",
      is_active: service.is_active,
    });
    setIsModalOpen(true);
  };

  const deleteService = async (id: string) => {
    if (!confirm('Are you sure you want to delete this service?')) return;
    try {
      await supabase.from('services').delete().eq('id', id);
      fetchServices();
    } catch (error) {
      console.error("Error deleting service:", error);
    }
  };

  const toggleStatus = async (service: Service) => {
    try {
      await supabase.from('services').update({ is_active: !service.is_active }).eq('id', service.id);
      fetchServices();
    } catch (error) {
      console.error("Error toggling status:", error);
    }
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
      const fileName = `services/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '')}`;
      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(fileName, file);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      if (editingService) {
        await supabase.from('services').update(formData).eq('id', editingService.id);
      } else {
        await supabase.from('services').insert([formData]);
      }
      setIsModalOpen(false);
      fetchServices();
    } catch (error) {
      console.error("Error saving service:", error);
      alert("Failed to save service.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-2">Services</h1>
          <p className="text-gray-500">Manage the core services offered by your agency.</p>
        </div>
        <button
          onClick={openAddModal}
          className="btn btn-primary"
        >
          <Plus className="w-5 h-5" />
          Add New Service
        </button>
      </header>

      {/* Table */}
      <div className="panel hover-lift">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="thead-row">
                <th className="px-6 py-4 font-medium w-16">Icon</th>
                <th className="px-6 py-4 font-medium">Title</th>
                <th className="px-6 py-4 font-medium">Description</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {services.length === 0 ? (
                <tr><td colSpan={5} className="empty-state">No services found. Click &quot;Add New Service&quot; to create one.</td></tr>
              ) : (
                services.map((service) => (
                  <tr key={service.id} className="hover:bg-violet-50/30 transition-colors group">
                    <td className="px-6 py-4">
                      {service.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={service.image_url} alt={service.title} className="w-10 h-10 object-contain rounded-md bg-gray-50 border border-gray-100 p-1" />
                      ) : (
                        <div className="w-10 h-10 rounded-md bg-violet-50 text-violet-600 flex items-center justify-center font-bold">
                          {service.title.charAt(0)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-900 font-medium">{service.title}</td>
                    <td className="px-6 py-4 text-gray-500 text-sm max-w-md truncate">{service.description || "-"}</td>
                    <td className="px-6 py-4">
                      <span className={`badge ${service.is_active ? "badge-primary" : "badge-neutral"}`}>
                        {service.is_active ? "Active" : "Hidden"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => toggleStatus(service)} className="icon-btn" title={service.is_active ? "Hide Service" : "Show Service"}>
                          {service.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                        <button onClick={() => openEditModal(service)} className="icon-btn" title="Edit Service">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => deleteService(service.id)} className="icon-btn-danger" title="Delete Service">
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
        <div className="modal-overlay">
          <div className="modal-panel w-full max-w-md p-6 relative animate-in zoom-in-95 duration-200">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold text-gray-900 mb-6">{editingService ? "Edit Service" : "Add New Service"}</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex flex-col items-center gap-4 mb-6">
                <div className="relative w-full h-32 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden bg-gray-50 group hover:border-violet-500 transition-colors">
                  {isUploading ? (
                    <Loader2 className="w-6 h-6 text-violet-500 animate-spin" />
                  ) : formData.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={formData.image_url} alt="Preview" className="w-full h-full object-contain p-2" />
                  ) : (
                    <div className="flex flex-col items-center">
                      <ImageIcon className="w-8 h-8 text-gray-400 group-hover:text-violet-500 transition-colors" />
                      <span className="text-xs text-gray-500 mt-2">Upload Service Icon/Image</span>
                    </div>
                  )}
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input required type="text" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} className="input-field" placeholder="e.g. Custom Software Development" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea rows={3} value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="input-field resize-none" placeholder="Short description..." />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <input 
                  type="checkbox" 
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                  className="w-4 h-4 text-violet-600 rounded border-gray-300 focus:ring-violet-500"
                />
                <label htmlFor="is_active" className="text-sm text-gray-700 select-none cursor-pointer">
                  Service is active and visible
                </label>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" disabled={isSubmitting || isUploading} className="btn btn-primary">
                  {isSubmitting ? "Saving..." : (editingService ? "Save Changes" : "Create Service")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
