"use client";

import React, { useState, useEffect, useRef } from "react";
import { FiDownload, FiClock, FiChevronDown, FiCalendar, FiPrinter } from "react-icons/fi";
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
  
  const printRef = useRef<HTMLDivElement>(null);

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

  const downloadOfficialImage = async () => {
    if (!printRef.current) return;
    try {
      setDownloading(true);
      const element = printRef.current;
      element.style.display = "block";

      const canvas = await html2canvas(element, { 
        scale: 3, 
        useCORS: true, 
        backgroundColor: "#ffffff",
        logging: false,
      });

      element.style.display = "none";
      const link = document.createElement("a");
      link.download = `Official_Timetable_${studentInfo?.name.replace(/\s+/g, '_')}.png`;
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
    if (n.includes('sci')) return 'bg-rose-50 border-rose-100 text-rose-700 dark:bg-rose-950/30 dark:border-rose-800 dark:text-rose-300';
    if (n.includes('math')) return 'bg-indigo-50 border-indigo-100 text-indigo-700 dark:bg-indigo-950/30 dark:border-indigo-800 dark:text-indigo-300';
    if (n.includes('eng')) return 'bg-amber-50 border-amber-100 text-amber-700 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-300';
    return 'bg-slate-50 border-slate-200 text-slate-600 dark:bg-slate-800/50 dark:border-slate-700 dark:text-slate-300';
  };

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-white dark:bg-slate-950">
      <div className="flex flex-col items-center gap-2">
        <div className="w-8 h-8 border-4 border-brand border-t-transparent rounded-full animate-spin" />
        <p className="text-[10px] font-black text-brand uppercase tracking-widest">Syncing Schedule</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 md:bg-white dark:bg-slate-950 pb-24 transition-colors duration-300">
      
      {/* HEADER */}
      <div className="bg-brand p-6 md:p-10 text-white md:rounded-b-[3rem] shadow-xl relative overflow-hidden">
        <div className="max-w-7xl mx-auto flex justify-between items-center relative z-10">
          <div>
            <h1 className="text-2xl md:text-4xl font-black uppercase tracking-tighter text-white">Time Table</h1>
            <p className="text-[10px] md:text-xs font-bold opacity-80 uppercase tracking-widest mt-1 text-white">
              {studentInfo?.name} • Class {studentInfo?.class}-{studentInfo?.section}
            </p>
          </div>
          <button 
            onClick={downloadOfficialImage}
            disabled={downloading}
            className="p-3 bg-white text-brand dark:bg-slate-900 dark:text-white rounded-2xl shadow-lg active:scale-90 transition-transform disabled:opacity-50 flex items-center gap-2 px-5"
          >
            {downloading ? (
              <div className="w-5 h-5 border-2 border-brand border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <FiPrinter size={20} />
                <span className="hidden md:inline text-[10px] font-black uppercase tracking-widest">Export Official</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 mt-6 md:mt-10">
        
        {/* DESKTOP VIEW */}
        <div className="hidden md:grid grid-cols-6 gap-4">
          {DAYS.map((day) => (
            <div key={day} className="flex flex-col gap-3 bg-white dark:bg-slate-900 p-4 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm transition-colors">
              <div className="py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-center text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-widest">{day}</div>
              {PERIODS.map((slot) => {
                const entry = timetable.find(t => t.day.trim().toLowerCase() === day.toLowerCase() && t.period === slot.id);
                return (
                  <div key={slot.id} className={`p-3 rounded-2xl border flex flex-col gap-1 min-h-[95px] transition-all ${entry ? getSubColor(entry.subjects?.name) : 'bg-slate-50/30 border-dashed border-slate-200 dark:bg-slate-950/20 dark:border-slate-800 opacity-40'}`}>
                    <span className="text-[8px] font-black opacity-40 uppercase tracking-tighter">P{slot.id}</span>
                    <h4 className="text-[10px] font-black uppercase leading-tight line-clamp-2">{entry?.subjects?.name || "—"}</h4>
                    <span className="text-[7px] font-bold mt-auto opacity-60 italic">{slot.time.split('-')[0]}</span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* MOBILE VIEW */}
        <div className="md:hidden space-y-3">
          {DAYS.map((day) => {
            const isExpanded = expandedDay === day;
            const isToday = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(new Date()) === day;
            return (
              <div key={day} className={`rounded-3xl border overflow-hidden transition-all duration-300 ${isExpanded ? 'bg-white dark:bg-slate-900 border-brand shadow-xl' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm opacity-80'}`}>
                <button 
                  onClick={() => setExpandedDay(isExpanded ? "" : day)}
                  className={`w-full flex justify-between items-center p-5 text-left ${isToday && !isExpanded ? 'bg-brand/5 dark:bg-brand/10' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${isToday ? 'bg-brand animate-pulse' : 'bg-slate-300 dark:bg-slate-700'}`} />
                    <span className={`text-sm font-black uppercase tracking-widest ${isExpanded ? 'text-brand' : 'text-slate-600 dark:text-slate-400'}`}>{day}</span>
                  </div>
                  <FiChevronDown className={`transition-transform duration-300 ${isExpanded ? 'rotate-180 text-brand' : 'text-slate-400'}`} />
                </button>
                {isExpanded && (
                  <div className="p-4 pt-0 space-y-3 animate-in fade-in slide-in-from-top-2">
                    {PERIODS.map((slot) => {
                      const entry = timetable.find(t => t.day.trim().toLowerCase() === day.toLowerCase() && t.period === slot.id);
                      return (
                        <div key={slot.id} className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${entry ? getSubColor(entry.subjects?.name) : 'bg-slate-50 border-slate-100 dark:bg-slate-800/30 dark:border-slate-800 opacity-50'}`}>
                          <div className="w-10 text-center border-r border-black/5 dark:border-white/5 pr-3">
                            <p className="text-[10px] font-black leading-none dark:text-slate-300">P{slot.id}</p>
                            <p className="text-[7px] font-bold uppercase opacity-50 mt-1 dark:text-slate-500">Slot</p>
                          </div>
                          <div className="flex-1">
                            <h4 className="text-[11px] font-black uppercase tracking-tight dark:text-slate-200">{entry?.subjects?.name || "Free Period"}</h4>
                            <div className="flex items-center gap-1 mt-1 opacity-60">
                              <FiClock size={8} className="dark:text-slate-400" />
                              <span className="text-[8px] font-bold italic dark:text-slate-400">{slot.time}</span>
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

        {/* PRINT TEMPLATE (Remains Light for Printing) */}
        <div style={{ position: 'absolute', left: '-9999px', top: '0' }}>
          <div ref={printRef} style={{ width: '1120px', padding: '50px', backgroundColor: 'white', fontFamily: 'sans-serif' }}>
            <div style={{ border: '8px double #a63d93', padding: '40px' }}>
              <div style={{ textAlign: 'center', marginBottom: '30px', borderBottom: '3px solid #a63d93', paddingBottom: '20px' }}>
                <h1 style={{ fontSize: '42px', fontWeight: '900', color: '#a63d93', margin: 0, textTransform: 'uppercase' }}>Prashanti Vidyalaya</h1>
                <p style={{ fontSize: '12px', fontWeight: 'bold', letterSpacing: '5px', color: '#64748b', margin: '5px 0' }}>OFFICIAL ACADEMIC SCHEDULE • 2026-27</p>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', backgroundColor: '#fdf2f8', padding: '20px', borderRadius: '15px', marginBottom: '40px', border: '1px solid #fbcfe8' }}>
                <div>
                  <p style={{ fontSize: '10px', fontWeight: '900', color: '#a63d93', textTransform: 'uppercase', margin: 0 }}>Candidate Name</p>
                  <h2 style={{ fontSize: '24px', fontWeight: '800', margin: 0, color: '#000' }}>{studentInfo?.name?.toUpperCase()}</h2>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: '10px', fontWeight: '900', color: '#a63d93', textTransform: 'uppercase', margin: 0 }}>Class & Section</p>
                  <h2 style={{ fontSize: '24px', fontWeight: '800', margin: 0, color: '#000' }}>{studentInfo?.class} — {studentInfo?.section}</h2>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '15px' }}>
                {DAYS.map((day) => (
                  <div key={day}>
                    <div style={{ backgroundColor: '#a63d93', color: 'white', padding: '10px', textAlign: 'center', borderRadius: '8px', fontSize: '12px', fontWeight: '900', marginBottom: '12px', textTransform: 'uppercase' }}>{day}</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {PERIODS.map((slot) => {
                        const entry = timetable.find(t => t.day.trim().toLowerCase() === day.toLowerCase() && t.period === slot.id);
                        return (
                          <div key={slot.id} style={{ padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', minHeight: '100px', backgroundColor: entry ? '#f8fafc' : '#ffffff', display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: '9px', fontWeight: '900', color: '#94a3b8' }}>PERIOD {slot.id}</span>
                            <p style={{ fontSize: '13px', fontWeight: '800', margin: '6px 0', lineHeight: '1.2', color: '#1e293b' }}>{entry?.subjects?.name || "—"}</p>
                            <span style={{ fontSize: '9px', color: '#64748b', marginTop: 'auto', fontWeight: '600' }}>{slot.time.split(' ')[0]}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: '60px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                 <div style={{ textAlign: 'center' }}><div style={{ borderTop: '2px solid #000', width: '200px', paddingTop: '10px', fontSize: '11px', fontWeight: '900' }}>ACADEMIC COORDINATOR</div></div>
                 <div style={{ textAlign: 'center', opacity: 0.2 }}><p style={{ fontSize: '10px', fontWeight: 'bold' }}>SYSTEM GENERATED RECORD</p></div>
                 <div style={{ textAlign: 'center' }}><div style={{ borderTop: '2px solid #000', width: '200px', paddingTop: '10px', fontSize: '11px', fontWeight: '900' }}>PRINCIPAL SEAL</div></div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}