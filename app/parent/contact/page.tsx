"use client";

import React, { useState, useEffect } from "react";
import { 
  FiPhone, FiMail, FiMapPin, FiClock, 
  FiInstagram, FiYoutube, FiSend, FiArrowUpRight, FiShield, FiMessageSquare 
} from "react-icons/fi";
import { supabase } from "@/lib/supabase";

export default function SchoolContact() {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContactData();
  }, []);

  async function fetchContactData() {
    setLoading(true);
    try {
      const { data } = await supabase.from("school_settings").select("*").eq("id", 1).single();
      setSettings(data);
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  }

  const formatTime = (time: string) => {
    if (!time) return "--:--";
    return new Date(`1970-01-01T${time}`).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit', 
      hour12: true 
    });
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <span className="text-[10px] font-black uppercase tracking-[0.4em] animate-pulse text-brand-light/40">Syncing...</span>
    </div>
  );

  return (
    // Added relative positioning to the main container for the FAB
    <div className="relative max-w-8xl mx-auto p-4 md:p-10 space-y-6 font-sans selection:bg-brand-light selection:text-white transition-colors duration-500">
      
      {/* --- HEADER --- */}
      <div className="flex flex-col gap-2 border-b border-slate-100 dark:border-slate-800 pb-6">
        <div className="flex items-center gap-2">
          <FiShield className="text-brand-light" size={14} />
          <span className="text-[9px] font-black uppercase tracking-[0.3em] text-brand-light/50">Verified Institution</span>
        </div>
        <div className="flex flex-row justify-between items-baseline">
          <h1 className="text-3xl md:text-4xl font-black tracking-tighter uppercase text-slate-800 dark:text-white">
            Contact<span className="text-brand-light">.</span>
          </h1>
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest hidden sm:block">Directory 2026</p>
        </div>
      </div>

      {/* --- GRID SYSTEM --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        
        {/* Phone Box */}
        <div className="group bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-[2rem] hover:border-brand-light/30 transition-all shadow-sm">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Voice Support</p>
          <p className="text-lg font-black text-slate-700 dark:text-slate-200 tracking-tight select-all">{settings?.phone || "Not Listed"}</p>
          <a href={`tel:${settings?.phone}`} className="mt-4 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-brand-light active:scale-95 transition-transform">
            Tap to Call <FiArrowUpRight />
          </a>
        </div>

        {/* Email Box */}
        <div className="group bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-[2rem] hover:border-brand-light/30 transition-all shadow-sm">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Digital Mail</p>
          <p className="text-sm font-black text-slate-700 dark:text-slate-200 truncate tracking-tight uppercase select-all">{settings?.email || "No Email"}</p>
          <a href={`mailto:${settings?.email}`} className="mt-4 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-brand-light active:scale-95 transition-transform">
            Send Message <FiArrowUpRight />
          </a>
        </div>

        {/* Timings Box */}
        <div className="lg:row-span-2 bg-slate-900 dark:bg-brand-light p-7 rounded-[2.5rem] text-white flex flex-col justify-between shadow-xl order-last lg:order-none">
          <div>
            <FiClock className="mb-6 text-brand-soft" size={24} />
            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/40 mb-6">Availability</p>
            <div className="space-y-5">
              <div className="flex justify-between items-center border-b border-white/10 pb-2">
                <span className="text-[10px] font-bold text-white/60 uppercase">Days</span>
                <span className="text-[11px] font-black uppercase tracking-tighter">{settings?.working_days || "Mon-Sat"}</span>
              </div>
              <div className="flex justify-between items-center border-b border-white/10 pb-2">
                <span className="text-[10px] font-bold text-white/60 uppercase">Office Hours</span>
                <span className="text-[11px] font-black uppercase tracking-tighter">
                  {formatTime(settings?.opening_time)} — {formatTime(settings?.closing_time)}
                </span>
              </div>
            </div>
          </div>
          <div className="mt-10 pt-6 border-t border-white/10">
            <p className="text-[9px] font-medium leading-relaxed uppercase tracking-widest opacity-40">
              Closed on Sundays & National Holidays.
            </p>
          </div>
        </div>

        {/* Address Box */}
        <div className="sm:col-span-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 p-7 rounded-[2.5rem] flex flex-col sm:flex-row items-start gap-5 shadow-inner">
          <div className="w-12 h-12 bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-center shadow-sm shrink-0">
            <FiMapPin className="text-brand-light" size={20} />
          </div>
          <div className="overflow-hidden">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Campus Hub</p>
            <p className="text-[11px] font-bold text-slate-600 dark:text-slate-300 leading-relaxed uppercase tracking-tight">
              {settings?.address || "Address details currently unavailable."}
            </p>
          </div>
        </div>

        {/* Socials */}
      {/* --- SOCIALS --- */}
<div className="sm:col-span-2 flex flex-row gap-2">
  {[
    { icon: FiInstagram, link: settings?.instagram_link, label: "Instagram", color: "hover:text-pink-600" },
    { icon: FiYoutube, link: settings?.youtube_link, label: "YouTube", color: "hover:text-red-600" },
    { icon: FiMessageSquare, link: settings?.whatsapp_link, label: "WhatsApp", color: "hover:text-emerald-600" },
  ].map((item, idx) => (
    item.link ? (
      <a 
        key={idx} 
        href={item.link} 
        target="_blank" 
        rel="noreferrer" 
        aria-label={item.label}
        className={`flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 h-16 rounded-2xl flex items-center justify-center text-slate-700 dark:text-slate-300 transition-all active:scale-95 shadow-sm ${item.color}`}
      >
        {/* Simply render the component and pass size directly */}
        <item.icon size={24} />
      </a>
    ) : null
  ))}
</div>

      </div>

      {/* --- WHATSAPP-STYLE FLOATING CHAT ICON --- */}
      {/* Positioned fixed to the viewport, bottom-right corner. */}
      <div className="fixed bottom-6 right-6 z-50 group flex items-center gap-3">
        {/* The Label/Tooltip (Hidden by default, slides out on hover) */}
        <div className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest px-4 py-2.5 rounded-xl shadow-2xl transition-all duration-300 transform scale-90 opacity-0 group-hover:scale-100 group-hover:opacity-100 hidden sm:block">
          Support Center
        </div>
    
      </div>

    </div>
  );
}