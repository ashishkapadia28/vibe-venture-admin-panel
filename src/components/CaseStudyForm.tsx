/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Upload, Loader2, Image as ImageIcon, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { CaseStudy } from "@/components/CaseStudyTable";
import { createClient } from "@/utils/supabase/client";
import { FastAverageColor } from "fast-average-color";

const PREDEFINED_THEMES = [
  { name: 'Red', gradient: 'from-red-500/10 via-rose-500/5 to-transparent', accentColor: 'text-red-500', hex: '#ef4444' },
  { name: 'Orange', gradient: 'from-orange-500/10 via-amber-500/5 to-transparent', accentColor: 'text-orange-500', hex: '#f97316' },
  { name: 'Amber', gradient: 'from-amber-500/10 via-yellow-500/5 to-transparent', accentColor: 'text-amber-500', hex: '#f59e0b' },
  { name: 'Yellow', gradient: 'from-yellow-500/10 via-amber-500/5 to-transparent', accentColor: 'text-yellow-500', hex: '#eab308' },
  { name: 'Lime', gradient: 'from-lime-500/10 via-green-500/5 to-transparent', accentColor: 'text-lime-500', hex: '#84cc16' },
  { name: 'Green', gradient: 'from-green-500/10 via-emerald-500/5 to-transparent', accentColor: 'text-green-500', hex: '#22c55e' },
  { name: 'Emerald', gradient: 'from-emerald-500/10 via-teal-500/5 to-transparent', accentColor: 'text-emerald-500', hex: '#10b981' },
  { name: 'Teal', gradient: 'from-teal-500/10 via-cyan-500/5 to-transparent', accentColor: 'text-teal-500', hex: '#14b8a6' },
  { name: 'Cyan', gradient: 'from-cyan-500/10 via-sky-500/5 to-transparent', accentColor: 'text-cyan-500', hex: '#06b6d4' },
  { name: 'Sky', gradient: 'from-sky-500/10 via-blue-500/5 to-transparent', accentColor: 'text-sky-500', hex: '#0ea5e9' },
  { name: 'Blue', gradient: 'from-blue-500/10 via-indigo-500/5 to-transparent', accentColor: 'text-blue-500', hex: '#3b82f6' },
  { name: 'Indigo', gradient: 'from-indigo-500/10 via-violet-500/5 to-transparent', accentColor: 'text-indigo-500', hex: '#6366f1' },
  { name: 'Violet', gradient: 'from-violet-500/10 via-purple-500/5 to-transparent', accentColor: 'text-violet-500', hex: '#8b5cf6' },
  { name: 'Purple', gradient: 'from-purple-500/10 via-fuchsia-500/5 to-transparent', accentColor: 'text-purple-500', hex: '#a855f7' },
  { name: 'Fuchsia', gradient: 'from-fuchsia-500/10 via-pink-500/5 to-transparent', accentColor: 'text-fuchsia-500', hex: '#d946ef' },
  { name: 'Pink', gradient: 'from-pink-500/10 via-rose-500/5 to-transparent', accentColor: 'text-pink-500', hex: '#ec4899' },
  { name: 'Rose', gradient: 'from-rose-500/10 via-red-500/5 to-transparent', accentColor: 'text-rose-500', hex: '#f43f5e' }
];

const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 };
};

