"use client";

import React, { useState, useEffect, useRef } from "react";
import { FiClock, FiCalendar, FiDownload, FiInfo } from "react-icons/fi";
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
  const [studentInfo, setStudentInfo] = useState<any>(null);
  const [activeDay, setActiveDay] = useState(DAYS[0]); // For mobile view
  const tableRef = useRef(null);

  useEffect(() => {
    fetchData();
    // Set active day to current day if it's a school day
    const today = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(new Date());
    if (DAYS.includes(today)) setActiveDay(today);
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

      const { data: ttData } = await supabase
        .from("timetable")
        .select(`*, subjects(*)`)
        .eq("class", classNum)
        .ilike("section", sectionStr);

      setTimetable(ttData || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const downloadImage = async () => {
    if (tableRef.current) {
      const canvas = await html2canvas(tableRef.current, { scale: 2 });
      const link = document.createElement("a");
      link.download = `Timetable_${studentInfo?.name}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    }
  };

  const getSubjectColor = (subjectName: string) => {
    const name = subjectName?.toLowerCase() || "";
    if (name.includes('science')) return 'bg-pink-50 border-pink-100 text-pink-600';
    if (name.includes('math')) return 'bg-blue-50 border-blue-100 text-blue-600';
    if (name.includes('english')) return 'bg-amber-50 border-amber-100 text-amber-600';
    return 'bg-cyan-50 border-cyan-100 text-cyan-600';
  };

  if (loading) return <div className="p-20 text-center text-[#722366] font-black animate-pulse uppercase tracking-widest">Generating Table...</div>;

 return (
  /* MAIN CANVAS: bg-slate-50 | dark:bg-slate-950 */
  <div className="p-4 md:p-10 bg-slate-50 dark:bg-slate-950 min-h-screen pb-24 md:pb-10 transition-colors duration-300">
{/* HEADER SECTION - MOBILE OPTIMIZED */}
<div className="bg-[#722366] rounded-2xl md:rounded-3xl p-4 md:p-6 mb-4 md:mb-6 text-white shadow-xl border border-white/10 relative overflow-hidden">
  
  {/* Subtle Background Pattern for Premium Look */}
  <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/5 rounded-full blur-3xl" />

  <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
    
    {/* Left Side: Title & Badges */}
    <div className="w-full sm:w-auto">
      <h2 className="text-xl md:text-2xl font-black tracking-tighter uppercase leading-none mb-2">
        Class Timetable
      </h2>

      <div className="flex flex-wrap gap-1.5">
        <div className="bg-white/10 backdrop-blur-md px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider border border-white/10">
          Class {studentInfo?.class}
        </div>

        <div className="bg-white/10 backdrop-blur-md px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider border border-white/10">
          Section {studentInfo?.section}
        </div>
      </div>
    </div>

    {/* Right Side: Student Info & Action */}
    <div className="flex flex-row sm:flex-col justify-between items-center sm:items-end w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-white/10">
      
      <div className="text-left sm:text-right overflow-hidden mr-2 sm:mr-0">
        <p className="text-[7px] font-bold opacity-60 uppercase tracking-widest leading-none mb-1">
          Student Profile
        </p>
        <h3 className="text-xs md:text-base font-black uppercase truncate max-w-[150px] md:max-w-full leading-tight">
          {studentInfo?.name}
        </h3>
      </div>

      <button
        onClick={downloadImage}
        className="flex items-center gap-2 px-3 py-2.5 bg-white text-[#722366] active:scale-95 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-lg shrink-0"
      >
        <FiDownload size={14} className="sm:size-[12px]" /> 
        <span className="hidden xs:inline">Save Image</span>
      </button>
    </div>

  </div>
</div>

    {/* MOBILE DAY SELECTOR */}
    <div className="md:hidden flex overflow-x-auto gap-2 mb-6 pb-2 scrollbar-hide">
      {DAYS.map((day) => (
        <button
          key={day}
          onClick={() => setActiveDay(day)}
          className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border ${activeDay === day
              ? 'bg-[#722366] text-white border-[#722366] shadow-md'
              : 'bg-white dark:bg-slate-900 text-slate-400 border-slate-200 dark:border-slate-800'
            }`}
        >
          {day.substring(0, 3)}
        </button>
      ))}
    </div>

    {/* MAIN VIEW AREA */}
    <div className="max-w-8xl mx-auto">

      {/* MOBILE VIEW (List Style) */}
      <div className="md:hidden space-y-4">
        <div className="flex items-center gap-2 px-2 mb-2">
          <FiCalendar className="text-[#722366] dark:text-brand-soft" />
          <span className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest">{activeDay}'s Schedule</span>
        </div>

        {PERIODS.map((slot) => {
          const entry = timetable.find(
            t => t.day.trim().toLowerCase() === activeDay.toLowerCase() && t.period === slot.id
          );

          return (
            /* MOBILE CARD: bg-white | dark:bg-slate-900 */
            <div key={slot.id} className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4 transition-colors">
              <div className="w-16 flex flex-col items-center justify-center border-r border-slate-50 dark:border-slate-800 pr-4">
                <span className="text-[10px] font-black text-[#722366] dark:text-brand-soft">P{slot.id}</span>
                <span className="text-[8px] font-bold text-slate-400 text-center leading-tight mt-1">{slot.time.split('-')[0]}</span>
              </div>

              <div className="flex-1">
                {entry ? (
                  <div className={`p-3 rounded-xl border ${getSubjectColor(entry.subjects?.name)}`}>
                    <h4 className="text-[11px] font-black uppercase truncate dark:text-slate-900">
                      {entry.subjects?.subject_name || entry.subjects?.name}
                    </h4>
                    <p className="text-[8px] font-bold opacity-60 tracking-widest mt-0.5 dark:text-slate-800">
                      {entry.subjects?.subject_code || entry.subjects?.code}
                    </p>
                  </div>
                ) : (
                  <div className="text-[10px] font-bold text-slate-300 dark:text-slate-700 italic">No Class Scheduled</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* DESKTOP VIEW (Grid Style) */}
      <div className="hidden md:block">
        <div ref={tableRef} className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-800 transition-colors">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50">
                  <th className="p-5 border border-slate-100 dark:border-slate-800 text-left w-[120px]">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Timeline</span>
                  </th>
                  {PERIODS.map((p) => (
                    <th key={p.id} className="p-5 border border-slate-100 dark:border-slate-800 min-w-[140px]">
                      <span className="block text-[10px] font-black text-[#722366] dark:text-brand-soft uppercase">Period {p.id}</span>
                      <div className="flex items-center justify-center gap-1 mt-1.5 text-slate-400">
                        <FiClock size={10} />
                        <span className="text-[8px] font-bold">{p.time}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {DAYS.map((day) => (
                  <tr key={day} className="hover:bg-slate-50/30 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="p-5 border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                      <span className="text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest">{day}</span>
                    </td>
                    {PERIODS.map((slot) => {
                      const entry = timetable.find(
                        t => t.day.trim().toLowerCase() === day.toLowerCase() && t.period === slot.id
                      );

                      return (
                        <td key={`${day}-${slot.id}`} className="p-2 border border-slate-100 dark:border-slate-800">
                          {entry ? (
                            <div className={`p-3 rounded-xl border text-center flex flex-col justify-center min-h-[70px] ${getSubjectColor(entry.subjects?.name)}`}>
                              <h4 className="text-[10px] font-black uppercase leading-tight mb-1 dark:text-slate-900">
                                {entry.subjects?.subject_name || entry.subjects?.name}
                              </h4>
                              <p className="text-[8px] font-bold opacity-60 tracking-widest dark:text-slate-800">
                                {entry.subjects?.subject_code || entry.subjects?.code}
                              </p>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center py-4 text-slate-200 dark:text-slate-800 transition-colors">—</div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Branding for image export */}
          <div className="mt-6 flex justify-between items-center opacity-30 dark:opacity-20 px-2 text-slate-800 dark:text-slate-100">
            <span className="text-[8px] font-black uppercase tracking-[0.3em]">Official School Timetable</span>
            <span className="text-[8px] font-black uppercase tracking-[0.3em]">Session 2026-27</span>
          </div>
        </div>
      </div>
    </div>
  </div>
);
}