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
    <div className="max-w-7xl mx-auto mt-10 px-4 sm:px-6 lg:px-8 py-4 space-y-8 animate-in fade-in duration-500">
      <Toaster position="top-right" />

      {/* HEADER */}
      {/* HEADER - Registry Style */}
      <header className="flex items-center justify-between bg-white/80 backdrop-blur-md px-8 py-6 rounded-[2rem] border border-brand-accent shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-brand-accent text-brand-light rounded-2xl flex items-center justify-center shadow-inner">
            <FiShield size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-800 tracking-tight uppercase leading-none">Media Registry</h1>
            <p className="text-[10px] font-bold text-brand-light tracking-[0.2em] uppercase mt-1">Digital Asset Archive</p>
          </div>
        </div>
        <button
          onClick={() => openFormModal()}
          className="bg-brand-light hover:bg-brand text-white px-6 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-brand-accent/50">
          <FiPlus size={18} className="inline mr-2" /> New Entry
        </button>
      </header>

    {/* STATS/METRICS SIDEBAR & MAIN CONTENT */}
<div className="grid lg:grid-cols-12 gap-8 items-start">
  
  {/* LEFT SIDEBAR: Classification */}
  <aside className="lg:col-span-3 space-y-6 sticky top-24">
    <div className="bg-white p-8 rounded-[2.5rem] border border-brand-accent shadow-sm">
      <div className="flex items-center gap-2 mb-6">
        <div className="w-1.5 h-4 bg-brand-light rounded-full" />
        <p className="text-[10px] font-black text-brand-light uppercase tracking-[0.2em]">Classification</p>
      </div>
      
      <div className="space-y-2">
        {['All', 'Events', 'Achievements', 'Sports', 'Cultural'].map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat as any)}
            className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl transition-all duration-300 group ${
              filter === cat 
              ? 'bg-brand-light text-white shadow-lg shadow-brand-light/20 translate-x-1' 
              : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
            }`}
          >
            <span className="text-[10px] font-black uppercase tracking-widest">{cat}</span>
            <span className={`text-[9px] px-2 py-0.5 rounded-lg font-bold ${
              filter === cat ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
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
      <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-[3rem] py-32 text-center text-slate-400">
        <FiGrid size={48} className="mx-auto mb-4 opacity-10" />
        <p className="font-black uppercase text-xs tracking-widest">No Records in Registry</p>
      </div>
    ) : (
      <div className="grid md:grid-cols-3 gap-6">
        {filteredItems.map((item) => (
          <div key={item.id} className="group bg-white p-6 rounded-[2.5rem] border border-brand-accent shadow-lg shadow-brand-accent/20 transition-all duration-500 hover:shadow-2xl hover:-translate-y-1">
            
            {/* MEDIA BOX */}
            <div className="relative aspect-video rounded-[1.8rem] overflow-hidden mb-6 border border-brand-accent bg-slate-100">
              <AutoMediaPreview urls={item.image_urls} />
              
              {/* HOVER ACTIONS */}
              <div className="absolute inset-0 bg-brand-dark/60 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center gap-3 backdrop-blur-sm">
                <button onClick={() => openFormModal(item)} className="p-4 bg-white rounded-2xl text-brand-dark hover:scale-110 transition-transform shadow-xl">
                  <FiEdit size={18} />
                </button>
                <button onClick={() => setShowDeleteModal(item)} className="p-4 bg-white rounded-2xl text-red-500 hover:scale-110 transition-transform shadow-xl">
                  <FiTrash size={18} />
                </button>
              </div>

              {/* FLOATING TAG */}
              <div className="absolute top-4 left-4">
                <span className="px-3 py-1 bg-white/90 backdrop-blur-md text-[9px] font-black uppercase rounded-lg text-brand-dark shadow-sm border border-brand-accent">
                  {item.category}
                </span>
              </div>
            </div>

            {/* CONTENT INFO */}
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-brand-soft text-brand-light rounded-2xl flex-shrink-0 flex items-center justify-center shadow-inner border border-brand-accent">
                <FiImage size={20} />
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

            {/* DESCRIPTION DESCRIPTION */}
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
        <div className="fixed inset-0 bg-brand-dark/60 backdrop-blur-xl flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[3.5rem] w-full max-w-5xl max-h-[92vh] overflow-hidden shadow-[0_32px_64px_-15px_rgba(0,0,0,0.3)] flex flex-col animate-in zoom-in-95 duration-300">

            {/* MODAL HEADER */}
            <div className="px-10 py-8 border-b border-slate-50 flex justify-between items-center bg-white/80 backdrop-blur-md sticky top-0 z-10">
              <div className="flex items-center gap-5">
                <div className="w-12 h-12 bg-brand-soft-bg text-brand-light rounded-2xl flex items-center justify-center border border-brand-soft">
                  {editingItem ? <FiEdit size={22} /> : <FiPlus size={22} />}
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-800 tracking-tight">
                    {editingItem ? "Edit Album" : "Create New Album"}
                  </h2>
                  <p className="text-[10px] font-black text-brand-light uppercase tracking-[0.2em]">
                    Media Hub &bull; Asset Manager
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowFormModal(false)}
                className="p-3 bg-slate-50 text-slate-400 hover:text-brand-dark hover:bg-brand-soft-bg rounded-2xl transition-all active:scale-90"
              >
                <FiX size={24} />
              </button>
            </div>

            {/* MODAL BODY (SCROLLABLE) */}
            <div className="overflow-y-auto custom-scrollbar flex-1 bg-gradient-to-b from-white to-slate-50/50">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">

                {/* LEFT COLUMN: INFORMATION */}
                <div className="lg:col-span-7 p-10 space-y-8">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="h-px w-8 bg-brand-light/30"></span>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">General Information</span>
                  </div>

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
                        className="form-input-v2 appearance-none cursor-pointer"
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
                      rows={4}
                      value={formData.description}
                      onChange={e => setFormData({ ...formData, description: e.target.value })}
                      className="form-input-v2 resize-none pt-4"
                      placeholder="Share the story behind these moments..."
                    />
                  </FormItem>
                </div>

                {/* RIGHT COLUMN: ASSET MANAGER */}
                <div className="lg:col-span-5 p-10 bg-slate-50/50 border-l border-slate-100 space-y-8">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="h-px w-8 bg-brand-light/30"></span>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Media Assets</span>
                  </div>

                  {/* UPLOAD ZONE */}
                  <div className="relative group">
                    <input
                      type="file"
                      multiple
                      accept="image/*,video/*"
                      onChange={e => e.target.files && setFiles([...files, ...Array.from(e.target.files)])}
                      className="hidden"
                      id="file-upload"
                    />
                    <label
                      htmlFor="file-upload"
                      className="flex flex-col items-center justify-center p-10 border-2 border-dashed border-slate-200 rounded-[2.5rem] bg-white hover:border-brand-light hover:bg-brand-soft-bg/30 transition-all cursor-pointer group"
                    >
                      <div className="w-14 h-14 bg-slate-50 text-slate-400 group-hover:bg-brand-light group-hover:text-white rounded-2xl flex items-center justify-center transition-all mb-4 shadow-sm">
                        <FiPlus size={28} />
                      </div>
                      <span className="text-xs font-black text-slate-500 uppercase tracking-widest group-hover:text-brand-dark">Upload Media</span>
                      <span className="text-[10px] font-bold text-slate-300 uppercase mt-1">Images or Videos</span>
                    </label>
                  </div>

                  {/* PREVIEW GRID */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Live Preview ({existingUrls.length + files.length})
                      </p>
                      {errors.files && <span className="text-[9px] font-bold text-red-500 uppercase">{errors.files}</span>}
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      {/* Existing Cloud Media */}
                      {existingUrls.map((url, idx) => (
                        <div key={`cloud-${idx}`} className="group relative aspect-square rounded-[1.5rem] overflow-hidden shadow-sm border border-white">
                          {/\.(mp4|webm|mov)$/i.test(url) ? (
                            <div className="w-full h-full bg-brand-dark flex items-center justify-center text-white"><FiPlayCircle size={24} /></div>
                          ) : (
                            <img src={url} className="w-full h-full object-cover" alt="Cloud Asset" />
                          )}
                          <button
                            onClick={() => removeExistingMedia(url)}
                            className="absolute inset-0 bg-red-500/80 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-all backdrop-blur-sm"
                          >
                            <FiTrash size={20} />
                          </button>
                          <div className="absolute top-2 right-2 w-2 h-2 bg-green-500 rounded-full border-2 border-white"></div>
                        </div>
                      ))}

                      {/* New Pending Media */}
                      {files.map((file, idx) => (
                        <div key={`new-${idx}`} className="group relative aspect-square rounded-[1.5rem] overflow-hidden shadow-sm border-2 border-brand-light/20">
                          {file.type.startsWith('video/') ? (
                            <div className="w-full h-full bg-slate-100 flex items-center justify-center text-brand-light"><FiPlayCircle size={24} /></div>
                          ) : (
                            <img src={URL.createObjectURL(file)} className="w-full h-full object-cover opacity-80" alt="New Asset" />
                          )}
                          <button
                            onClick={() => setFiles(files.filter((_, i) => i !== idx))}
                            className="absolute inset-0 bg-slate-800/80 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-all"
                          >
                            <FiX size={20} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* MODAL FOOTER */}
            <div className="px-10 py-8 bg-slate-50/80 backdrop-blur-md border-t border-slate-100 flex justify-end items-center gap-6">
              <button
                onClick={() => setShowFormModal(false)}
                className="text-xs font-black text-slate-400 hover:text-slate-600 uppercase tracking-[0.2em] transition-colors"
              >
                Discard Changes
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-brand-dark text-white px-10 py-5 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-brand-dark/20 hover:shadow-brand-dark/30 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center gap-3 disabled:opacity-50 disabled:pointer-events-none"
              >
                {saving ? <FiRefreshCw className="animate-spin" /> : <FiSave size={18} />}
                {saving ? "Publishing..." : editingItem ? "Update Album" : "Create Album"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-brand-dark/40 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] p-10 max-w-md w-full text-center">
            <div className="w-20 h-20 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <FiTrash size={32} />
            </div>
            <h2 className="text-2xl font-black text-slate-800 mb-2">Delete Album?</h2>
            <p className="text-slate-500 text-sm mb-10 leading-relaxed">This action will permanently delete <span className="text-brand-dark font-bold">"{showDeleteModal.album_title}"</span> and all associated media from our servers.</p>
            <div className="flex flex-col gap-3">
              <button onClick={handleDeleteAlbum} className="bg-red-500 text-white w-full py-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-600 transition-all">Confirm Delete</button>
              <button onClick={() => setShowDeleteModal(null)} className="w-full py-5 font-black text-slate-400 uppercase text-xs">Keep Album</button>
            </div>
          </div>
        </div>
      )}

      {/* Replace your current input styles in the modal with these */}
<style jsx global>{`
  .form-input-v2 {
    width: 100%;
    background: #f1f5f9; /* brand-soft */
    border: 1px solid #e2e8f0; /* brand-accent */
    padding: 1rem 1.25rem;
    border-radius: 1.25rem;
    font-size: 11px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #1e293b;
    outline: none;
    transition: all 0.2s;
  }
  .form-input-v2:focus {
    border-color: #3b82f6; /* brand-light */
    background: white;
  }
  .custom-scrollbar::-webkit-scrollbar {
    width: 4px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: #e2e8f0;
    border-radius: 10px;
  }
`}</style>
    </div>
  );
}

function FormItem({ label, children, error }: { label: string, children: React.ReactNode, error?: string }) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">{label}</label>
      {children}
      {error && <p className="text-red-500 text-[10px] font-bold mt-1 ml-1">{error}</p>}
    </div>
  );
}