const getClosestTheme = (r: number, g: number, b: number) => {
  let closestTheme = PREDEFINED_THEMES[6]; // default Emerald
  let minDistance = Infinity;

  for (const theme of PREDEFINED_THEMES) {
    const rgb = hexToRgb(theme.hex);
    const distance = Math.sqrt(
      Math.pow(r - rgb.r, 2) +
      Math.pow(g - rgb.g, 2) +
      Math.pow(b - rgb.b, 2)
    );

    if (distance < minDistance) {
      minDistance = distance;
      closestTheme = theme;
    }
  }

  return closestTheme;
};

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
    client: initialData?.client || "",
    overview: initialData?.overview || "",
    role: initialData?.role || "",
    timeline: initialData?.timeline || "",
    industry: initialData?.industry || "",
    challenge: initialData?.challenge || "",
    solution: initialData?.solution || "",
    impact: initialData?.impact || "",
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
  const [activeTab, setActiveTab] = useState('basic');

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
        const objectUrl = URL.createObjectURL(webpFile);
        setImagePreview(objectUrl);
        
        // Extract color and update theme automatically
        const fac = new FastAverageColor();
        fac.getColorAsync(objectUrl)
          .then(color => {
            const closest = getClosestTheme(color.value[0], color.value[1], color.value[2]);
            setFormData(prev => ({
              ...prev,
              gradient: closest.gradient,
              accentColor: closest.accentColor
            }));
          })
          .catch(e => {
            console.error("Color extraction failed:", e);
          });
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
      timeline: formData.timeline ? parseInt(formData.timeline.toString(), 10) : null,
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

        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
          {/* Tabs Navigation */}
          <div className="flex border-b border-gray-200 overflow-x-auto bg-gray-50/80">
            {[
              { id: 'basic', label: 'Basic Info' },
              { id: 'details', label: 'Detailed Content' },
              { id: 'media', label: 'Media & Styling' },
              { id: 'metrics', label: 'Metrics & Tech' },
            ].map((tab, idx) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-4 text-sm font-medium whitespace-nowrap transition-colors border-b-2 outline-none ${
                  activeTab === tab.id
                    ? "border-blue-600 text-blue-600 bg-white"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100/50"
                }`}
              >
                <span className={`mr-2 px-2 py-0.5 rounded-full text-xs ${activeTab === tab.id ? 'bg-blue-100 text-blue-600' : 'bg-gray-200 text-gray-500'}`}>{idx + 1}</span>
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-8">
            {activeTab === 'basic' && (
              <div className="space-y-8 animate-in fade-in duration-300">
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">Short Description (for the card)</label>
                  <textarea 
                    required 
                    rows={4}
                    value={formData.description} 
                    onChange={e => setFormData({...formData, description: e.target.value})} 
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none resize-none transition-shadow" 
                    placeholder="Short description for the case study card..." 
                  />
                </div>
              </div>
            )}

            {activeTab === 'details' && (
              <div className="space-y-8 animate-in fade-in duration-300">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Industry</label>
                    <input 
                      type="text" 
                      value={formData.industry} 
                      onChange={e => setFormData({...formData, industry: e.target.value})} 
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-shadow" 
                      placeholder="e.g. Global Finance" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Scope of Work</label>
                    <input 
                      type="text" 
                      value={formData.role} 
                      onChange={e => setFormData({...formData, role: e.target.value})} 
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-shadow" 
                      placeholder="e.g. Core Architecture" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Timeline (Number of Months)</label>
                    <input 
                      type="number" 
                      value={formData.timeline} 
                      onChange={e => setFormData({...formData, timeline: e.target.value})} 
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-shadow" 
                      placeholder="e.g. 8" 
                    />
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Project Overview</label>
                    <textarea 
                      rows={4}
                      value={formData.overview} 
                      onChange={e => setFormData({...formData, overview: e.target.value})} 
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none resize-none transition-shadow" 
                      placeholder="Detailed project overview..." 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">The Challenge</label>
                    <textarea 
                      rows={4}
                      value={formData.challenge} 
                      onChange={e => setFormData({...formData, challenge: e.target.value})} 
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none resize-none transition-shadow" 
                      placeholder="What was the challenge?..." 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">The Solution</label>
                    <textarea 
                      rows={4}
                      value={formData.solution} 
                      onChange={e => setFormData({...formData, solution: e.target.value})} 
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none resize-none transition-shadow" 
                      placeholder="How did you solve it?..." 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">The Impact</label>
                    <textarea 
                      rows={4}
                      value={formData.impact} 
                      onChange={e => setFormData({...formData, impact: e.target.value})} 
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none resize-none transition-shadow" 
                      placeholder="What was the final impact?..." 
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'media' && (
              <div className="space-y-8 animate-in fade-in duration-300">
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

                <div className="flex items-center gap-3 p-4 bg-blue-50/50 rounded-lg border border-blue-100 mt-4">
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
            )}

            {activeTab === 'metrics' && (
              <div className="space-y-8 animate-in fade-in duration-300">
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

                <div className="bg-gray-50/80 -mx-8 px-8 py-6 border-y border-gray-200">
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
              </div>
            )}
          </div>

          <div className="px-8 py-5 bg-gray-50/80 border-t border-gray-200 flex justify-between items-center gap-4">
            <div className="flex gap-2">
              {activeTab !== 'basic' && (
                <button
                  type="button"
                  onClick={() => {
                    const tabs = ['basic', 'details', 'media', 'metrics'];
                    setActiveTab(tabs[tabs.indexOf(activeTab) - 1]);
                  }}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg font-medium transition-colors shadow-sm flex items-center gap-2"
                >
                  <ChevronLeft className="w-4 h-4" /> Previous
                </button>
              )}
              {activeTab !== 'metrics' && (
                <button
                  type="button"
                  onClick={() => {
                    const tabs = ['basic', 'details', 'media', 'metrics'];
                    setActiveTab(tabs[tabs.indexOf(activeTab) + 1]);
                  }}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg font-medium transition-colors shadow-sm flex items-center gap-2"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
            
            <div className="flex gap-4">
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
          </div>
        </form>
      </div>
    </div>
  );
}
