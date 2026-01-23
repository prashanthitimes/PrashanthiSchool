"use client";

import React, { useEffect, useState, useCallback } from "react";
import { FiSave, FiClock, FiCalendar, FiLock, FiAward,FiSettings, FiMapPin, FiRefreshCw, FiGlobe, FiMail, FiPhone } from "react-icons/fi";
import { createClient } from "@supabase/supabase-js";
import toast, { Toaster } from "react-hot-toast";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [yearStart, setYearStart] = useState("");
  const [yearEnd, setYearEnd] = useState("");
  const [formData, setFormData] = useState({
    school_name: "", principal_name: "", affiliation_no: "",
    email: "", phone: "", address: "", academic_year: "",
    opening_time: "08:00", closing_time: "16:00",
  });

  const fetchData = useCallback(async () => {
    try {
      const { data, error } = await supabase.from("school_settings").select("*").eq("id", 1).single();
      if (error) throw error;
      if (data.academic_year?.includes("-")) {
        const parts = data.academic_year.split("-");
        setYearStart(parts[0]);
        setYearEnd(parts[1]);
      }
      setFormData({
        ...data,
        opening_time: data.opening_time?.slice(0, 5) || "08:00",
        closing_time: data.closing_time?.slice(0, 5) || "16:00",
        phone: data.phone?.replace("+91", "") || "",
      });
    } catch (err) { toast.error("Load failed"); } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase.from("school_settings").update({
        ...formData,
        phone: `+91${formData.phone}`,
        academic_year: `${yearStart}-${yearEnd}`,
        updated_at: new Date(),
      }).eq("id", 1);
      if (error) throw error;
      toast.success("Settings Synchronized");
    } catch (err) { toast.error("Sync failed"); } finally { setSaving(false); }
  };

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-brand-soft-bg">
        <div className="w-10 h-10 border-4 border-brand-soft border-t-brand-light rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto mt-10 px-4 sm:px-6 lg:px-8 py-4 space-y-8 animate-in fade-in duration-700">
      <Toaster position="top-right" />

      {/* COMPACT FLOATING HEADER */}
      <header className="flex items-center justify-between bg-brand-soft/80 backdrop-blur-md px-6 py-4 rounded-3xl border border-brand-light/20 shadow-lg">
        <div className="flex items-center gap-4">
            <div className="hidden sm:flex w-12 h-12 bg-white text-brand-light rounded-2xl items-center justify-center shadow-sm">
                <FiSettings size={22} className="animate-spin-slow" />
            </div>
            <div>
                <h1 className="text-base font-black text-brand-dark uppercase tracking-tight">Institutional Setup</h1>
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    <p className="text-[9px] font-black text-brand-light uppercase tracking-widest">Live System Database</p>
                </div>
            </div>
        </div>
        
        <button 
          onClick={handleSave} 
          disabled={saving}
          className="bg-brand-light text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-[0.15em] shadow-lg shadow-brand-light/30 hover:bg-brand-dark transition-all flex items-center gap-2 disabled:opacity-50 active:scale-95"
        >
          {saving ? <FiRefreshCw className="animate-spin" /> : <FiSave size={16}/>}
          {saving ? "Syncing..." : "Publish Changes"}
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: PRIMARY DATA */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* CARD: Identity */}
          <section className="bg-white p-6 sm:p-10 rounded-[2.5rem] border border-brand-soft shadow-sm ring-1 ring-brand-soft/20">
            <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-brand-soft-bg rounded-2xl text-brand-light border border-brand-soft"><FiAward size={22}/></div>
                    <h2 className="text-sm font-black uppercase text-slate-800 tracking-widest">Legal Identity</h2>
                </div>
                <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest border border-slate-100 px-3 py-1 rounded-full">Section 01</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <FormItem label="School Name" icon={<FiGlobe />}>
                <input 
                  value={formData.school_name} 
                  onChange={e => setFormData({...formData, school_name: e.target.value})}
                  className="w-full p-4 bg-brand-soft-bg/30 border-2 border-brand-soft/50 focus:border-brand-light focus:bg-white rounded-2xl outline-none font-bold text-slate-700 transition-all text-sm" 
                  placeholder="Official Name"
                />
              </FormItem>
              <FormItem label="Principal / Head" icon={<FiLock />}>
                <input 
                  value={formData.principal_name} 
                  onChange={e => setFormData({...formData, principal_name: e.target.value})}
                  className="w-full p-4 bg-brand-soft-bg/30 border-2 border-brand-soft/50 focus:border-brand-light focus:bg-white rounded-2xl outline-none font-bold text-slate-700 transition-all text-sm" 
                  placeholder="Full Name"
                />
              </FormItem>
              <FormItem label="Affiliation No." icon={<FiAward />}>
                <input 
                  value={formData.affiliation_no} 
                  onChange={e => setFormData({...formData, affiliation_no: e.target.value})}
                  className="w-full p-4 bg-brand-soft-bg/30 border-2 border-brand-soft/50 focus:border-brand-light focus:bg-white rounded-2xl outline-none font-bold text-slate-700 transition-all text-sm" 
                  placeholder="CBSE/ICSE Code"
                />
              </FormItem>
              <FormItem label="System Email" icon={<FiMail />}>
                <input 
                  value={formData.email} 
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  className="w-full p-4 bg-brand-soft-bg/30 border-2 border-brand-soft/50 focus:border-brand-light focus:bg-white rounded-2xl outline-none font-bold text-slate-700 transition-all text-sm" 
                  placeholder="admin@school.com"
                />
              </FormItem>
            </div>
          </section>

          {/* CARD: Location */}
          <section className="bg-white p-6 sm:p-10 rounded-[2.5rem] border border-brand-soft shadow-sm">
            <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-brand-soft-bg rounded-2xl text-brand-light border border-brand-soft"><FiMapPin size={22}/></div>
                <h2 className="text-sm font-black uppercase text-slate-800 tracking-widest">Global Location</h2>
            </div>
            <div className="grid grid-cols-1 gap-6">
                <FormItem label="Direct Contact Line" icon={<FiPhone />}>
                    <div className="relative">
                        <span className="absolute left-5 top-1/2 -translate-y-1/2 text-brand-light font-black text-xs pr-4 border-r border-brand-soft">+91</span>
                        <input 
                            value={formData.phone} 
                            onChange={e => setFormData({...formData, phone: e.target.value.replace(/[^0-9]/g, "").slice(0, 10)})}
                            className="w-full p-4 pl-20 bg-brand-soft-bg/30 border-2 border-brand-soft/50 focus:border-brand-light focus:bg-white rounded-2xl outline-none font-black text-slate-700 text-sm tracking-[0.2em]" 
                        />
                    </div>
                </FormItem>
                <FormItem label="Permanent Address">
                    <textarea 
                        value={formData.address} 
                        onChange={e => setFormData({...formData, address: e.target.value})}
                        rows={3}
                        className="w-full p-4 bg-brand-soft-bg/30 border-2 border-brand-soft/50 focus:border-brand-light focus:bg-white rounded-2xl outline-none font-bold text-slate-700 transition-all text-sm resize-none" 
                        placeholder="Street, District, State, PIN"
                    />
                </FormItem>
            </div>
          </section>
        </div>

        {/* RIGHT COLUMN: TIMING & SYNC */}
        <div className="lg:col-span-4 space-y-8">
            
            {/* SESSION BOX: High Contrast */}
            <div className="bg-brand-dark p-8 rounded-[2.5rem] text-white shadow-xl shadow-brand-dark/20 relative overflow-hidden group">
                <div className="absolute -right-4 -top-4 opacity-10 group-hover:scale-110 transition-transform">
                    <FiCalendar size={120} />
                </div>
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-6">
                        <FiCalendar className="text-brand-soft" size={24} />
                        <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-brand-soft">Academic Session</h2>
                    </div>
                    <div className="flex items-center gap-3 bg-white/10 p-2 rounded-2xl backdrop-blur-sm border border-white/20">
                        <input 
                            type="number" 
                            value={yearStart} 
                            onChange={e => setYearStart(e.target.value.slice(0, 4))}
                            className="w-full p-3 bg-white rounded-xl outline-none font-black text-center text-xl text-brand-dark shadow-inner"
                        />
                        <div className="font-black text-white/40 text-2xl">/</div>
                        <input 
                            type="number" readOnly value={yearEnd} 
                            className="w-full p-3 bg-brand-dark border border-white/20 rounded-xl font-black text-center text-xl text-white/50"
                        />
                    </div>
                </div>
            </div>

            {/* TIMINGS CARD */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-brand-soft shadow-sm">
                <div className="flex items-center gap-3 mb-8">
                    <div className="p-2.5 bg-brand-soft-bg rounded-xl text-brand-light border border-brand-soft"><FiClock size={22}/></div>
                    <h2 className="text-[11px] font-black uppercase text-slate-500 tracking-[0.2em]">Operational Hours</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
                    <FormItem label="Gate Opens">
                        <input type="time" value={formData.opening_time} onChange={e => setFormData({...formData, opening_time: e.target.value})} className="w-full p-4 bg-brand-soft-bg/50 border border-brand-soft rounded-2xl font-black text-xs text-slate-600 outline-none focus:bg-white transition-colors" />
                    </FormItem>
                    <FormItem label="Gate Closes">
                        <input type="time" value={formData.closing_time} onChange={e => setFormData({...formData, closing_time: e.target.value})} className="w-full p-4 bg-brand-soft-bg/50 border border-brand-soft rounded-2xl font-black text-xs text-slate-600 outline-none focus:bg-white transition-colors" />
                    </FormItem>
                </div>
            </div>

            {/* LOG: Notification Card */}
            <div className="bg-white border-2 border-brand-soft/50 p-6 rounded-[2.5rem] relative overflow-hidden">
                <div className="flex items-center gap-3 text-brand-dark mb-4">
                    <div className="w-8 h-8 bg-brand-soft-bg rounded-full flex items-center justify-center animate-pulse">
                         <FiRefreshCw size={14} className="text-brand-light" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Sync Status</span>
                </div>
                <p className="text-[12px] font-medium text-slate-500 leading-relaxed italic">
                    All system-wide variables (Timings, Headers, Contact) are updated globally upon sync.
                </p>
                <div className="mt-4 h-1 w-full bg-brand-soft-bg rounded-full">
                    <div className="h-full w-2/3 bg-brand-light rounded-full"></div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}

// Sub-component for clean code
function FormItem({ label, children, icon }: { label: string, children: React.ReactNode, icon?: React.ReactNode }) {
  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-2 ml-2">
        {icon && <span className="text-brand-light/40 text-[10px]">{icon}</span>}
        <label className="text-[10px] font-black text-brand-light/60 uppercase tracking-widest">{label}</label>
      </div>
      {children}
    </div>
  );
}