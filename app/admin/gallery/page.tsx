"use client";

import React, { useEffect, useState, useCallback } from "react";
import { FiSave, FiCalendar, FiAward, FiShield, FiGlobe, FiImage, FiPlus, FiTrash, FiEdit, FiX, FiGrid, FiAlertCircle } from "react-icons/fi";
import { createClient } from "@supabase/supabase-js";
import toast, { Toaster } from "react-hot-toast";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type GalleryCategory = 'Events' | 'Achievements' | 'Sports' | 'Cultural' | 'Other';

interface GalleryItem {
  id: string;
  image_urls: string[];
  album_title: string;
  category: GalleryCategory;
  uploaded_at: string;
  event_date: string;
  description: string;
}

// --- SUB-COMPONENT: AUTO-SCROLLING MEDIA ---
const AutoMediaPreview = ({ urls }: { urls: string[] }) => {
  const [index, setIndex] = useState(0);
  const isVideo = (url: string) => /\.(mp4|webm|ogg|mov|m4v)$/i.test(url);

  useEffect(() => {
    if (urls.length <= 1) return;
    const currentIsVideo = isVideo(urls[index]);
    const timer = setTimeout(() => {
      setIndex((prev) => (prev + 1) % urls.length);
    }, currentIsVideo ? 5000 : 3000);
    return () => clearTimeout(timer);
  }, [index, urls]);

  if (!urls.length) return <div className="w-full h-full bg-slate-200 dark:bg-slate-800" />;

  return (
    <div className="relative w-full h-full overflow-hidden">
      {isVideo(urls[index]) ? (
        <video key={urls[index]} src={urls[index]} className="w-full h-full object-cover" autoPlay muted loop playsInline />
      ) : (
        <img key={urls[index]} src={urls[index]} className="w-full h-full object-cover transition-opacity duration-1000" alt="Gallery Content" />
      )}
      <div className="absolute bottom-2 right-2 flex gap-1">
        {urls.map((_, i) => (
          <div key={i} className={`h-1 w-3 rounded-full ${i === index ? 'bg-white' : 'bg-white/30'}`} />
        ))}
      </div>
    </div>
  );
};

