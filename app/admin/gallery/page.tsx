"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { FiSave, FiCalendar, FiAward, FiShield, FiGlobe, FiImage, FiPlus, FiTrash, FiEdit, FiX, FiRefreshCw, FiPlayCircle, FiGrid, FiChevronRight, FiChevronLeft } from "react-icons/fi";
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

  if (!urls.length) return <div className="w-full h-full bg-slate-200" />;

  return (
    <div className="relative w-full h-full overflow-hidden">
      {isVideo(urls[index]) ? (
        <video
          key={urls[index]}
          src={urls[index]}
          className="w-full h-full object-cover"
          autoPlay muted loop playsInline
        />
      ) : (
        <img
          key={urls[index]}
          src={urls[index]}
          className="w-full h-full object-cover transition-opacity duration-1000"
          alt="Gallery Content"
        />
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
    try {
      for (const url of showDeleteModal.image_urls) {
        const fileName = url.split('/').pop();
        if (fileName) await supabase.storage.from('gallery-assets').remove([fileName]);
      }
      const { error } = await supabase.from("gallery").delete().eq("id", showDeleteModal.id);
      if (error) throw error;
      toast.success("Album deleted");
      setShowDeleteModal(null);
      fetchGallery();
    } catch (err) {
      toast.error("Failed to delete album");
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

  // Stats & Filtering
  const categoryCounts = galleryItems.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const filteredItems = filter === 'All'
    ? galleryItems
    : galleryItems.filter(i => i.category === filter);

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-slate-50">
      <div className="w-10 h-10 border-4 border-brand-soft border-t-brand-light rounded-full animate-spin" />
    </div>
  );

 return (
    <div className="max-w-7xl mx-auto mt-4 sm:mt-10 px-4 sm:px-6 lg:px-8 py-4 space-y-6 sm:space-y-8 animate-in fade-in duration-500">
      <Toaster position="top-right" />

      {/* HEADER - Registry Style */}
      <header className="flex flex-col sm:flex-row items-center justify-between bg-white/80 backdrop-blur-md px-6 py-4 sm:px-8 sm:py-6 rounded-[1.5rem] sm:rounded-[2rem] border border-brand-accent shadow-sm gap-4">
        <div className="flex items-center gap-4 self-start sm:self-center">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-brand-accent text-brand-light rounded-xl sm:rounded-2xl flex items-center justify-center shadow-inner">
            <FiShield size={20} />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-black text-slate-800 tracking-tight uppercase leading-none">Media Registry</h1>
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

      {/* STATS/METRICS SIDEBAR & MAIN CONTENT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">

        {/* TOP/SIDEBAR: Classification */}
        {/* On mobile, this becomes a horizontal scrollable menu */}
        <aside className="lg:col-span-3 lg:sticky lg:top-24 z-20">
          <div className="bg-white p-4 sm:p-8 rounded-[1.5rem] sm:rounded-[2.5rem] border border-brand-accent shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 mb-4 sm:mb-6">
              <div className="w-1.5 h-4 bg-brand-light rounded-full" />
              <p className="text-[10px] font-black text-brand-light uppercase tracking-[0.2em]">Classification</p>
            </div>

            <div className="flex lg:flex-col gap-2 overflow-x-auto pb-2 lg:pb-0 no-scrollbar">
              {['All', 'Events', 'Achievements', 'Sports', 'Cultural'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFilter(cat as any)}
                  className={`flex-shrink-0 lg:w-full flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 rounded-xl sm:rounded-2xl transition-all duration-300 group ${filter === cat
                    ? 'bg-brand-light text-white shadow-lg shadow-brand-light/20 translate-x-0 lg:translate-x-1'
                    : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600 border border-transparent'
                    }`}
                >
                  <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest mr-4 lg:mr-0">{cat}</span>
                  <span className={`text-[9px] px-2 py-0.5 rounded-lg font-bold ${filter === cat ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                    }`}>
                    {cat === 'All' ? galleryItems.length : (categoryCounts[cat] || 0)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* RIGHT MAIN CONTENT: The Items */}
        <main className="lg:col-span-9">
          {filteredItems.length === 0 ? (
            <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2rem] sm:rounded-[3rem] py-20 sm:py-32 text-center text-slate-400 px-6">
              <FiGrid size={48} className="mx-auto mb-4 opacity-10" />
              <p className="font-black uppercase text-xs tracking-widest">No Records in Registry</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredItems.map((item) => (
                <div key={item.id} className="group bg-white p-5 sm:p-6 rounded-[1.8rem] sm:rounded-[2.5rem] border border-brand-accent shadow-lg shadow-brand-accent/20 transition-all duration-500 hover:shadow-2xl">

                  {/* MEDIA BOX */}
                  <div className="relative aspect-video rounded-[1.4rem] sm:rounded-[1.8rem] overflow-hidden mb-6 border border-brand-accent bg-slate-100">
                    <AutoMediaPreview urls={item.image_urls} />

                    {/* ACTIONS: Always visible on mobile, hover on desktop */}
                    <div className="absolute bottom-3 right-3 sm:inset-0 sm:bg-brand-dark/60 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-300 flex sm:items-center sm:justify-center gap-2 sm:gap-3 sm:backdrop-blur-sm">
                      <button onClick={() => openFormModal(item)} className="p-3 sm:p-4 bg-white rounded-xl sm:rounded-2xl text-brand-dark hover:scale-110 transition-transform shadow-xl">
                        <FiEdit size={16} />
                      </button>
                      <button onClick={() => setShowDeleteModal(item)} className="p-3 sm:p-4 bg-white rounded-xl sm:rounded-2xl text-red-500 hover:scale-110 transition-transform shadow-xl">
                        <FiTrash size={16} />
                      </button>
                    </div>

                    <div className="absolute top-4 left-4">
                      <span className="px-3 py-1 bg-white/90 backdrop-blur-md text-[9px] font-black uppercase rounded-lg text-brand-dark shadow-sm border border-brand-accent">
                        {item.category}
                      </span>
                    </div>
                  </div>

                  {/* CONTENT INFO */}
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-brand-soft text-brand-light rounded-xl sm:rounded-2xl flex-shrink-0 flex items-center justify-center shadow-inner border border-brand-accent">
                      <FiImage size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight truncate leading-tight">
                        {item.album_title}
                      </h3>
                      <div className="flex items-center gap-2 mt-2">
                        <FiCalendar className="text-brand-light" size={12} />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          {item.event_date}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-brand-soft">
                    <p className="text-[11px] text-slate-500 font-medium leading-relaxed line-clamp-2 italic">
                      "{item.description || 'No description provided for this archive entry.'}"
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* FORM MODAL */}
      {showFormModal && (
        <div className="fixed inset-0 bg-brand-dark/60 backdrop-blur-md flex items-end sm:items-center justify-center z-[100] p-0 sm:p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-t-[2.5rem] sm:rounded-[3.5rem] w-full max-w-5xl h-[95vh] sm:h-auto sm:max-h-[92vh] overflow-hidden shadow-2xl flex flex-col animate-in slide-in-from-bottom sm:zoom-in-95 duration-300">

            {/* MODAL HEADER */}
            <div className="px-6 py-6 sm:px-10 sm:py-8 border-b border-slate-50 flex justify-between items-center bg-white sticky top-0 z-10">
              <div className="flex items-center gap-4">
                <div className="hidden sm:flex w-12 h-12 bg-brand-soft-bg text-brand-light rounded-2xl items-center justify-center border border-brand-soft">
                  {editingItem ? <FiEdit size={22} /> : <FiPlus size={22} />}
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
                    {editingItem ? "Edit Album" : "New Album"}
                  </h2>
                  <p className="text-[9px] sm:text-[10px] font-black text-brand-light uppercase tracking-[0.2em]">
                    Registry Asset Manager
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowFormModal(false)}
                className="p-3 bg-slate-50 text-slate-400 rounded-2xl"
              >
                <FiX size={24} />
              </button>
            </div>

            {/* MODAL BODY */}
            <div className="overflow-y-auto flex-1 bg-white">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
                {/* LEFT: INFO */}
                <div className="lg:col-span-7 p-6 sm:p-10 space-y-6 sm:space-y-8">
                  <FormItem label="Album Title" icon={<FiGlobe />} error={errors.album_title}>
                    <input
                      value={formData.album_title}
                      onChange={e => setFormData({ ...formData, album_title: e.target.value })}
                      className="form-input-v2"
                      placeholder="Name your collection..."
                    />
                  </FormItem>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <FormItem label="Category" icon={<FiAward />}>
                      <select
                        value={formData.category}
                        onChange={e => setFormData({ ...formData, category: e.target.value as any })}
                        className="form-input-v2 appearance-none"
                      >
                        <option value="Events">Events</option>
                        <option value="Achievements">Achievements</option>
                        <option value="Sports">Sports</option>
                        <option value="Cultural">Cultural</option>
                      </select>
                    </FormItem>
                    <FormItem label="Event Date" icon={<FiCalendar />} error={errors.event_date}>
                      <input
                        type="date"
                        value={formData.event_date}
                        onChange={e => setFormData({ ...formData, event_date: e.target.value })}
                        className="form-input-v2"
                      />
                    </FormItem>
                  </div>

                  <FormItem label="Album Description" error={errors.description}>
                    <textarea
                      rows={3}
                      value={formData.description}
                      onChange={e => setFormData({ ...formData, description: e.target.value })}
                      className="form-input-v2 resize-none pt-4"
                      placeholder="Share the story..."
                    />
                  </FormItem>
                </div>

                {/* RIGHT: ASSETS */}
                <div className="lg:col-span-5 p-6 sm:p-10 bg-slate-50/50 border-t lg:border-t-0 lg:border-l border-slate-100 space-y-6">
                  <label htmlFor="file-upload" className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-200 rounded-[2rem] bg-white cursor-pointer">
                    <FiPlus size={24} className="text-brand-light mb-2" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Upload Media</span>
                    <input type="file" multiple accept="image/*,video/*" onChange={e => e.target.files && setFiles([...files, ...Array.from(e.target.files)])} className="hidden" id="file-upload" />
                  </label>

                  <div className="grid grid-cols-3 gap-3">
                    {/* Simplified Preview Grid for brevity - keep your existing logic here */}
                    {existingUrls.map((url, idx) => (
                      <div key={idx} className="aspect-square rounded-2xl bg-slate-200 overflow-hidden relative">
                         <img src={url} className="w-full h-full object-cover" />
                         <button onClick={() => removeExistingMedia(url)} className="absolute inset-0 bg-red-500/40 flex items-center justify-center text-white"><FiTrash/></button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* MODAL FOOTER */}
            <div className="px-6 py-6 sm:px-10 sm:py-8 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row justify-end items-center gap-4 sm:gap-6">
              <button onClick={() => setShowFormModal(false)} className="order-2 sm:order-1 text-[10px] font-black text-slate-400 uppercase tracking-widest">Discard</button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="order-1 sm:order-2 w-full sm:w-auto bg-brand-dark text-white px-10 py-4 sm:py-5 rounded-2xl sm:rounded-[2rem] font-black text-[10px] sm:text-xs uppercase tracking-widest flex items-center justify-center gap-3"
              >
                {saving ? "Publishing..." : "Save Album"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Style overrides for Mobile Scroller */}
      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        
        @media (max-width: 640px) {
          .form-input-v2 {
            padding: 0.8rem 1rem;
            border-radius: 1rem;
            font-size: 10px;
          }
        }
      `}</style>
    </div>
  );
}

// Updated FormItem with 'icon' support
// Place this at the very bottom of your file
function FormItem({
  label,
  children,
  icon,
  error
}: {
  label: string;
  children: React.ReactNode;
  icon?: React.ReactNode; // This allows the icon prop to be optional
  error?: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 ml-1">
        {/* Only renders the icon if you actually provide one */}
        {icon && <span className="text-brand-light">{icon}</span>}
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
          {label}
        </label>
      </div>
      {children}
      {error && <p className="text-red-500 text-[10px] font-bold mt-1 ml-1">{error}</p>}
    </div>
  );
}