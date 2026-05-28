"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Upload, Loader2, Image as ImageIcon } from "lucide-react";
import Link from "next/link";
import { CaseStudy } from "@/components/CaseStudyTable";
import { createClient } from "@/utils/supabase/client";

const PREDEFINED_THEMES = [
  { name: 'Emerald', gradient: 'from-emerald-500/10 via-teal-500/5 to-transparent', accentColor: 'text-emerald-500' }
];

interface CaseStudyFormProps {
  initialData?: CaseStudy;
  isEdit?: boolean;
}

export default function CaseStudyForm({ initialData, isEdit = false }: CaseStudyFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(initialData?.image || null);
  
  const [formData, setFormData] = useState({
    tag: initialData?.tag || "",
    title: initialData?.title || "",
    description: initialData?.description || "",
    gradient: initialData?.gradient || "from-emerald-500/10 via-teal-500/5 to-transparent",
    accentColor: initialData?.accentColor || "text-emerald-500",
    image: initialData?.image || "",
    is_published: initialData?.is_published ?? true,
  });
  
  const [metrics, setMetrics] = useState([
    { label: initialData?.metrics?.[0]?.label || "Adoption", value: initialData?.metrics?.[0]?.value || "" },
    { label: initialData?.metrics?.[1]?.label || "Compliance", value: initialData?.metrics?.[1]?.value || "" },
    { label: initialData?.metrics?.[2]?.label || "Uptime", value: initialData?.metrics?.[2]?.value || "" },
  ]);
  
  const [techStack, setTechStack] = useState(initialData?.tech.join(", ") || "");

  const handleMetricChange = (index: number, field: 'label' | 'value', value: string) => {
    const newMetrics = [...metrics];
    newMetrics[index][field] = value;
    setMetrics(newMetrics);
  };

  const convertToWebP = (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            reject(new Error("Canvas context is null"));
            return;
          }
          ctx.drawImage(img, 0, 0);
          canvas.toBlob((blob) => {
            if (!blob) {
              reject(new Error("Canvas to Blob failed"));
              return;
            }
            const webpFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".webp", {
              type: "image/webp",
            });
            resolve(webpFile);
          }, "image/webp", 0.8);
        };
        img.onerror = () => reject(new Error("Image load failed"));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error("File read failed"));
      reader.readAsDataURL(file);
    });
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      if (file.size > 2 * 1024 * 1024) {
        alert("Image size exceeds 2MB. Please select a smaller file.");
        e.target.value = '';
        return;
      }

      try {
        setIsConverting(true);
        const webpFile = await convertToWebP(file);
        setImageFile(webpFile);
        setImagePreview(URL.createObjectURL(webpFile));
      } catch (error) {
        console.error("Failed to convert image:", error);
        alert("Failed to process image. Please try another one.");
      } finally {
        setIsConverting(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Clean up metrics
    const validMetrics = metrics.filter(m => m.label && m.value);
    
    // Clean up tech stack
    const parsedTech = techStack.split(",").map(t => t.trim()).filter(Boolean);

    let finalImageUrl = formData.image;
    
    if (imageFile) {
      try {
        const supabase = createClient();
        const fileName = `${Date.now()}_${imageFile.name}`;
        
        const { error: uploadError } = await supabase.storage
          .from("case_studies")
          .upload(fileName, imageFile, {
            contentType: "image/webp",
            upsert: false,
          });

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
          .from("case_studies")
          .getPublicUrl(fileName);
          
        finalImageUrl = data.publicUrl;
      } catch (error) {
        console.error("Image upload error:", error);
        alert("Failed to upload image. Make sure the 'case_studies' bucket exists and is public.");
        setIsSubmitting(false);
        return;
      }
    }

    const payload = {
      ...formData,
      image: finalImageUrl,
      metrics: validMetrics,
      tech: parsedTech
    };

    try {
      const url = isEdit && initialData ? `/api/case-studies/${initialData.id}` : "/api/case-studies";
      const method = isEdit ? "PUT" : "POST";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to save case study");
      }
      
      router.push("/case-studies");
      router.refresh();
    } catch (error: any) {
      console.error(error);
      alert(`Error: ${error.message}`);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 p-8 overflow-y-auto bg-gray-50/50">
      <div className="max-w-4xl mx-auto space-y-8">
        <header>
          <Link href="/case-studies" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors mb-4">
            <ArrowLeft className="w-4 h-4" />
            Back to Case Studies
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
            {isEdit ? "Edit Case Study" : "Create New Case Study"}
          </h1>
          <p className="text-gray-500 mt-2">
            {isEdit ? "Update the details of your case study." : "Add a new project to your portfolio."}
          </p>
        </header>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                <input 
                  required 
                  type="text" 
                  value={formData.title} 
                  onChange={e => setFormData({...formData, title: e.target.value})} 
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-shadow" 
                  placeholder="e.g. Fintech Nexus" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tag</label>
                <input 
                  required 
                  type="text" 
                  value={formData.tag} 
                  onChange={e => setFormData({...formData, tag: e.target.value})} 
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-shadow" 
                  placeholder="e.g. SaaS Platform" 
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea 
                required 
                rows={4}
                value={formData.description} 
                onChange={e => setFormData({...formData, description: e.target.value})} 
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none resize-none transition-shadow" 
                placeholder="Detailed description of the case study..." 
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Project Image</label>
              
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:bg-gray-50 transition-colors relative overflow-hidden group">
                <div className="space-y-2 text-center relative z-10 bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-gray-100 shadow-sm transition-all group-hover:bg-white">
                  {isConverting ? (
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                      <p className="text-sm text-gray-500 font-medium">Optimizing image (WebP)...</p>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-center">
                        {imagePreview ? (
                          <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-gray-200 shadow-sm">
                            <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center">
                            <ImageIcon className="w-8 h-8" />
                          </div>
                        )}
                      </div>
                      <div className="flex text-sm text-gray-600 justify-center">
                        <label
                          htmlFor="file-upload"
                          className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none"
                        >
                          <span>{imagePreview ? "Change Image" : "Upload an image"}</span>
                          <input id="file-upload" name="file-upload" type="file" className="sr-only" accept="image/*" onChange={handleImageChange} />
                        </label>
                        {!imagePreview && <p className="pl-1">or drag and drop</p>}
                      </div>
                      <p className="text-xs text-gray-500">
                        PNG, JPG, up to 2MB. Will be auto-converted to WebP.
                      </p>
                    </>
                  )}
                </div>
                {imagePreview && (
                  <img src={imagePreview} alt="Background Preview" className="absolute inset-0 w-full h-full object-cover opacity-20 blur-sm scale-105" />
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tech Stack (comma separated)</label>
              <input 
                required 
                type="text" 
                value={techStack} 
                onChange={e => setTechStack(e.target.value)} 
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-shadow" 
                placeholder="Node.js, Kafka, PostgreSQL..." 
              />
            </div>

            <div className="bg-gray-50 -mx-8 px-8 py-6 border-y border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Metrics (Up to 3)</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {metrics.map((metric, index) => (
                  <div key={index} className="space-y-3 bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider">Label</label>
                      <input 
                        type="text" 
                        value={metric.label} 
                        onChange={e => handleMetricChange(index, 'label', e.target.value)} 
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none text-sm" 
                        placeholder="e.g. Adoption" 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider">Value</label>
                      <input 
                        type="text" 
                        value={metric.value} 
                        onChange={e => handleMetricChange(index, 'value', e.target.value)} 
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none text-sm font-bold" 
                        placeholder="e.g. 50k+" 
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Theme Color</label>
              <select
                value={PREDEFINED_THEMES.find(t => t.accentColor === formData.accentColor)?.name || "Emerald"}
                onChange={(e) => {
                  const selectedTheme = PREDEFINED_THEMES.find(t => t.name === e.target.value);
                  if (selectedTheme) {
                    setFormData(prev => ({
                      ...prev,
                      gradient: selectedTheme.gradient,
                      accentColor: selectedTheme.accentColor
                    }));
                  }
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-shadow bg-white"
              >
                {PREDEFINED_THEMES.map(theme => (
                  <option key={theme.name} value={theme.name}>
                    {theme.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-2">
                This sets the accent color and background gradient for the case study on the main website.
              </p>
            </div>

            <div className="flex items-center gap-3 p-4 bg-blue-50/50 rounded-lg border border-blue-100">
              <input 
                type="checkbox" 
                id="is_published"
                checked={formData.is_published}
                onChange={e => setFormData({...formData, is_published: e.target.checked})}
                className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-600"
              />
              <label htmlFor="is_published" className="text-sm font-medium text-gray-900 cursor-pointer select-none">
                Published (Visible on main website)
              </label>
            </div>
          </div>

          <div className="px-8 py-5 bg-gray-50 border-t border-gray-200 flex justify-end gap-4">
            <Link 
              href="/case-studies"
              className="px-6 py-2.5 text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg font-medium transition-colors shadow-sm"
            >
              Cancel
            </Link>
            <button 
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 text-white bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors shadow-sm flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Saving..." : (isEdit ? "Save Changes" : "Create Case Study")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