export default function GalleryPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [filter, setFilter] = useState<GalleryCategory | 'All'>('All');
  const [editingItem, setEditingItem] = useState<GalleryItem | null>(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState<GalleryItem | null>(null);

  const [formData, setFormData] = useState({
    album_title: "",
    category: "Events" as GalleryCategory,
    event_date: "",
    description: "",
  });
  const [files, setFiles] = useState<File[]>([]);
  const [existingUrls, setExistingUrls] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const fetchGallery = useCallback(async () => {
    try {
      const { data, error } = await supabase.from("gallery").select("*").order("uploaded_at", { ascending: false });
      if (error) throw error;
      setGalleryItems(data || []);
    } catch (err) {
      toast.error("Failed to load gallery");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchGallery(); }, [fetchGallery]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.album_title.trim()) newErrors.album_title = "Album title is required.";
    if (!formData.event_date) newErrors.event_date = "Event date is required.";
    if (!editingItem && files.length === 0) newErrors.files = "Upload at least one media file.";
    if (editingItem && existingUrls.length === 0 && files.length === 0) newErrors.files = "Album must have media.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    setSaving(true);
    try {
      let finalUrls = [...existingUrls];

      if (files.length > 0) {
        for (const file of files) {
          const fileExt = file.name.split('.').pop();
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
          const { error: uploadError } = await supabase.storage.from('gallery-assets').upload(fileName, file);
          if (uploadError) throw uploadError;
          const { data: urlData } = supabase.storage.from('gallery-assets').getPublicUrl(fileName);
          finalUrls.push(urlData.publicUrl);
        }
      }

      const payload = { ...formData, image_urls: finalUrls };
      const { error } = editingItem
        ? await supabase.from("gallery").update(payload).eq("id", editingItem.id)
        : await supabase.from("gallery").insert(payload);

      if (error) throw error;
      toast.success(editingItem ? "Album updated" : "Album created");
      setShowFormModal(false);
      resetForm();
      fetchGallery();
    } catch (err) {
      toast.error("Error saving media");
    } finally {
      setSaving(false);
    }
  };

  const removeExistingMedia = (urlToRemove: string) => {
    setExistingUrls(existingUrls.filter(url => url !== urlToRemove));
  };

  const handleDeleteAlbum = async () => {
    if (!showDeleteModal) return;
    const loadingToast = toast.loading("Deleting album...");
    try {
      for (const url of showDeleteModal.image_urls) {
        const fileName = url.split('/').pop();
        if (fileName) await supabase.storage.from('gallery-assets').remove([fileName]);
      }
      const { error } = await supabase.from("gallery").delete().eq("id", showDeleteModal.id);
      if (error) throw error;
      toast.success("Album deleted", { id: loadingToast });
      setShowDeleteModal(null);
      fetchGallery();
    } catch (err) {
      toast.error("Failed to delete album", { id: loadingToast });
    }
  };

  const resetForm = () => {
    setFormData({ album_title: "", category: "Events", event_date: "", description: "" });
    setFiles([]);
    setExistingUrls([]);
    setErrors({});
    setEditingItem(null);
  };

  const openFormModal = (item?: GalleryItem) => {
    if (item) {
      setEditingItem(item);
      setExistingUrls(item.image_urls);
      setFormData({
        album_title: item.album_title,
        category: item.category,
        event_date: item.event_date,
        description: item.description,
      });
    } else {
      resetForm();
    }
    setShowFormModal(true);
  };

  const categoryCounts = galleryItems.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const filteredItems = filter === 'All' ? galleryItems : galleryItems.filter(i => i.category === filter);

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
      <div className="w-10 h-10 border-4 border-brand-soft border-t-brand-light rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      <div className="max-w-8xl mx-auto mt-4 sm:mt-10 px-4 sm:px-6 lg:px-8 py-4 space-y-6 sm:space-y-8 animate-in fade-in duration-500">
        <Toaster position="top-right" />

        {/* HEADER */}
        <header className="flex flex-col sm:flex-row items-center justify-between bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-6 py-4 sm:px-8 sm:py-6 rounded-[1.5rem] sm:rounded-[2rem] border border-brand-accent dark:border-slate-800 shadow-sm gap-4">
          <div className="flex items-center gap-4 self-start sm:self-center">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-brand-accent text-brand-light rounded-xl sm:rounded-2xl flex items-center justify-center shadow-inner">
              <FiShield size={20} />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-black text-slate-800 dark:text-white tracking-tight uppercase leading-none">Media Registry</h1>
              <p className="text-[9px] sm:text-[10px] font-bold text-brand-light tracking-[0.2em] uppercase mt-1">Digital Asset Archive</p>
            </div>
          </div>
          <button
            onClick={() => openFormModal()}
            className="w-full sm:w-auto bg-brand-light hover:bg-brand text-white px-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-black text-[10px] sm:text-[11px] uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-brand-accent/50"
          >
            <FiPlus size={18} className="inline mr-2" /> New Entry
          </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
          {/* SIDEBAR */}
          <aside className="lg:col-span-3 lg:sticky lg:top-24 z-20">
            <div className="bg-white dark:bg-slate-900 p-4 sm:p-8 rounded-[1.5rem] sm:rounded-[2.5rem] border border-brand-accent dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="flex items-center gap-2 mb-4 sm:mb-6">
                <div className="w-1.5 h-4 bg-brand-light rounded-full" />
                <p className="text-[10px] font-black text-brand-light uppercase tracking-[0.2em]">Classification</p>
              </div>
              <div className="flex lg:flex-col gap-2 overflow-x-auto pb-2 lg:pb-0 no-scrollbar">
                {['All', 'Events', 'Achievements', 'Sports', 'Cultural'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setFilter(cat as any)}
                    className={`flex-shrink-0 lg:w-full flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 rounded-xl sm:rounded-2xl transition-all duration-300 ${filter === cat
                      ? 'bg-brand-light text-white shadow-lg shadow-brand-light/20'
                      : 'text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-600 border border-transparent'
                      }`}
                  >
                    <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest mr-4 lg:mr-0">{cat}</span>
                    <span className={`text-[9px] px-2 py-0.5 rounded-lg font-bold ${filter === cat ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                      {cat === 'All' ? galleryItems.length : (categoryCounts[cat] || 0)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* MAIN CONTENT */}
          <main className="lg:col-span-9">
            {filteredItems.length === 0 ? (
              <div className="bg-slate-50 dark:bg-slate-900/50 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2rem] py-20 text-center text-slate-400 px-6">
                <FiGrid size={48} className="mx-auto mb-4 opacity-10" />
                <p className="font-black uppercase text-xs tracking-widest">No Records in Registry</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredItems.map((item) => (
                  <div key={item.id} className="group bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-[1.8rem] border border-brand-accent dark:border-slate-800 shadow-lg hover:shadow-2xl transition-all duration-500">
                    <div className="relative aspect-video rounded-[1.4rem] overflow-hidden mb-6 border border-brand-accent dark:border-slate-800 bg-slate-100 dark:bg-slate-800">
                      <AutoMediaPreview urls={item.image_urls} />
                      <div className="absolute bottom-3 right-3 sm:inset-0 sm:bg-brand-dark/60 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-300 flex sm:items-center sm:justify-center gap-2 sm:backdrop-blur-sm">
                        <button onClick={() => openFormModal(item)} className="p-3 bg-white dark:bg-slate-800 rounded-xl text-brand-dark dark:text-white hover:scale-110 transition-transform shadow-xl"><FiEdit size={16} /></button>
                        <button onClick={() => setShowDeleteModal(item)} className="p-3 bg-white dark:bg-slate-800 rounded-xl text-red-500 hover:scale-110 transition-transform shadow-xl"><FiTrash size={16} /></button>
                      </div>
                      <div className="absolute top-4 left-4">
                        <span className="px-3 py-1 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md text-[9px] font-black uppercase rounded-lg text-brand-dark dark:text-white shadow-sm border border-brand-accent dark:border-slate-700">{item.category}</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-brand-soft text-brand-light rounded-xl flex-shrink-0 flex items-center justify-center shadow-inner border border-brand-accent dark:border-slate-800"><FiImage size={18} /></div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight truncate leading-tight">{item.album_title}</h3>
                        <div className="flex items-center gap-2 mt-2">
                          <FiCalendar className="text-brand-light" size={12} />
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.event_date}</span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-brand-soft dark:border-slate-800">
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed line-clamp-2 italic">"{item.description || 'No description provided.'}"</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </main>
        </div>

        {/* DELETE CONFIRMATION MODAL */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-brand-dark/80 backdrop-blur-sm flex items-center justify-center z-[110] p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] max-w-sm w-full shadow-2xl border border-red-100 dark:border-red-900/30 text-center">
              <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6"><FiAlertCircle size={32} /></div>
              <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight mb-2">Delete Album?</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 font-medium">This action is permanent and will remove all media from the archive.</p>
              <div className="flex gap-3">
                <button onClick={() => setShowDeleteModal(null)} className="flex-1 px-6 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Cancel</button>
                <button onClick={handleDeleteAlbum} className="flex-1 px-6 py-4 rounded-xl bg-red-500 text-white font-black text-[10px] uppercase tracking-widest hover:bg-red-600 transition-colors shadow-lg shadow-red-500/30">Delete Now</button>
              </div>
            </div>
          </div>
        )}

        {/* FORM MODAL */}
        {showFormModal && (
          <div className="fixed inset-0 bg-brand-dark/60 dark:bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center z-[100] p-0 sm:p-4 animate-in fade-in duration-300">
            <div className="bg-white dark:bg-slate-900 rounded-t-[2.5rem] sm:rounded-[3.5rem] w-full max-w-5xl h-[95vh] sm:h-auto sm:max-h-[92vh] overflow-hidden shadow-2xl flex flex-col animate-in slide-in-from-bottom sm:zoom-in-95 duration-300">
              <div className="px-6 py-6 sm:px-10 sm:py-8 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900 sticky top-0 z-10">
                <div className="flex items-center gap-4">
                  <div className="hidden sm:flex w-12 h-12 bg-brand-soft-bg dark:bg-slate-800 text-brand-light rounded-2xl items-center justify-center border border-brand-soft dark:border-slate-700">
                    {editingItem ? <FiEdit size={22} /> : <FiPlus size={22} />}
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white tracking-tight">{editingItem ? "Edit Album" : "New Album"}</h2>
                    <p className="text-[9px] sm:text-[10px] font-black text-brand-light uppercase tracking-[0.2em]">Registry Asset Manager</p>
                  </div>
                </div>
                <button onClick={() => setShowFormModal(false)} className="p-3 bg-slate-50 dark:bg-slate-800 text-slate-400 rounded-2xl"><FiX size={24} /></button>
              </div>

              <div className="overflow-y-auto flex-1 bg-white dark:bg-slate-900">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
                  <div className="lg:col-span-7 p-6 sm:p-10 space-y-6 sm:space-y-8">
                    <FormItem label="Album Title" icon={<FiGlobe />} error={errors.album_title}>
                      <input value={formData.album_title} onChange={e => setFormData({ ...formData, album_title: e.target.value })} className="form-input-v2 dark:bg-slate-800 dark:text-white dark:border-slate-700" placeholder="Name your collection..." />
                    </FormItem>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <FormItem label="Category" icon={<FiAward />}>
                        <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value as any })} className="form-input-v2 dark:bg-slate-800 dark:text-white dark:border-slate-700 appearance-none">
                          <option value="Events">Events</option>
                          <option value="Achievements">Achievements</option>
                          <option value="Sports">Sports</option>
                          <option value="Cultural">Cultural</option>
                        </select>
                      </FormItem>
                      <FormItem label="Event Date" icon={<FiCalendar />} error={errors.event_date}>
                        <input type="date" value={formData.event_date} onChange={e => setFormData({ ...formData, event_date: e.target.value })} className="form-input-v2 dark:bg-slate-800 dark:text-white dark:border-slate-700" />
                      </FormItem>
                    </div>
                    <FormItem label="Album Description" error={errors.description}>
                      <textarea rows={3} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="form-input-v2 dark:bg-slate-800 dark:text-white dark:border-slate-700 resize-none pt-4" placeholder="Share the story..." />
                    </FormItem>
                  </div>

                  <div className="lg:col-span-5 p-6 sm:p-10 bg-slate-50/50 dark:bg-slate-950/20 border-t lg:border-t-0 lg:border-l border-slate-100 dark:border-slate-800 space-y-6">
                    <label htmlFor="file-upload" className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2rem] bg-white dark:bg-slate-900 cursor-pointer">
                      <FiPlus size={24} className="text-brand-light mb-2" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Upload Media</span>
                      <input type="file" multiple accept="image/*,video/*" onChange={e => e.target.files && setFiles([...files, ...Array.from(e.target.files)])} className="hidden" id="file-upload" />
                    </label>

                    <div className="grid grid-cols-3 gap-3">
                      {existingUrls.map((url, idx) => (
                        <div key={idx} className="aspect-square rounded-2xl bg-slate-200 dark:bg-slate-800 overflow-hidden relative group">
                          <img src={url} className="w-full h-full object-cover" />
                          <button onClick={() => removeExistingMedia(url)} className="absolute inset-0 bg-red-500/60 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"><FiTrash /></button>
                        </div>
                      ))}
                      {files.map((file, idx) => (
                        <div key={idx} className="aspect-square rounded-2xl bg-brand-soft-bg overflow-hidden relative border">
                          <img
                            src={URL.createObjectURL(file)}
                            className="w-full h-full object-cover"
                            onLoad={(e) => URL.revokeObjectURL((e.target as any).src)}
                          />
                          <button onClick={() => setFiles(files.filter((_, i) => i !== idx))} className="absolute top-1 right-1 p-1 bg-red-500 rounded-lg text-white">
                            <FiX size={10} />
                          </button>
                        </div>
                      ))}
                    </div>
                    {errors.files && <p className="text-red-500 text-[10px] font-bold mt-1 ml-1">{errors.files}</p>}
                  </div>
                </div>
              </div>

              <div className="px-6 py-6 sm:px-10 sm:py-8 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row justify-end items-center gap-4 sm:gap-6">
                <button onClick={() => setShowFormModal(false)} className="order-2 sm:order-1 text-[10px] font-black text-slate-400 uppercase tracking-widest">Discard</button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="order-1 sm:order-2 w-full sm:w-auto bg-brand-dark dark:bg-brand-light text-white px-10 py-4 sm:py-5 rounded-2xl sm:rounded-[2rem] font-black text-[10px] sm:text-xs uppercase tracking-widest flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {saving ? "Publishing..." : "Save Album"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .form-input-v2 {
          width: 100%;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          padding: 1.25rem 1.5rem;
          border-radius: 1.5rem;
          font-weight: 700;
          font-size: 13px;
          outline: none;
          transition: all 0.2s;
        }
        .form-input-v2:focus { border-color: #3b82f6; background: #fff; box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1); }
        .dark .form-input-v2 { background: #1e293b; border-color: #334155; }
        .dark .form-input-v2:focus { background: #0f172a; border-color: #3b82f6; }
      `}</style>
    </div>
  );
}

function FormItem({ label, children, icon, error }: { label: string; children: React.ReactNode; icon?: React.ReactNode; error?: string; }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 ml-1">
        {icon && <span className="text-brand-light">{icon}</span>}
        <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">{label}</label>
      </div>
      {children}
      {error && <p className="text-red-500 text-[10px] font-bold mt-1 ml-1">{error}</p>}
    </div>
  );
}