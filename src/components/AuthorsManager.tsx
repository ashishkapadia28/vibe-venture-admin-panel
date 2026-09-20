"use client";

import { useState } from "react";
import { Plus, Edit2, Trash2, X, Image as ImageIcon, Loader2 } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

interface Author {
  id: string;
  name: string;
  avatar_url: string;
  bio: string;
  created_at?: string;
}

export default function AuthorsManager({ initialAuthors }: { initialAuthors: Author[] }) {
  const [authors, setAuthors] = useState<Author[]>(initialAuthors);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAuthor, setEditingAuthor] = useState<Author | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    bio: "",
    avatar_url: "",
  });

  const supabase = createClient();

  const fetchAuthors = async () => {
    const { data } = await supabase.from('authors').select('*').order('created_at', { ascending: false });
    if (data) setAuthors(data);
  };

  const openAddModal = () => {
    setEditingAuthor(null);
    setFormData({ name: "", bio: "", avatar_url: "" });
    setIsModalOpen(true);
  };

  const openEditModal = (author: Author) => {
    setEditingAuthor(author);
    setFormData({
      name: author.name,
      bio: author.bio || "",
      avatar_url: author.avatar_url || "",
    });
    setIsModalOpen(true);
  };

  const deleteAuthor = async (id: string) => {
    if (!confirm('Are you sure you want to delete this author?')) return;
    try {
      await supabase.from('authors').delete().eq('id', id);
      fetchAuthors();
    } catch (error) {
      console.error("Error deleting author:", error);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    
    if (file.size > 2 * 1024 * 1024) {
      alert("Image size exceeds 2MB. Please select a smaller file.");
      return;
    }

    setIsUploading(true);
    try {
      const fileName = `authors/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '')}`;
      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('images').getPublicUrl(fileName);
      setFormData(prev => ({ ...prev, avatar_url: data.publicUrl }));
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
      if (editingAuthor) {
        await supabase.from('authors').update(formData).eq('id', editingAuthor.id);
      } else {
        await supabase.from('authors').insert([formData]);
      }
      setIsModalOpen(false);
      fetchAuthors();
    } catch (error) {
      console.error("Error saving author:", error);
      alert("Failed to save author.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-2">Authors</h1>
          <p className="text-gray-500">Manage blog authors and their profiles.</p>
        </div>
        <button
          onClick={openAddModal}
          className="btn btn-primary"
        >
          <Plus className="w-5 h-5" />
          Add New Author
        </button>
      </header>

      {/* Table */}
      <div className="panel hover-lift">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="thead-row">
                <th className="px-6 py-4 font-medium w-16">Avatar</th>
                <th className="px-6 py-4 font-medium">Name</th>
                <th className="px-6 py-4 font-medium">Bio</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {authors.length === 0 ? (
                <tr><td colSpan={4} className="empty-state">No authors found. Click &quot;Add New Author&quot; to create one.</td></tr>
              ) : (
                authors.map((author) => (
                  <tr key={author.id} className="hover:bg-violet-50/30 transition-colors group">
                    <td className="px-6 py-4">
                      {author.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={author.avatar_url} alt={author.name} className="w-10 h-10 rounded-full object-cover border border-gray-200" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-violet-50 text-violet-600 flex items-center justify-center font-bold">
                          {author.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-900 font-medium">{author.name}</td>
                    <td className="px-6 py-4 text-gray-500 text-sm max-w-md truncate">{author.bio || "No bio provided."}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEditModal(author)} className="icon-btn" title="Edit Author">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => deleteAuthor(author.id)} className="icon-btn-danger" title="Delete Author">
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
            <h2 className="text-xl font-bold text-gray-900 mb-6">{editingAuthor ? "Edit Author" : "Add New Author"}</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Avatar Upload */}
              <div className="flex flex-col items-center gap-4 mb-6">
                <div className="relative w-24 h-24 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden bg-gray-50 group hover:border-violet-500 transition-colors">
                  {isUploading ? (
                    <Loader2 className="w-6 h-6 text-violet-500 animate-spin" />
                  ) : formData.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={formData.avatar_url} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="w-8 h-8 text-gray-400 group-hover:text-violet-500 transition-colors" />
                  )}
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                </div>
                <p className="text-xs text-gray-500 text-center">Click or drag image to upload avatar<br/>(Max 2MB)</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Author Name</label>
                <input required type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="input-field" placeholder="e.g. John Doe" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                <textarea rows={3} value={formData.bio} onChange={(e) => setFormData({...formData, bio: e.target.value})} className="input-field resize-none" placeholder="Short biography..." />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" disabled={isSubmitting || isUploading} className="btn btn-primary">
                  {isSubmitting ? "Saving..." : (editingAuthor ? "Save Changes" : "Create Author")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
