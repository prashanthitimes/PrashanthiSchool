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
  /* MAIN CANVAS: Locked width to screen to prevent horizontal overflow */
  <div className="w-full max-w-[100vw] overflow-x-hidden px-3 pt-6 pb-24 bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
    
    {/* HEADER SECTION - Redesigned to be compact and stay within phone bounds */}
    <div className="relative bg-[#722366] rounded-[2rem] p-5 mb-5 text-white shadow-lg overflow-hidden border border-white/5">
      <div className="relative z-10">
        
        {/* Top Row: Title and Class/Sec Badges */}
        <div className="flex justify-between items-start gap-2 mb-4">
          <div className="flex-1">
            <p className="text-[7px] uppercase font-black opacity-60 tracking-[0.2em] mb-1">Academic</p>
            <h2 className="text-xl font-black tracking-tighter uppercase leading-none">
              Timetable
            </h2>
          </div>
          <div className="flex gap-1">
            <div className="bg-white/10 backdrop-blur-sm px-2 py-1 rounded-lg text-[8px] font-black border border-white/10">
              C-{studentInfo?.class}
            </div>
            <div className="bg-white/10 backdrop-blur-sm px-2 py-1 rounded-lg text-[8px] font-black border border-white/10">
              S-{studentInfo?.section}
            </div>
          </div>
        </div>

        {/* Bottom Row: Student Name and Save Button */}
        <div className="flex items-center justify-between pt-4 border-t border-white/10">
          <div className="flex-1 min-w-0">
            <p className="text-[7px] font-bold opacity-50 uppercase tracking-widest mb-0.5">Student Name</p>
            <h3 className="text-xs font-black uppercase truncate pr-3">
              {studentInfo?.name}
            </h3>
          </div>

          <button
            onClick={downloadImage}
            className="flex items-center justify-center h-9 w-9 bg-white text-[#722366] active:scale-90 rounded-xl transition-all shadow-md shrink-0"
          >
            <FiDownload size={16} />
          </button>
        </div>
      </div>
    </div>

    {/* FIXED DAY SELECTOR: Uses first 3 letters and stays within screen width */}
    <div className="flex justify-between items-center gap-1 mb-6 px-1">
      {DAYS.map((day) => (
        <button
          key={day}
          onClick={() => setActiveDay(day)}
          className={`flex-1 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-tight transition-all border ${
            activeDay === day
              ? 'bg-[#722366] text-white border-[#722366] shadow-md'
              : 'bg-white dark:bg-slate-900 text-slate-400 border-slate-200 dark:border-slate-800'
          }`}
        >
          {day.substring(0, 3)}
        </button>
      ))}
    </div>

    {/* MAIN VIEW AREA */}
    <div className="max-w-full">
      
      {/* MOBILE LIST VIEW (Always visible on mobile) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1 mb-1">
          <div className="flex items-center gap-2">
            <div className="w-1 h-3 bg-[#722366] rounded-full" />
            <span className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest">
              {activeDay} Schedule
            </span>
          </div>
          <span className="text-[8px] font-bold text-slate-400 uppercase">
            {PERIODS.length} Slots
          </span>
        </div>

        {PERIODS.map((slot) => {
          const entry = timetable.find(
            t => t.day.trim().toLowerCase() === activeDay.toLowerCase() && t.period === slot.id
          );

          return (
            <div
              key={slot.id}
              className="bg-white dark:bg-slate-900 rounded-2xl p-2.5 border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-3 transition-all"
            >
              {/* Time Column: Fixed width to prevent content shifting */}
              <div className="w-12 flex flex-col items-center justify-center border-r border-slate-50 dark:border-slate-800 pr-2 shrink-0">
                <span className="text-[10px] font-black text-[#722366] leading-none">P{slot.id}</span>
                <span className="text-[7px] font-bold text-slate-400 mt-1 uppercase">{slot.time.split('-')[0]}</span>
              </div>

              {/* Subject Content: Uses flex-1 and min-w-0 to force truncation */}
              <div className="flex-1 min-w-0">
                {entry ? (
                  <div className={`w-full p-2.5 rounded-xl border ${getSubjectColor(entry.subjects?.name)}`}>
                    <h4 className="text-[11px] font-black uppercase truncate dark:text-slate-900 leading-tight">
                      {entry.subjects?.subject_name || entry.subjects?.name}
                    </h4>
                    <div className="flex justify-between items-center mt-0.5">
                      <p className="text-[8px] font-bold opacity-60 dark:text-slate-800 truncate">
                        {entry.subjects?.subject_code || entry.subjects?.code}
                      </p>
                      <span className="text-[7px] font-black opacity-30 dark:text-slate-900">
                        {slot.time.split('-')[1]}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="w-full py-2.5 px-3 border border-dashed border-slate-100 dark:border-slate-800 rounded-xl flex items-center">
                    <span className="text-[9px] font-black text-slate-300 dark:text-slate-700 uppercase tracking-tighter">No Class</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* FOOTER BRANDING (Mobile Optimized) */}
      <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-col items-center gap-1 opacity-40">
        <span className="text-[8px] font-black uppercase tracking-[0.4em] text-slate-800 dark:text-slate-100 text-center">
          Official Schedule
        </span>
        <span className="text-[7px] font-bold uppercase tracking-[0.2em] text-slate-500">
          Academic Session 2026
        </span>
      </div>
    </div>
  </div>
);
}