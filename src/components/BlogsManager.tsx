"use client";

import { useState } from "react";
import { Plus, Edit2, Trash2, X, Image as ImageIcon, Loader2, Eye, EyeOff, Search } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

interface Blog {
  id: string;
  title: string;
  slug: string;
  content: string;
  image_url: string;
  author_id: string;
  industry_id: string;
  is_published: boolean;
  created_at?: string;
  author?: { name: string };
  industry?: { name: string };
}

interface DropdownItem {
  id: string;
  name: string;
}

export default function BlogsManager({ 
  initialBlogs, 
  authors, 
  industries 
}: { 
  initialBlogs: Blog[], 
  authors: DropdownItem[], 
  industries: DropdownItem[] 
}) {
  const [blogs, setBlogs] = useState<Blog[]>(initialBlogs);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBlog, setEditingBlog] = useState<Blog | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    content: "",
    image_url: "",
    author_id: "",
    industry_id: "",
    is_published: false,
  });

  const supabase = createClient();

  const fetchBlogs = async () => {
    const { data } = await supabase
      .from('blogs')
      .select(`*, author:authors(name), industry:industries(name)`)
      .order('created_at', { ascending: false });
    if (data) setBlogs(data);
  };

  const openAddModal = () => {
    setEditingBlog(null);
    setFormData({ 
      title: "", 
      slug: "", 
      content: "", 
      image_url: "", 
      author_id: authors[0]?.id || "", 
      industry_id: industries[0]?.id || "", 
      is_published: false 
    });
    setIsModalOpen(true);
  };

  const openEditModal = (blog: Blog) => {
    setEditingBlog(blog);
    setFormData({
      title: blog.title,
      slug: blog.slug,
      content: blog.content,
      image_url: blog.image_url || "",
      author_id: blog.author_id || "",
      industry_id: blog.industry_id || "",
      is_published: blog.is_published,
    });
    setIsModalOpen(true);
  };

  const deleteBlog = async (id: string) => {
    if (!confirm('Are you sure you want to delete this blog post?')) return;
    try {
      await supabase.from('blogs').delete().eq('id', id);
      fetchBlogs();
    } catch (error) {
      console.error("Error deleting blog:", error);
    }
  };

  const togglePublish = async (blog: Blog) => {
    try {
      await supabase.from('blogs').update({ is_published: !blog.is_published }).eq('id', blog.id);
      fetchBlogs();
    } catch (error) {
      console.error("Error toggling publish status:", error);
    }
  };

  const generateSlug = (title: string) => {
    return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    setFormData(prev => ({
      ...prev,
      title,
      slug: !editingBlog ? generateSlug(title) : prev.slug
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
      const fileName = `blogs/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '')}`;
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
      const payload = {
        ...formData,
        author_id: formData.author_id || null,
        industry_id: formData.industry_id || null
      };

      if (editingBlog) {
        await supabase.from('blogs').update(payload).eq('id', editingBlog.id);
      } else {
        await supabase.from('blogs').insert([payload]);
      }
      setIsModalOpen(false);
      fetchBlogs();
    } catch (error: any) {
      console.error("Error saving blog:", error);
      alert(error.message.includes('unique') ? "A blog with this slug already exists!" : "Failed to save blog.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredBlogs = blogs.filter(b => b.title.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-2">Blog Posts</h1>
          <p className="text-gray-500">Manage your company news and industry insights.</p>
        </div>
        <button 
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors shadow-sm whitespace-nowrap"
        >
          <Plus className="w-5 h-5" />
          Create New Post
        </button>
      </header>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input 
          type="text"
          placeholder="Search blog posts..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-gray-500 text-sm tracking-wider uppercase">
                <th className="px-6 py-4 font-medium w-16">Image</th>
                <th className="px-6 py-4 font-medium">Post Details</th>
                <th className="px-6 py-4 font-medium">Author & Category</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredBlogs.length === 0 ? (
                <tr><td colSpan={5} className="p-12 text-center text-gray-500">No blogs found.</td></tr>
              ) : (
                filteredBlogs.map((blog) => (
                  <tr key={blog.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-6 py-4">
                      {blog.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={blog.image_url} alt={blog.title} className="w-12 h-12 object-cover rounded-md border border-gray-200" />
                      ) : (
                        <div className="w-12 h-12 rounded-md bg-gray-100 text-gray-400 flex items-center justify-center">
                          <ImageIcon className="w-5 h-5" />
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-gray-900 font-medium line-clamp-1">{blog.title}</p>
                      <p className="text-gray-500 text-xs mt-1">/{blog.slug}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-900">{blog.author?.name || "Unknown Author"}</p>
                      <p className="text-xs text-gray-500 mt-1">{blog.industry?.name || "Uncategorized"}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 text-xs rounded-full font-medium ${blog.is_published ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                        {blog.is_published ? "Published" : "Draft"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => togglePublish(blog)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title={blog.is_published ? "Unpublish" : "Publish"}>
                          {blog.is_published ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                        <button onClick={() => openEditModal(blog)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit Blog">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => deleteBlog(blog.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete Blog">
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
          <div className="bg-white rounded-xl shadow-lg w-full max-w-4xl p-6 relative flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-2xl font-bold text-gray-900 mb-6 shrink-0">{editingBlog ? "Edit Blog Post" : "Create Blog Post"}</h2>
            
            <form onSubmit={handleSubmit} className="flex flex-col overflow-hidden h-full">
              <div className="overflow-y-auto pr-2 space-y-6 flex-1 custom-scrollbar pb-6">
                
                {/* Banner Upload */}
                <div className="relative w-full h-48 sm:h-64 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden bg-gray-50 group hover:border-blue-500 transition-colors">
                  {isUploading ? (
                    <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                  ) : formData.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={formData.image_url} alt="Cover Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center">
                      <ImageIcon className="w-10 h-10 text-gray-400 group-hover:text-blue-500 transition-colors" />
                      <span className="text-sm text-gray-500 mt-2 font-medium">Upload Cover Image (Max 2MB)</span>
                    </div>
                  )}
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                    <input required type="text" value={formData.title} onChange={handleTitleChange} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900" placeholder="e.g. The Future of Finance" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Slug URL</label>
                    <input required type="text" value={formData.slug} onChange={(e) => setFormData({...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')})} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-gray-50 font-mono text-sm" placeholder="e.g. the-future-of-finance" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Author</label>
                    <select value={formData.author_id} onChange={(e) => setFormData({...formData, author_id: e.target.value})} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white">
                      <option value="">Select Author...</option>
                      {authors.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Industry / Category</label>
                    <select value={formData.industry_id} onChange={(e) => setFormData({...formData, industry_id: e.target.value})} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white">
                      <option value="">Select Industry...</option>
                      {industries.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 flex items-center justify-between">
                    <span>Content (Markdown/HTML supported)</span>
                  </label>
                  <textarea required rows={12} value={formData.content} onChange={(e) => setFormData({...formData, content: e.target.value})} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 resize-none font-mono text-sm leading-relaxed" placeholder="Write your blog post content here..." />
                </div>

                <div className="flex items-center gap-3 p-4 bg-blue-50/50 rounded-lg border border-blue-100">
                  <input 
                    type="checkbox" 
                    id="is_published"
                    checked={formData.is_published}
                    onChange={(e) => setFormData({...formData, is_published: e.target.checked})}
                    className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  <div>
                    <label htmlFor="is_published" className="text-sm font-bold text-gray-900 select-none cursor-pointer">
                      Publish immediately
                    </label>
                    <p className="text-xs text-gray-500 mt-0.5">If unchecked, this post will be saved as a Draft.</p>
                  </div>
                </div>
              </div>

              <div className="pt-5 pb-2 shrink-0 flex justify-end gap-3 border-t border-gray-100 mt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors">Cancel</button>
                <button type="submit" disabled={isSubmitting || isUploading} className="px-6 py-2.5 text-white bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors disabled:opacity-50">
                  {isSubmitting ? "Saving..." : (editingBlog ? "Save Changes" : "Create Blog Post")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
