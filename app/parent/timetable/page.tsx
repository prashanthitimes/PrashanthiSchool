"use client";

import React, { useState, useEffect, useRef } from "react";
import { FiDownload, FiClock, FiChevronDown, FiCalendar } from "react-icons/fi";
import { supabase } from "@/lib/supabase";
import html2canvas from "html2canvas";

const PERIODS = [
  { id: 1, time: "09:00 - 09:45" },
  { id: 2, time: "09:45 - 10:30" },
  { id: 3, time: "10:45 - 11:30" },
  { id: 4, time: "11:30 - 12:15" },
  { id: 5, time: "01:00 - 01:45" },
  { id: 6, time: "01:45 - 02:30" },
];

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function StudentTimetable() {
  const [timetable, setTimetable] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [studentInfo, setStudentInfo] = useState<any>(null);
  const [expandedDay, setExpandedDay] = useState<string>("");
  
  const exportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchData();
    const today = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(new Date());
    setExpandedDay(DAYS.includes(today) ? today : "Monday");
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      const childId = localStorage.getItem("childId");
      if (!childId) return;

      const { data: student } = await supabase.from("students").select("*").eq("id", childId).single();
      if (!student) return;

      const classNum = parseInt(student.class_name.replace(/\D/g, ''));
      const sectionStr = student.section.split('-').pop()?.trim() || student.section.trim();

      setStudentInfo({ class: classNum, section: sectionStr, name: student.full_name });

      const { data: ttData } = await supabase.from("timetable").select(`*, subjects(*)`).eq("class", classNum).ilike("section", sectionStr);
      setTimetable(ttData || []);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }

  const downloadImage = async () => {
    if (!exportRef.current) return;
    try {
      setDownloading(true);
      // We temporarily show the hidden export div to capture it
      const canvas = await html2canvas(exportRef.current, { 
        scale: 2, 
        useCORS: true, 
        backgroundColor: "#ffffff",
        logging: false,
      });
      const link = document.createElement("a");
      link.download = `Timetable_${studentInfo?.name || 'Student'}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (err) {
      console.error("Download failed", err);
    } finally {
      setDownloading(false);
    }
  };

  const getSubColor = (name: string = "") => {
    const n = name.toLowerCase();
    if (n.includes('sci')) return 'bg-rose-50 border-rose-100 text-rose-700';
    if (n.includes('math')) return 'bg-indigo-50 border-indigo-100 text-indigo-700';
    if (n.includes('eng')) return 'bg-amber-50 border-amber-100 text-amber-700';
    return 'bg-slate-50 border-slate-200 text-slate-600';
  };

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-2">
        <div className="w-8 h-8 border-4 border-brand border-t-transparent rounded-full animate-spin" />
        <p className="text-[10px] font-black text-brand uppercase tracking-widest">Syncing Schedule</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 md:bg-white pb-24">
      
      {/* HEADER */}
      <div className="bg-brand p-6 md:p-10 text-white md:rounded-b-[3rem] shadow-xl relative overflow-hidden">
        <div className="max-w-7xl mx-auto flex justify-between items-center relative z-10">
          <div>
            <h1 className="text-2xl md:text-4xl font-black uppercase tracking-tighter">Time Table</h1>
            <p className="text-[10px] md:text-xs font-bold opacity-80 uppercase tracking-widest mt-1">
              {studentInfo?.name} • Class {studentInfo?.class}-{studentInfo?.section}
            </p>
          </div>
          <button 
            onClick={downloadImage}
            disabled={downloading}
            className="p-3 bg-white text-brand rounded-2xl shadow-lg active:scale-90 transition-transform disabled:opacity-50"
          >
            {downloading ? <div className="w-5 h-5 border-2 border-brand border-t-transparent rounded-full animate-spin" /> : <FiDownload size={22} />}
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 mt-6 md:mt-10">
        
        {/* --- DESKTOP VIEW (Visible only on md+) --- */}
        <div className="hidden md:grid grid-cols-6 gap-4">
          {DAYS.map((day) => (
            <div key={day} className="flex flex-col gap-3 bg-white p-4 rounded-[2rem] border border-slate-100 shadow-sm">
              <div className="py-2 bg-slate-100 rounded-xl text-center text-[10px] font-black uppercase text-slate-500 tracking-widest">{day}</div>
              {PERIODS.map((slot) => {
                const entry = timetable.find(t => t.day.trim().toLowerCase() === day.toLowerCase() && t.period === slot.id);
                return (
                  <div key={slot.id} className={`p-3 rounded-2xl border flex flex-col gap-1 min-h-[95px] ${entry ? getSubColor(entry.subjects?.name) : 'bg-slate-50/30 border-dashed border-slate-200 opacity-40'}`}>
                    <span className="text-[8px] font-black opacity-40 uppercase tracking-tighter">P{slot.id}</span>
                    <h4 className="text-[10px] font-black uppercase leading-tight line-clamp-2">{entry?.subjects?.name || "—"}</h4>
                    <span className="text-[7px] font-bold mt-auto opacity-60 italic">{slot.time.split('-')[0]}</span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* --- MOBILE VIEW (Accordion) --- */}
        <div className="md:hidden space-y-3">
          {DAYS.map((day) => {
            const isExpanded = expandedDay === day;
            const isToday = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(new Date()) === day;

            return (
              <div key={day} className={`rounded-3xl border overflow-hidden transition-all duration-300 ${isExpanded ? 'bg-white border-brand shadow-xl' : 'bg-white border-slate-200 shadow-sm opacity-80'}`}>
                <button 
                  onClick={() => setExpandedDay(isExpanded ? "" : day)}
                  className={`w-full flex justify-between items-center p-5 text-left ${isToday && !isExpanded ? 'bg-brand/5' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${isToday ? 'bg-brand animate-pulse' : 'bg-slate-300'}`} />
                    <span className={`text-sm font-black uppercase tracking-widest ${isExpanded ? 'text-brand' : 'text-slate-600'}`}>{day}</span>
                  </div>
                  <FiChevronDown className={`transition-transform duration-300 ${isExpanded ? 'rotate-180 text-brand' : 'text-slate-400'}`} />
                </button>

                {isExpanded && (
                  <div className="p-4 pt-0 space-y-3 animate-in fade-in slide-in-from-top-2">
                    {PERIODS.map((slot) => {
                      const entry = timetable.find(t => t.day.trim().toLowerCase() === day.toLowerCase() && t.period === slot.id);
                      return (
                        <div key={slot.id} className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${entry ? getSubColor(entry.subjects?.name) : 'bg-slate-50 border-slate-100 opacity-50'}`}>
                          <div className="w-10 text-center border-r border-black/5 pr-3">
                            <p className="text-[10px] font-black leading-none">P{slot.id}</p>
                            <p className="text-[7px] font-bold uppercase opacity-50 mt-1">Slot</p>
                          </div>
                          <div className="flex-1">
                            <h4 className="text-[11px] font-black uppercase tracking-tight">{entry?.subjects?.name || "Free Period"}</h4>
                            <div className="flex items-center gap-1 mt-1 opacity-60">
                              <FiClock size={8} />
                              <span className="text-[8px] font-bold italic">{slot.time}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* --- HIDDEN EXPORT CANVAS --- */}
        {/* This div is invisible to the user but used by html2canvas for the download image */}
        <div style={{ position: 'absolute', left: '-9999px', top: '0' }}>
          <div ref={exportRef} className="p-10 bg-white min-w-[1200px]">
            <div className="mb-8 border-b-4 border-brand pb-6 flex justify-between items-end">
                <div>
                    <h2 className="text-5xl font-black uppercase text-brand italic">Weekly Schedule</h2>
                    <p className="text-xl font-bold text-slate-400 uppercase mt-2">{studentInfo?.name} • Class {studentInfo?.class}-{studentInfo?.section}</p>
                </div>
                <div className="text-right">
                    <p className="text-sm font-black text-slate-300 uppercase tracking-widest">Academic Session 2026</p>
                </div>
            </div>
            <div className="grid grid-cols-6 gap-4">
              {DAYS.map((day) => (
                <div key={day} className="flex flex-col gap-4">
                  <div className="py-3 bg-brand text-white rounded-xl text-center text-sm font-black uppercase tracking-widest">{day}</div>
                  {PERIODS.map((slot) => {
                    const entry = timetable.find(t => t.day.trim().toLowerCase() === day.toLowerCase() && t.period === slot.id);
                    return (
                      <div key={slot.id} className={`p-4 rounded-2xl border-2 flex flex-col gap-2 min-h-[120px] ${entry ? getSubColor(entry.subjects?.name) : 'bg-slate-50 border-dashed border-slate-200'}`}>
                        <span className="text-[10px] font-black opacity-40 uppercase">Period {slot.id}</span>
                        <h4 className="text-sm font-black uppercase leading-tight">{entry?.subjects?.name || "—"}</h4>
                        <span className="text-[10px] font-bold mt-auto opacity-60 italic">{slot.time}</span>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
            <div className="mt-10 pt-6 border-t border-slate-100 text-center">
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.5em]">Official Student Portal Generated Schedule</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}