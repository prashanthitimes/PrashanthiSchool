"use client";

import React, { useState, useEffect } from "react";
import { 
  FiPhone, FiMail, FiMapPin, FiClock, 
  FiMessageCircle, FiHeadphones, FiUser, FiSmartphone, FiArrowRight 
} from "react-icons/fi";
import { supabase } from "@/lib/supabase";

export default function SchoolContact() {
  const [settings, setSettings] = useState<any>(null);
  const [teacher, setTeacher] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContactData();
  }, []);

  async function fetchContactData() {
    setLoading(true);
    try {
      // 1. Fetch School Settings
      const { data: schoolData } = await supabase
        .from("school_settings")
        .select("*")
        .eq("id", 1)
        .single();
      setSettings(schoolData);

      // 2. Fetch Class Teacher from class_teacher_allotment table
      const childId = localStorage.getItem('childId');
      if (childId) {
        // First get the student's current class/section info
        const { data: student } = await supabase
          .from("students")
          .select("class_name, section")
          .eq("id", childId)
          .single();

        if (student) {
          // Now join allotment table with teachers table
          const { data: allotment } = await supabase
            .from("class_teacher_allotment")
            .select(`
              teachers (
                full_name,
                phone_number
              )
            `)
            .eq("class_name", student.class_name)
            .eq("section", student.section)
            .eq("academic_year", "2026-27") // Matches your header year
            .single();

          if (allotment?.teachers) {
            setTeacher(allotment.teachers);
          }
        }
      }
    } catch (err) {
      console.error("Contact Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  }

  const formatTime = (time: string) => {
    if (!time) return "";
    return new Date(`1970-01-01T${time}`).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="space-y-8 p-6 bg-white min-h-screen animate-in fade-in duration-700">
      
      {/* --- SMALL COMPACT HEADER --- */}
      <header className="bg-brand-soft/40 rounded-[2rem] p-6 border border-brand-soft flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-brand-light rounded-2xl flex items-center justify-center text-white shadow-lg shadow-brand-soft">
            <FiHeadphones size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-brand-light tracking-tighter uppercase font-sans">Support Center</h1>
            <p className="text-[10px] font-bold text-brand-light/60 uppercase tracking-[0.2em]">School & Faculty Directory</p>
          </div>
        </div>
        <div className="flex gap-2">
            <div className="bg-white/60 px-4 py-2 rounded-xl border border-brand-soft text-[10px] font-black text-brand-light uppercase tracking-widest font-sans">
                Admin Wing
            </div>
            <div className="bg-brand-light px-4 py-2 rounded-xl text-[10px] font-black text-white uppercase tracking-widest font-sans">
                Active
            </div>
        </div>
      </header>

      {loading ? (
        <div className="text-center py-20 font-black text-brand-light/20 animate-pulse uppercase text-xs tracking-widest">
            Fetching Faculty Info...
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2 space-y-8">
            
            {/* --- CLASS TEACHER SECTION (FETCHED FROM ALLOTMENT TABLE) --- */}
            <div className="bg-brand-soft/20 border-2 border-dashed border-brand-soft rounded-[3rem] p-8 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden group">
                <div className="w-24 h-24 bg-brand-light rounded-[2.5rem] flex items-center justify-center text-white shadow-xl shadow-brand-soft/40 group-hover:rotate-6 transition-transform">
                    <FiUser size={40} />
                </div>
                <div className="text-center md:text-left flex-1 z-10">
                    <h3 className="text-[10px] font-black text-brand-light/50 uppercase tracking-[0.2em] mb-1">Your Class Teacher</h3>
                    <h2 className="text-3xl font-black text-brand-light uppercase tracking-tight mb-4 leading-tight">
                        {teacher?.full_name || "Teacher Not Assigned"}
                    </h2>
                    <div className="flex flex-wrap justify-center md:justify-start gap-3">
                        <div className="flex items-center gap-3 bg-white px-5 py-3 rounded-2xl border border-brand-soft shadow-sm">
                            <FiSmartphone className="text-brand-light" size={16} />
                            <span className="text-sm font-black text-brand-light tracking-widest font-sans">
                                {teacher?.phone_number || "Contact Admin"}
                            </span>
                        </div>
                    </div>
                </div>
                {teacher?.phone_number && (
                  <button 
                    onClick={() => window.location.href = `tel:${teacher?.phone_number}`}
                    className="bg-brand-light text-white px-8 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-brand-light/90 transition-all z-10 flex items-center gap-2 group shadow-lg shadow-brand-soft/50"
                  >
                      Call Now <FiArrowRight className="group-hover:translate-x-1 transition-transform"/>
                  </button>
                )}
                <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-brand-light/5 rounded-full blur-3xl"></div>
            </div>

            {/* --- GENERAL SCHOOL CONTACTS --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-8 rounded-[2.5rem] border border-brand-soft flex flex-col items-center text-center hover:border-brand-light/40 transition-all">
                <div className="w-14 h-14 bg-brand-soft/40 text-brand-light rounded-2xl flex items-center justify-center mb-4">
                  <FiPhone size={22} />
                </div>
                <h3 className="font-black text-brand-light/40 uppercase text-[9px] tracking-widest mb-1">General Office</h3>
                <p className="text-lg font-black text-brand-light font-sans">{settings?.phone || "N/A"}</p>
              </div>

              <div className="bg-white p-8 rounded-[2.5rem] border border-brand-soft flex flex-col items-center text-center hover:border-brand-light/40 transition-all">
                <div className="w-14 h-14 bg-brand-soft/40 text-brand-light rounded-2xl flex items-center justify-center mb-4">
                  <FiMail size={22} />
                </div>
                <h3 className="font-black text-brand-light/40 uppercase text-[9px] tracking-widest mb-1">Official Email</h3>
                <p className="text-xs font-black text-brand-light break-all tracking-tighter uppercase font-sans">{settings?.email || "N/A"}</p>
              </div>
            </div>

            <div className="bg-white p-8 rounded-[3rem] border border-brand-soft flex items-center gap-6">
                <div className="w-14 h-14 bg-brand-soft/30 text-brand-light rounded-2xl flex items-center justify-center shrink-0">
                  <FiMapPin size={24} />
                </div>
                <div>
                  <h3 className="font-black text-brand-light/40 uppercase text-[10px] tracking-widest mb-1">Campus Address</h3>
                  <p className="text-brand-light font-bold italic text-sm uppercase leading-relaxed font-sans">
                    {settings?.address || "Address detail pending"}
                  </p>
                </div>
            </div>
          </div>

          {/* --- SIDEBAR: OFFICE TIMINGS --- */}
          <div className="space-y-6 font-sans">
            <div className="bg-brand-light rounded-[3rem] p-10 text-white shadow-xl shadow-brand-soft/50 relative overflow-hidden">
              <div className="relative z-10">
                <h3 className="text-xl font-black mb-8 flex items-center gap-3 tracking-tighter uppercase">
                  <FiClock className="text-brand-soft" /> Timings
                </h3>
                
                <div className="space-y-6">
                  <div className="flex justify-between items-center border-b border-white/10 pb-4">
                    <span className="text-brand-soft/60 font-black text-[9px] uppercase tracking-widest">Office Days</span>
                    <span className="text-xs font-black uppercase tracking-tighter">{settings?.working_days || "Mon - Sat"}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-white/10 pb-4">
                    <span className="text-brand-soft/60 font-black text-[9px] uppercase tracking-widest">Starts</span>
                    <span className="text-xs font-black uppercase tracking-tighter">{formatTime(settings?.opening_time)}</span>
                  </div>
                  <div className="flex justify-between items-center pb-2">
                    <span className="text-brand-soft/60 font-black text-[9px] uppercase tracking-widest">Ends</span>
                    <span className="text-xs font-black uppercase tracking-tighter">{formatTime(settings?.closing_time)}</span>
                  </div>
                </div>

                <div className="mt-10 p-5 bg-white/10 rounded-2xl border border-white/10">
                  <p className="text-[10px] text-white/70 leading-relaxed font-bold uppercase tracking-[0.15em]">
                    *Office remains closed on Sundays.
                  </p>
                </div>
              </div>
            </div>

            <button 
              onClick={() => window.location.href = `mailto:${settings?.email}`}
              className="w-full bg-brand-soft border border-brand-light/20 text-brand-light p-8 rounded-[2.5rem] font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-4 hover:bg-brand-light hover:text-white transition-all shadow-lg shadow-brand-soft/30 group"
            >
              <FiMessageCircle size={20} className="group-hover:rotate-12 transition-transform" /> 
              Send Message
            </button>
          </div>
        </div>
      )}
    </div>
  );
}